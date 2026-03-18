import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const ROLE_COLORS = {
  admin:        { bg: '#7c3aed', text: '#fff' },
  coordinador:  { bg: '#0369a1', text: '#fff' },
  orquestador:  { bg: '#b45309', text: '#fff' },
  kickoff:      { bg: '#0f766e', text: '#fff' },
  ultima_milla: { bg: '#be185d', text: '#fff' },
  config_pem:   { bg: '#6d28d9', text: '#fff' },
}

const ROLE_LABELS = {
  admin:        'Admin',
  coordinador:  'Coordinador',
  orquestador:  'Orquestador',
  kickoff:      'Kick Off',
  ultima_milla: 'Última Milla',
  config_pem:   'Config/PEM',
}

const styles = {
  header: {
    backgroundColor: '#1a5c38',
    color: '#fff',
    padding: '0 5%',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '28px',
  },
  logo: {
    fontSize: '1.35rem',
    fontWeight: 800,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: '#fff',
    textDecoration: 'none',
  },
  nav: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
  },
  navLink: {
    color: '#d1fae5',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '0.9rem',
    transition: 'color 0.2s',
    padding: '4px 0',
    borderBottom: '2px solid transparent',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  roleBadge: {
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '0.78rem',
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  username: {
    fontSize: '0.9rem',
    color: '#d1fae5',
    fontWeight: 500,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
}

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (!isAuthenticated) return null

  const roleColor = ROLE_COLORS[user?.role] || { bg: '#4b5563', text: '#fff' }
  const roleLabel = ROLE_LABELS[user?.role] || user?.role

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Determine nav links based on role
  const canCreateTask = ['kickoff', 'ultima_milla', 'config_pem', 'coordinador', 'orquestador'].includes(user?.role)
  const isAdmin = user?.role === 'admin'

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <Link to="/dashboard" style={styles.logo}>INTEEGRA</Link>
        <nav style={styles.nav}>
          <Link
            to="/dashboard"
            style={styles.navLink}
            onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.borderBottomColor = '#28a745' }}
            onMouseLeave={e => { e.target.style.color = '#d1fae5'; e.target.style.borderBottomColor = 'transparent' }}
          >
            Dashboard
          </Link>
          {canCreateTask && (
            <Link
              to="/nueva-tarea"
              style={styles.navLink}
              onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.borderBottomColor = '#28a745' }}
              onMouseLeave={e => { e.target.style.color = '#d1fae5'; e.target.style.borderBottomColor = 'transparent' }}
            >
              Nueva Tarea
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin/usuarios"
              style={styles.navLink}
              onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.borderBottomColor = '#28a745' }}
              onMouseLeave={e => { e.target.style.color = '#d1fae5'; e.target.style.borderBottomColor = 'transparent' }}
            >
              Usuarios
            </Link>
          )}
        </nav>
      </div>

      <div style={styles.right}>
        <span
          style={{
            ...styles.roleBadge,
            backgroundColor: roleColor.bg,
            color: roleColor.text,
          }}
        >
          {roleLabel}
        </span>
        <span style={styles.username}>{user?.username}</span>
        <button
          style={styles.logoutBtn}
          onClick={handleLogout}
          onMouseEnter={e => e.target.style.backgroundColor = 'rgba(255,255,255,0.25)'}
          onMouseLeave={e => e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'}
        >
          Cerrar sesion
        </button>
      </div>
    </header>
  )
}
