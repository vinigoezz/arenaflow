// src/app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || ''
    const origin = searchParams.get('origin') || ''
    const type = searchParams.get('type') || ''
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''

    const where: any = {}
    if (status) where.status = status
    if (origin) where.origin = origin
    if (type) where.type = type
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to + 'T23:59:59')
    }

    const [payments, summary] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.groupBy({
        by: ['status'],
        _sum: { value: true },
        _count: true,
      }),
    ])

    return NextResponse.json({ payments, summary })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, referenceId, customerName, value, paymentMethod, dueDate, paymentDate, status, origin, notes } = body

    if (!customerName || !value) {
      return NextResponse.json({ error: 'Cliente e valor são obrigatórios' }, { status: 400 })
    }

    const payment = await prisma.payment.create({
      data: {
        type: type || 'mensalidade',
        referenceId: referenceId || null,
        customerName,
        value: Number(value),
        paymentMethod: paymentMethod || 'pix',
        dueDate: dueDate || null,
        paymentDate: paymentDate || null,
        status: status || 'pendente',
        origin: origin || 'academia',
        notes: notes || null,
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao registrar pagamento' }, { status: 500 })
  }
}
