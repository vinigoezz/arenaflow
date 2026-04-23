// src/app/courts/[id]/page.tsx — Court detail with agenda view
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, Loader } from 'lucide-react'

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

export default function CourtAgenda({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [court, setCourt] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const [courtRes, resRes] = await Promise.all([
      fetch(`/api/courts/${params.id}`),
      fetch(`/api/reservations?courtId=${params.id}&date=${selectedDate}`),
    ])
    if (courtRes.ok) setCourt(await courtRes.json())
    if (resRes.ok) setReservations(await resRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [params.id, selectedDate])

  if (!court && !loading) return <AppLayout><div className="page"><p>Quadra não encontrada</p></div></AppLayout>

  const [openH] = (court?.openingTime ?? '07:00').split(':').map(Number)
  const [closeH] = (court?.closingTime ?? '22:00').split(':').map(Number)

  const hours = Array.from({ length: closeH - openH }, (_, i) => openH + i)

  function getReservationForHour(h: number) {
    const timeStr = `${String(h).padStart(2, '0')}:00`
    return reservations.find(r => {
      const rStart = parseInt(r.startTime.replace(':', ''))
      const rEnd = parseInt(r.endTime.replace(':', ''))
      return h * 100 >= rStart && h * 100 < rEnd
    })
  }

  return (
    <AppLayout>
      <div className="page">
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)', paddingLeft: 0 }}
          onClick={() => router.back()}>
          <ArrowLeft size={16} /> Voltar
        </button>

        {loading && !court ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : (
          <>
            <div className="row-between" style={{ marginBottom: 'var(--space-5)' }}>
              <div>
                <h1>{court?.name}</h1>
                <p style={{ fontSize: '.8rem', marginTop: 2 }}>{court?.description}</p>
              </div>
              <span className={`badge badge-${court?.status}`}>{court?.status}</span>
            </div>

            {/* Date selector */}
            <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
              <label className="form-label">Selecionar data</label>
              <input
                id="agenda-date"
                className="form-input"
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            </div>

            {/* Agenda timeline */}
            <div className="section-header">
              <span className="section-title">
                Agenda — {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            </div>

            {loading ? (
              <div className="loading-overlay"><div className="spinner" /></div>
            ) : (
              <div className="stack" style={{ gap: 'var(--space-2)' }}>
                {hours.map(h => {
                  const res = getReservationForHour(h)
                  const timeStr = `${String(h).padStart(2, '0')}:00`
                  const isStart = res && res.startTime === timeStr

                  if (res && !isStart) return null // only show at start time

                  return (
                    <div key={h} className="time-slot" style={{
                      background: res ? 'rgba(34,197,94,.06)' : 'var(--color-surface)',
                      borderColor: res ? 'var(--color-green-dark)' : 'var(--color-border)',
                    }}>
                      <div style={{
                        width: 44, flexShrink: 0,
                        fontSize: '.8rem', fontWeight: 700,
                        color: res ? 'var(--color-green)' : 'var(--color-text-3)',
                      }}>
                        {timeStr}
                      </div>

                      {res ? (
                        <>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{res.customerName}</div>
                            <div style={{ fontSize: '.72rem', color: 'var(--color-text-3)', marginTop: 2 }}>
                              {res.startTime}–{res.endTime} · {res.customerPhone}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={`badge badge-${res.status}`}>{res.status}</span>
                            <div style={{ fontSize: '.72rem', color: 'var(--color-green)', fontWeight: 600, marginTop: 2 }}>
                              {fmt(res.value)}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ flex: 1, fontSize: '.8rem', color: 'var(--color-text-3)' }}>
                            Horário disponível
                          </div>
                          <CheckCircle size={16} color="var(--color-green)" />
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ marginTop: 'var(--space-5)', display: 'flex', gap: 'var(--space-2)' }}>
              <div className="row" style={{ gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-green-dim)', border: '1px solid var(--color-green-dark)' }} />
                <span style={{ fontSize: '.72rem', color: 'var(--color-text-3)' }}>Ocupado</span>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
                <span style={{ fontSize: '.72rem', color: 'var(--color-text-3)' }}>Livre</span>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
