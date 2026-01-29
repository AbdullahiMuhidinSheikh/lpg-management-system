import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const {
      supplierId,
      cylinderSizeId,
      quantity,
      pricePerKg
    } = await req.json()

    const cylinder = await prisma.cylinderSize.findUnique({
      where: { id: cylinderSizeId }
    })

    if (!cylinder) {
      return NextResponse.json({ error: 'Cylinder size not found' }, { status: 404 })
    }

    const total = quantity * cylinder.kg * pricePerKg

    const purchase = await prisma.purchase.create({
      data: {
        supplierId,
        cylinderSizeId,
        quantity,
        pricePerKg,
        total
      },
      include: { supplier: true, cylinderSize: true }
    })

    // Increment full stock (new purchase arrives)
    await prisma.inventory.update({
      where: { cylinderSizeId },
      data: { fullStock: { increment: quantity } }
    })

    return NextResponse.json(purchase, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supplierId = req.nextUrl.searchParams.get('supplierId')
    const where = supplierId ? { supplierId: parseInt(supplierId) } : {}

    const purchases = await prisma.purchase.findMany({
      where,
      include: { supplier: true, cylinderSize: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return NextResponse.json(purchases)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
