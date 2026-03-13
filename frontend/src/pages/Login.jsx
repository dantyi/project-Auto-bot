import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f0fdf4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 40px rgba(26,92,56,0.12), 0 4px 12px rgba(0,0,0,0.06)',
    border: '1px solid #d1fae5',
  },
  logoArea: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoText: {
    fontSize: '2rem',
    fontWeight: 900,
    color: '#1a5c38',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    display: 'block',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#6b7280',
    marginTop: '6px',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '24px',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#1a5c38',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '7px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '2px solid #e5e7eb',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    backgroundColor: '#f9fafb',
    color: '#111827',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#1a5c38',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.15s',
    marginTop: '8px',
    letterSpacing: '0.3px',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    border: '1px solid #fca5a5',
    color: '#991b1b',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '0.88rem',
    marginBottom: '18px',
    fontWeight: 500,
  },
  loadingText: {
    opacity: 0.7,
  },
}

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Por favor ingrese su usuario y contrasena.')
      return
    }

    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al iniciar sesion. Verifique sus credenciales.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <span style={styles.logoText}>INTEEGRA</span>
          <p style={styles.subtitle}>Sistema de Automatizacion CRM</p>
        </div>

        <h2 style={styles.title}>Iniciar sesion</h2>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              style={styles.input}
              placeholder="Ingrese su usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              onFocus={e => {
                e.target.style.borderColor = '#1a5c38'
                e.target.style.boxShadow = '0 0 0 4px rgba(26,92,56,0.1)'
                e.target.style.backgroundColor = '#fff'
              }}
              onBlur={e => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.boxShadow = 'none'
                e.target.style.backgroundColor = '#f9fafb'
              }}
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="password">Contrasena</label>
            <input
              id="password"
              type="password"
              style={styles.input}
              placeholder="Ingrese su contrasena"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              onFocus={e => {
                e.target.style.borderColor = '#1a5c38'
                e.target.style.boxShadow = '0 0 0 4px rgba(26,92,56,0.1)'
                e.target.style.backgroundColor = '#fff'
              }}
              onBlur={e => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.boxShadow = 'none'
                e.target.style.backgroundColor = '#f9fafb'
              }}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              ...(loading ? styles.loadingText : {}),
              backgroundColor: loading ? '#2d7a4f' : '#1a5c38',
            }}
            disabled={loading}
            onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = '#14472c' }}
            onMouseLeave={e => { if (!loading) e.target.style.backgroundColor = '#1a5c38' }}
          >
            {loading ? 'Iniciando sesion...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
