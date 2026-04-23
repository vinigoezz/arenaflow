// src/app/api/courts/[id]/slots/route.ts — Available time slots for a court on a date
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const duration = Number(searchParams.get('duration') || 1)

    if (!date) return NextResponse.json({ error: 'Data obrigatória' }, { status: 400 })

    const court = await prisma.court.findUnique({ where: { id: params.id } })
    if (!court) return NextResponse.json({ error: 'Quadra não encontrada' }, { status: 404 })

    // Get existing reservations for that day
    const reservations = await prisma.reservation.findMany({
      where: {
        courtId: params.id,
        reservationDate: date,
        status: { in: ['pendente', 'confirmado'] },
      },
    })

    // Generate all possible start times (hourly)
    const [openH] = court.openingTime.split(':').map(Number)
    const [closeH] = court.closingTime.split(':').map(Number)

    const slots: { time: string; available: boolean }[] = []
    for (let h = openH; h < closeH - duration + 1; h++) {
      const startTime = `${String(h).padStart(2, '0')}:00`
      const endH = h + duration
      const endTime = `${String(endH).padStart(2, '0')}:00`

      // Check conflict: a slot is unavailable if any existing reservation overlaps
      const conflict = reservations.some(r => {
        const rStart = parseInt(r.startTime.replace(':', ''))
        const rEnd = parseInt(r.endTime.replace(':', ''))
        const sStart = h * 100
        const sEnd = endH * 100
        return !(sEnd <= rStart || sStart >= rEnd)
      })

      slots.push({ time: startTime, available: !conflict })
    }

    return NextResponse.json({ slots, court })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
