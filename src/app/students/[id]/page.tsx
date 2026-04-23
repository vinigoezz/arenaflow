// src/app/students/[id]/page.tsx — Student profile
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import {
  ArrowLeft, Edit, Trash2, CheckCircle, DollarSign,
  Activity, Calendar, Phone, Mail, User, Plus
} from 'lucide-react'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
}

export default function StudentProfile({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [editForm, setEditForm] = useState<any>(null)
  const [payForm, setPayForm] = useState({ value: '', paymentMethod: 'pix', paymentDate: new Date().toISOString().split('T')[0] })

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/students/${params.id}`)
    if (res.ok) {
      const d = await res.json()
      setStudent(d)
      setEditForm({
        name: d.name, phone: d.phone, email: d.email || '',
        birthDate: d.birthDate || '', plan: d.plan,
        monthlyFee: d.monthlyFee, dueDate: d.dueDate,
        status: d.status, notes: d.notes || '',
      })
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [params.id])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleCheckIn() {
    setCheckingIn(true)
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: params.id }),
    })
    setCheckingIn(false)
    const d = await res.json()
    if (res.ok) {
      showToast('Check-in registrado! ✅')
      load()
    } else {
      showToast(d.message || d.error || 'Erro', res.status === 200 ? 'success' : 'error')
    }
  }

  async function handleSaveEdit() {
    const res = await fetch(`/api/students/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, monthlyFee: Number(editForm.monthlyFee), dueDate: Number(editForm.dueDate) }),
    })
    if (res.ok) {
      showToast('Aluno atualizado!')
      setShowEdit(false)
      load()
    } else {
      showToast('Erro ao atualizar', 'error')
    }
  }

  async function handleDelete() {
    if (!confirm(`Excluir ${student.name}? Esta ação não pode ser desfeita.`)) return
    const res = await fetch(`/api/students/${params.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/students')
    } else {
      showToast('Erro ao excluir', 'error')
    }
  }

  async function handlePayment() {
    if (!payForm.value) { showToast('Informe o valor', 'error'); return }
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'mensalidade',
        referenceId: params.id,
        customerName: student.name,
        value: Number(payForm.value),
        paymentMethod: payForm.paymentMethod,
        paymentDate: payForm.paymentDate,
        status: 'pago',
        origin: 'academia',
      }),
    })
    if (res.ok) {
      showToast('Pagamento registrado!')
      setShowPayment(false)
      // Also update student status to ativo
      await fetch(`/api/students/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, status: 'ativo' }),
      })
      load()
    } else {
      showToast('Erro ao registrar', 'error')
    }
  }

  if (loading) return <AppLayout><div className="loading-overlay"><div className="spinner" /></div></AppLayout>
  if (!student) return <AppLayout><div className="page"><p>Aluno não encontrado</p></div></AppLayout>

  const todayStr = new Date().toISOString().split('T')[0]
  const thisMonth = todayStr.substring(0, 7)
  const monthAttendances = student.attendances?.filter((a: any) => a.date.startsWith(thisMonth)) || []
  const lastAttendance = student.attendances?.[0]?.date

  return (
    <AppLayout>
      <div className="page">
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

        {/* Back button */}
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)', paddingLeft: 0 }}
          onClick={() => router.back()}>
          <ArrowLeft size={16} /> Voltar
        </button>

        {/* Profile Header */}
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="row" style={{ marginBottom: 'var(--space-4)', alignItems: 'flex-start' }}>
            <div className="avatar avatar-lg">
              {student.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.1rem' }}>{student.name}</h2>
              <span className={`badge badge-${student.status}`} style={{ marginTop: 4 }}>{student.status}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button id="edit-student-btn" className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}>
                <Edit size={14} />
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="stack" style={{ gap: 'var(--space-3)' }}>
            <div className="row"><Phone size={14} color="var(--color-text-3)" /><span style={{ fontSize: '.875rem' }}>{student.phone}</span></div>
            {student.email && <div className="row"><Mail size={14} color="var(--color-text-3)" /><span style={{ fontSize: '.875rem' }}>{student.email}</span></div>}
            <div className="row"><User size={14} color="var(--color-text-3)" /><span style={{ fontSize: '.875rem' }}>{student.plan} · Vence dia {student.dueDate}</span></div>
          </div>

          <div className="divider" />

          <div className="grid-2">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-green)' }}>
                {fmt(student.monthlyFee)}
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--color-text-3)', textTransform: 'uppercase' }}>Mensalidade</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{monthAttendances.length}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--color-text-3)', textTransform: 'uppercase' }}>Presenças/mês</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid-2" style={{ marginBottom: 'var(--space-5)' }}>
          <button id="checkin-btn" className="btn btn-secondary btn-lg" style={{ gap: 'var(--space-2)', flexDirection: 'column' }}
            onClick={handleCheckIn} disabled={checkingIn}>
            <CheckCircle size={22} color="var(--color-green)" />
            <span style={{ fontSize: '.8rem' }}>{checkingIn ? 'Registrando...' : 'Check-in'}</span>
          </button>
          <button id="register-payment-btn" className="btn btn-primary btn-lg" style={{ gap: 'var(--space-2)', flexDirection: 'column' }}
            onClick={() => setShowPayment(true)}>
            <DollarSign size={22} />
            <span style={{ fontSize: '.8rem' }}>Pagamento</span>
          </button>
        </div>

        {/* Attendance History */}
        <div className="section-header"><span className="section-title">Frequência este mês</span></div>
        {lastAttendance && (
          <p style={{ fontSize: '.75rem', color: 'var(--color-text-3)', marginBottom: 'var(--space-2)' }}>
            Última presença: {fmtDate(lastAttendance)}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 'var(--space-5)' }}>
          {Array.from({ length: 31 }, (_, i) => {
            const day = String(i + 1).padStart(2, '0')
            const dateStr = `${thisMonth}-${day}`
            const present = student.attendances?.some((a: any) => a.date === dateStr)
            return (
              <div key={day} style={{
                width: 28, height: 28, borderRadius: 6, fontSize: '.7rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: present ? 'var(--color-green-dim)' : 'var(--color-surface-2)',
                border: `1px solid ${present ? 'var(--color-green-dark)' : 'var(--color-border)'}`,
                color: present ? 'var(--color-green)' : 'var(--color-text-3)',
              }}>
                {i + 1}
              </div>
            )
          })}
        </div>

        {/* Payment History */}
        <div className="section-header"><span className="section-title">Histórico de pagamentos</span></div>
        {student.payments?.length === 0 ? (
          <p style={{ fontSize: '.8rem', color: 'var(--color-text-3)' }}>Nenhum pagamento registrado</p>
        ) : (
          <div className="stack">
            {student.payments?.map((p: any) => (
              <div key={p.id} className="list-item">
                <div className="list-item-icon">
                  <DollarSign size={16} />
                </div>
                <div className="list-item-body">
                  <div className="list-item-title">{p.paymentMethod.toUpperCase()}</div>
                  <div className="list-item-sub">
                    {p.paymentDate ? `Pago em ${fmtDate(p.paymentDate)}` : p.dueDate ? `Vence ${fmtDate(p.dueDate)}` : '—'}
                  </div>
                </div>
                <div className="list-item-right">
                  <span className={`badge badge-${p.status}`}>{p.status}</span>
                  <div style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--color-green)', marginTop: 2 }}>
                    {fmt(p.value)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {showEdit && editForm && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowEdit(false) }}>
            <div className="modal-sheet">
              <div className="modal-header">
                <h2 className="modal-title">Editar Aluno</h2>
                <button className="btn-ghost" onClick={() => setShowEdit(false)}>✕</button>
              </div>

              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input className="form-input" value={editForm.name}
                  onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone *</label>
                <input className="form-input" value={editForm.phone}
                  onChange={e => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Plano</label>
                  <select className="form-select" value={editForm.plan}
                    onChange={e => setEditForm((f: any) => ({ ...f, plan: e.target.value }))}>
                    <option>Mensal Básico</option><option>Mensal Completo</option>
                    <option>Trimestral</option><option>Semestral</option><option>Anual</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Mensalidade R$</label>
                  <input className="form-input" type="number" value={editForm.monthlyFee}
                    onChange={e => setEditForm((f: any) => ({ ...f, monthlyFee: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={editForm.status}
                  onChange={e => setEditForm((f: any) => ({ ...f, status: e.target.value }))}>
                  <option value="ativo">Ativo</option>
                  <option value="pendente">Pendente</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              <button className="btn btn-primary btn-full btn-lg" onClick={handleSaveEdit}>
                Salvar Alterações
              </button>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPayment && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowPayment(false) }}>
            <div className="modal-sheet">
              <div className="modal-header">
                <h2 className="modal-title">Registrar Pagamento</h2>
                <button className="btn-ghost" onClick={() => setShowPayment(false)}>✕</button>
              </div>

              <p style={{ marginBottom: 'var(--space-4)', fontSize: '.875rem' }}>
                Mensalidade de <strong>{student.name}</strong>
              </p>

              <div className="form-group">
                <label className="form-label">Valor R$</label>
                <input id="payment-value" className="form-input" type="number" step="0.01"
                  placeholder={String(student.monthlyFee)}
                  value={payForm.value}
                  onChange={e => setPayForm(f => ({ ...f, value: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Forma de pagamento</label>
                <select className="form-select" value={payForm.paymentMethod}
                  onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                  <option value="pix">Pix</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_credito">Cartão de crédito</option>
                  <option value="cartao_debito">Cartão de débito</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Data do pagamento</label>
                <input className="form-input" type="date" value={payForm.paymentDate}
                  onChange={e => setPayForm(f => ({ ...f, paymentDate: e.target.value }))} />
              </div>

              <button id="confirm-payment-btn" className="btn btn-primary btn-full btn-lg" onClick={handlePayment}>
                Confirmar Pagamento
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
