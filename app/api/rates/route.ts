import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { rate, note } = await req.json()

    if (!rate || typeof rate !== 'number') {
      return NextResponse.json({ error: 'Valid rate required' }, { status: 400 })
    }

    const rateEntry = await prisma.ratePerKg.create({
      data: {
        rate,
        note: note || null
      }
    })

    return NextResponse.json(rateEntry, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const latest = await prisma.ratePerKg.findFirst({
      orderBy: { effectiveAt: 'desc' }
    })

    const history = await prisma.ratePerKg.findMany({
      orderBy: { effectiveAt: 'desc' },
      take: 30
    })

    return NextResponse.json({ latest, history })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
