// src/app/api/reservations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id },
      include: { court: true },
    })
    if (!reservation) return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 })
    return NextResponse.json(reservation)
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()

    // If updating time, check conflict (excluding this reservation)
    if (body.startTime && body.endTime && body.reservationDate) {
      const conflict = await prisma.reservation.findFirst({
        where: {
          id: { not: params.id },
          courtId: body.courtId,
          reservationDate: body.reservationDate,
          status: { in: ['pendente', 'confirmado'] },
          AND: [
            { startTime: { lt: body.endTime } },
            { endTime: { gt: body.startTime } },
          ],
        },
      })
      if (conflict) {
        return NextResponse.json({
          error: `Conflito com reserva de ${conflict.customerName} (${conflict.startTime}–${conflict.endTime})`
        }, { status: 409 })
      }
    }

    const reservation = await prisma.reservation.update({
      where: { id: params.id },
      data: {
        ...body,
        value: body.value ? Number(body.value) : undefined,
        duration: body.duration ? Number(body.duration) : undefined,
      },
      include: { court: true },
    })

    return NextResponse.json(reservation)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao atualizar reserva' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.reservation.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao excluir reserva' }, { status: 500 })
  }
}
