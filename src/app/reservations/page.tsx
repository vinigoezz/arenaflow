// src/app/reservations/page.tsx — Reservations module with 6-step booking wizard
'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock, User, Phone, DollarSign, CheckCircle } from 'lucide-react'

type Reservation = {
  id: string; courtId: string; customerName: string; customerPhone: string
  reservationDate: string; startTime: string; endTime: string; duration: number
  value: number; paymentMethod: string; status: string; notes?: string
  court: { name: string; pricePerHour: number }
}

type Court = { id: string; name: string; pricePerHour: number; openingTime: string; closingTime: string }

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function fmtDatePt(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente', confirmado: 'Confirmado', cancelado: 'Cancelado', concluido: 'Concluído'
}

const PAY_METHODS = [
  { value: 'pix', label: 'Pix' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão de crédito' },
  { value: 'cartao_debito', label: 'Cartão de débito' },
  { value: 'boleto', label: 'Boleto' },
]

export default function ReservationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(searchParams.get('new') === '1')
  const [statusFilter, setStatusFilter] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Wizard state
  const [step, setStep] = useState(1)
  const [courts, setCourts] = useState<Court[]>([])
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([])
  const [wizard, setWizard] = useState({
    courtId: '', courtName: '', date: new Date().toISOString().split('T')[0],
    startTime: '', endTime: '', duration: 1, value: 0, pricePerHour: 0,
    customerName: '', customerPhone: '', paymentMethod: 'pix', notes: '',
  })
  const [wizardLoading, setWizardLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ date: selectedDate })
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/reservations?${params}`)
    if (res.ok) setReservations(await res.json())
    setLoading(false)
  }, [selectedDate, statusFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/courts').then(r => r.json()).then(d => setCourts(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => {
    if (wizard.courtId && wizard.date && step === 3) {
      setWizardLoading(true)
      fetch(`/api/courts/${wizard.courtId}/slots?date=${wizard.date}&duration=${wizard.duration}`)
        .then(r => r.json())
        .then(d => { setSlots(d.slots || []); setWizardLoading(false) })
    }
  }, [wizard.courtId, wizard.date, wizard.duration, step])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  function selectCourt(c: Court) {
    setWizard(w => ({ ...w, courtId: c.id, courtName: c.name, pricePerHour: c.pricePerHour }))
    setStep(2)
  }

  function selectSlot(time: string) {
    const [h] = time.split(':').map(Number)
    const endH = h + wizard.duration
    const endTime = `${String(endH).padStart(2, '0')}:00`
    setWizard(w => ({
      ...w, startTime: time, endTime,
      value: w.pricePerHour * w.duration,
    }))
    setStep(4)
  }

  async function handleBook() {
    if (!wizard.customerName || !wizard.customerPhone) {
      showToast('Nome e telefone obrigatórios', 'error'); return
    }
    setSaving(true)
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courtId: wizard.courtId,
        customerName: wizard.customerName,
        customerPhone: wizard.customerPhone,
        reservationDate: wizard.date,
        startTime: wizard.startTime,
        endTime: wizard.endTime,
        duration: wizard.duration,
        value: wizard.value,
        paymentMethod: wizard.paymentMethod,
        status: 'confirmado',
        notes: wizard.notes,
      }),
    })
    setSaving(false)
    if (res.ok) {
      showToast('Reserva confirmada! 🎉')
      setShowWizard(false); setStep(1)
      setWizard(w => ({ ...w, courtId: '', startTime: '', customerName: '', customerPhone: '' }))
      load()
    } else {
      const d = await res.json()
      showToast(d.error || 'Erro ao criar reserva', 'error')
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/reservations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  function prevDay() {
    const d = new Date(selectedDate + 'T12:00:00'); d.setDate(d.getDate() - 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }
  function nextDay() {
    const d = new Date(selectedDate + 'T12:00:00'); d.setDate(d.getDate() + 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const STATUSES = ['', 'confirmado', 'pendente', 'cancelado', 'concluido']

  return (
    <AppLayout>
      <div className="page">
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

        {/* Header */}
        <div className="row-between" style={{ marginBottom: 'var(--space-4)' }}>
          <h1>Reservas</h1>
          <button id="new-reservation-btn" className="btn btn-primary btn-sm" onClick={() => { setStep(1); setShowWizard(true) }}>
            <Plus size={16} /> Nova
          </button>
        </div>

        {/* Date nav */}
        <div className="row" style={{ marginBottom: 'var(--space-3)', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary btn-sm" onClick={prevDay}><ChevronLeft size={16} /></button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={nextDay}><ChevronRight size={16} /></button>
        </div>

        {/* Status filter */}
        <div className="filter-tabs" style={{ marginBottom: 'var(--space-4)' }}>
          {STATUSES.map(s => (
            <button key={s} className={`filter-tab ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}>
              {s === '' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : reservations.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} />
            <h3>Nenhuma reserva neste dia</h3>
            <p>Clique em Nova para criar uma reserva</p>
          </div>
        ) : (
          <div className="stack">
            {reservations.map(r => (
              <div key={r.id} className="card" style={{ padding: 'var(--space-4)' }}>
                <div className="row-between" style={{ marginBottom: 'var(--space-3)' }}>
                  <div>
                    <h3>{r.customerName}</h3>
                    <p style={{ fontSize: '.75rem', marginTop: 2 }}>{r.court?.name}</p>
                  </div>
                  <span className={`badge badge-${r.status}`}>{STATUS_LABELS[r.status]}</span>
                </div>

                <div className="row" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                  <div className="row" style={{ gap: 6 }}>
                    <Clock size={14} color="var(--color-text-3)" />
                    <span style={{ fontSize: '.8rem' }}>{r.startTime}–{r.endTime}</span>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <DollarSign size={14} color="var(--color-green)" />
                    <span style={{ fontSize: '.8rem', color: 'var(--color-green)', fontWeight: 600 }}>{fmt(r.value)}</span>
                  </div>
                  <span style={{ fontSize: '.75rem', color: 'var(--color-text-3)' }}>{r.paymentMethod}</span>
                </div>

                <p style={{ fontSize: '.75rem', color: 'var(--color-text-3)', marginBottom: 'var(--space-3)' }}>
                  📞 {r.customerPhone}
                </p>

                {r.status === 'pendente' && (
                  <div className="row" style={{ gap: 'var(--space-2)' }}>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }}
                      onClick={() => updateStatus(r.id, 'confirmado')}>
                      <CheckCircle size={14} /> Confirmar
                    </button>
                    <button className="btn btn-danger btn-sm"
                      onClick={() => updateStatus(r.id, 'cancelado')}>
                      Cancelar
                    </button>
                  </div>
                )}
                {r.status === 'confirmado' && (
                  <div className="row" style={{ gap: 'var(--space-2)' }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}
                      onClick={() => updateStatus(r.id, 'concluido')}>
                      ✓ Concluir
                    </button>
                    <button className="btn btn-danger btn-sm"
                      onClick={() => updateStatus(r.id, 'cancelado')}>
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 6-Step Booking Wizard */}
        {showWizard && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowWizard(false); setStep(1) } }}>
            <div className="modal-sheet">
              {/* Progress */}
              <div className="wizard-progress" style={{ gap: 0 }}>
                {[1,2,3,4,5,6].map((s, i) => (
                  <>
                    <div key={`dot-${s}`} className={`wizard-step-dot ${s < step ? 'done' : s === step ? 'active' : ''}`} />
                    {i < 5 && <div key={`line-${s}`} className={`wizard-step-line ${s < step ? 'done' : ''}`} />}
                  </>
                ))}
              </div>

              {/* Step 1: Select court */}
              {step === 1 && (
                <>
                  <div className="modal-header">
                    <h2 className="modal-title">1. Selecione a quadra</h2>
                    <button className="btn-ghost" onClick={() => { setShowWizard(false); setStep(1) }}>✕</button>
                  </div>
                  {courts.length === 0 ? (
                    <p style={{ color: 'var(--color-text-3)' }}>Nenhuma quadra cadastrada</p>
                  ) : (
                    <div className="stack">
                      {courts.filter(c => (c as any).status !== 'inativa').map(c => (
                        <button key={c.id} id={`court-option-${c.id}`} className="list-item" style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                          onClick={() => selectCourt(c)}>
                          <div className="list-item-icon"><Calendar size={18} /></div>
                          <div className="list-item-body">
                            <div className="list-item-title">{c.name}</div>
                            <div className="list-item-sub">{c.openingTime}–{c.closingTime}</div>
                          </div>
                          <div style={{ color: 'var(--color-green)', fontWeight: 700, fontSize: '.875rem' }}>
                            {fmt(c.pricePerHour)}/h
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Step 2: Select date */}
              {step === 2 && (
                <>
                  <div className="modal-header">
                    <h2 className="modal-title">2. Selecione a data</h2>
                    <button className="btn-ghost" onClick={() => setStep(1)}>← Voltar</button>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data da reserva</label>
                    <input id="wizard-date" className="form-input" type="date"
                      value={wizard.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setWizard(w => ({ ...w, date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duração</label>
                    <select className="form-select" value={wizard.duration}
                      onChange={e => setWizard(w => ({ ...w, duration: Number(e.target.value) }))}>
                      {[1,1.5,2,3].map(d => <option key={d} value={d}>{d} hora{d > 1 ? 's' : ''}</option>)}
                    </select>
                  </div>
                  <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(3)} disabled={!wizard.date}>
                    Ver horários disponíveis
                  </button>
                </>
              )}

              {/* Step 3: Select time slot */}
              {step === 3 && (
                <>
                  <div className="modal-header">
                    <h2 className="modal-title">3. Selecione o horário</h2>
                    <button className="btn-ghost" onClick={() => setStep(2)}>← Voltar</button>
                  </div>
                  <p style={{ fontSize: '.8rem', color: 'var(--color-text-3)', marginBottom: 'var(--space-4)' }}>
                    {wizard.courtName} · {fmtDatePt(wizard.date)} · {wizard.duration}h
                  </p>
                  {wizardLoading ? (
                    <div className="loading-overlay"><div className="spinner" /></div>
                  ) : slots.length === 0 ? (
                    <p style={{ color: 'var(--color-text-3)' }}>Nenhum horário disponível</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {slots.map(s => (
                        <button
                          key={s.time}
                          id={`slot-${s.time}`}
                          disabled={!s.available}
                          className={`btn ${s.available ? 'btn-secondary' : ''}`}
                          style={{
                            opacity: s.available ? 1 : .35,
                            cursor: s.available ? 'pointer' : 'not-allowed',
                            background: s.available ? 'var(--color-surface-2)' : 'var(--color-surface)',
                            border: `1px solid ${s.available ? 'var(--color-border)' : 'var(--color-border)'}`,
                            fontSize: '.85rem',
                            fontWeight: 600,
                          }}
                          onClick={() => s.available && selectSlot(s.time)}
                        >
                          {s.time}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Step 4: Customer info */}
              {step === 4 && (
                <>
                  <div className="modal-header">
                    <h2 className="modal-title">4. Dados do cliente</h2>
                    <button className="btn-ghost" onClick={() => setStep(3)}>← Voltar</button>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nome do cliente *</label>
                    <input id="wizard-customer-name" className="form-input" placeholder="Nome completo ou do time"
                      value={wizard.customerName}
                      onChange={e => setWizard(w => ({ ...w, customerName: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefone *</label>
                    <input id="wizard-customer-phone" className="form-input" placeholder="(11) 9 0000-0000"
                      value={wizard.customerPhone}
                      onChange={e => setWizard(w => ({ ...w, customerPhone: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Observações</label>
                    <input className="form-input" placeholder="Ex: equipe de 8 jogadores"
                      value={wizard.notes}
                      onChange={e => setWizard(w => ({ ...w, notes: e.target.value }))} />
                  </div>
                  <button className="btn btn-primary btn-full btn-lg"
                    onClick={() => setStep(5)}
                    disabled={!wizard.customerName || !wizard.customerPhone}>
                    Próximo
                  </button>
                </>
              )}

              {/* Step 5: Payment method */}
              {step === 5 && (
                <>
                  <div className="modal-header">
                    <h2 className="modal-title">5. Forma de pagamento</h2>
                    <button className="btn-ghost" onClick={() => setStep(4)}>← Voltar</button>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valor (R$)</label>
                    <input className="form-input" type="number" value={wizard.value}
                      onChange={e => setWizard(w => ({ ...w, value: Number(e.target.value) }))} />
                  </div>
                  <div className="stack" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                    {PAY_METHODS.map(m => (
                      <button key={m.value}
                        id={`pay-method-${m.value}`}
                        className={`btn ${wizard.paymentMethod === m.value ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ width: '100%', justifyContent: 'flex-start' }}
                        onClick={() => setWizard(w => ({ ...w, paymentMethod: m.value }))}>
                        {wizard.paymentMethod === m.value && <CheckCircle size={16} />}
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(6)}>
                    Revisar reserva
                  </button>
                </>
              )}

              {/* Step 6: Confirm */}
              {step === 6 && (
                <>
                  <div className="modal-header">
                    <h2 className="modal-title">6. Confirmar reserva</h2>
                    <button className="btn-ghost" onClick={() => setStep(5)}>← Voltar</button>
                  </div>

                  <div className="card" style={{ background: 'var(--color-green-dim)', borderColor: 'var(--color-green-dark)', marginBottom: 'var(--space-5)' }}>
                    <div className="stack" style={{ gap: 'var(--space-3)' }}>
                      <div className="row-between">
                        <span style={{ fontSize: '.8rem', color: 'var(--color-text-3)' }}>Quadra</span>
                        <span style={{ fontWeight: 600 }}>{wizard.courtName}</span>
                      </div>
                      <div className="row-between">
                        <span style={{ fontSize: '.8rem', color: 'var(--color-text-3)' }}>Data</span>
                        <span style={{ fontWeight: 600 }}>{fmtDatePt(wizard.date)}</span>
                      </div>
                      <div className="row-between">
                        <span style={{ fontSize: '.8rem', color: 'var(--color-text-3)' }}>Horário</span>
                        <span style={{ fontWeight: 600 }}>{wizard.startTime} – {wizard.endTime}</span>
                      </div>
                      <div className="row-between">
                        <span style={{ fontSize: '.8rem', color: 'var(--color-text-3)' }}>Cliente</span>
                        <span style={{ fontWeight: 600 }}>{wizard.customerName}</span>
                      </div>
                      <div className="row-between">
                        <span style={{ fontSize: '.8rem', color: 'var(--color-text-3)' }}>Pagamento</span>
                        <span style={{ fontWeight: 600 }}>{PAY_METHODS.find(m => m.value === wizard.paymentMethod)?.label}</span>
                      </div>
                      <div className="divider" style={{ margin: 0 }} />
                      <div className="row-between">
                        <span style={{ fontSize: '.9rem', fontWeight: 700 }}>Total</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-green)' }}>{fmt(wizard.value)}</span>
                      </div>
                    </div>
                  </div>

                  <button id="confirm-booking-btn" className="btn btn-primary btn-full btn-lg" onClick={handleBook} disabled={saving}>
                    {saving ? <span className="spinner" /> : '✓ Confirmar Reserva'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
