// src/app/settings/page.tsx — Settings module
'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { Settings, Plus, Trash2, Save } from 'lucide-react'

type Plan = { name: string; value: number }

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [newPlan, setNewPlan] = useState({ name: '', value: '' })
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      setSettings(d)
      try { setPlans(JSON.parse(d.plans || '[]')) } catch { setPlans([]) }
      setLoading(false)
    })
  }, [])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, plans: JSON.stringify(plans) }),
    })
    setSaving(false)
    if (res.ok) showToast('Configurações salvas!')
    else showToast('Erro ao salvar', 'error')
  }

  function addPlan() {
    if (!newPlan.name || !newPlan.value) { showToast('Preencha nome e valor', 'error'); return }
    setPlans(p => [...p, { name: newPlan.name, value: Number(newPlan.value) }])
    setNewPlan({ name: '', value: '' })
  }

  function removePlan(i: number) {
    setPlans(p => p.filter((_, idx) => idx !== i))
  }

  if (loading) return <AppLayout><div className="loading-overlay"><div className="spinner" /></div></AppLayout>

  return (
    <AppLayout>
      <div className="page">
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

        <div className="row-between" style={{ marginBottom: 'var(--space-5)' }}>
          <h1>Configurações</h1>
          <button id="save-settings-btn" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" /> : <><Save size={14} /> Salvar</>}
          </button>
        </div>

        {/* Academy Info */}
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>🏋️ Dados da Academia</h3>

          <div className="form-group">
            <label className="form-label">Nome da academia</label>
            <input id="gym-name" className="form-input" value={settings?.gymName || ''}
              onChange={e => setSettings((s: any) => ({ ...s, gymName: e.target.value }))} />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input className="form-input" value={settings?.phone || ''}
                onChange={e => setSettings((s: any) => ({ ...s, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={settings?.email || ''}
                onChange={e => setSettings((s: any) => ({ ...s, email: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Endereço</label>
            <input className="form-input" value={settings?.address || ''}
              onChange={e => setSettings((s: any) => ({ ...s, address: e.target.value }))} />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Horário de funcionamento</label>
              <input className="form-input" placeholder="06:00 - 23:00" value={settings?.openingHours || ''}
                onChange={e => setSettings((s: any) => ({ ...s, openingHours: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Dias de funcionamento</label>
              <input className="form-input" placeholder="Segunda a Sábado" value={settings?.workingDays || ''}
                onChange={e => setSettings((s: any) => ({ ...s, workingDays: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>💳 Planos de Mensalidade</h3>

          <div className="stack" style={{ marginBottom: 'var(--space-4)' }}>
            {plans.length === 0 && (
              <p style={{ fontSize: '.8rem', color: 'var(--color-text-3)' }}>Nenhum plano cadastrado</p>
            )}
            {plans.map((p, i) => (
              <div key={i} className="row-between" style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius)',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{p.name}</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--color-green)' }}>
                    {p.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => removePlan(i)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="row" style={{ gap: 'var(--space-2)' }}>
            <input className="form-input" placeholder="Nome do plano" style={{ flex: 2 }}
              value={newPlan.name}
              onChange={e => setNewPlan(p => ({ ...p, name: e.target.value }))} />
            <input className="form-input" type="number" placeholder="R$ valor" style={{ flex: 1 }}
              value={newPlan.value}
              onChange={e => setNewPlan(p => ({ ...p, value: e.target.value }))} />
            <button id="add-plan-btn" className="btn btn-primary btn-sm" onClick={addPlan}>
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Payment methods */}
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>💰 Formas de Pagamento Aceitas</h3>

          {['pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'boleto'].map(method => {
            const labels: Record<string, string> = {
              pix: 'Pix', cartao_credito: 'Cartão de crédito',
              cartao_debito: 'Cartão de débito', dinheiro: 'Dinheiro', boleto: 'Boleto',
            }
            const accepted = (settings?.acceptedPaymentMethods || '').split(',')
            const isActive = accepted.includes(method)

            return (
              <div key={method} className="row-between" style={{
                padding: 'var(--space-3) 0',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <span style={{ fontSize: '.875rem' }}>{labels[method]}</span>
                <button
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    const current = (settings?.acceptedPaymentMethods || '').split(',').filter(Boolean)
                    const updated = isActive
                      ? current.filter(m => m !== method)
                      : [...current, method]
                    setSettings((s: any) => ({ ...s, acceptedPaymentMethods: updated.join(',') }))
                  }}
                >
                  {isActive ? '✓ Ativo' : 'Inativo'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Integrations (future) */}
        <div className="card" style={{ marginBottom: 'var(--space-4)', opacity: .7 }}>
          <h3 style={{ marginBottom: 'var(--space-3)' }}>🔌 Integrações futuras</h3>
          <div className="stack" style={{ gap: 'var(--space-3)' }}>
            {[
              { label: 'WhatsApp Business API', icon: '💬', status: 'Em breve' },
              { label: 'Gateway de Pagamento (Pix automático)', icon: '⚡', status: 'Em breve' },
              { label: 'Webhook de Pagamento', icon: '🔗', status: 'Em breve' },
            ].map(int => (
              <div key={int.label} className="row-between">
                <div className="row" style={{ gap: 'var(--space-2)' }}>
                  <span>{int.icon}</span>
                  <span style={{ fontSize: '.8rem', color: 'var(--color-text-2)' }}>{int.label}</span>
                </div>
                <span className="badge badge-pendente">{int.status}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-full btn-lg" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner" /> : <><Save size={18} /> Salvar todas as configurações</>}
        </button>
      </div>
    </AppLayout>
  )
}
