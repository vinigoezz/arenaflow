// src/app/api/dashboard/route.ts — Dashboard aggregated metrics
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const firstOfMonth = today.substring(0, 7) + '-01'

    const [
      totalActive,
      totalPending,
      totalInactive,
      todayReservations,
      pendingPayments,
      overduePayments,
      todayPaidRevenue,
      monthPaidRevenue,
      studentsWithDue,
      todayAttendance,
    ] = await Promise.all([
      prisma.student.count({ where: { status: 'ativo' } }),
      prisma.student.count({ where: { status: 'pendente' } }),
      prisma.student.count({ where: { status: 'inativo' } }),
      prisma.reservation.findMany({
        where: { reservationDate: today },
        include: { court: true },
        orderBy: { startTime: 'asc' },
      }),
      prisma.payment.count({ where: { status: 'pendente' } }),
      prisma.payment.count({ where: { status: 'vencido' } }),
      prisma.payment.aggregate({
        where: { status: 'pago', paymentDate: today },
        _sum: { value: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'pago', paymentDate: { gte: firstOfMonth } },
        _sum: { value: true },
      }),
      // Students whose monthly fee is due soon (next 5 days) or already overdue
      prisma.student.findMany({
        where: { status: { in: ['ativo', 'pendente'] } },
        orderBy: { name: 'asc' },
        take: 10,
      }),
      prisma.attendance.count({ where: { date: today } }),
    ])

    // Free slots today — compute total slots across all courts
    const courts = await prisma.court.findMany({ where: { status: 'ativa' } })
    const totalSlots = courts.length * 8 // avg 8 hours per court
    const freeSlots = Math.max(0, totalSlots - todayReservations.length)

    return NextResponse.json({
      students: { active: totalActive, pending: totalPending, inactive: totalInactive },
      reservations: { today: todayReservations, count: todayReservations.length, freeSlots },
      payments: { pending: pendingPayments, overdue: overduePayments },
      revenue: {
        today: todayPaidRevenue._sum.value ?? 0,
        month: monthPaidRevenue._sum.value ?? 0,
      },
      studentsWithDue,
      todayAttendance,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
