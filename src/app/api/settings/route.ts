// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    let settings = await prisma.settings.findFirst()
    if (!settings) {
      settings = await prisma.settings.create({ data: {} })
    }
    return NextResponse.json(settings)
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    let settings = await prisma.settings.findFirst()

    if (!settings) {
      settings = await prisma.settings.create({ data: body })
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: body,
      })
    }

    return NextResponse.json(settings)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}
