// src/app/students/page.tsx — Students module
'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { Users, Search, Plus, Phone, ChevronRight } from 'lucide-react'

type Student = {
  id: string; name: string; phone: string; email?: string; plan: string
  monthlyFee: number; dueDate: number; status: string; createdAt: string
}

const STATUSES = ['todos', 'ativo', 'pendente', 'inativo']

const EMPTY_FORM = {
  name: '', phone: '', email: '', birthDate: '', plan: 'Mensal Básico',
  monthlyFee: '', dueDate: '1', status: 'ativo', notes: '',
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function StudentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(searchParams.get('new') === '1')
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter !== 'todos') params.set('status', statusFilter)
    const res = await fetch(`/api/students?${params}`)
    const data = await res.json()
    setStudents(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => { load() }, [load])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSave() {
    if (!form.name || !form.phone) { showToast('Nome e telefone obrigatórios', 'error'); return }
    setSaving(true)
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, monthlyFee: Number(form.monthlyFee), dueDate: Number(form.dueDate) }),
    })
    setSaving(false)
    if (res.ok) {
      showToast('Aluno cadastrado com sucesso!')
      setShowModal(false)
      setForm(EMPTY_FORM)
      load()
    } else {
      const d = await res.json()
      showToast(d.error || 'Erro ao cadastrar', 'error')
    }
  }

  return (
    <AppLayout>
      <div className="page">
        {toast && (
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        )}

        {/* Header */}
        <div className="row-between" style={{ marginBottom: 'var(--space-4)' }}>
          <h1>Alunos</h1>
          <button className="btn btn-primary btn-sm" onClick={() => { setForm(EMPTY_FORM); setShowModal(true) }}>
            <Plus size={16} /> Novo
          </button>
        </div>

        {/* Search */}
        <div className="search-wrapper" style={{ marginBottom: 'var(--space-3)' }}>
          <Search size={16} className="search-icon" />
          <input
            id="student-search"
            className="form-input search-input"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs" style={{ marginBottom: 'var(--space-4)' }}>
          {STATUSES.map(s => (
            <button
              key={s}
              id={`filter-${s}`}
              className={`filter-tab ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>Nenhum aluno encontrado</h3>
            <p>Cadastre o primeiro aluno clicando em Novo</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Cadastrar aluno
            </button>
          </div>
        ) : (
          <div className="stack">
            {students.map(s => (
              <div
                key={s.id}
                className="list-item"
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/students/${s.id}`)}
              >
                <div className="avatar">
                  {s.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="list-item-body">
                  <div className="list-item-title">{s.name}</div>
                  <div className="list-item-sub">{s.plan} · {s.phone}</div>
                </div>
                <div className="list-item-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div>
                    <span className={`badge badge-${s.status}`}>{s.status}</span>
                    <div style={{ fontSize: '.7rem', color: 'var(--color-text-3)', marginTop: 2, textAlign: 'right' }}>
                      {fmt(s.monthlyFee)}
                    </div>
                  </div>
                  <ChevronRight size={14} color="var(--color-text-3)" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Student Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <div className="modal-sheet">
              <div className="modal-header">
                <h2 className="modal-title">Novo Aluno</h2>
                <button className="btn-ghost" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="form-group">
                <label className="form-label">Nome completo *</label>
                <input id="student-name" className="form-input" placeholder="João da Silva" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone *</label>
                <input id="student-phone" className="form-input" placeholder="(11) 9 0000-0000" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="joao@email.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Data de nascimento</label>
                  <input className="form-input" type="date" value={form.birthDate}
                    onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Dia vencimento</label>
                  <input className="form-input" type="number" min="1" max="31" value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Plano</label>
                  <select className="form-select" value={form.plan}
                    onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                    <option>Mensal Básico</option>
                    <option>Mensal Completo</option>
                    <option>Trimestral</option>
                    <option>Semestral</option>
                    <option>Anual</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Mensalidade R$</label>
                  <input className="form-input" type="number" min="0" step="0.01" placeholder="89.90" value={form.monthlyFee}
                    onChange={e => setForm(f => ({ ...f, monthlyFee: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="ativo">Ativo</option>
                  <option value="pendente">Pendente</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Observações</label>
                <textarea className="form-textarea" placeholder="Informações adicionais..." value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              <button id="save-student-btn" className="btn btn-primary btn-full btn-lg" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" /> : 'Cadastrar Aluno'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
