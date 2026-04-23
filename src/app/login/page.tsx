// src/app/login/page.tsx — Login / Register page
'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, UserPlus, LogIn } from 'lucide-react'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()

  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'recepcionista'>('recepcionista')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setSuccess('')
    setName('')
    setPassword('')
    setConfirmPassword('')
  }

  /* ─── Login ─── */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)

    if (res?.error) {
      setError('E-mail ou senha incorretos. Verifique seus dados.')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  /* ─── Register ─── */
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim()) { setError('Informe seu nome completo.'); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return }

    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Erro ao criar conta.')
    } else {
      setSuccess('Conta criada! Fazendo login automaticamente...')
      // Auto-login after register
      const loginRes = await signIn('credentials', { email, password, redirect: false })
      if (loginRes?.ok) {
        router.push('/')
        router.refresh()
      } else {
        setSuccess('Conta criada com sucesso! Faça login.')
        switchMode('login')
      }
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
    }}>

      {/* ─── Logo ─── */}
      <div style={{ marginBottom: 'var(--space-7)', textAlign: 'center' }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '20px',
          background: 'var(--color-green-dim)',
          border: '2px solid var(--color-green-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-4)',
          boxShadow: 'var(--shadow-green)',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            <path d="M2 12h20"/>
          </svg>
        </div>
        <h1 style={{ color: 'var(--color-text)', letterSpacing: '-.03em', fontSize: '1.6rem' }}>
          Arena<span style={{ color: 'var(--color-green)' }}>Flow</span>
        </h1>
        <p style={{ color: 'var(--color-text-3)', fontSize: '.85rem', marginTop: '6px' }}>
          Gestão de academia e quadras society
        </p>
      </div>

      {/* ─── Card ─── */}
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 'var(--space-6)' }}>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--color-surface-2)',
          borderRadius: 'var(--radius)',
          padding: '4px',
          marginBottom: 'var(--space-5)',
          border: '1px solid var(--color-border)',
        }}>
          <button
            id="tab-login"
            onClick={() => switchMode('login')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'calc(var(--radius) - 2px)',
              fontWeight: 600,
              fontSize: '.85rem',
              transition: 'all .18s',
              background: mode === 'login' ? 'var(--color-surface)' : 'transparent',
              color: mode === 'login' ? 'var(--color-text)' : 'var(--color-text-3)',
              border: mode === 'login' ? '1px solid var(--color-border-light)' : '1px solid transparent',
              boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <LogIn size={15} />
            Entrar
          </button>
          <button
            id="tab-register"
            onClick={() => switchMode('register')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'calc(var(--radius) - 2px)',
              fontWeight: 600,
              fontSize: '.85rem',
              transition: 'all .18s',
              background: mode === 'register' ? 'var(--color-surface)' : 'transparent',
              color: mode === 'register' ? 'var(--color-text)' : 'var(--color-text-3)',
              border: mode === 'register' ? '1px solid var(--color-border-light)' : '1px solid transparent',
              boxShadow: mode === 'register' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <UserPlus size={15} />
            Criar conta
          </button>
        </div>

        {/* ─── LOGIN FORM ─── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <p style={{ fontSize: '.8rem', color: 'var(--color-text-3)', marginBottom: 'var(--space-5)' }}>
              Bem-vindo de volta! Insira seus dados para acessar.
            </p>

            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-text-3)', background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <AlertBox type="error">{error}</AlertBox>}

            <button
              id="login-btn"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ marginTop: 'var(--space-2)' }}
            >
              {loading ? <span className="spinner" /> : <><LogIn size={17} /> Entrar</>}
            </button>

            <p style={{ textAlign: 'center', fontSize: '.75rem', marginTop: 'var(--space-4)', color: 'var(--color-text-3)' }}>
              Não tem conta?{' '}
              <button type="button" onClick={() => switchMode('register')}
                style={{ color: 'var(--color-green)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}>
                Criar conta grátis
              </button>
            </p>
          </form>
        )}

        {/* ─── REGISTER FORM ─── */}
        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <p style={{ fontSize: '.8rem', color: 'var(--color-text-3)', marginBottom: 'var(--space-5)' }}>
              Crie sua conta para começar a gerenciar sua academia.
            </p>

            <div className="form-group">
              <label className="form-label">Nome completo</label>
              <input
                id="register-name"
                type="text"
                className="form-input"
                placeholder="João da Silva"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                id="register-email"
                type="email"
                className="form-input"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Perfil de acesso</label>
              <select
                id="register-role"
                className="form-select"
                value={role}
                onChange={e => setRole(e.target.value as 'admin' | 'recepcionista')}
              >
                <option value="admin">Administrador — acesso total</option>
                <option value="recepcionista">Recepcionista — acesso operacional</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="register-password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-text-3)', background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirmar senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="register-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-text-3)', background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password strength indicator */}
              {password.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: password.length >= i * 2
                        ? i <= 2 ? 'var(--color-warning)' : 'var(--color-green)'
                        : 'var(--color-border)',
                      transition: 'background .2s',
                    }} />
                  ))}
                </div>
              )}
            </div>

            {error && <AlertBox type="error">{error}</AlertBox>}
            {success && <AlertBox type="success">{success}</AlertBox>}

            <button
              id="register-btn"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ marginTop: 'var(--space-2)' }}
            >
              {loading ? <span className="spinner" /> : <><UserPlus size={17} /> Criar minha conta</>}
            </button>

            <p style={{ textAlign: 'center', fontSize: '.75rem', marginTop: 'var(--space-4)', color: 'var(--color-text-3)' }}>
              Já tem uma conta?{' '}
              <button type="button" onClick={() => switchMode('login')}
                style={{ color: 'var(--color-green)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}>
                Fazer login
              </button>
            </p>
          </form>
        )}

      </div>

      {/* Demo hint — only on login mode */}
      {mode === 'login' && (
        <div style={{
          marginTop: 'var(--space-4)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius)',
          background: 'rgba(34,197,94,.06)',
          border: '1px solid rgba(34,197,94,.15)',
          width: '100%',
          maxWidth: 400,
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '.72rem', color: 'var(--color-text-3)' }}>
            <span style={{ color: 'var(--color-green)', fontWeight: 700 }}>Demo Admin:</span>{' '}
            admin@arenaflow.com · admin123
          </p>
        </div>
      )}
    </div>
  )
}

/* ─── Helper component ─── */
function AlertBox({ type, children }: { type: 'error' | 'success'; children: React.ReactNode }) {
  const isError = type === 'error'
  return (
    <div style={{
      padding: 'var(--space-3) var(--space-4)',
      borderRadius: 'var(--radius)',
      background: isError ? 'rgba(239,68,68,.08)' : 'rgba(34,197,94,.08)',
      border: `1px solid ${isError ? 'rgba(239,68,68,.3)' : 'rgba(34,197,94,.3)'}`,
      color: isError ? 'var(--color-error)' : 'var(--color-green)',
      fontSize: '.82rem',
      fontWeight: 500,
      marginBottom: 'var(--space-4)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
    }}>
      <span>{isError ? '⚠️' : '✅'}</span>
      {children}
    </div>
  )
}
