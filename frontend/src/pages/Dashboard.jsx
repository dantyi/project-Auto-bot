import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api.js'
import TaskTable from '../components/TaskTable.jsx'
import BotStatus from '../components/BotStatus.jsx'

const styles = {
  page: {
    padding: '28px 5%',
    maxWidth: '1400px',
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
  newTaskBtn: {
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 22px',
    fontSize: '0.92rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.15s',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap: '14px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '18px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e5e7eb',
  },
  statCardValue: {
    fontSize: '2rem',
    fontWeight: 800,
    lineHeight: 1,
    marginBottom: '4px',
  },
  statCardLabel: {
    fontSize: '0.78rem',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: 600,
  },
  botStatusRow: {
    marginBottom: '24px',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#1a5c38',
    marginBottom: '14px',
    paddingBottom: '8px',
    borderBottom: '2px solid #d1fae5',
  },
  successBanner: {
    backgroundColor: '#d1fae5',
    border: '1px solid #6ee7b7',
    color: '#065f46',
    borderRadius: '10px',
    padding: '12px 18px',
    marginBottom: '20px',
    fontWeight: 600,
    fontSize: '0.92rem',
  },
  loadingText: {
    color: '#1a5c38',
    fontWeight: 600,
    padding: '40px',
    textAlign: 'center',
  },
  errorText: {
    color: '#991b1b',
    backgroundColor: '#fee2e2',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '14px',
    marginBottom: '20px',
    fontWeight: 500,
    fontSize: '0.9rem',
  },
}

const ROLE_TITLES = {
  admin:        'Panel de Administracion',
  coordinador:  'Panel de Coordinacion',
  orquestador:  'Mis Tareas',
  kickoff:      'Mis Tareas - Kick Off',
  ultima_milla: 'Mis Tareas - Ultima Milla',
  config_pem:   'Mis Tareas - Config/PEM',
}

const STAT_CARDS = [
  { key: 'total',      label: 'Total',      color: '#374151' },
  { key: 'pendiente',  label: 'Pendientes', color: '#92400e' },
  { key: 'en_proceso', label: 'En Proceso', color: '#1e40af' },
  { key: 'completado', label: 'Completados',color: '#065f46' },
  { key: 'error',      label: 'Errores',    color: '#991b1b' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const successMessage = location.state?.success || ''

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get('/tasks/')
      setTasks(res.data)
      setError('')
    } catch (err) {
      setError('Error al cargar las tareas: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/tasks/stats')
      setStats(res.data)
    } catch {
      // Stats failure is non-critical
    }
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchStats()
  }, [fetchTasks, fetchStats])

  const handleRefresh = () => {
    setLoading(true)
    fetchTasks()
    fetchStats()
  }

  const role = user?.role
  const isAdminOrCoord = role === 'admin' || role === 'coordinador'
  const isOrquestador = role === 'orquestador'
  const canCreateTask = ['kickoff', 'ultima_milla', 'config_pem', 'coordinador', 'orquestador'].includes(role)

  // Split tasks for orquestador view
  const ownTasks = isOrquestador
    ? tasks.filter(t => t.created_by === 'orquestador')
    : tasks
  const kickoffTasks = isOrquestador
    ? tasks.filter(t => t.created_by === 'kickoff')
    : []

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>{ROLE_TITLES[role] || 'Dashboard'}</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            style={{
              backgroundColor: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={handleRefresh}
          >
            Actualizar
          </button>
          {canCreateTask && (
            <button
              style={styles.newTaskBtn}
              onClick={() => navigate('/nueva-tarea')}
              onMouseEnter={e => e.target.style.backgroundColor = '#218838'}
              onMouseLeave={e => e.target.style.backgroundColor = '#28a745'}
            >
              + Nueva Tarea
            </button>
          )}
        </div>
      </div>

      {successMessage && (
        <div style={styles.successBanner}>{successMessage}</div>
      )}

      {error && <div style={styles.errorText}>{error}</div>}

      {/* Admin / Coordinador view */}
      {isAdminOrCoord && (
        <>
          <div style={styles.botStatusRow}>
            <BotStatus />
          </div>

          {stats && (
            <div style={styles.statsRow}>
              {STAT_CARDS.map(card => (
                <div key={card.key} style={styles.statCard}>
                  <div style={{ ...styles.statCardValue, color: card.color }}>
                    {stats[card.key] ?? 0}
                  </div>
                  <div style={styles.statCardLabel}>{card.label}</div>
                </div>
              ))}
            </div>
          )}

          <div style={styles.section}>
            {loading ? (
              <div style={styles.loadingText}>Cargando tareas...</div>
            ) : (
              <TaskTable
                tasks={tasks}
                onStatusChange={handleRefresh}
                showAssign={true}
              />
            )}
          </div>
        </>
      )}

      {/* Orquestador view */}
      {isOrquestador && (
        <>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Mis Tareas de Orquestacion ({ownTasks.length})</h2>
            {loading ? (
              <div style={styles.loadingText}>Cargando tareas...</div>
            ) : (
              <TaskTable tasks={ownTasks} onStatusChange={handleRefresh} />
            )}
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Tareas de Kick Off ({kickoffTasks.length})</h2>
            {loading ? (
              <div style={styles.loadingText}>Cargando tareas...</div>
            ) : (
              <TaskTable tasks={kickoffTasks} onStatusChange={handleRefresh} />
            )}
          </div>
        </>
      )}

      {/* Kick Off / Ultima Milla / Config PEM view */}
      {!isAdminOrCoord && !isOrquestador && (
        <div style={styles.section}>
          {loading ? (
            <div style={styles.loadingText}>Cargando tareas...</div>
          ) : (
            <TaskTable tasks={tasks} onStatusChange={handleRefresh} />
          )}
        </div>
      )}
    </div>
  )
}
