import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('id')

    if (!clientId) {
      // Return all clients
      const clients = await prisma.client.findMany({
        include: { cylinderDebts: { include: { cylinderSize: true } } },
        orderBy: { name: 'asc' }
      })
      return NextResponse.json(clients)
    }

    // Get specific client with ledger
    const client = await prisma.client.findUnique({
      where: { id: parseInt(clientId) },
      include: {
        cylinderDebts: { include: { cylinderSize: true } },
        sales: { include: { cylinderSize: true }, orderBy: { createdAt: 'desc' } }
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Calculate total owed amount (unpaid sales)
    const unpaidSales = await prisma.sale.findMany({
      where: {
        clientId: parseInt(clientId),
        paymentStatus: 'UNPAID'
      }
    })

    const totalOwedAmount = unpaidSales.reduce((sum, s) => sum + s.total, 0)
    const totalOwedCylinders = client.cylinderDebts.reduce((sum, d) => sum + Math.max(0, d.issuedFull - d.returnedEmpty), 0)

    return NextResponse.json({
      ...client,
      totalOwedAmount,
      totalOwedCylinders,
      creditStatus: {
        canDeliver:
          (!client.creditLimitAmount || totalOwedAmount < client.creditLimitAmount) &&
          (!client.creditLimitCylinders || totalOwedCylinders < client.creditLimitCylinders),
        exceedsMoneyLimit: client.creditLimitAmount ? totalOwedAmount >= client.creditLimitAmount : false,
        exceedsCylinderLimit: client.creditLimitCylinders ? totalOwedCylinders >= client.creditLimitCylinders : false
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, type, creditLimitAmount, creditLimitCylinders } = await req.json()

    const client = await prisma.client.create({
      data: {
        name,
        type,
        creditLimitAmount: creditLimitAmount || null,
        creditLimitCylinders: creditLimitCylinders || null
      }
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
