import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const startDate = req.nextUrl.searchParams.get('startDate')
    const endDate = req.nextUrl.searchParams.get('endDate')

    // Default to today if not provided
    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0))
    const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999))

    // Get all sales for the period
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: { cylinderSize: true }
    })

    // Get all expenses for the period
    const expenses = await prisma.expense.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    })

    // Calculate totals
    const totalSalesRevenue = sales.reduce((sum, s) => sum + s.total, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

    // Group sales by payment status
    const paidSales = sales.filter(s => s.paymentStatus === 'PAID')
    const unpaidSales = sales.filter(s => s.paymentStatus === 'UNPAID')

    const paidAmount = paidSales.reduce((sum, s) => sum + s.total, 0)
    const unpaidAmount = unpaidSales.reduce((sum, s) => sum + s.total, 0)

    // Calculate net (simple: revenue - expenses)
    // In a real system, you'd also subtract gas cost from supplier purchases
    const netCash = paidAmount - totalExpenses

    // Expense breakdown
    const expensesByType: Record<string, number> = {}
    expenses.forEach(e => {
      expensesByType[e.type] = (expensesByType[e.type] || 0) + e.amount
    })

    return NextResponse.json({
      period: { startDate: start, endDate: end },
      sales: {
        count: sales.length,
        totalRevenue: totalSalesRevenue,
        paidCount: paidSales.length,
        paidAmount,
        unpaidCount: unpaidSales.length,
        unpaidAmount
      },
      expenses: {
        total: totalExpenses,
        breakdown: expensesByType
      },
      netCash,
      generatedAt: new Date()
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
