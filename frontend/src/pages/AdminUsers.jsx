import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api.js'

const ROLE_LABELS = {
  admin:        'Admin',
  coordinador:  'Coordinador',
  orquestador:  'Orquestador',
  kickoff:      'Kick Off',
  ultima_milla: 'Ultima Milla',
  config_pem:   'Config/PEM',
}

const ROLE_COLORS = {
  admin:        { bg: '#f3e8ff', color: '#7c3aed' },
  coordinador:  { bg: '#e0f2fe', color: '#0369a1' },
  orquestador:  { bg: '#fef3c7', color: '#b45309' },
  kickoff:      { bg: '#d1fae5', color: '#065f46' },
  ultima_milla: { bg: '#fce7f3', color: '#be185d' },
  config_pem:   { bg: '#ede9fe', color: '#6d28d9' },
}

const styles = {
  page: {
    padding: '28px 5%',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#1a5c38',
  },
  createBtn: {
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 20px',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  tableWrapper: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  thead: {
    backgroundColor: '#1a5c38',
    color: '#fff',
  },
  th: {
    padding: '13px 18px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  td: {
    padding: '13px 18px',
    borderBottom: '1px solid #f0f0f0',
    verticalAlign: 'middle',
  },
  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '0.78rem',
    fontWeight: 700,
  },
  actionBtn: {
    backgroundColor: 'transparent',
    color: '#1a5c38',
    border: '1.5px solid #1a5c38',
    borderRadius: '7px',
    padding: '5px 12px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  // Modal
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  },
  modalTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#1a5c38',
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
    padding: '11px 14px',
    borderRadius: '10px',
    border: '2px solid #e5e7eb',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    backgroundColor: '#f9fafb',
    marginBottom: '16px',
  },
  select: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '2px solid #e5e7eb',
    fontSize: '0.95rem',
    outline: 'none',
    backgroundColor: '#f9fafb',
    marginBottom: '16px',
    cursor: 'pointer',
  },
  modalBtns: {
    display: 'flex',
    gap: '10px',
    marginTop: '8px',
  },
  saveBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#1a5c38',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  cancelModalBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    border: '1px solid #fca5a5',
    color: '#991b1b',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '0.85rem',
    marginBottom: '14px',
    fontWeight: 500,
  },
  successBox: {
    backgroundColor: '#d1fae5',
    border: '1px solid #6ee7b7',
    color: '#065f46',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '0.85rem',
    marginBottom: '16px',
    fontWeight: 500,
  },
}

const onFocus = e => {
  e.target.style.borderColor = '#1a5c38'
  e.target.style.boxShadow = '0 0 0 4px rgba(26,92,56,0.1)'
  e.target.style.backgroundColor = '#fff'
}
const onBlur = e => {
  e.target.style.borderColor = '#e5e7eb'
  e.target.style.boxShadow = 'none'
  e.target.style.backgroundColor = '#f9fafb'
}

const ALL_ROLES = ['admin', 'coordinador', 'orquestador', 'kickoff', 'ultima_milla', 'config_pem']

