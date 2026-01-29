import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { type, amount, note } = await req.json()

    const expense = await prisma.expense.create({
      data: {
        type,
        amount,
        note: note || null
      }
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const startDate = req.nextUrl.searchParams.get('startDate')
    const endDate = req.nextUrl.searchParams.get('endDate')

    const where: any = {}
    if (startDate) where.createdAt = { gte: new Date(startDate) }
    if (endDate) {
      if (where.createdAt) {
        where.createdAt.lte = new Date(endDate)
      } else {
        where.createdAt = { lte: new Date(endDate) }
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(expenses)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
