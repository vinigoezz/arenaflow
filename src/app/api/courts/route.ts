// src/app/api/courts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const courts = await prisma.court.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(courts)
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, pricePerHour, openingTime, closingTime, status } = body

    if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

    const court = await prisma.court.create({
      data: {
        name,
        description: description || null,
        pricePerHour: Number(pricePerHour) || 100,
        openingTime: openingTime || '07:00',
        closingTime: closingTime || '22:00',
        status: status || 'ativa',
      },
    })

    return NextResponse.json(court, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar quadra' }, { status: 500 })
  }
}
