import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      include: { cylinderSize: true },
      orderBy: { cylinderSizeId: 'asc' }
    })

    return NextResponse.json(inventory)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { cylinderSizeId, fullStock, emptyStock } = await req.json()

    const updated = await prisma.inventory.update({
      where: { cylinderSizeId },
      data: {
        fullStock: fullStock !== undefined ? fullStock : undefined,
        emptyStock: emptyStock !== undefined ? emptyStock : undefined
      },
      include: { cylinderSize: true }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
