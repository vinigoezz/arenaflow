// src/app/courts/page.tsx — Courts management
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { Grid3X3, Plus, Edit, Trash2, ChevronRight, Clock, DollarSign } from 'lucide-react'

type Court = { id: string; name: string; description?: string; pricePerHour: number; openingTime: string; closingTime: string; status: string }

const EMPTY_FORM = { name: '', description: '', pricePerHour: '120', openingTime: '07:00', closingTime: '22:00', status: 'ativa' }

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

export default function CourtsPage() {
  const router = useRouter()
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/courts')
    const data = await res.json()
    setCourts(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  function openAdd() { setForm(EMPTY_FORM); setEditingId(null); setShowModal(true) }
  function openEdit(c: Court) {
    setForm({ name: c.name, description: c.description || '', pricePerHour: String(c.pricePerHour), openingTime: c.openingTime, closingTime: c.closingTime, status: c.status })
    setEditingId(c.id); setShowModal(true)
  }

  async function handleSave() {
    if (!form.name) { showToast('Nome obrigatório', 'error'); return }
    setSaving(true)
    const url = editingId ? `/api/courts/${editingId}` : '/api/courts'
    const method = editingId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, pricePerHour: Number(form.pricePerHour) }),
    })
    setSaving(false)
    if (res.ok) {
      showToast(editingId ? 'Quadra atualizada!' : 'Quadra cadastrada!')
      setShowModal(false); load()
    } else {
      showToast('Erro ao salvar', 'error')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir ${name}?`)) return
    const res = await fetch(`/api/courts/${id}`, { method: 'DELETE' })
    if (res.ok) { showToast('Quadra excluída!'); load() }
    else showToast('Erro ao excluir', 'error')
  }

  return (
    <AppLayout>
      <div className="page">
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

        <div className="row-between" style={{ marginBottom: 'var(--space-5)' }}>
          <h1>Quadras</h1>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <Plus size={16} /> Nova
          </button>
        </div>

        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : courts.length === 0 ? (
          <div className="empty-state">
            <Grid3X3 size={48} />
            <h3>Nenhuma quadra cadastrada</h3>
            <p>Cadastre suas quadras para começar a gerenciar reservas</p>
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} /> Cadastrar quadra
            </button>
          </div>
        ) : (
          <div className="stack">
            {courts.map(c => (
              <div key={c.id} className="card" style={{ padding: 'var(--space-4)' }}>
                <div className="row-between" style={{ marginBottom: 'var(--space-3)' }}>
                  <div className="row" style={{ gap: 'var(--space-3)' }}>
                    <div className="list-item-icon" style={{ width: 44, height: 44 }}>
                      <Grid3X3 size={20} />
                    </div>
                    <div>
                      <h3>{c.name}</h3>
                      {c.description && <p style={{ fontSize: '.75rem', marginTop: 2 }}>{c.description}</p>}
                    </div>
                  </div>
                  <span className={`badge badge-${c.status}`}>{c.status}</span>
                </div>

                <div className="row" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                  <div className="row" style={{ gap: 6 }}>
                    <DollarSign size={14} color="var(--color-green)" />
                    <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--color-green)' }}>
                      {fmt(c.pricePerHour)}/h
                    </span>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <Clock size={14} color="var(--color-text-3)" />
                    <span style={{ fontSize: '.8rem', color: 'var(--color-text-2)' }}>
                      {c.openingTime}–{c.closingTime}
                    </span>
                  </div>
                </div>

                <div className="row" style={{ gap: 'var(--space-2)' }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}
                    onClick={() => router.push(`/courts/${c.id}`)}>
                    <ChevronRight size={14} /> Ver agenda
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>
                    <Edit size={14} />
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id, c.name)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <div className="modal-sheet">
              <div className="modal-header">
                <h2 className="modal-title">{editingId ? 'Editar Quadra' : 'Nova Quadra'}</h2>
                <button className="btn-ghost" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="form-group">
                <label className="form-label">Nome da quadra *</label>
                <input id="court-name" className="form-input" placeholder="Quadra 1" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Descrição</label>
                <input className="form-input" placeholder="Grama sintética, 8 jogadores..." value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Preço por hora R$</label>
                <input id="court-price" className="form-input" type="number" value={form.pricePerHour}
                  onChange={e => setForm(f => ({ ...f, pricePerHour: e.target.value }))} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Abertura</label>
                  <input className="form-input" type="time" value={form.openingTime}
                    onChange={e => setForm(f => ({ ...f, openingTime: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fechamento</label>
                  <input className="form-input" type="time" value={form.closingTime}
                    onChange={e => setForm(f => ({ ...f, closingTime: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="ativa">Ativa</option>
                  <option value="inativa">Inativa</option>
                </select>
              </div>

              <button id="save-court-btn" className="btn btn-primary btn-full btn-lg" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" /> : editingId ? 'Salvar Alterações' : 'Cadastrar Quadra'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
