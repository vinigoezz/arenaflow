// src/app/api/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { studentId } = await req.json()
    if (!studentId) return NextResponse.json({ error: 'studentId obrigatório' }, { status: 400 })

    const today = new Date().toISOString().split('T')[0]

    // Prevent duplicate check-in on same day
    const existing = await prisma.attendance.findFirst({
      where: { studentId, date: today },
    })

    if (existing) {
      return NextResponse.json({ message: 'Check-in já registrado hoje', attendance: existing })
    }

    const attendance = await prisma.attendance.create({
      data: { studentId, date: today },
    })

    return NextResponse.json(attendance, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao registrar check-in' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const date = searchParams.get('date')

    const where: any = {}
    if (studentId) where.studentId = studentId
    if (date) where.date = date

    const attendances = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { student: { select: { name: true } } },
    })

    return NextResponse.json(attendances)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
