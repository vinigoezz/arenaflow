// src/app/api/students/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        attendances: { orderBy: { date: 'desc' }, take: 30 },
      },
    })

    if (!student) return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })

    const payments = await prisma.payment.findMany({
      where: { referenceId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ ...student, payments })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { name, phone, email, birthDate, plan, monthlyFee, dueDate, status, notes } = body

    const student = await prisma.student.update({
      where: { id: params.id },
      data: {
        name,
        phone,
        email: email || null,
        birthDate: birthDate || null,
        plan,
        monthlyFee: Number(monthlyFee),
        dueDate: Number(dueDate),
        status,
        notes: notes || null,
      },
    })

    return NextResponse.json(student)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao atualizar aluno' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.attendance.deleteMany({ where: { studentId: params.id } })
    await prisma.student.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao excluir aluno' }, { status: 500 })
  }
}
