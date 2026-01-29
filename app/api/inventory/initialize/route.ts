import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const {
      cylinderSizeId,
      fullStock,
      emptyStock,
      note
    } = await req.json()

    if (!cylinderSizeId || fullStock === undefined || emptyStock === undefined) {
      return NextResponse.json(
        { error: 'cylinderSizeId, fullStock, and emptyStock are required' },
        { status: 400 }
      )
    }

    // Check if inventory already exists for this cylinder size
    const existing = await prisma.inventory.findUnique({
      where: { cylinderSizeId }
    })

    if (existing) {
      // Update existing inventory
      const updated = await prisma.inventory.update({
        where: { cylinderSizeId },
        data: {
          fullStock: parseInt(fullStock),
          emptyStock: parseInt(emptyStock)
        },
        include: { cylinderSize: true }
      })
      return NextResponse.json(updated, { status: 200 })
    }

    // Create new inventory
    const inventory = await prisma.inventory.create({
      data: {
        cylinderSizeId,
        fullStock: parseInt(fullStock),
        emptyStock: parseInt(emptyStock)
      },
      include: { cylinderSize: true }
    })

    return NextResponse.json(inventory, { status: 201 })
  } catch (error: any) {
    console.error('Inventory initialization error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
