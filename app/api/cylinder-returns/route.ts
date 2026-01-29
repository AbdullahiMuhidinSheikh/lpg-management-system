import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const {
      clientId,
      cylinderSizeId,
      emptyQuantity
    } = await req.json()

    if (!clientId || !cylinderSizeId || !emptyQuantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Increment empty stock
    await prisma.inventory.update({
      where: { cylinderSizeId },
      data: { emptyStock: { increment: emptyQuantity } }
    })

    // Update cylinder debt (returnedEmpty side)
    const debt = await prisma.cylinderDebt.upsert({
      where: {
        client_id_cylinderSizeId: {
          clientId,
          cylinderSizeId
        }
      },
      update: { returnedEmpty: { increment: emptyQuantity } },
      create: {
        clientId,
        cylinderSizeId,
        issuedFull: 0,
        returnedEmpty: emptyQuantity
      },
      include: { client: true, cylinderSize: true }
    })

    // Calculate debt
    const debtAmount = debt.issuedFull - debt.returnedEmpty

    return NextResponse.json({
      ...debt,
      debt: debtAmount,
      message: debtAmount > 0 
        ? `Client owes ${debtAmount} cylinders of ${debt.cylinderSize.label}` 
        : 'All cylinders accounted for'
    })
  } catch (error: any) {
    console.error('Empty return error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('clientId')
    
    if (!clientId) {
      return NextResponse.json({ error: 'clientId required' }, { status: 400 })
    }

    const debts = await prisma.cylinderDebt.findMany({
      where: { clientId: parseInt(clientId) },
      include: { cylinderSize: true }
    })

    // Add computed debt field
    const withDebt = debts.map(d => ({
      ...d,
      debt: d.issuedFull - d.returnedEmpty
    }))

    return NextResponse.json(withDebt)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