function ChangePasswordModal({ targetUser, onClose, onSuccess }) {
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newPassword.trim()) { setError('La contrasena no puede estar vacia.'); return }
    if (newPassword.length < 4) { setError('La contrasena debe tener al menos 4 caracteres.'); return }
    setLoading(true)
    setError('')
    try {
      await api.patch(`/users/${targetUser.id}`, { password: newPassword })
      onSuccess(`Contrasena de "${targetUser.username}" actualizada correctamente.`)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contrasena.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={styles.modal}>
        <h2 style={styles.modalTitle}>Cambiar contrasena</h2>
        <p style={{ fontSize: '0.88rem', color: '#6b7280', marginBottom: '18px' }}>
          Usuario: <strong style={{ color: '#1a5c38' }}>{targetUser.username}</strong>
        </p>
        {error && <div style={styles.errorBox}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label style={styles.label} htmlFor="new-password">Nueva contrasena</label>
          <input
            id="new-password"
            type="password"
            style={styles.input}
            placeholder="Ingrese nueva contrasena"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            onFocus={onFocus} onBlur={onBlur}
            autoFocus
          />
          <div style={styles.modalBtns}>
            <button type="submit" style={styles.saveBtn} disabled={loading}
              onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = '#14472c' }}
              onMouseLeave={e => { if (!loading) e.target.style.backgroundColor = '#1a5c38' }}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" style={styles.cancelModalBtn} onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateUserModal({ onClose, onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password || !role) { setError('Todos los campos son requeridos.'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/users/', { username: username.trim(), password, role })
      onSuccess(`Usuario "${username.trim()}" creado correctamente.`)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el usuario.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={styles.modal}>
        <h2 style={styles.modalTitle}>Crear nuevo usuario</h2>
        {error && <div style={styles.errorBox}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Usuario</label>
          <input type="text" style={styles.input} placeholder="Nombre de usuario"
            value={username} onChange={e => setUsername(e.target.value)}
            onFocus={onFocus} onBlur={onBlur} autoFocus />
          <label style={styles.label}>Contrasena</label>
          <input type="password" style={styles.input} placeholder="Contrasena inicial"
            value={password} onChange={e => setPassword(e.target.value)}
            onFocus={onFocus} onBlur={onBlur} />
          <label style={styles.label}>Rol</label>
          <select style={styles.select} value={role} onChange={e => setRole(e.target.value)}
            onFocus={onFocus} onBlur={onBlur}>
            <option value="">Seleccione rol...</option>
            {ALL_ROLES.map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          <div style={styles.modalBtns}>
            <button type="submit" style={styles.saveBtn} disabled={loading}
              onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = '#14472c' }}
              onMouseLeave={e => { if (!loading) e.target.style.backgroundColor = '#1a5c38' }}>
              {loading ? 'Creando...' : 'Crear usuario'}
            </button>
            <button type="button" style={styles.cancelModalBtn} onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordModal, setPasswordModal] = useState(null) // user object
  const [createModal, setCreateModal] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/users/')
      setUsers(res.data)
      setError('')
    } catch (err) {
      setError('Error al cargar usuarios: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleSuccess = (msg) => {
    setSuccess(msg)
    fetchUsers()
    setTimeout(() => setSuccess(''), 5000)
  }

  const formatDate = (d) => {
    if (!d) return '-'
    try { return new Date(d).toLocaleDateString('es-CO') } catch { return d }
  }

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Gestion de Usuarios</h1>
        <button
          style={styles.createBtn}
          onClick={() => setCreateModal(true)}
          onMouseEnter={e => e.target.style.backgroundColor = '#218838'}
          onMouseLeave={e => e.target.style.backgroundColor = '#28a745'}
        >
          + Nuevo Usuario
        </button>
      </div>

      {success && <div style={styles.successBox}>{success}</div>}
      {error && <div style={{ ...styles.errorBox, marginBottom: '16px' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#1a5c38', fontWeight: 600 }}>
          Cargando usuarios...
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Usuario</th>
                <th style={styles.th}>Rol</th>
                <th style={styles.th}>Creado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                    No hay usuarios
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => {
                  const roleColor = ROLE_COLORS[u.role] || { bg: '#f3f4f6', color: '#4b5563' }
                  const isSelf = u.username === currentUser?.username

                  return (
                    <tr key={u.id}
                      style={{ backgroundColor: idx % 2 !== 0 ? '#f9fafe' : '#fff' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 !== 0 ? '#f9fafe' : '#fff'}
                    >
                      <td style={{ ...styles.td, color: '#9ca3af', fontSize: '0.82rem' }}>#{u.id}</td>
                      <td style={styles.td}>
                        <span style={{ fontWeight: 700, color: '#111827' }}>{u.username}</span>
                        {isSelf && (
                          <span style={{ marginLeft: '8px', fontSize: '0.72rem', color: '#1a5c38', fontWeight: 600 }}>
                            (tu cuenta)
                          </span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: roleColor.bg,
                          color: roleColor.color,
                        }}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: '#6b7280', fontSize: '0.85rem' }}>
                        {formatDate(u.created_at)}
                      </td>
                      <td style={styles.td}>
                        <button
                          style={{
                            ...styles.actionBtn,
                            opacity: isSelf ? 0.5 : 1,
                            cursor: isSelf ? 'not-allowed' : 'pointer',
                          }}
                          onClick={() => { if (!isSelf) setPasswordModal(u) }}
                          disabled={isSelf}
                          title={isSelf ? 'No puedes cambiar tu propia contrasena desde aqui' : 'Cambiar contrasena'}
                          onMouseEnter={e => { if (!isSelf) { e.target.style.backgroundColor = '#1a5c38'; e.target.style.color = '#fff' } }}
                          onMouseLeave={e => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#1a5c38' }}
                        >
                          Cambiar contrasena
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {passwordModal && (
        <ChangePasswordModal
          targetUser={passwordModal}
          onClose={() => setPasswordModal(null)}
          onSuccess={handleSuccess}
        />
      )}

      {createModal && (
        <CreateUserModal
          onClose={() => setCreateModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
