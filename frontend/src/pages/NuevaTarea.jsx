import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api.js'

// ─── Shared form styles ───────────────────────────────────────────────────────
const S = {
  page: {
    padding: '28px 5%',
    maxWidth: '800px',
    margin: '0 auto',
  },
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#1a5c38',
    marginBottom: '24px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '18px',
    padding: '36px 40px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
  },
  formTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#1a5c38',
    marginBottom: '28px',
    paddingBottom: '12px',
    borderBottom: '2px solid #d1fae5',
  },
  formGroup: {
    marginBottom: '22px',
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
  required: {
    color: '#dc2626',
    marginLeft: '3px',
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
    color: '#111827',
  },
  select: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '2px solid #e5e7eb',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    backgroundColor: '#f9fafb',
    color: '#111827',
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '2px solid #e5e7eb',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    backgroundColor: '#f9fafb',
    color: '#111827',
    minHeight: '110px',
    resize: 'vertical',
  },
  switchRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderRadius: '12px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #d1fae5',
    marginBottom: '22px',
  },
  switchLabel: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#1a5c38',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  toggle: {
    position: 'relative',
    width: '56px',
    height: '28px',
    flexShrink: 0,
  },
  conditionalSection: {
    borderLeft: '4px solid #28a745',
    paddingLeft: '18px',
    marginBottom: '10px',
    animation: 'fadeIn 0.3s ease',
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
    marginTop: '8px',
    transition: 'background 0.2s',
  },
  cancelBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'border-color 0.2s, color 0.2s',
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
}

// ─── Focus/blur helpers ───────────────────────────────────────────────────────
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

// ─── Toggle Switch Component ─────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <label style={{ position: 'relative', display: 'inline-block', width: '56px', height: '28px', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ display: 'none' }}
      />
      <span style={{
        position: 'absolute', inset: 0,
        borderRadius: '50px',
        backgroundColor: checked ? '#1a5c38' : '#d1d5db',
        transition: '0.3s',
      }} />
      <span style={{
        position: 'absolute',
        top: '3px',
        left: checked ? '29px' : '3px',
        width: '22px', height: '22px',
        borderRadius: '50%',
        backgroundColor: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        transition: '0.3s',
      }} />
      <span style={{
        position: 'absolute',
        top: '50%', transform: 'translateY(-50%)',
        fontSize: '9px', fontWeight: 900,
        color: '#fff', pointerEvents: 'none',
        left: checked ? '8px' : undefined,
        right: !checked ? '8px' : undefined,
        opacity: checked ? 1 : 0.7,
      }}>
        {checked ? 'SI' : 'NO'}
      </span>
    </label>
  )
}

