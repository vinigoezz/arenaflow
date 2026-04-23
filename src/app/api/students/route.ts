// src/app/api/students/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const students = await prisma.student.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search } },
                  { phone: { contains: search } },
                  { email: { contains: search } },
                ],
              }
            : {},
          status ? { status } : {},
        ],
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(students)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, email, birthDate, plan, monthlyFee, dueDate, status, notes } = body

    if (!name || !phone) {
      return NextResponse.json({ error: 'Nome e telefone são obrigatórios' }, { status: 400 })
    }

    const student = await prisma.student.create({
      data: {
        name,
        phone,
        email: email || null,
        birthDate: birthDate || null,
        plan: plan || 'Mensal',
        monthlyFee: Number(monthlyFee) || 0,
        dueDate: Number(dueDate) || 1,
        status: status || 'ativo',
        notes: notes || null,
      },
    })

    return NextResponse.json(student, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar aluno' }, { status: 500 })
  }
}
