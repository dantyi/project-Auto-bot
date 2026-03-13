import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api.js'

const ESTADO_STYLES = {
  pendiente:   { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
  en_proceso:  { backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' },
  completado:  { backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' },
  error:       { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
}

const ESTADO_LABELS = {
  pendiente:   'Pendiente',
  en_proceso:  'En Proceso',
  completado:  'Completado',
  error:       'Error',
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

const styles = {
  wrapper: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  thead: {
    backgroundColor: '#1a5c38',
    color: '#fff',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: '0.82rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '11px 16px',
    borderBottom: '1px solid #f0f0f0',
    verticalAlign: 'middle',
  },
  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '0.78rem',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  actionBtn: {
    backgroundColor: '#1a5c38',
    color: '#fff',
    border: 'none',
    borderRadius: '7px',
    padding: '5px 12px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginRight: '6px',
    transition: 'background 0.2s',
  },
  assignSelect: {
    padding: '5px 8px',
    borderRadius: '7px',
    border: '1px solid #d1d5db',
    fontSize: '0.82rem',
    cursor: 'pointer',
    backgroundColor: '#f9fafb',
    minWidth: '130px',
  },
  emptyRow: {
    textAlign: 'center',
    color: '#9ca3af',
    padding: '32px',
    fontStyle: 'italic',
  },
  trEven: {
    backgroundColor: '#f9fafe',
  },
}

const ORQUESTADORES = ['orquestador']

export default function TaskTable({ tasks = [], onStatusChange, showAssign = false }) {
  const navigate = useNavigate()
  const [assigning, setAssigning] = useState({})

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleString('es-CO', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const handleAssign = async (taskId, assignedTo) => {
    if (!assignedTo) return
    setAssigning(prev => ({ ...prev, [taskId]: true }))
    try {
      await api.patch(`/tasks/${taskId}`, { assigned_to: assignedTo })
      if (onStatusChange) onStatusChange()
    } catch (err) {
      alert('Error al asignar tarea: ' + (err.response?.data?.error || err.message))
    } finally {
      setAssigning(prev => ({ ...prev, [taskId]: false }))
    }
  }

  return (
    <div style={styles.wrapper}>
      <table style={styles.table}>
        <thead style={styles.thead}>
          <tr>
            <th style={styles.th}>ID / OTP</th>
            <th style={styles.th}>Tipo</th>
            <th style={styles.th}>Estado</th>
            <th style={styles.th}>Fecha</th>
            <th style={styles.th}>Creado por</th>
            <th style={styles.th}>Asignado a</th>
            {showAssign && <th style={styles.th}>Asignar</th>}
            <th style={styles.th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={showAssign ? 8 : 7} style={styles.emptyRow}>
                No hay tareas para mostrar
              </td>
            </tr>
          ) : (
            tasks.map((task, idx) => {
              const otp = task.datos?.otp || task.datos?.OTP || '-'
              const estadoStyle = ESTADO_STYLES[task.estado] || {}
              const tipoLabel = TIPO_LABELS[task.tipo] || task.tipo

              return (
                <tr
                  key={task.id}
                  style={idx % 2 !== 0 ? styles.trEven : {}}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 !== 0 ? '#f9fafe' : ''}
                >
                  <td style={{ ...styles.td, fontWeight: 700, color: '#1a5c38' }}>
                    #{task.id}
                    {otp !== '-' && (
                      <span style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', fontWeight: 400 }}>
                        OTP: {otp}
                      </span>
                    )}
                  </td>
                  <td style={{ ...styles.td, maxWidth: '200px' }}>
                    <span style={{ fontSize: '0.85rem' }}>{tipoLabel}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...estadoStyle }}>
                      {ESTADO_LABELS[task.estado] || task.estado}
                    </span>
                  </td>
                  <td style={{ ...styles.td, color: '#6b7280', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    {formatDate(task.created_at)}
                  </td>
                  <td style={{ ...styles.td, fontSize: '0.85rem' }}>{task.created_by || '-'}</td>
                  <td style={{ ...styles.td, fontSize: '0.85rem', color: task.assigned_to ? '#1a5c38' : '#9ca3af' }}>
                    {task.assigned_to || 'Sin asignar'}
                  </td>
                  {showAssign && (
                    <td style={styles.td}>
                      <select
                        style={styles.assignSelect}
                        defaultValue={task.assigned_to || ''}
                        disabled={assigning[task.id]}
                        onChange={e => handleAssign(task.id, e.target.value)}
                      >
                        <option value="">Asignar a...</option>
                        <option value="orquestador">Orquestador</option>
                        <option value="kickoff">Kick Off</option>
                        <option value="ultima_milla">Ultima Milla</option>
                        <option value="config_pem">Config/PEM</option>
                      </select>
                    </td>
                  )}
                  <td style={styles.td}>
                    <button
                      style={styles.actionBtn}
                      onClick={() => navigate(`/tarea/${task.id}`)}
                      onMouseEnter={e => e.target.style.backgroundColor = '#14472c'}
                      onMouseLeave={e => e.target.style.backgroundColor = '#1a5c38'}
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
