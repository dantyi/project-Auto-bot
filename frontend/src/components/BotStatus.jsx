import React, { useState, useEffect, useCallback } from 'react'
import api from '../api.js'

const styles = {
  widget: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '18px 22px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  statusGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  indicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  indicatorRunning: {
    backgroundColor: '#22c55e',
    boxShadow: '0 0 0 3px rgba(34,197,94,0.25)',
    animation: 'pulse 2s infinite',
  },
  indicatorIdle: {
    backgroundColor: '#9ca3af',
  },
  statusLabel: {
    fontWeight: 700,
    fontSize: '0.9rem',
    color: '#1a5c38',
  },
  divider: {
    width: '1px',
    height: '28px',
    backgroundColor: '#e5e7eb',
  },
  statsGroup: {
    display: 'flex',
    gap: '18px',
    flexWrap: 'wrap',
  },
  statItem: {
    textAlign: 'center',
  },
  statValue: {
    display: 'block',
    fontSize: '1.3rem',
    fontWeight: 800,
    lineHeight: 1,
  },
  statLabel: {
    display: 'block',
    fontSize: '0.72rem',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '2px',
  },
}

export default function BotStatus() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/tasks/stats')
      setStats(res.data)
      setError(false)
    } catch {
      setError(true)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [fetchStats])

  // Bot is considered "running" if there are tasks en_proceso
  const isRunning = stats && stats.en_proceso > 0

  if (error) {
    return (
      <div style={{ ...styles.widget, borderColor: '#fca5a5', backgroundColor: '#fff5f5' }}>
        <span style={{ color: '#991b1b', fontSize: '0.85rem', fontWeight: 600 }}>
          Sin conexion con el servidor
        </span>
      </div>
    )
  }

  return (
    <div style={styles.widget}>
      <div style={styles.statusGroup}>
        <span
          style={{
            ...styles.indicator,
            ...(isRunning ? styles.indicatorRunning : styles.indicatorIdle),
          }}
        />
        <span style={styles.statusLabel}>
          Bot: {isRunning ? 'Procesando' : 'En espera'}
        </span>
      </div>

      <div style={styles.divider} />

      <div style={styles.statsGroup}>
        <div style={styles.statItem}>
          <span style={{ ...styles.statValue, color: '#92400e' }}>
            {stats ? stats.pendiente : '-'}
          </span>
          <span style={styles.statLabel}>Pendientes</span>
        </div>
        <div style={styles.statItem}>
          <span style={{ ...styles.statValue, color: '#1e40af' }}>
            {stats ? stats.en_proceso : '-'}
          </span>
          <span style={styles.statLabel}>En Proceso</span>
        </div>
        <div style={styles.statItem}>
          <span style={{ ...styles.statValue, color: '#065f46' }}>
            {stats ? stats.completado : '-'}
          </span>
          <span style={styles.statLabel}>Completados</span>
        </div>
        <div style={styles.statItem}>
          <span style={{ ...styles.statValue, color: '#991b1b' }}>
            {stats ? stats.error : '-'}
          </span>
          <span style={styles.statLabel}>Errores</span>
        </div>
        <div style={styles.statItem}>
          <span style={{ ...styles.statValue, color: '#374151' }}>
            {stats ? stats.total : '-'}
          </span>
          <span style={styles.statLabel}>Total</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.25); }
          50% { box-shadow: 0 0 0 6px rgba(34,197,94,0.1); }
        }
      `}</style>
    </div>
  )
}