// ─── Kickoff Form ─────────────────────────────────────────────────────────────
function KickoffForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    otp: '',
    factibilidad: '',
    correo_inicio: '',
    marcacion_oth: '',
    doc_item_facturacion: false,
    fecha_compromiso: '',
    fecha_programacion: '',
    cod_resolucion: '',
    gerencia: '',
    tipo_servicio: '',
    cerrado_otp: false,
    cod_resolucion_otp: '',
  })

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))
  const setToggle = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      tipo: 'solicitud_doc_oth_kickoff',
      datos: {
        otp: form.otp,
        factibilidad: form.factibilidad,
        correo_inicio: form.correo_inicio,
        marcacion_oth: form.marcacion_oth,
        documentacion_item_facturacion: form.doc_item_facturacion ? 'SI' : 'NO',
        fecha_compromiso: form.fecha_compromiso,
        fecha_programacion: form.fecha_programacion,
        cod_resolucion: form.cod_resolucion,
        gerencia: form.gerencia,
        tipo_servicio: form.tipo_servicio,
        cerrado_otp: form.cerrado_otp ? 'SI' : 'NO',
        cod_resolucion_otp: form.cod_resolucion_otp,
      },
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={S.formGroup}>
        <label style={S.label}>OTP <span style={S.required}>*</span></label>
        <input style={S.input} type="text" placeholder="Ingrese codigo OTP" value={form.otp}
          onChange={set('otp')} required onFocus={onFocus} onBlur={onBlur} />
      </div>

      <div style={S.formGroup}>
        <label style={S.label}>Documentar Check Factibilidad</label>
        <textarea style={S.textarea} placeholder="Ingrese toda la documentacion de factibilidad..."
          value={form.factibilidad} onChange={set('factibilidad')} onFocus={onFocus} onBlur={onBlur} />
      </div>

      <div style={S.formGroup}>
        <label style={S.label}>Correo Reporte Inicio</label>
        <textarea style={{ ...S.textarea, minHeight: '140px' }}
          placeholder="Pegue aqui el correo de reporte de inicio..."
          value={form.correo_inicio} onChange={set('correo_inicio')} onFocus={onFocus} onBlur={onBlur} />
      </div>

      <div style={S.formGroup}>
        <label style={S.label}>Marcacion OTH</label>
        <input style={S.input} type="text" placeholder="Ingrese marcacion"
          value={form.marcacion_oth} onChange={set('marcacion_oth')} onFocus={onFocus} onBlur={onBlur} />
      </div>

      <div style={S.switchRow}>
        <span style={S.switchLabel}>Documentacion Item Facturacion</span>
        <Toggle checked={form.doc_item_facturacion} onChange={setToggle('doc_item_facturacion')} />
      </div>

      {form.doc_item_facturacion && (
        <div style={S.conditionalSection}>
          <div style={S.formGroup}>
            <label style={S.label}>Fecha Compromiso</label>
            <input style={S.input} type="date" value={form.fecha_compromiso}
              onChange={set('fecha_compromiso')} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Fecha Programacion</label>
            <input style={S.input} type="date" value={form.fecha_programacion}
              onChange={set('fecha_programacion')} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Codigo de Resolucion 1</label>
            <select style={S.select} value={form.cod_resolucion} onChange={set('cod_resolucion')} onFocus={onFocus} onBlur={onBlur}>
              <option value="">Seleccione COD 1</option>
              <option>FO SIN VISITA TECNICA</option>
              <option>FIBRA OPTICA</option>
              <option>HABILITACION DE SERVICIOS</option>
              <option>INSTALACION CON TERCEROS</option>
            </select>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Gerencia</label>
            <select style={S.select} value={form.gerencia} onChange={set('gerencia')} onFocus={onFocus} onBlur={onBlur}>
              <option value="">Seleccione Gerencia</option>
              <option>PROYECTOS</option>
              <option>ESTANDAR</option>
            </select>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Tipo de Servicio</label>
            <select style={S.select} value={form.tipo_servicio} onChange={set('tipo_servicio')} onFocus={onFocus} onBlur={onBlur}>
              <option value="">Seleccione Tipo Servicio</option>
              <option>INTERNET BANDA ANCHA</option>
              <option>INTERNET DEDICADO</option>
              <option>INTERNET SEGURO CORPORATIVO</option>
              <option>TELEFONIA BASICA</option>
              <option>MPLS</option>
            </select>
          </div>
        </div>
      )}

      <div style={S.switchRow}>
        <span style={S.switchLabel}>Cerrado OTP</span>
        <Toggle checked={form.cerrado_otp} onChange={setToggle('cerrado_otp')} />
      </div>

      <div style={S.formGroup}>
        <label style={S.label}>Codigo de Resolucion 1 - OTP</label>
        <select style={S.select} value={form.cod_resolucion_otp} onChange={set('cod_resolucion_otp')} onFocus={onFocus} onBlur={onBlur}>
          <option value="">Seleccione opcion</option>
          <option>PL_EXT/EN CURSO SIN INCONVENIENTE REPORTADO</option>
          <option>PL_EXT/EN CURSO SOBRE OTP ASOCIADA</option>
          <option>TERCEROS</option>
          <option>HABILITACION SERVICIOS</option>
          <option>PENDIENTE EXPANSION DE RED/TRONCAL</option>
        </select>
      </div>

      <button type="submit" style={S.submitBtn} disabled={loading}
        onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = '#14472c' }}
        onMouseLeave={e => { if (!loading) e.target.style.backgroundColor = '#1a5c38' }}>
        {loading ? 'Enviando...' : 'Guardar Registro'}
      </button>
    </form>
  )
}

// ─── Coordinador Form ─────────────────────────────────────────────────────────
function CoordinadorForm({ onSubmit, loading }) {
  const [tipo, setTipo] = useState('')
  const [otp, setOtp] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [fechaSolicitada, setFechaSolicitada] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const datos = { otp, observaciones }
    if (tipo === 'solicitud_cambio_fechas') datos.fecha_solicitada = fechaSolicitada
    onSubmit({ tipo, datos })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={S.formGroup}>
        <label style={S.label}>Tipo de Solicitud <span style={S.required}>*</span></label>
        <select style={S.select} value={tipo} onChange={e => setTipo(e.target.value)} required onFocus={onFocus} onBlur={onBlur}>
          <option value="">Seleccione tipo...</option>
          <option value="solicitud_marcacion_otp">Solicitud Marcacion OTP</option>
          <option value="solicitud_cambio_fechas">Solicitud Cambio de Fechas</option>
        </select>
      </div>

      <div style={S.formGroup}>
        <label style={S.label}>OTP <span style={S.required}>*</span></label>
        <input style={S.input} type="text" placeholder="Ingrese codigo OTP" value={otp}
          onChange={e => setOtp(e.target.value)} required onFocus={onFocus} onBlur={onBlur} />
      </div>

      {tipo === 'solicitud_cambio_fechas' && (
        <div style={{ ...S.conditionalSection, marginBottom: '22px' }}>
          <div style={S.formGroup}>
            <label style={S.label}>Fecha Solicitada</label>
            <input style={S.input} type="date" value={fechaSolicitada}
              onChange={e => setFechaSolicitada(e.target.value)} onFocus={onFocus} onBlur={onBlur} />
          </div>
        </div>
      )}

      <div style={S.formGroup}>
        <label style={S.label}>Observaciones</label>
        <textarea style={S.textarea} placeholder="Ingrese observaciones..."
          value={observaciones} onChange={e => setObservaciones(e.target.value)} onFocus={onFocus} onBlur={onBlur} />
      </div>

      <button type="submit" style={S.submitBtn} disabled={loading}
        onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = '#14472c' }}
        onMouseLeave={e => { if (!loading) e.target.style.backgroundColor = '#1a5c38' }}>
        {loading ? 'Enviando...' : 'Crear Solicitud'}
      </button>
    </form>
  )
}

