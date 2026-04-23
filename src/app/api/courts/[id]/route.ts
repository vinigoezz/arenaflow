// src/app/api/courts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const court = await prisma.court.findUnique({
      where: { id: params.id },
      include: {
        reservations: {
          where: { status: { not: 'cancelado' } },
          orderBy: [{ reservationDate: 'desc' }, { startTime: 'asc' }],
          take: 20,
        },
      },
    })
    if (!court) return NextResponse.json({ error: 'Quadra não encontrada' }, { status: 404 })
    return NextResponse.json(court)
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const court = await prisma.court.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description || null,
        pricePerHour: Number(body.pricePerHour),
        openingTime: body.openingTime,
        closingTime: body.closingTime,
        status: body.status,
      },
    })
    return NextResponse.json(court)
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao atualizar quadra' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.court.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao excluir quadra' }, { status: 500 })
  }
}
