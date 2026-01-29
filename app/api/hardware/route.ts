import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { serial, productId, status, clientId } = await req.json()

    // Check if serial already exists
    const existing = await prisma.hardwareSerial.findUnique({
      where: { serial }
    })

    if (existing) {
      return NextResponse.json({ error: 'Serial already exists' }, { status: 400 })
    }

    const hardware = await prisma.hardwareSerial.create({
      data: {
        serial,
        productId,
        status: status || 'IN_STOCK',
        clientId: clientId || null
      },
      include: { product: true, client: true }
    })

    return NextResponse.json(hardware, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('productId')
    const clientId = req.nextUrl.searchParams.get('clientId')
    const status = req.nextUrl.searchParams.get('status')

    const where: any = {}
    if (productId) where.productId = parseInt(productId)
    if (clientId) where.clientId = parseInt(clientId)
    if (status) where.status = status

    const items = await prisma.hardwareSerial.findMany({
      where,
      include: { product: true, client: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(items)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { serial, status, clientId } = await req.json()

    const updated = await prisma.hardwareSerial.update({
      where: { serial },
      data: {
        status: status || undefined,
        clientId: clientId !== undefined ? clientId : undefined
      },
      include: { product: true, client: true }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