// ─── Ultima Milla Form ────────────────────────────────────────────────────────
function UltimaMillaForm({ onSubmit, loading }) {
  const [otp, setOtp] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [evidencia, setEvidencia] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      tipo: 'solicitud_doc_oth_um',
      datos: { otp, observaciones, evidencia: evidencia ? evidencia.name : '' },
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={S.formGroup}>
        <label style={S.label}>OTP <span style={S.required}>*</span></label>
        <input style={S.input} type="text" placeholder="Ingrese codigo OTP" value={otp}
          onChange={e => setOtp(e.target.value)} required onFocus={onFocus} onBlur={onBlur} />
      </div>

      <div style={S.formGroup}>
        <label style={S.label}>Observaciones</label>
        <textarea style={S.textarea} placeholder="Ingrese observaciones..."
          value={observaciones} onChange={e => setObservaciones(e.target.value)} onFocus={onFocus} onBlur={onBlur} />
      </div>

      <div style={S.formGroup}>
        <label style={S.label}>Adjuntar Evidencia</label>
        <input
          type="file"
          style={{
            ...S.input,
            padding: '9px 14px',
            cursor: 'pointer',
          }}
          onChange={e => setEvidencia(e.target.files[0] || null)}
        />
        <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '5px' }}>
          Solo referencia visual — la carga de archivos no esta habilitada aun.
        </p>
      </div>

      <button type="submit" style={S.submitBtn} disabled={loading}
        onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = '#14472c' }}
        onMouseLeave={e => { if (!loading) e.target.style.backgroundColor = '#1a5c38' }}>
        {loading ? 'Enviando...' : 'Crear Solicitud'}
      </button>
    </form>
  )
}

// ─── Orquestador Form ─────────────────────────────────────────────────────────
const ORQUESTADOR_TIPOS = [
  { value: 'gestion_cierre_otp',  label: 'Gestion Cierre OTP' },
  { value: 'creacion_oth',        label: 'Creacion OTH' },
  { value: 'documentacion_oth',   label: 'Documentacion OTH' },
  { value: 'check_config_pem',    label: 'Check Config/PEM' },
  { value: 'otp_documentacion',   label: 'OTP Documentacion' },
  { value: 'marcacion_otp',       label: 'Marcacion OTP' },
  { value: 'remarcacion_oth',     label: 'Remarcacion OTH' },
]

function OrquestadorForm({ onSubmit, loading }) {
  const [tipo, setTipo] = useState('')
  const [otp, setOtp] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ tipo, datos: { otp, observaciones } })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={S.formGroup}>
        <label style={S.label}>Tipo de Tarea <span style={S.required}>*</span></label>
        <select style={S.select} value={tipo} onChange={e => setTipo(e.target.value)} required onFocus={onFocus} onBlur={onBlur}>
          <option value="">Seleccione tipo...</option>
          {ORQUESTADOR_TIPOS.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div style={S.formGroup}>
        <label style={S.label}>OTP <span style={S.required}>*</span></label>
        <input style={S.input} type="text" placeholder="Ingrese codigo OTP" value={otp}
          onChange={e => setOtp(e.target.value)} required onFocus={onFocus} onBlur={onBlur} />
      </div>

      <div style={S.formGroup}>
        <label style={S.label}>Observaciones</label>
        <textarea style={S.textarea} placeholder="Ingrese observaciones..."
          value={observaciones} onChange={e => setObservaciones(e.target.value)} onFocus={onFocus} onBlur={onBlur} />
      </div>

      <button type="submit" style={S.submitBtn} disabled={loading}
        onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = '#14472c' }}
        onMouseLeave={e => { if (!loading) e.target.style.backgroundColor = '#1a5c38' }}>
        {loading ? 'Enviando...' : 'Crear Tarea'}
      </button>
    </form>
  )
}

