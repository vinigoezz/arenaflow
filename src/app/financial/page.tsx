// src/app/financial/page.tsx — Financial module
'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { DollarSign, Plus, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react'

type Payment = {
  id: string; type: string; referenceId?: string; customerName: string
  value: number; paymentMethod: string; dueDate?: string; paymentDate?: string
  status: string; origin: string; createdAt: string
}

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
}

const PAY_LABELS: Record<string, string> = {
  pix: 'Pix', dinheiro: 'Dinheiro', cartao_credito: 'Crédito',
  cartao_debito: 'Débito', boleto: 'Boleto',
}

const EMPTY_FORM = {
  type: 'mensalidade', customerName: '', value: '', paymentMethod: 'pix',
  dueDate: '', paymentDate: new Date().toISOString().split('T')[0],
  status: 'pago', origin: 'academia', notes: '',
}

export default function FinancialPage() {
  const searchParams = useSearchParams()
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [originFilter, setOriginFilter] = useState('')
  const [showModal, setShowModal] = useState(searchParams.get('new') === '1')
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (originFilter) params.set('origin', originFilter)
    const res = await fetch(`/api/payments?${params}`)
    if (res.ok) {
      const d = await res.json()
      setPayments(d.payments || [])
      setSummary(d.summary || [])
    }
    setLoading(false)
  }, [statusFilter, originFilter])

  useEffect(() => { load() }, [load])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  async function handleSave() {
    if (!form.customerName || !form.value) { showToast('Cliente e valor obrigatórios', 'error'); return }
    setSaving(true)
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, value: Number(form.value) }),
    })
    setSaving(false)
    if (res.ok) {
      showToast('Pagamento registrado!')
      setShowModal(false); setForm(EMPTY_FORM); load()
    } else {
      showToast('Erro ao registrar', 'error')
    }
  }

  async function markPaid(id: string) {
    await fetch(`/api/payments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pago', paymentDate: new Date().toISOString().split('T')[0] }),
    })
    showToast('Marcado como pago!')
    load()
  }

  // Aggregate from summary
  const totalPago = summary.find(s => s.status === 'pago')?._sum?.value ?? 0
  const totalPendente = summary.find(s => s.status === 'pendente')?._sum?.value ?? 0
  const totalVencido = summary.find(s => s.status === 'vencido')?._sum?.value ?? 0

  return (
    <AppLayout>
      <div className="page">
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

        {/* Header */}
        <div className="row-between" style={{ marginBottom: 'var(--space-4)' }}>
          <h1>Financeiro</h1>
          <button id="new-payment-btn" className="btn btn-primary btn-sm" onClick={() => { setForm(EMPTY_FORM); setShowModal(true) }}>
            <Plus size={16} /> Registrar
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid-3" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="metric-card accent">
            <div className="metric-label">Recebido</div>
            <div className="metric-value green" style={{ fontSize: '1.1rem' }}>{fmt(totalPago)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Pendente</div>
            <div className="metric-value" style={{ fontSize: '1.1rem', color: 'var(--color-warning)' }}>{fmt(totalPendente)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Vencido</div>
            <div className="metric-value" style={{ fontSize: '1.1rem', color: 'var(--color-error)' }}>{fmt(totalVencido)}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-tabs" style={{ marginBottom: 'var(--space-3)' }}>
          {['', 'pago', 'pendente', 'vencido'].map(s => (
            <button key={s} className={`filter-tab ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}>
              {s === '' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="filter-tabs" style={{ marginBottom: 'var(--space-4)' }}>
          {['', 'academia', 'quadra'].map(o => (
            <button key={o} className={`filter-tab ${originFilter === o ? 'active' : ''}`}
              onClick={() => setOriginFilter(o)}>
              {o === '' ? 'Origem: Todos' : o === 'academia' ? '🏋️ Academia' : '⚽ Quadra'}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <DollarSign size={48} />
            <h3>Nenhum pagamento</h3>
            <p>Registre pagamentos de mensalidades e reservas</p>
          </div>
        ) : (
          <div className="stack">
            {payments.map(p => (
              <div key={p.id} className="list-item">
                <div className="list-item-icon" style={{
                  background: p.origin === 'quadra' ? 'rgba(59,130,246,.1)' : 'var(--color-green-dim)',
                  color: p.origin === 'quadra' ? 'var(--color-info)' : 'var(--color-green)',
                }}>
                  <DollarSign size={16} />
                </div>
                <div className="list-item-body">
                  <div className="list-item-title">{p.customerName}</div>
                  <div className="list-item-sub">
                    {p.type === 'mensalidade' ? '🏋️' : '⚽'} {PAY_LABELS[p.paymentMethod] || p.paymentMethod}
                    {p.paymentDate ? ` · ${fmtDate(p.paymentDate)}` : p.dueDate ? ` · vence ${fmtDate(p.dueDate)}` : ''}
                  </div>
                </div>
                <div className="list-item-right">
                  <span className={`badge badge-${p.status}`}>{p.status}</span>
                  <div style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--color-green)', marginTop: 2 }}>
                    {fmt(p.value)}
                  </div>
                  {p.status !== 'pago' && (
                    <button className="btn btn-sm btn-secondary" style={{ marginTop: 4 }}
                      onClick={() => markPaid(p.id)}>
                      ✓ Pago
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Register payment modal */}
        {showModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <div className="modal-sheet">
              <div className="modal-header">
                <h2 className="modal-title">Registrar Pagamento</h2>
                <button className="btn-ghost" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-select" value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="mensalidade">Mensalidade</option>
                    <option value="reserva">Reserva</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Origem</label>
                  <select className="form-select" value={form.origin}
                    onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}>
                    <option value="academia">Academia</option>
                    <option value="quadra">Quadra</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nome do cliente *</label>
                <input id="payment-customer" className="form-input" placeholder="Nome completo"
                  value={form.customerName}
                  onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Valor R$ *</label>
                <input id="payment-amount" className="form-input" type="number" step="0.01" placeholder="0,00"
                  value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Forma de pagamento</label>
                <select className="form-select" value={form.paymentMethod}
                  onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                  <option value="pix">Pix</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_credito">Cartão de crédito</option>
                  <option value="cartao_debito">Cartão de débito</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Vencimento</label>
                  <input className="form-input" type="date" value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Data pagamento</label>
                  <input className="form-input" type="date" value={form.paymentDate}
                    onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                  <option value="vencido">Vencido</option>
                </select>
              </div>

              <button id="save-payment-btn" className="btn btn-primary btn-full btn-lg" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" /> : 'Registrar Pagamento'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
