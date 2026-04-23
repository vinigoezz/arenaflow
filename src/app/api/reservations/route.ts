// src/app/api/reservations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const courtId = searchParams.get('courtId')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const where: any = {}
    if (date) where.reservationDate = date
    if (courtId) where.courtId = courtId
    if (status) where.status = status
    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
      ]
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: { court: true },
      orderBy: [{ reservationDate: 'desc' }, { startTime: 'asc' }],
    })

    return NextResponse.json(reservations)
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      courtId, customerName, customerPhone, reservationDate,
      startTime, endTime, duration, value, paymentMethod, status, notes,
    } = body

    if (!courtId || !customerName || !customerPhone || !reservationDate || !startTime || !endTime) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    // Conflict check
    const conflict = await prisma.reservation.findFirst({
      where: {
        courtId,
        reservationDate,
        status: { in: ['pendente', 'confirmado'] },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    })

    if (conflict) {
      return NextResponse.json({
        error: `Horário em conflito com outra reserva (${conflict.startTime}–${conflict.endTime}) de ${conflict.customerName}`
      }, { status: 409 })
    }

    const reservation = await prisma.reservation.create({
      data: {
        courtId, customerName, customerPhone, reservationDate,
        startTime, endTime,
        duration: Number(duration) || 1,
        value: Number(value) || 0,
        paymentMethod: paymentMethod || 'pix',
        status: status || 'pendente',
        notes: notes || null,
      },
      include: { court: true },
    })

    return NextResponse.json(reservation, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar reserva' }, { status: 500 })
  }
}
