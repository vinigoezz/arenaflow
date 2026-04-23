import { PrismaClient } from '../src/generated/prisma'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'

const dbPath = path.resolve('./dev.db')
const adapter = new PrismaBetterSqlite3({ url: 'file:' + dbPath })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('🌱 Seeding ArenaFlow database...')

  // Clear existing data
  await prisma.payment.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.court.deleteMany()
  await prisma.student.deleteMany()
  await prisma.user.deleteMany()
  await prisma.settings.deleteMany()

  // --- USERS ---
  const adminPassword = await bcrypt.hash('admin123', 10)
  const recepPassword = await bcrypt.hash('recepcao123', 10)

  await prisma.user.createMany({
    data: [
      {
        name: 'Admin ArenaFlow',
        email: 'admin@arenaflow.com',
        password: adminPassword,
        role: 'admin',
      },
      {
        name: 'Maria Silva',
        email: 'recepcao@arenaflow.com',
        password: recepPassword,
        role: 'recepcionista',
      },
    ],
  })

  // --- SETTINGS ---
  await prisma.settings.create({
    data: {
      gymName: 'ArenaFlow Academia',
      phone: '(11) 9 9999-0000',
      email: 'contato@arenaflow.com',
      address: 'Rua das Flores, 123 – São Paulo, SP',
      openingHours: '06:00 - 23:00',
      workingDays: 'Segunda a Domingo',
      acceptedPaymentMethods: 'pix,cartao_credito,cartao_debito,dinheiro,boleto',
      plans: JSON.stringify([
        { name: 'Mensal Básico', value: 89.9 },
        { name: 'Mensal Completo', value: 129.9 },
        { name: 'Trimestral', value: 349.9 },
        { name: 'Semestral', value: 649.9 },
        { name: 'Anual', value: 1199.9 },
      ]),
    },
  })

  // --- COURTS ---
  const courts = await prisma.court.createManyAndReturn({
    data: [
      {
        name: 'Quadra 1',
        description: 'Quadra de grama sintética — 8 jogadores',
        pricePerHour: 120,
        openingTime: '07:00',
        closingTime: '22:00',
        status: 'ativa',
      },
      {
        name: 'Quadra 2',
        description: 'Quadra de grama natural — 10 jogadores',
        pricePerHour: 150,
        openingTime: '07:00',
        closingTime: '22:00',
        status: 'ativa',
      },
      {
        name: 'Quadra 3',
        description: 'Quadra coberta — 6 jogadores',
        pricePerHour: 100,
        openingTime: '08:00',
        closingTime: '21:00',
        status: 'ativa',
      },
    ],
  })

  // --- STUDENTS ---
  const today = new Date()
  const students = await prisma.student.createManyAndReturn({
    data: [
      {
        name: 'Carlos Eduardo Santos',
        phone: '(11) 9 8888-1111',
        email: 'carlos@email.com',
        birthDate: '1990-05-15',
        plan: 'Mensal Completo',
        monthlyFee: 129.9,
        dueDate: 5,
        status: 'ativo',
      },
      {
        name: 'Ana Paula Ferreira',
        phone: '(11) 9 7777-2222',
        email: 'ana@email.com',
        birthDate: '1995-08-22',
        plan: 'Mensal Básico',
        monthlyFee: 89.9,
        dueDate: 10,
        status: 'ativo',
      },
      {
        name: 'Roberto Lima',
        phone: '(11) 9 6666-3333',
        email: 'roberto@email.com',
        birthDate: '1988-03-10',
        plan: 'Mensal Completo',
        monthlyFee: 129.9,
        dueDate: 1,
        status: 'pendente',
        notes: 'Mensalidade abril em aberto',
      },
      {
        name: 'Fernanda Costa',
        phone: '(11) 9 5555-4444',
        birthDate: '2000-11-30',
        plan: 'Mensal Básico',
        monthlyFee: 89.9,
        dueDate: 15,
        status: 'ativo',
      },
      {
        name: 'Marcos Oliveira',
        phone: '(11) 9 4444-5555',
        email: 'marcos@email.com',
        birthDate: '1985-07-20',
        plan: 'Trimestral',
        monthlyFee: 349.9,
        dueDate: 20,
        status: 'ativo',
      },
      {
        name: 'Juliana Rodrigues',
        phone: '(11) 9 3333-6666',
        birthDate: '1993-01-14',
        plan: 'Mensal Básico',
        monthlyFee: 89.9,
        dueDate: 25,
        status: 'inativo',
        notes: 'Cancelou plano em março',
      },
      {
        name: 'Pedro Almeida',
        phone: '(11) 9 2222-7777',
        email: 'pedro@email.com',
        birthDate: '1997-09-05',
        plan: 'Mensal Completo',
        monthlyFee: 129.9,
        dueDate: 8,
        status: 'pendente',
      },
      {
        name: 'Luciana Mendes',
        phone: '(11) 9 1111-8888',
        email: 'luciana@email.com',
        birthDate: '1991-12-19',
        plan: 'Semestral',
        monthlyFee: 649.9,
        dueDate: 1,
        status: 'ativo',
      },
    ],
  })

  // --- ATTENDANCE ---
  const todayStr = today.toISOString().split('T')[0]
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const attendanceData = []
  for (const student of students.slice(0, 5)) {
    // Last 30 days random attendance
    for (let i = 0; i < 30; i++) {
      if (Math.random() > 0.5) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        attendanceData.push({ studentId: student.id, date: d.toISOString().split('T')[0] })
      }
    }
  }
  // Ensure today has some check-ins
  attendanceData.push({ studentId: students[0].id, date: todayStr })
  attendanceData.push({ studentId: students[1].id, date: todayStr })
  attendanceData.push({ studentId: students[3].id, date: todayStr })

  for (const att of attendanceData) {
    await prisma.attendance.create({ data: att })
  }

  // --- RESERVATIONS ---
  const reservationData = [
    {
      courtId: courts[0].id,
      customerName: 'Time do Zé',
      customerPhone: '(11) 9 9000-1111',
      reservationDate: todayStr,
      startTime: '08:00',
      endTime: '09:00',
      duration: 1,
      value: 120,
      paymentMethod: 'pix',
      status: 'confirmado',
    },
    {
      courtId: courts[0].id,
      customerName: 'Pelé FC',
      customerPhone: '(11) 9 9000-2222',
      reservationDate: todayStr,
      startTime: '10:00',
      endTime: '11:00',
      duration: 1,
      value: 120,
      paymentMethod: 'dinheiro',
      status: 'pendente',
    },
    {
      courtId: courts[1].id,
      customerName: 'Os Crias',
      customerPhone: '(11) 9 9000-3333',
      reservationDate: todayStr,
      startTime: '14:00',
      endTime: '16:00',
      duration: 2,
      value: 300,
      paymentMethod: 'pix',
      status: 'confirmado',
    },
    {
      courtId: courts[2].id,
      customerName: 'Stars FC',
      customerPhone: '(11) 9 9000-4444',
      reservationDate: todayStr,
      startTime: '19:00',
      endTime: '20:00',
      duration: 1,
      value: 100,
      paymentMethod: 'cartao_credito',
      status: 'pendente',
    },
    {
      courtId: courts[0].id,
      customerName: 'Time do Zé',
      customerPhone: '(11) 9 9000-1111',
      reservationDate: yesterdayStr,
      startTime: '08:00',
      endTime: '09:00',
      duration: 1,
      value: 120,
      paymentMethod: 'pix',
      status: 'concluido',
    },
  ]

  const createdReservations = []
  for (const r of reservationData) {
    const res = await prisma.reservation.create({ data: r })
    createdReservations.push(res)
  }

  // --- PAYMENTS ---
  const paymentData = [
    // Academy payments
    {
      type: 'mensalidade',
      referenceId: students[0].id,
      customerName: students[0].name,
      value: 129.9,
      paymentMethod: 'pix',
      dueDate: '2026-04-05',
      paymentDate: '2026-04-04',
      status: 'pago',
      origin: 'academia',
    },
    {
      type: 'mensalidade',
      referenceId: students[1].id,
      customerName: students[1].name,
      value: 89.9,
      paymentMethod: 'cartao_debito',
      dueDate: '2026-04-10',
      paymentDate: '2026-04-09',
      status: 'pago',
      origin: 'academia',
    },
    {
      type: 'mensalidade',
      referenceId: students[2].id,
      customerName: students[2].name,
      value: 129.9,
      paymentMethod: 'pix',
      dueDate: '2026-04-01',
      status: 'vencido',
      origin: 'academia',
    },
    {
      type: 'mensalidade',
      referenceId: students[6].id,
      customerName: students[6].name,
      value: 129.9,
      paymentMethod: 'pix',
      dueDate: '2026-04-08',
      status: 'pendente',
      origin: 'academia',
    },
    {
      type: 'mensalidade',
      referenceId: students[3].id,
      customerName: students[3].name,
      value: 89.9,
      paymentMethod: 'dinheiro',
      dueDate: '2026-04-15',
      paymentDate: todayStr,
      status: 'pago',
      origin: 'academia',
    },
    // Court payments
    {
      type: 'reserva',
      referenceId: createdReservations[0].id,
      customerName: 'Time do Zé',
      value: 120,
      paymentMethod: 'pix',
      dueDate: todayStr,
      paymentDate: todayStr,
      status: 'pago',
      origin: 'quadra',
    },
    {
      type: 'reserva',
      referenceId: createdReservations[1].id,
      customerName: 'Pelé FC',
      value: 120,
      paymentMethod: 'dinheiro',
      dueDate: todayStr,
      status: 'pendente',
      origin: 'quadra',
    },
    {
      type: 'reserva',
      referenceId: createdReservations[2].id,
      customerName: 'Os Crias',
      value: 300,
      paymentMethod: 'pix',
      dueDate: todayStr,
      paymentDate: todayStr,
      status: 'pago',
      origin: 'quadra',
    },
  ]

  for (const p of paymentData) {
    await prisma.payment.create({ data: p })
  }

  console.log('✅ Seed complete!')
  console.log('   👤 Admin: admin@arenaflow.com / admin123')
  console.log('   👤 Recepcionista: recepcao@arenaflow.com / recepcao123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
