import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api.js'

const ESTADO_STYLES = {
  pendiente:  { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  en_proceso: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  completado: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  error:      { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
}

const ESTADO_LABELS = {
  pendiente:  'Pendiente',
  en_proceso: 'En Proceso',
  completado: 'Completado',
  error:      'Error',
}

const TIPO_LABELS = {
  solicitud_marcacion_otp:      'Solicitud Marcacion OTP',
  solicitud_cambio_fechas:      'Solicitud Cambio de Fechas',
  gestion_cierre_otp:           'Gestion Cierre OTP',
  creacion_oth:                 'Creacion OTH',
  documentacion_oth:            'Documentacion OTH',
  check_config_pem:             'Check Config/PEM',
  otp_documentacion:            'OTP Documentacion',
  marcacion_otp:                'Marcacion OTP',
  remarcacion_oth:              'Remarcacion OTH',
  solicitud_doc_oth_kickoff:    'Solicitud Doc. OTH (Kick Off)',
  planear_cliente:              'Planear Cliente',
  cierre_oth:                   'Cierre OTH',
  solicitud_doc_oth_um:         'Solicitud Doc. OTH (Ult. Milla)',
  solicitud_doc_oth_config_pem: 'Solicitud Doc. OTH (Config/PEM)',
  solicitud_saturacion_internet:'Solicitud Saturacion Internet',
  consulta_disponibilidad_ip:   'Consulta Disponibilidad IP',
  marcacion_red:                'Marcacion Red',
}

const DATO_LABELS = {
  otp:                           'OTP',
  factibilidad:                  'Factibilidad',
  correo_inicio:                 'Correo Reporte Inicio',
  marcacion_oth:                 'Marcacion OTH',
  documentacion_item_facturacion:'Doc. Item Facturacion',
  fecha_compromiso:              'Fecha Compromiso',
  fecha_programacion:            'Fecha Programacion',
  cod_resolucion:                'Cod. Resolucion 1',
  gerencia:                      'Gerencia',
  tipo_servicio:                 'Tipo de Servicio',
  cerrado_otp:                   'Cerrado OTP',
  cod_resolucion_otp:            'Cod. Resolucion 1 OTP',
  observaciones:                 'Observaciones',
  fecha_solicitada:              'Fecha Solicitada',
  evidencia:                     'Evidencia',
  ip:                            'Direccion IP',
}

const styles = {
  page: {
    padding: '28px 5%',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  backBtn: {
    backgroundColor: 'transparent',
    color: '#1a5c38',
    border: '2px solid #1a5c38',
    borderRadius: '8px',
    padding: '7px 16px',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  pageTitle: {
    fontSize: '1.4rem',
    fontWeight: 800,
    color: '#1a5c38',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e5e7eb',
  },
  cardFull: {
    gridColumn: '1 / -1',
  },
  cardTitle: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#1a5c38',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '2px solid #d1fae5',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
    gap: '12px',
  },
  infoKey: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#6b7280',
    flexShrink: 0,
    minWidth: '140px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  infoValue: {
    fontSize: '0.9rem',
    color: '#111827',
    textAlign: 'right',
    wordBreak: 'break-word',
    maxWidth: '400px',
  },
  badge: {
    display: 'inline-block',
    padding: '3px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 700,
  },
  logEntry: {
    padding: '10px 14px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '8px',
    borderLeft: '3px solid #28a745',
    fontSize: '0.85rem',
  },
  logTime: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginBottom: '3px',
  },
  logAction: {
    fontWeight: 700,
    color: '#1a5c38',
    marginBottom: '2px',
  },
  logDetail: {
    color: '#4b5563',
    lineHeight: 1.5,
  },
  loadingText: {
    color: '#1a5c38',
    fontWeight: 600,
    padding: '60px',
    textAlign: 'center',
    fontSize: '1rem',
  },
  errorText: {
    color: '#991b1b',
    backgroundColor: '#fee2e2',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '16px',
    fontWeight: 500,
  },
  noLogs: {
    color: '#9ca3af',
    fontStyle: 'italic',
    fontSize: '0.88rem',
    textAlign: 'center',
    padding: '20px',
  },
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleString('es-CO', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  } catch { return dateStr }
}

export default function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/tasks/${id}`)
        setTask(res.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Error al cargar la tarea.')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  if (loading) {
    return <div style={styles.loadingText}>Cargando tarea...</div>
  }

  if (error) {
    return (
      <div style={{ ...styles.page }}>
        <div style={styles.errorText}>{error}</div>
        <button style={{ ...styles.backBtn, marginTop: '16px' }} onClick={() => navigate('/dashboard')}>
          Volver al dashboard
        </button>
      </div>
    )
  }

  if (!task) return null

  const estadoStyle = ESTADO_STYLES[task.estado] || {}
  const tipoLabel = TIPO_LABELS[task.tipo] || task.tipo
  const datos = task.datos || {}
  const logs = task.bot_logs || []

  // Build datos rows: filter empty values
  const datosEntries = Object.entries(datos).filter(([, v]) => v !== '' && v !== null && v !== undefined)

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button
          style={styles.backBtn}
          onClick={() => navigate('/dashboard')}
          onMouseEnter={e => { e.target.style.backgroundColor = '#1a5c38'; e.target.style.color = '#fff' }}
          onMouseLeave={e => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#1a5c38' }}
        >
          Volver
        </button>
        <h1 style={styles.pageTitle}>Tarea #{task.id}</h1>
        <span
          style={{
            ...styles.badge,
            backgroundColor: estadoStyle.bg,
            color: estadoStyle.color,
            border: `1px solid ${estadoStyle.border}`,
          }}
        >
          {ESTADO_LABELS[task.estado] || task.estado}
        </span>
      </div>

      <div style={styles.grid}>
        {/* Meta info */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Informacion General</div>
          <div style={styles.infoRow}>
            <span style={styles.infoKey}>ID</span>
            <span style={{ ...styles.infoValue, fontWeight: 700 }}>#{task.id}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoKey}>Tipo</span>
            <span style={styles.infoValue}>{tipoLabel}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoKey}>Estado</span>
            <span
              style={{
                ...styles.badge,
                backgroundColor: estadoStyle.bg,
                color: estadoStyle.color,
                border: `1px solid ${estadoStyle.border}`,
              }}
            >
              {ESTADO_LABELS[task.estado] || task.estado}
            </span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoKey}>Creado por</span>
            <span style={styles.infoValue}>{task.created_by || '-'}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoKey}>Asignado a</span>
            <span style={{ ...styles.infoValue, color: task.assigned_to ? '#1a5c38' : '#9ca3af', fontWeight: task.assigned_to ? 600 : 400 }}>
              {task.assigned_to || 'Sin asignar'}
            </span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoKey}>Creado el</span>
            <span style={{ ...styles.infoValue, fontSize: '0.82rem', color: '#6b7280' }}>
              {formatDate(task.created_at)}
            </span>
          </div>
          <div style={{ ...styles.infoRow, borderBottom: 'none' }}>
            <span style={styles.infoKey}>Actualizado</span>
            <span style={{ ...styles.infoValue, fontSize: '0.82rem', color: '#6b7280' }}>
              {formatDate(task.updated_at)}
            </span>
          </div>
        </div>

        {/* Datos */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Datos de la Tarea</div>
          {datosEntries.length === 0 ? (
            <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.88rem' }}>Sin datos adicionales</p>
          ) : (
            datosEntries.map(([key, value], i) => (
              <div key={key} style={{ ...styles.infoRow, borderBottom: i < datosEntries.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <span style={styles.infoKey}>{DATO_LABELS[key] || key.replace(/_/g, ' ')}</span>
                <span style={{ ...styles.infoValue, maxWidth: '280px' }}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Bot Logs */}
        <div style={{ ...styles.card, ...styles.cardFull }}>
          <div style={styles.cardTitle}>Historial del Bot ({logs.length} entradas)</div>
          {logs.length === 0 ? (
            <p style={styles.noLogs}>No hay registros del bot para esta tarea.</p>
          ) : (
            [...logs].reverse().map((log, i) => (
              <div key={i} style={{
                ...styles.logEntry,
                borderLeftColor: log.accion?.includes('error') ? '#ef4444' : '#28a745',
              }}>
                <div style={styles.logTime}>{formatDate(log.timestamp)}</div>
                <div style={{
                  ...styles.logAction,
                  color: log.accion?.includes('error') ? '#991b1b' : '#1a5c38',
                }}>
                  {log.accion}
                </div>
                {(log.resultado || log.detalle) && (
                  <div style={styles.logDetail}>{log.resultado || log.detalle}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
