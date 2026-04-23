// src/app/api/payments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const payment = await prisma.payment.update({
      where: { id: params.id },
      data: {
        ...body,
        value: body.value ? Number(body.value) : undefined,
      },
    })
    return NextResponse.json(payment)
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao atualizar pagamento' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.payment.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao excluir pagamento' }, { status: 500 })
  }
}
