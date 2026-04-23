// src/app/dashboard/page.tsx — Main Dashboard
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import {
  Users, DollarSign, Calendar, Clock, TrendingUp,
  AlertCircle, Plus, CheckCircle, Activity
} from 'lucide-react'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function statusBadge(status: string) {
  return <span className={`badge badge-${status}`}>{status}</span>
}

export default function Dashboard() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <AppLayout>
      <div className="page">
        {/* Greeting */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <p style={{ fontSize: '.8rem', color: 'var(--color-text-3)', textTransform: 'capitalize' }}>{today}</p>
          <h1 style={{ fontSize: '1.3rem', marginTop: 2 }}>Visão geral 👋</h1>
        </div>

        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : (
          <>
            {/* Metric Cards Grid */}
            <div className="grid-2" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="metric-card">
                <div className="row" style={{ marginBottom: 'var(--space-2)' }}>
                  <Users size={16} color="var(--color-green)" />
                  <span className="metric-label" style={{ margin: 0 }}>Alunos ativos</span>
                </div>
                <div className="metric-value green">{data?.students?.active ?? 0}</div>
                <div className="metric-sub">{data?.students?.pending ?? 0} pendentes</div>
              </div>

              <div className="metric-card accent">
                <div className="row" style={{ marginBottom: 'var(--space-2)' }}>
                  <DollarSign size={16} color="var(--color-green)" />
                  <span className="metric-label" style={{ margin: 0 }}>Hoje</span>
                </div>
                <div className="metric-value green">{fmt(data?.revenue?.today ?? 0)}</div>
                <div className="metric-sub">Recebido hoje</div>
              </div>

              <div className="metric-card">
                <div className="row" style={{ marginBottom: 'var(--space-2)' }}>
                  <Calendar size={16} color="var(--color-green)" />
                  <span className="metric-label" style={{ margin: 0 }}>Reservas hoje</span>
                </div>
                <div className="metric-value">{data?.reservations?.count ?? 0}</div>
                <div className="metric-sub">{data?.reservations?.freeSlots ?? 0} horários livres</div>
              </div>

              <div className="metric-card">
                <div className="row" style={{ marginBottom: 'var(--space-2)' }}>
                  <TrendingUp size={16} color="var(--color-green)" />
                  <span className="metric-label" style={{ margin: 0 }}>Mês</span>
                </div>
                <div className="metric-value">{fmt(data?.revenue?.month ?? 0)}</div>
                <div className="metric-sub">Faturamento mensal</div>
              </div>
            </div>

            {/* Alerts */}
            {(data?.payments?.pending > 0 || data?.payments?.overdue > 0) && (
              <div style={{
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius)',
                background: 'rgba(245,158,11,.08)',
                border: '1px solid rgba(245,158,11,.25)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-4)',
              }}>
                <AlertCircle size={18} color="var(--color-warning)" />
                <div>
                  <p style={{ color: 'var(--color-warning)', fontWeight: 600, fontSize: '.85rem' }}>
                    {data.payments.overdue} vencidos · {data.payments.pending} pendentes
                  </p>
                  <p style={{ fontSize: '.75rem', marginTop: 2 }}>
                    Pagamentos precisam de atenção
                  </p>
                </div>
                <button className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto', flexShrink: 0 }}
                  onClick={() => router.push('/financial')}>
                  Ver
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="section-header">
              <span className="section-title">Ações rápidas</span>
            </div>
            <div className="grid-3" style={{ marginBottom: 'var(--space-5)' }}>
              <button className="btn btn-secondary" style={{ flexDirection: 'column', padding: 'var(--space-4)', gap: 'var(--space-2)', borderRadius: 'var(--radius-lg)' }}
                onClick={() => router.push('/students?new=1')}>
                <Plus size={20} color="var(--color-green)" />
                <span style={{ fontSize: '.75rem', fontWeight: 600 }}>Novo Aluno</span>
              </button>
              <button className="btn btn-secondary" style={{ flexDirection: 'column', padding: 'var(--space-4)', gap: 'var(--space-2)', borderRadius: 'var(--radius-lg)' }}
                onClick={() => router.push('/reservations?new=1')}>
                <Calendar size={20} color="var(--color-green)" />
                <span style={{ fontSize: '.75rem', fontWeight: 600 }}>Nova Reserva</span>
              </button>
              <button className="btn btn-secondary" style={{ flexDirection: 'column', padding: 'var(--space-4)', gap: 'var(--space-2)', borderRadius: 'var(--radius-lg)' }}
                onClick={() => router.push('/financial?new=1')}>
                <DollarSign size={20} color="var(--color-green)" />
                <span style={{ fontSize: '.75rem', fontWeight: 600 }}>Pagamento</span>
              </button>
            </div>

            {/* Today's Reservations */}
            {data?.reservations?.today?.length > 0 && (
              <>
                <div className="section-header">
                  <span className="section-title">Reservas de hoje</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => router.push('/reservations')}>
                    Ver todas
                  </button>
                </div>
                <div className="stack" style={{ marginBottom: 'var(--space-5)' }}>
                  {data.reservations.today.map((r: any) => (
                    <div key={r.id} className="list-item" style={{ cursor: 'pointer' }}
                      onClick={() => router.push('/reservations')}>
                      <div className="list-item-icon">
                        <Calendar size={18} />
                      </div>
                      <div className="list-item-body">
                        <div className="list-item-title">{r.customerName}</div>
                        <div className="list-item-sub">{r.court?.name} · {r.startTime}–{r.endTime}</div>
                      </div>
                      <div className="list-item-right">
                        {statusBadge(r.status)}
                        <div style={{ fontSize: '.75rem', color: 'var(--color-green)', marginTop: 2, fontWeight: 600 }}>
                          {fmt(r.value)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Students with pending payment */}
            {data?.studentsWithDue?.filter((s: any) => s.status === 'pendente').length > 0 && (
              <>
                <div className="section-header">
                  <span className="section-title">Alunos inadimplentes</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => router.push('/students?status=pendente')}>
                    Ver todos
                  </button>
                </div>
                <div className="stack">
                  {data.studentsWithDue
                    .filter((s: any) => s.status === 'pendente')
                    .slice(0, 4)
                    .map((s: any) => (
                    <div key={s.id} className="list-item" style={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/students/${s.id}`)}>
                      <div className="avatar">{s.name.split(' ').map((w: string) => w[0]).slice(0,2).join('').toUpperCase()}</div>
                      <div className="list-item-body">
                        <div className="list-item-title">{s.name}</div>
                        <div className="list-item-sub">{s.plan} · vence dia {s.dueDate}</div>
                      </div>
                      <div className="list-item-right">
                        <span className="badge badge-pendente">pendente</span>
                        <div style={{ fontSize: '.75rem', color: 'var(--color-text-3)', marginTop: 2 }}>
                          {fmt(s.monthlyFee)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Attendance today */}
            <div style={{
              marginTop: 'var(--space-5)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius)',
                background: 'var(--color-green-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Activity size={18} color="var(--color-green)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.9rem' }}>
                  {data?.todayAttendance ?? 0} check-ins hoje
                </div>
                <div style={{ fontSize: '.75rem', color: 'var(--color-text-3)' }}>
                  Frequência registrada
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
