import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const {
      clientName,
      cylinderSizeId,
      quantity,
      deliveryType,
      paymentStatus,
      userId,
      notes
    } = await req.json()

    // Enforce client name as mandatory
    if (!clientName || typeof clientName !== 'string' || !clientName.trim()) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 })
    }

    // Get current rate per kg
    const latestRate = await prisma.ratePerKg.findFirst({
      orderBy: { effectiveAt: 'desc' }
    })

    if (!latestRate) {
      return NextResponse.json({ error: 'No rate set. Please contact admin to set pricing.' }, { status: 400 })
    }

    // Get cylinder size to calculate total
    const cylinder = await prisma.cylinderSize.findUnique({
      where: { id: cylinderSizeId }
    })

    if (!cylinder) {
      return NextResponse.json({ error: 'Cylinder size not found' }, { status: 404 })
    }

    const total = quantity * cylinder.kg * latestRate.rate

    // Create sale record - no need to create/match client, just store name as text
    const sale = await prisma.sale.create({
      data: {
        clientId: null,
        cylinderSizeId,
        quantity,
        deliveryType,
        paymentStatus,
        ratePerKg: latestRate.rate,
        total,
        userId: userId || null,
        note: notes || null,
        clientName: clientName.trim()
      },
      include: { client: true, cylinderSize: true }
    })

    // Decrement full stock
    await prisma.inventory.update({
      where: { cylinderSizeId },
      data: { fullStock: { decrement: quantity } }
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (error: any) {
    console.error('Sale creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const sales = await prisma.sale.findMany({
      include: { client: true, cylinderSize: true, user: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    return NextResponse.json(sales)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