// ─── Config/PEM Form ──────────────────────────────────────────────────────────
const CONFIG_PEM_TIPOS = [
  { value: 'solicitud_doc_oth_config_pem', label: 'Solicitud Doc. OTH (Config/PEM)' },
  { value: 'solicitud_saturacion_internet', label: 'Solicitud Saturacion Internet' },
  { value: 'consulta_disponibilidad_ip',   label: 'Consulta Disponibilidad IP' },
  { value: 'marcacion_red',                label: 'Marcacion Red' },
]

function ConfigPemForm({ onSubmit, loading }) {
  const [tipo, setTipo] = useState('')
  const [otp, setOtp] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [ip, setIp] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const datos = { otp, observaciones }
    if (tipo === 'consulta_disponibilidad_ip') datos.ip = ip
    onSubmit({ tipo, datos })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={S.formGroup}>
        <label style={S.label}>Tipo de Solicitud <span style={S.required}>*</span></label>
        <select style={S.select} value={tipo} onChange={e => setTipo(e.target.value)} required onFocus={onFocus} onBlur={onBlur}>
          <option value="">Seleccione tipo...</option>
          {CONFIG_PEM_TIPOS.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div style={S.formGroup}>
        <label style={S.label}>OTP <span style={S.required}>*</span></label>
        <input style={S.input} type="text" placeholder="Ingrese codigo OTP" value={otp}
          onChange={e => setOtp(e.target.value)} required onFocus={onFocus} onBlur={onBlur} />
      </div>

      {tipo === 'consulta_disponibilidad_ip' && (
        <div style={{ ...S.conditionalSection, marginBottom: '22px' }}>
          <div style={S.formGroup}>
            <label style={S.label}>Direccion IP</label>
            <input style={S.input} type="text" placeholder="Ej: 192.168.1.1" value={ip}
              onChange={e => setIp(e.target.value)} onFocus={onFocus} onBlur={onBlur} />
          </div>
        </div>
      )}

      <div style={S.formGroup}>
        <label style={S.label}>Observaciones</label>
        <textarea style={S.textarea} placeholder="Ingrese observaciones..."
          value={observaciones} onChange={e => setObservaciones(e.target.value)} onFocus={onFocus} onBlur={onBlur} />
      </div>

      <button type="submit" style={S.submitBtn} disabled={loading}
        onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = '#14472c' }}
        onMouseLeave={e => { if (!loading) e.target.style.backgroundColor = '#1a5c38' }}>
        {loading ? 'Enviando...' : 'Crear Solicitud'}
      </button>
    </form>
  )
}

// ─── Main NuevaTarea page ─────────────────────────────────────────────────────
const FORM_TITLES = {
  kickoff:      'Nueva Tarea - Kick Off',
  coordinador:  'Nueva Solicitud - Coordinador',
  ultima_milla: 'Nueva Solicitud - Ultima Milla',
  orquestador:  'Nueva Tarea - Orquestador',
  config_pem:   'Nueva Solicitud - Config/PEM',
}

export default function NuevaTarea() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const role = user?.role

  const handleSubmit = async (payload) => {
    setError('')
    setLoading(true)
    try {
      await api.post('/tasks/', payload)
      navigate('/dashboard', { state: { success: 'Tarea creada correctamente.' } })
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al crear la tarea. Intente de nuevo.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const renderForm = () => {
    switch (role) {
      case 'kickoff':      return <KickoffForm onSubmit={handleSubmit} loading={loading} />
      case 'coordinador':  return <CoordinadorForm onSubmit={handleSubmit} loading={loading} />
      case 'ultima_milla': return <UltimaMillaForm onSubmit={handleSubmit} loading={loading} />
      case 'orquestador':  return <OrquestadorForm onSubmit={handleSubmit} loading={loading} />
      case 'config_pem':   return <ConfigPemForm onSubmit={handleSubmit} loading={loading} />
      default:
        return (
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
            Tu rol ({role}) no tiene permiso para crear tareas desde este formulario.
          </p>
        )
    }
  }

  return (
    <div style={S.page}>
      <h1 style={S.pageTitle}>{FORM_TITLES[role] || 'Nueva Tarea'}</h1>

      <div style={S.card}>
        <h2 style={S.formTitle}>Completar informacion</h2>

        {error && <div style={S.errorBox}>{error}</div>}

        {renderForm()}

        <button
          style={{ ...S.cancelBtn, marginTop: '14px' }}
          onClick={() => navigate('/dashboard')}
          onMouseEnter={e => { e.target.style.borderColor = '#9ca3af'; e.target.style.color = '#374151' }}
          onMouseLeave={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.color = '#6b7280' }}
        >
          Cancelar
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
