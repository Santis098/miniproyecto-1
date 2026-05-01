import React, { useState, useEffect, useRef } from 'react';
import './CreateActivity.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://miniproyecto-1-x936.onrender.com';

// ─── Fecha de hoy en formato YYYY-MM-DD (sin hora, zona local) ───
const hoy = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatFecha = (f) => {
  if (!f) return '';
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y}`;
};

// ─── Límite diario de horas ───────────────────────────────────


/**
 * Suma las horas de actividades para una fecha dada, excluyendo una actividad por id.
 */
const consultarHorasOcupadas = async (fecha, token, excluirId = null) => {
  try {
    const res = await fetch(`${API_BASE}/api/activities/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    const lista = Array.isArray(json?.data) ? json.data : [];
    return lista
      .filter(a => a.due_date === fecha && a.id !== excluirId)
      .reduce((sum, a) => sum + (parseFloat(a.horas_estimadas) || 0), 0);
  } catch {
    return 0;
  }
};

/**
 * Dado una fecha YYYY-MM-DD, devuelve el día siguiente en YYYY-MM-DD.
 */
const diaSiguiente = (fechaStr) => {
  const d = new Date(fechaStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Busca la próxima fecha (desde el día siguiente) que tenga cupo para horasNecesarias.
 * Busca hasta 30 días hacia adelante.
 */
const buscarProximaFechaDisponible = async (fechaBase, horasNecesarias, token, limiteDiario, excluirId = null) => {
  let candidata = diaSiguiente(fechaBase);
  for (let i = 0; i < 30; i++) {
    const ocupadas = await consultarHorasOcupadas(candidata, token, excluirId);
    if (ocupadas + horasNecesarias <= limiteDiario) return candidata;
    candidata = diaSiguiente(candidata);
  }
  return null;
};

// ─── Iconos ───────────────────────────────────────────────────
const IconTrash = () => (
  <svg style={{width:15,height:15,display:'inline-block',verticalAlign:'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconEdit = () => (
  <svg style={{width:15,height:15,display:'inline-block',verticalAlign:'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconSpinner = () => (
  <svg style={{width:18,height:18,display:'inline-block',verticalAlign:'middle',animation:'spin 0.7s linear infinite'}} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// ALERTA DE SOBRECARGA MEJORADA
// Ahora soporta tres modos:
//   1. overload_simple   → superó 6h, la actividad ≤ 6h (comportamiento anterior)
//   2. overload_split    → la actividad en sí supera 6h, propone dividirla
//   3. overload_reprog   → día lleno y actividad ≤ 6h, mover todo al próximo día
// ─────────────────────────────────────────────────────────────
function AlertaSobrecarga({ data, onReprogramar, onElegirFecha, onDividir, cargando }) {
  // 🟢 Aquí extraemos limiteDiario de la data
  const { modo, horasOcupadas, horasActividad, horasBloque1, horasBloque2, fechaBloque1, fechaBloque2, limiteDiario } = data; 

  // ── MODO: la actividad por sí sola supera el límite → proponer división
  if (modo === 'overload_split') {
    return (
      <div style={{
        background: '#f0f9ff',
        border: '1.5px solid #3b82f6',
        borderRadius: 12,
        padding: '16px 18px',
        margin: '0 0 12px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>✂️</span>
          <div>
            <div style={{ fontWeight: 700, color: '#1e40af', fontSize: 14, marginBottom: 4 }}>
              {/* 🟢 CORREGIDO: usar limiteDiario */}
              Actividad mayor a {limiteDiario}h 
            </div>
            <div style={{ color: '#1e3a8a', fontSize: 13, lineHeight: 1.5 }}>
              {/* 🟢 CORREGIDO: usar limiteDiario */}
              Esta actividad requiere <strong>{horasActividad}h</strong> pero el límite diario es <strong>{limiteDiario}h</strong>.
              Te proponemos dividirla en dos partes:
            </div>
            <div style={{
              marginTop: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              background: '#dbeafe',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 13,
            }}>
              <div>
                📅 <strong>Parte 1:</strong> {horasBloque1}h → {formatFecha(fechaBloque1)}
              </div>
              <div>
                📅 <strong>Parte 2:</strong> {horasBloque2}h → {formatFecha(fechaBloque2) || '⏳ buscando fecha...'}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            onClick={onDividir}
            disabled={cargando || !fechaBloque2}
            style={{
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '9px 0',
              fontWeight: 700,
              fontSize: 13,
              cursor: (cargando || !fechaBloque2) ? 'not-allowed' : 'pointer',
              opacity: (cargando || !fechaBloque2) ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {cargando ? '⏳ Creando actividades...' : `✂️ Dividir y programar las dos partes`}
          </button>
          <button
            type="button"
            onClick={onElegirFecha}
            disabled={cargando}
            style={{
              background: 'transparent',
              color: '#1e40af',
              border: '1.5px solid #3b82f6',
              borderRadius: 8,
              padding: '9px 0',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            🗓️ Ajustar horas manualmente
          </button>
        </div>
      </div>
    );
  }

  // ── MODO: día ocupado, actividad cabe pero el día está lleno → reprogramar
  return (
    <div style={{
      background: '#fff8f0',
      border: '1.5px solid #f59e0b',
      borderRadius: 12,
      padding: '16px 18px',
      margin: '0 0 12px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 700, color: '#92400e', fontSize: 14, marginBottom: 4 }}>
            Alerta de sobrecarga
          </div>
          <div style={{ color: '#78350f', fontSize: 13, lineHeight: 1.5 }}>
            Ya tienes <strong>{horasOcupadas}h</strong> programadas para ese día.
            {/* 🟢 CORREGIDO: usar limiteDiario */}
            Superaste el límite diario de <strong>{limiteDiario}h</strong>.<br/>
            Para mantener tu productividad, te recomendamos reprogramar la actividad.
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          type="button"
          onClick={onReprogramar}
          disabled={cargando}
          style={{
            background: '#f59e0b',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '9px 0',
            fontWeight: 700,
            fontSize: 13,
            cursor: cargando ? 'not-allowed' : 'pointer',
            opacity: cargando ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {cargando ? '⏳ Buscando fecha...' : '📅 Reprogramar para el próximo día disponible'}
        </button>
        <button
          type="button"
          onClick={onElegirFecha}
          disabled={cargando}
          style={{
            background: 'transparent',
            color: '#92400e',
            border: '1.5px solid #f59e0b',
            borderRadius: 8,
            padding: '9px 0',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          🗓️ Elegir otra fecha
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HOOK: Verificar si el día de hoy ya tiene 6h completas
// Uso: const { diaLleno, horasHoy } = useDiaHoyLleno(token)
// Expórtalo para usarlo en el componente padre que contiene el
// botón "Agregar actividad".
// ─────────────────────────────────────────────────────────────
export function useDiaHoyLleno(token) {
  const [diaLleno, setDiaLleno] = useState(false);
  const [horasHoy, setHorasHoy] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [limite, setLimite] = useState(6);

  const verificar = async () => {
    if (!token) { setCargando(false); return; }
    setCargando(true);
    try {
      const resLim = await fetch(`${API_BASE}/api/usuario/limite-horas/`, { headers: { Authorization: `Bearer ${token}` } });
      const dataLim = await resLim.json();
      const limiteUsuario = dataLim?.data?.limite_horas_diarias || 6;
      setLimite(limiteUsuario);

      const horas = await consultarHorasOcupadas(hoy(), token);
      setHorasHoy(horas);
      setDiaLleno(horas >= limiteUsuario);
    } catch { }
    setCargando(false);
  };

  useEffect(() => { verificar(); }, [token]);

  return { diaLleno, horasHoy, limite, cargando, refrescar: verificar };
}

// ─────────────────────────────────────────────────────────────
// CREAR ACTIVIDAD
// ─────────────────────────────────────────────────────────────
function CreateActivity({ onClose, onActivityCreated, fechaInicial }) {
  const [titulo, setTitulo]             = useState('');
  const [descripcion, setDescripcion]   = useState('');
  const [asignatura, setAsignatura]     = useState('');
  const [tipo, setTipo]                 = useState('');
  const [dificultad, setDificultad]     = useState('');
  const [fecha, setFecha] = useState(fechaInicial || '');
  const [horasEstimadas, setHorasEstimadas] = useState('');
  const [subtasks, setSubtasks]         = useState([]);
  const [nuevoSub, setNuevoSub]         = useState('');
  const [nuevoSubFecha, setNuevoSubFecha] = useState('');
  const [nuevoSubHoras, setNuevoSubHoras] = useState('');
  const [errorSub, setErrorSub]         = useState('');
  const [editandoSubId, setEditandoSubId] = useState(null);
  const [editandoSubTitulo, setEditandoSubTitulo] = useState('');
  const [editandoSubFecha, setEditandoSubFecha]   = useState('');
  const [editandoSubHoras, setEditandoSubHoras]   = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState(false);
  const [alertaSobrecarga, setAlertaSobrecarga] = useState(null);
  const [cargandoReprogramar, setCargandoReprogramar] = useState(false);
  const fechaInputRef = useRef(null);
  const mensajeRef = useRef(null);
  const [limiteDiario, setLimiteDiario] = useState(6);

  const TODAY = hoy();

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t) {
      fetch(`${API_BASE}/api/usuario/limite-horas/`, { headers: { Authorization: `Bearer ${t}` } })
        .then(r => r.json())
        .then(d => { if (d?.data?.limite_horas_diarias) setLimiteDiario(d.data.limite_horas_diarias); })
        .catch(() => {});
    }
  }, []);

  // ── Scroll automático al mensaje cuando aparece error o alerta ─
  useEffect(() => {
    if ((error || alertaSobrecarga) && mensajeRef.current) {
      mensajeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [error, alertaSobrecarga]);

  // ── Calcula horas ya asignadas a subtareas ──────────────────
  const horasSubtareas = subtasks.reduce((sum, st) => sum + (parseFloat(st.horas) || 0), 0);
  const horasDisponiblesParaSubtareas = Math.max(0, (parseFloat(horasEstimadas) || 0) - horasSubtareas);

  // ─── HANDLER: Reprogramar al próximo día disponible ─────────
  const handleReprogramarCreate = async () => {
    if (!alertaSobrecarga) return;
    setCargandoReprogramar(true);
    const token = localStorage.getItem('token');
    const proxima = await buscarProximaFechaDisponible(fecha, parseFloat(horasEstimadas), token, limiteDiario);
    setCargandoReprogramar(false);
    if (!proxima) {
      setAlertaSobrecarga(null);
      setError('No se encontró una fecha disponible en los próximos 30 días.');
      return;
    }
    setFecha(proxima);
    setAlertaSobrecarga(null);
    setTimeout(() => manejarEnvioConFecha(proxima), 50);
  };

  // ─── HANDLER: Elegir fecha manualmente ──────────────────────
  const handleElegirFechaCreate = () => {
    setAlertaSobrecarga(null);
    setFecha('');
    setTimeout(() => fechaInputRef.current?.showPicker?.() || fechaInputRef.current?.click(), 50);
  };

  // ─── HANDLER: Dividir actividad en dos bloques ──────────────
  // Crea la actividad parte-1 en fechaBloque1 y parte-2 en fechaBloque2
  const handleDividirActividad = async () => {
    if (!alertaSobrecarga || alertaSobrecarga.modo !== 'overload_split') return;
    const { horasBloque1, horasBloque2, fechaBloque1, fechaBloque2 } = alertaSobrecarga;
    if (!fechaBloque2) return;

    setCargandoReprogramar(true);
    const token = localStorage.getItem('token');
    const asignaturaId = await resolverAsignatura(asignatura, token);

    try {
      // Crear parte 1
      const body1 = {
        title: `${titulo} (Parte 1)`,
        description: descripcion,
        start_date: fechaBloque1, due_date: fechaBloque1,
        activity_type: tipo, difficulty: dificultad,
        horas_estimadas: horasBloque1,
        ...(asignaturaId && { asignatura: asignaturaId }),
      };
      const res1 = await fetch(API_BASE + '/api/activities/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body1),
      });

      // Crear parte 2
      const body2 = {
        title: `${titulo} (Parte 2)`,
        description: descripcion,
        start_date: fechaBloque2, due_date: fechaBloque2,
        activity_type: tipo, difficulty: dificultad,
        horas_estimadas: horasBloque2,
        ...(asignaturaId && { asignatura: asignaturaId }),
      };
      const res2 = await fetch(API_BASE + '/api/activities/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body2),
      });

      if (res1.status === 201 && res2.status === 201) {
        // Si hay subtareas, agregarlas a la parte 1
        const data1 = await res1.json();
        const actividadId1 = data1?.data?.id;
        if (actividadId1 && subtasks.length > 0) {
          await Promise.all(subtasks.map(st =>
            fetch(API_BASE + '/api/subtasks/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ 
                title: st.titulo, 
                activity: actividadId1,
                fecha: st.fecha,
                horas_estimadas: parseFloat(st.horas)
              })
            })
          ));
        }
        setAlertaSobrecarga(null);
        setSuccess(true);
// ... resto del código
        setCargandoReprogramar(false);
        setTimeout(() => { if (onActivityCreated) onActivityCreated(); if (onClose) onClose(); }, 1500);
      } else {
        setError('Error al crear una de las partes. Intenta de nuevo.');
        setCargandoReprogramar(false);
      }
    } catch {
      setError('Error de conexión al dividir la actividad.');
      setCargandoReprogramar(false);
    }
  };

  const agregarSubtask = () => {
    if (!nuevoSub.trim())   { setErrorSub('Ingresa el título de la subtarea.'); return; }
    if (nuevoSub.trim().length < 3) { setErrorSub('Mínimo 3 caracteres.'); return; }
    if (!nuevoSubFecha)     { setErrorSub('Selecciona una fecha para la subtarea.'); return; }
    if (nuevoSubFecha < TODAY) {
      setErrorSub(`La fecha de la subtarea no puede ser anterior a hoy (${formatFecha(TODAY)}).`);
      return;
    }
    if (!nuevoSubHoras || parseFloat(nuevoSubHoras) <= 0) { setErrorSub('Las horas deben ser mayores a 0.'); return; }
    if (fecha && nuevoSubFecha > fecha) {
      setErrorSub(`La fecha de la subtarea no puede ser posterior a la fecha de la actividad (${formatFecha(fecha)}).`);
      return;
    }

    // ── NUEVA VALIDACIÓN: horas de subtareas no pueden superar las de la actividad
    const horasYaAsignadas = subtasks.reduce((sum, st) => sum + (parseFloat(st.horas) || 0), 0);
    const horasNuevas = parseFloat(nuevoSubHoras);
    const horasPadre = parseFloat(horasEstimadas) || 0;
    if (horasPadre > 0 && horasYaAsignadas + horasNuevas > horasPadre) {
      const disponibles = (horasPadre - horasYaAsignadas).toFixed(1);
      setErrorSub(
        `Las subtareas no pueden superar las ${horasPadre}h de la actividad. ` +
        `Quedan ${disponibles}h disponibles.`
      );
      return;
    }

    setSubtasks([...subtasks, { titulo: nuevoSub.trim(), fecha: nuevoSubFecha, horas: parseFloat(nuevoSubHoras), id: Date.now() }]);
    setNuevoSub(''); setNuevoSubFecha(''); setNuevoSubHoras(''); setErrorSub('');
  };

  const eliminarSubtask = (id) => setSubtasks(subtasks.filter(s => s.id !== id));

  const iniciarEdicionSub = (st) => {
    setEditandoSubId(st.id);
    setEditandoSubTitulo(st.titulo);
    setEditandoSubFecha(st.fecha);
    setEditandoSubHoras(st.horas);
  };

  const guardarEdicionSub = (id) => {
    if (!editandoSubTitulo.trim() || !editandoSubFecha || !editandoSubHoras) return;
    if (editandoSubFecha < TODAY) {
      setErrorSub(`La fecha de la subtarea no puede ser anterior a hoy (${formatFecha(TODAY)}).`);
      return;
    }
    if (fecha && editandoSubFecha > fecha) {
      setErrorSub(`La subtarea no puede tener fecha posterior a la actividad (${formatFecha(fecha)}).`);
      return;
    }

    // ── NUEVA VALIDACIÓN en edición: horas totales de subtareas no superan la actividad
    const horasOtras = subtasks
      .filter(s => s.id !== id)
      .reduce((sum, st) => sum + (parseFloat(st.horas) || 0), 0);
    const horasPadre = parseFloat(horasEstimadas) || 0;
    const horasEditadas = parseFloat(editandoSubHoras);
    if (horasPadre > 0 && horasOtras + horasEditadas > horasPadre) {
      const disponibles = (horasPadre - horasOtras).toFixed(1);
      setErrorSub(
        `Las subtareas no pueden superar las ${horasPadre}h de la actividad. ` +
        `Quedan ${disponibles}h disponibles para esta subtarea.`
      );
      return;
    }

    setSubtasks(subtasks.map(s => s.id === id
      ? { ...s, titulo: editandoSubTitulo.trim(), fecha: editandoSubFecha, horas: parseFloat(editandoSubHoras) }
      : s
    ));
    setEditandoSubId(null); setEditandoSubTitulo(''); setEditandoSubFecha(''); setEditandoSubHoras('');
    setErrorSub('');
  };

  const resolverAsignatura = async (nombre, token) => {
    if (!nombre.trim()) return null;
    try {
      const res = await fetch(`${API_BASE}/api/asignaturas/`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const lista = Array.isArray(data?.data) ? data.data : [];
      const existe = lista.find(a => a.nombre.toLowerCase() === nombre.trim().toLowerCase());
      if (existe) return existe.id;
      const crear = await fetch(`${API_BASE}/api/asignaturas/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: nombre.trim(), codigo: nombre.trim().substring(0,10).toUpperCase().replace(/ /g,'_'), creditos: 0 })
      });
      const nueva = await crear.json();
      return nueva?.data?.id || null;
    } catch { return null; }
  };

  // Envío real a la API con una fecha específica
  const manejarEnvioConFecha = async (fechaFinal) => {
    setError(''); setLoading(true);
    const token = localStorage.getItem('token');
    const asignaturaId = await resolverAsignatura(asignatura, token);
    try {
      const res = await fetch(API_BASE + '/api/activities/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: titulo, description: descripcion,
          start_date: fechaFinal, due_date: fechaFinal,
          activity_type: tipo, difficulty: dificultad,
          horas_estimadas: parseFloat(horasEstimadas),
          ...(asignaturaId && { asignatura: asignaturaId }),
        }),
      });
      if (res.status === 201) {
        const data = await res.json();
        const actividadId = data?.data?.id;
        if (actividadId && subtasks.length > 0) {
          const responses = await Promise.all(subtasks.map(st =>
            fetch(API_BASE + '/api/subtasks/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ 
                title: st.titulo, 
                activity: actividadId,
                fecha: st.fecha,
                horas_estimadas: parseFloat(st.horas)
              })
            }).then(r => r.json())
          ));
          try {
            const meta = {};
            responses.forEach((data, i) => {
              const newId = data?.data?.id || data?.id;
              if (newId) {
                meta[newId] = { fecha: subtasks[i].fecha, horas: subtasks[i].horas };
              }
            });
            localStorage.setItem(`subtask_meta_${actividadId}`, JSON.stringify(meta));
          } catch {}
        }
        setSuccess(true); setLoading(false);
        setTimeout(() => { if (onActivityCreated) onActivityCreated(); if (onClose) onClose(); }, 1500);
      } else {
        const datos = await res.json();
        const errData = datos?.data || datos;
        if (errData?.title) setError('Titulo: ' + errData.title[0]);
        else if (errData?.due_date) setError('Fecha: ' + errData.due_date[0]);
        else setError('Datos incorrectos. Verifica el formulario.');
        setLoading(false);
      }
    } catch {
      setError('Error de conexión con el servidor.');
      setLoading(false);
    }
  };

  const manejarEnvio = async () => {
    if (!titulo.trim())           { setError('Debe ingresar un titulo.'); return; }
    if (titulo.trim().length < 3) { setError('El titulo debe tener al menos 3 caracteres.'); return; }
    if (!descripcion.trim())      { setError('Debe ingresar una descripción.'); return; }
    if (!tipo)                    { setError('Selecciona el tipo de actividad.'); return; }
    if (!dificultad)              { setError('Selecciona la prioridad.'); return; }
    if (!fecha)                   { setError('Selecciona una fecha de actividad.'); return; }
    if (fecha < TODAY) {
      setError(`La fecha de la actividad no puede ser anterior a hoy (${formatFecha(TODAY)}).`);
      return;
    }
    if (!horasEstimadas || parseFloat(horasEstimadas) <= 0) { setError('Las horas estimadas deben ser mayores a 0.'); return; }

    const horas = parseFloat(horasEstimadas);
    const token = localStorage.getItem('token');

    // ── CASO 1: La actividad por sí sola supera el límite → proponer división ──
    if (horas > limiteDiario) {
      const horasBloque1 = limiteDiario;
      const horasBloque2 = parseFloat((horas - limiteDiario).toFixed(2));
      const fechaBloque1 = fecha;

      const horasOcupadas1 = await consultarHorasOcupadas(fechaBloque1, token);
      let fechaRealBloque1 = fechaBloque1;
      let horasRealBloque1 = horasBloque1;

      if (horasOcupadas1 + horasBloque1 > limiteDiario) {
        const disponibleHoy = limiteDiario - horasOcupadas1;
        if (disponibleHoy > 0) {
          horasRealBloque1 = parseFloat(disponibleHoy.toFixed(2));
        } else {
          const proxima = await buscarProximaFechaDisponible(fecha, horasBloque1, token, limiteDiario);
          setAlertaSobrecarga({
            modo: 'overload_split',
            limiteDiario, 
            horasActividad: horas,
            horasBloque1: horasBloque1,
            horasBloque2: horasBloque2,
            fechaBloque1: proxima || fecha,
            fechaBloque2: null,
          });
          if (proxima) {
            const prox2 = await buscarProximaFechaDisponible(proxima, horasBloque2, token, limiteDiario);
            setAlertaSobrecarga(prev => ({ ...prev, fechaBloque2: prox2 }));
          }
          return;
        }
      }

      const fechaBloque2 = await buscarProximaFechaDisponible(fechaRealBloque1, horasBloque2 || horas - horasRealBloque1, token, limiteDiario);

      setAlertaSobrecarga({
        modo: 'overload_split',
        limiteDiario,
        horasActividad: horas,
        horasBloque1: horasRealBloque1,
        horasBloque2: parseFloat((horas - horasRealBloque1).toFixed(2)),
        fechaBloque1: fechaRealBloque1,
        fechaBloque2,
      });
      return;
    }

    // ── CASO 2: La actividad cabe en su día pero el día está lleno → reprogramar ──
    const horasOcupadas = await consultarHorasOcupadas(fecha, token);
    if (horasOcupadas + horas > limiteDiario) {
      setAlertaSobrecarga({ modo: 'overload_reprog', horasOcupadas, limiteDiario });
      return;
    }

    await manejarEnvioConFecha(fecha);
  };

  return (
    <div className="ca-overlay">
      <div className="ca-modal">
        <div className="ca-header">
          <h2 className="ca-titulo">Nueva Actividad</h2>
          <button className="ca-cerrar" onClick={onClose}>✕</button>
        </div>
        {success && <div className="ca-mensaje ca-exito">✅ Actividad creada exitosamente. Cerrando...</div>}
        <div ref={mensajeRef}>
          {alertaSobrecarga && (
            <AlertaSobrecarga
              data={alertaSobrecarga}
              cargando={cargandoReprogramar}
              onReprogramar={handleReprogramarCreate}
              onElegirFecha={handleElegirFechaCreate}
              onDividir={handleDividirActividad}
            />
          )}
          {error && <div className="ca-mensaje ca-error">⚠️ {error}</div>}
        </div>
        {!success && (
          <div className="ca-form">
            <div className="ca-campo">
              <label className="ca-label">Título *</label>
              <input className="ca-input" type="text" placeholder="Ej: Investigar sobre el medio ambiente" value={titulo} onChange={e => setTitulo(e.target.value)} />
            </div>
            <div className="ca-campo">
              <label className="ca-label">Descripción</label>
              <textarea className="ca-textarea" placeholder="Describe la actividad o notas importantes..." value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} />
            </div>
            <div className="ca-campo">
              <label className="ca-label">Asignatura</label>
              <input className="ca-input" type="text" placeholder="Ej: Matemáticas" value={asignatura} onChange={e => setAsignatura(e.target.value)} />
            </div>
            <div className="ca-fila-2">
              <div className="ca-campo">
                <label className="ca-label">Tipo *</label>
                <div className="ca-select-wrapper">
                  <select className="ca-select" value={tipo} onChange={e => setTipo(e.target.value)}>
                    <option value="">Selecciona...</option>
                    <option value="homework">Tarea</option>
                    <option value="exam">Examen</option>
                    <option value="presentation">Presentación</option>
                    <option value="project">Proyecto</option>
                  </select>
                </div>
              </div>
              <div className="ca-campo">
                <label className="ca-label">Prioridad *</label>
                <div className="ca-select-wrapper">
                  <select className="ca-select" value={dificultad} onChange={e => setDificultad(e.target.value)}>
                    <option value="">Selecciona...</option>
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="ca-fila-2">
              <div className="ca-campo">
                <label className="ca-label">Fecha de actividad *</label>
                <input ref={fechaInputRef} className="ca-input" type="date" min={TODAY} value={fecha} onChange={e => { setFecha(e.target.value); setAlertaSobrecarga(null); }} />
              </div>
              <div className="ca-campo">
                <label className="ca-label">Horas estimadas *</label>
                <div className="ca-horas-wrapper">
                  <input className="ca-input ca-input-horas" type="number" min="0" step="0.5" placeholder="00 h" value={horasEstimadas} onChange={e => { setHorasEstimadas(e.target.value); setAlertaSobrecarga(null); }} />
                </div>
              </div>
            </div>

            <SubtareasEditor
              subtasks={subtasks}
              fechaActividad={fecha}
              today={TODAY}
              horasPadre={parseFloat(horasEstimadas) || 0}
              horasSubtareas={horasSubtareas}
              nuevoSub={nuevoSub} setNuevoSub={setNuevoSub}
              nuevoSubFecha={nuevoSubFecha} setNuevoSubFecha={setNuevoSubFecha}
              nuevoSubHoras={nuevoSubHoras} setNuevoSubHoras={setNuevoSubHoras}
              errorSub={errorSub} setErrorSub={setErrorSub}
              editandoSubId={editandoSubId}
              editandoSubTitulo={editandoSubTitulo} setEditandoSubTitulo={setEditandoSubTitulo}
              editandoSubFecha={editandoSubFecha} setEditandoSubFecha={setEditandoSubFecha}
              editandoSubHoras={editandoSubHoras} setEditandoSubHoras={setEditandoSubHoras}
              onAgregar={agregarSubtask}
              onEliminar={eliminarSubtask}
              onIniciarEdicion={iniciarEdicionSub}
              onGuardarEdicion={guardarEdicionSub}
              onCancelarEdicion={() => { setEditandoSubId(null); setErrorSub(''); }}
            />

            <div className="ca-botones">
              <button className="ca-btn-cancelar" onClick={onClose} disabled={loading}>Cancelar</button>
              <button className="ca-btn-guardar" onClick={manejarEnvio} disabled={loading}>
                {loading ? <IconSpinner /> : 'Crear actividad'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateActivity;

// ─────────────────────────────────────────────────────────────
// COMPONENTE REUTILIZABLE: EDITOR DE SUBTAREAS
// Ahora recibe horasPadre y horasSubtareas para mostrar el cupo
// ─────────────────────────────────────────────────────────────
function SubtareasEditor({
  subtasks,
  fechaActividad,
  today,
  horasPadre,          // ← NUEVO: horas de la actividad padre
  horasSubtareas,      // ← NUEVO: suma de horas de las subtareas actuales
  nuevoSub, setNuevoSub,
  nuevoSubFecha, setNuevoSubFecha,
  nuevoSubHoras, setNuevoSubHoras,
  errorSub, setErrorSub,
  editandoSubId,
  editandoSubTitulo, setEditandoSubTitulo,
  editandoSubFecha, setEditandoSubFecha,
  editandoSubHoras, setEditandoSubHoras,
  onAgregar, onEliminar, onIniciarEdicion, onGuardarEdicion, onCancelarEdicion
}) {
  const maxFecha = fechaActividad || undefined;
  const horasDisponibles = horasPadre > 0 ? Math.max(0, horasPadre - horasSubtareas) : null;
  const porcentajeUsado = horasPadre > 0 ? Math.min(100, (horasSubtareas / horasPadre) * 100) : 0;

  return (
    <div className="ca-campo">
      <label className="ca-label">
        Subtareas <span style={{color:'#aaa', fontWeight:400}}>(opcional)</span>
      </label>

      {/* ── NUEVO: Barra de progreso de horas de subtareas ─── */}
      {horasPadre > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 4 }}>
            <span>Horas asignadas a subtareas</span>
            <span style={{ fontWeight: 600, color: horasDisponibles === 0 ? '#c0392b' : '#2563eb' }}>
              {horasSubtareas.toFixed(1)}h / {horasPadre}h
              {horasDisponibles !== null && (
                <span style={{ color: '#777', fontWeight: 400 }}>
                  {' '}({horasDisponibles.toFixed(1)}h disponibles)
                </span>
              )}
            </span>
          </div>
          <div style={{ background: '#e5e7eb', borderRadius: 99, height: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${porcentajeUsado}%`,
              background: porcentajeUsado >= 100 ? '#ef4444' : porcentajeUsado >= 80 ? '#f59e0b' : '#3b82f6',
              borderRadius: 99,
              transition: 'width 0.3s ease',
            }} />
          </div>
          {horasDisponibles === 0 && (
            <p style={{ fontSize: 12, color: '#c0392b', marginTop: 4, fontWeight: 600 }}>
              ⛔ Límite de horas alcanzado. No puedes agregar más subtareas.
            </p>
          )}
        </div>
      )}

      <div className="ca-subtask-cols-header">
        <span>Título</span>
        <span>Fecha límite</span>
        <span>Horas</span>
        <span></span>
      </div>

      {subtasks.length > 0 && (
        <ul className="ca-subtasks-lista">
          {subtasks.map(st => (
            <li key={st.id} className="ca-subtask-item">
              {editandoSubId === st.id ? (
                <>
                  <div className="ca-subtask-edit-grid">
                    <input className="ca-input" type="text" placeholder="Título"
                      value={editandoSubTitulo} onChange={e => setEditandoSubTitulo(e.target.value)} autoFocus />
                    <input className="ca-input" type="date"
                      min={today} max={maxFecha}
                      value={editandoSubFecha} onChange={e => setEditandoSubFecha(e.target.value)} />
                    <input className="ca-input" type="number" min="0.5" step="0.5" placeholder="h"
                      value={editandoSubHoras} onChange={e => setEditandoSubHoras(e.target.value)} />
                  </div>
                  <div className="ca-subtask-acciones">
                    <button className="ca-sub-btn ca-sub-btn-ok" type="button" onClick={() => onGuardarEdicion(st.id)}>✓</button>
                    <button className="ca-sub-btn ca-sub-btn-cancel" type="button" onClick={onCancelarEdicion}>✕</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="ca-subtask-edit-grid">
                    <span className="ca-subtask-texto">{st.titulo}</span>
                    <span className="ca-subtask-meta">{st.fecha ? `📅 ${formatFecha(st.fecha)}` : '—'}</span>
                    <span className="ca-subtask-meta">{st.horas ? `⏱ ${st.horas}h` : '—'}</span>
                  </div>
                  <div className="ca-subtask-acciones">
                    <button className="ca-sub-btn ca-sub-btn-edit" type="button" onClick={() => onIniciarEdicion(st)}><IconEdit /></button>
                    <button className="ca-sub-btn ca-sub-btn-del" type="button" onClick={() => onEliminar(st.id)}><IconTrash /></button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ── Input de nueva subtarea (desactivado si cupo = 0) ── */}
      <div className="ca-subtask-input-grid">
        <input className="ca-input" type="text" placeholder="Título subtarea"
          value={nuevoSub}
          disabled={horasPadre > 0 && horasDisponibles === 0}
          onChange={e => { setNuevoSub(e.target.value); setErrorSub(''); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAgregar(); } }}
        />
        <input className="ca-input" type="date"
          min={today} max={maxFecha}
          disabled={horasPadre > 0 && horasDisponibles === 0}
          value={nuevoSubFecha}
          onChange={e => { setNuevoSubFecha(e.target.value); setErrorSub(''); }}
        />
        <input className="ca-input" type="number" min="0.5" step="0.5"
          placeholder={horasPadre > 0 && horasDisponibles !== null ? `máx ${horasDisponibles.toFixed(1)}h` : 'Horas'}
          disabled={horasPadre > 0 && horasDisponibles === 0}
          value={nuevoSubHoras}
          onChange={e => { setNuevoSubHoras(e.target.value); setErrorSub(''); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAgregar(); } }}
        />
        <button
          className="ca-subtask-add-btn"
          type="button"
          onClick={onAgregar}
          disabled={horasPadre > 0 && horasDisponibles === 0}
          style={{ opacity: (horasPadre > 0 && horasDisponibles === 0) ? 0.5 : 1, cursor: (horasPadre > 0 && horasDisponibles === 0) ? 'not-allowed' : 'pointer' }}
        >
          + Agregar
        </button>
      </div>
      {errorSub && <p className="ca-sub-error">{errorSub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EDITAR ACTIVIDAD — con gestión de subtareas
// ─────────────────────────────────────────────────────────────
export function EditActivity({ actividad, onClose, onActualizado }) {
  const [titulo, setTitulo]             = useState(actividad.title || '');
  const [descripcion, setDescripcion]   = useState(actividad.description || '');
  const [tipo, setTipo]                 = useState(actividad.activity_type || '');
  const [dificultad, setDificultad]     = useState(actividad.difficulty || '');
  const [fecha, setFecha]               = useState(actividad.due_date || '');
  const [horasEstimadas, setHorasEstimadas] = useState(String(actividad.horas_estimadas || ''));
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState(false);
  const [alertaSobrecarga, setAlertaSobrecarga] = useState(null);
  const [cargandoReprogramar, setCargandoReprogramar] = useState(false);
  const fechaInputRef = useRef(null);
  const mensajeRef = useRef(null);

  const [subtasks, setSubtasks]         = useState([]);
  const [loadingSubs, setLoadingSubs]   = useState(true);

  const [nuevoSub, setNuevoSub]         = useState('');
  const [nuevoSubFecha, setNuevoSubFecha] = useState('');
  const [nuevoSubHoras, setNuevoSubHoras] = useState('');
  const [errorSub, setErrorSub]         = useState('');

  const [editandoSubId, setEditandoSubId] = useState(null);
  const [editandoSubTitulo, setEditandoSubTitulo] = useState('');
  const [editandoSubFecha, setEditandoSubFecha]   = useState('');
  const [editandoSubHoras, setEditandoSubHoras]   = useState('');

  const token = localStorage.getItem('token');
  const TODAY = hoy();
  const [limiteDiario, setLimiteDiario] = useState(6);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t) {
      fetch(`${API_BASE}/api/usuario/limite-horas/`, { headers: { Authorization: `Bearer ${t}` } })
        .then(r => r.json())
        .then(d => { if (d?.data?.limite_horas_diarias) setLimiteDiario(d.data.limite_horas_diarias); })
        .catch(() => {});
    }
  }, []);

  // ── Scroll automático al mensaje cuando aparece error o alerta ─
  useEffect(() => {
    if ((error || alertaSobrecarga) && mensajeRef.current) {
      mensajeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [error, alertaSobrecarga]);

  // Horas de subtareas en edición
  const horasSubtareasEdit = subtasks.reduce((sum, st) => sum + (parseFloat(st.horas) || 0), 0);

  const handleReprogramarEdit = async () => {
    if (!alertaSobrecarga) return;
    setCargandoReprogramar(true);
    const proxima = await buscarProximaFechaDisponible(fecha, parseFloat(horasEstimadas), token, limiteDiario, actividad.id);
    setCargandoReprogramar(false);
    if (!proxima) {
      setAlertaSobrecarga(null);
      setError('No se encontró una fecha disponible en los próximos 30 días.');
      return;
    }
    setFecha(proxima);
    setAlertaSobrecarga(null);
    setTimeout(() => manejarEnvioConFechaEdit(proxima), 50);
  };

  const handleElegirFechaEdit = () => {
    setAlertaSobrecarga(null);
    setFecha('');
    setTimeout(() => fechaInputRef.current?.showPicker?.() || fechaInputRef.current?.click(), 50);
  };

  useEffect(() => { cargarSubtasks(); }, []);

  const cargarSubtasks = async () => {
    setLoadingSubs(true);
    try {
      const res = await fetch(`${API_BASE}/api/subtasks/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      const lista = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      setSubtasks(
        lista
          .filter(st => st.activity === actividad.id)
          .map(st => {
            let meta = {};
            try {
              const stored = JSON.parse(localStorage.getItem(`subtask_meta_${actividad.id}`) || '{}');
              meta = stored[st.id] || {};
            } catch {}
            return {
              id: st.id,
              titulo: st.title || '',
              fecha: meta.fecha || st.fecha || '',
              horas: meta.horas || st.horas_estimadas || 0,
              esServidor: true,
            };
          })
      );
    } catch (err) { console.error(err); }
    setLoadingSubs(false);
  };

  const agregarSubtask = async () => {
    if (!nuevoSub.trim())   { setErrorSub('Ingresa el título de la subtarea.'); return; }
    if (nuevoSub.trim().length < 3) { setErrorSub('Mínimo 3 caracteres.'); return; }
    if (!nuevoSubFecha)     { setErrorSub('Selecciona una fecha.'); return; }
    if (nuevoSubFecha < TODAY) {
      setErrorSub(`La fecha de la subtarea no puede ser anterior a hoy (${formatFecha(TODAY)}).`);
      return;
    }
    if (!nuevoSubHoras || parseFloat(nuevoSubHoras) <= 0) { setErrorSub('Las horas deben ser mayores a 0.'); return; }
    if (fecha && nuevoSubFecha > fecha) {
      setErrorSub(`La subtarea no puede tener fecha posterior a la actividad (${formatFecha(fecha)}).`);
      return;
    }

    // ── NUEVA VALIDACIÓN de horas en EditActivity ────────────
    const horasPadre = parseFloat(horasEstimadas) || 0;
    const horasNuevas = parseFloat(nuevoSubHoras);
    if (horasPadre > 0 && horasSubtareasEdit + horasNuevas > horasPadre) {
      const disponibles = (horasPadre - horasSubtareasEdit).toFixed(1);
      setErrorSub(
        `Las subtareas no pueden superar las ${horasPadre}h de la actividad. ` +
        `Quedan ${disponibles}h disponibles.`
      );
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/subtasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: nuevoSub.trim(),
          activity: actividad.id,
          fecha: nuevoSubFecha,
          horas_estimadas: parseFloat(nuevoSubHoras),
        })
      });
      if (res.status === 201) {
        const data = await res.json();
        const newId = data?.data?.id || data?.id;
        if (newId) {
          try {
            const meta = JSON.parse(localStorage.getItem(`subtask_meta_${actividad.id}`) || '{}');
            meta[newId] = { fecha: nuevoSubFecha, horas: parseFloat(nuevoSubHoras) };
            localStorage.setItem(`subtask_meta_${actividad.id}`, JSON.stringify(meta));
          } catch {}
        }
        setNuevoSub(''); setNuevoSubFecha(''); setNuevoSubHoras(''); setErrorSub('');
        cargarSubtasks();
      }
    } catch (err) { console.error(err); }
  };

  const eliminarSubtask = async (id) => {
    try {
      await fetch(`${API_BASE}/api/subtasks/${id}/`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      cargarSubtasks();
    } catch (err) { console.error(err); }
  };

  const iniciarEdicionSub = (st) => {
    setEditandoSubId(st.id);
    setEditandoSubTitulo(st.titulo);
    setEditandoSubFecha(st.fecha || '');
    setEditandoSubHoras(String(st.horas || ''));
    setErrorSub('');
  };

  const guardarEdicionSub = async (id) => {
    if (!editandoSubTitulo.trim()) { setErrorSub('El título no puede estar vacío.'); return; }
    if (editandoSubFecha && editandoSubFecha < TODAY) {
      setErrorSub(`La fecha de la subtarea no puede ser anterior a hoy (${formatFecha(TODAY)}).`);
      return;
    }
    if (fecha && editandoSubFecha && editandoSubFecha > fecha) {
      setErrorSub(`La subtarea no puede tener fecha posterior a la actividad (${formatFecha(fecha)}).`);
      return;
    }

    // ── NUEVA VALIDACIÓN de horas en edición ─────────────────
    const horasPadre = parseFloat(horasEstimadas) || 0;
    const horasOtras = subtasks.filter(s => s.id !== id).reduce((sum, st) => sum + (parseFloat(st.horas) || 0), 0);
    const horasEditadas = parseFloat(editandoSubHoras) || 0;
    if (horasPadre > 0 && horasOtras + horasEditadas > horasPadre) {
      const disponibles = (horasPadre - horasOtras).toFixed(1);
      setErrorSub(
        `Las subtareas no pueden superar las ${horasPadre}h de la actividad. ` +
        `Quedan ${disponibles}h disponibles.`
      );
      return;
    }

    try {
      await fetch(`${API_BASE}/api/subtasks/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: editandoSubTitulo.trim(),
          fecha: editandoSubFecha || undefined,
          horas_estimadas: editandoSubHoras ? parseFloat(editandoSubHoras) : undefined,
        })
      });
      try {
        const meta = JSON.parse(localStorage.getItem(`subtask_meta_${actividad.id}`) || '{}');
        meta[id] = { fecha: editandoSubFecha, horas: parseFloat(editandoSubHoras) };
        localStorage.setItem(`subtask_meta_${actividad.id}`, JSON.stringify(meta));
      } catch {}
      setEditandoSubId(null); setEditandoSubTitulo(''); setEditandoSubFecha(''); setEditandoSubHoras('');
      setErrorSub('');
      cargarSubtasks();
    } catch (err) { console.error(err); }
  };

  const manejarEnvioConFechaEdit = async (fechaFinal) => {
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/activities/${actividad.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: titulo, description: descripcion,
          start_date: fechaFinal, due_date: fechaFinal,
          activity_type: tipo, difficulty: dificultad,
          horas_estimadas: parseFloat(horasEstimadas),
        }),
      });
      if (res.ok) {
        setSuccess(true); setLoading(false);
        setTimeout(() => { if (onActualizado) onActualizado(); }, 1000);
      } else {
        const datos = await res.json();
        const errData = datos?.data || datos;
        if (errData?.title) setError('Titulo: ' + errData.title[0]);
        else if (errData?.due_date) setError('Fecha: ' + errData.due_date[0]);
        else setError('Datos incorrectos.');
        setLoading(false);
      }
    } catch {
      setError('Error de conexión.'); setLoading(false);
    }
  };

  const manejarEnvio = async () => {
    if (!titulo.trim())           { setError('Debe ingresar un titulo.'); return; }
    if (titulo.trim().length < 3) { setError('El titulo debe tener al menos 3 caracteres.'); return; }
    if (!descripcion.trim())      { setError('Debe ingresar una descripción.'); return; }
    if (!tipo)                    { setError('Selecciona el tipo de actividad.'); return; }
    if (!dificultad)              { setError('Selecciona la prioridad.'); return; }
    if (!fecha)                   { setError('Selecciona una fecha.'); return; }
    if (fecha < TODAY) {
      setError(`La fecha de la actividad no puede ser anterior a hoy (${formatFecha(TODAY)}).`);
      return;
    }
    if (!horasEstimadas || parseFloat(horasEstimadas) <= 0) { setError('Las horas estimadas deben ser mayores a 0.'); return; }
    if (parseFloat(horasEstimadas) % 0.5 !== 0) { setError('Las horas estimadas deben ser múltiplos de 0.5 (ej: 1, 1.5, 2).'); return; }

    const horasOcupadas = await consultarHorasOcupadas(fecha, token, actividad.id);
    if (horasOcupadas + parseFloat(horasEstimadas) > limiteDiario) {
      setAlertaSobrecarga({ modo: 'overload_reprog', horasOcupadas, limiteDiario });
      return;
    }

    const subsConFechaInvalida = subtasks.filter(st => st.fecha && st.fecha > fecha);
    if (subsConFechaInvalida.length > 0) {
      const nombres = subsConFechaInvalida.map(st => `"${st.titulo}"`).join(', ');
      setError(
        `Las siguientes subtareas tienen fecha posterior al ${formatFecha(fecha)}: ${nombres}. ` +
        `Edítalas primero para poder guardar.`
      );
      return;
    }

    await manejarEnvioConFechaEdit(fecha);
  };

  return (
    <div className="ca-overlay">
      <div className="ca-modal">
        <div className="ca-header">
          <h2 className="ca-titulo">Editar Actividad</h2>
          <button className="ca-cerrar" onClick={onClose}>✕</button>
        </div>
        {success && <div className="ca-mensaje ca-exito">✅ Actividad actualizada. Cerrando...</div>}
        <div ref={mensajeRef}>
          {alertaSobrecarga && (
            <AlertaSobrecarga
              data={alertaSobrecarga}
              cargando={cargandoReprogramar}
              onReprogramar={handleReprogramarEdit}
              onElegirFecha={handleElegirFechaEdit}
              onDividir={() => {}}
            />
          )}
          {error && <div className="ca-mensaje ca-error">⚠️ {error}</div>}
        </div>
        {!success && (
          <div className="ca-form">
            <div className="ca-campo">
              <label className="ca-label">Título *</label>
              <input className="ca-input" type="text" value={titulo} onChange={e => setTitulo(e.target.value)} />
            </div>
            <div className="ca-campo">
              <label className="ca-label">Descripción</label>
              <textarea className="ca-textarea" value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} />
            </div>
            <div className="ca-fila-2">
              <div className="ca-campo">
                <label className="ca-label">Tipo *</label>
                <div className="ca-select-wrapper">
                  <select className="ca-select" value={tipo} onChange={e => setTipo(e.target.value)}>
                    <option value="">Selecciona...</option>
                    <option value="homework">Tarea</option>
                    <option value="exam">Examen</option>
                    <option value="presentation">Presentación</option>
                    <option value="project">Proyecto</option>
                  </select>
                </div>
              </div>
              <div className="ca-campo">
                <label className="ca-label">Prioridad *</label>
                <div className="ca-select-wrapper">
                  <select className="ca-select" value={dificultad} onChange={e => setDificultad(e.target.value)}>
                    <option value="">Selecciona...</option>
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="ca-fila-2">
              <div className="ca-campo">
                <label className="ca-label">Fecha de actividad *</label>
                <input ref={fechaInputRef} className="ca-input" type="date" min={TODAY} value={fecha} onChange={e => { setFecha(e.target.value); setAlertaSobrecarga(null); }} />
              </div>
              <div className="ca-campo">
                <label className="ca-label">Horas estimadas *</label>
                <input className="ca-input" type="number" min="0" step="0.5" placeholder="00 h" value={horasEstimadas} onChange={e => setHorasEstimadas(e.target.value)} />
              </div>
            </div>

            {/* SUBTAREAS EN EDICIÓN */}
            <div className="ca-campo">
              <label className="ca-label">
                Subtareas
                {loadingSubs && <span style={{color:'#aaa', fontWeight:400, marginLeft:8}}>cargando...</span>}
              </label>

              {/* ── Barra de progreso de horas en edición ──── */}
              {!loadingSubs && parseFloat(horasEstimadas) > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 4 }}>
                    <span>Horas asignadas a subtareas</span>
                    <span style={{ fontWeight: 600, color: horasSubtareasEdit >= parseFloat(horasEstimadas) ? '#c0392b' : '#2563eb' }}>
                      {horasSubtareasEdit.toFixed(1)}h / {horasEstimadas}h
                      <span style={{ color: '#777', fontWeight: 400 }}>
                        {' '}({Math.max(0, parseFloat(horasEstimadas) - horasSubtareasEdit).toFixed(1)}h disponibles)
                      </span>
                    </span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, (horasSubtareasEdit / parseFloat(horasEstimadas)) * 100)}%`,
                      background: horasSubtareasEdit >= parseFloat(horasEstimadas) ? '#ef4444' : horasSubtareasEdit / parseFloat(horasEstimadas) >= 0.8 ? '#f59e0b' : '#3b82f6',
                      borderRadius: 99,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              )}

              {!loadingSubs && (
                <>
                  <div className="ca-subtask-cols-header">
                    <span>Título</span>
                    <span>Fecha límite</span>
                    <span>Horas</span>
                    <span></span>
                  </div>

                  {subtasks.length > 0 && (
                    <ul className="ca-subtasks-lista">
                      {subtasks.map(st => {
                        const fechaInvalida = st.fecha && fecha && st.fecha > fecha;
                        return (
                          <li key={st.id} className={`ca-subtask-item${fechaInvalida ? ' ca-subtask-fecha-invalida' : ''}`}>
                            {editandoSubId === st.id ? (
                              <>
                                <div className="ca-subtask-edit-grid">
                                  <input className="ca-input" type="text" placeholder="Título"
                                    value={editandoSubTitulo} onChange={e => setEditandoSubTitulo(e.target.value)} autoFocus />
                                  <input className="ca-input" type="date"
                                    min={TODAY} max={fecha || undefined}
                                    value={editandoSubFecha} onChange={e => setEditandoSubFecha(e.target.value)} />
                                  <input className="ca-input" type="number" min="0.5" step="0.5" placeholder="h"
                                    value={editandoSubHoras} onChange={e => setEditandoSubHoras(e.target.value)} />
                                </div>
                                <div className="ca-subtask-acciones">
                                  <button className="ca-sub-btn ca-sub-btn-ok" type="button" onClick={() => guardarEdicionSub(st.id)}>✓</button>
                                  <button className="ca-sub-btn ca-sub-btn-cancel" type="button" onClick={() => { setEditandoSubId(null); setErrorSub(''); }}>✕</button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="ca-subtask-edit-grid">
                                  <span className="ca-subtask-texto">
                                    {st.titulo}
                                    {fechaInvalida && (
                                      <span style={{ marginLeft: 8, fontSize: 11, color: '#c0392b', fontWeight: 600, background: '#fdecea', borderRadius: 4, padding: '1px 6px' }}>
                                        ⚠ Reprogramar
                                      </span>
                                    )}
                                  </span>
                                  <span className="ca-subtask-meta" style={fechaInvalida ? {color:'#c0392b', fontWeight:600} : {}}>
                                    {st.fecha ? `📅 ${formatFecha(st.fecha)}` : '—'}
                                  </span>
                                  <span className="ca-subtask-meta">
                                    {st.horas ? `⏱ ${st.horas}h` : '—'}
                                  </span>
                                </div>
                                <div className="ca-subtask-acciones">
                                  <button className="ca-sub-btn ca-sub-btn-edit" type="button" onClick={() => iniciarEdicionSub(st)}><IconEdit /></button>
                                  <button className="ca-sub-btn ca-sub-btn-del" type="button" onClick={() => eliminarSubtask(st.id)}><IconTrash /></button>
                                </div>
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {errorSub && <p className="ca-sub-error">{errorSub}</p>}

                  <div className="ca-subtask-input-grid">
                    <input className="ca-input" type="text" placeholder="Título subtarea"
                      value={nuevoSub}
                      disabled={parseFloat(horasEstimadas) > 0 && horasSubtareasEdit >= parseFloat(horasEstimadas)}
                      onChange={e => { setNuevoSub(e.target.value); setErrorSub(''); }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarSubtask(); } }}
                    />
                    <input className="ca-input" type="date"
                      min={TODAY} max={fecha || undefined}
                      disabled={parseFloat(horasEstimadas) > 0 && horasSubtareasEdit >= parseFloat(horasEstimadas)}
                      value={nuevoSubFecha} onChange={e => { setNuevoSubFecha(e.target.value); setErrorSub(''); }}
                    />
                    <input className="ca-input" type="number" min="0.5" step="0.5"
                      placeholder={parseFloat(horasEstimadas) > 0 ? `máx ${Math.max(0, parseFloat(horasEstimadas) - horasSubtareasEdit).toFixed(1)}h` : 'Horas'}
                      disabled={parseFloat(horasEstimadas) > 0 && horasSubtareasEdit >= parseFloat(horasEstimadas)}
                      value={nuevoSubHoras}
                      onChange={e => { setNuevoSubHoras(e.target.value); setErrorSub(''); }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarSubtask(); } }}
                    />
                    <button
                      className="ca-subtask-add-btn"
                      type="button"
                      onClick={agregarSubtask}
                      disabled={parseFloat(horasEstimadas) > 0 && horasSubtareasEdit >= parseFloat(horasEstimadas)}
                      style={{ opacity: (parseFloat(horasEstimadas) > 0 && horasSubtareasEdit >= parseFloat(horasEstimadas)) ? 0.5 : 1 }}
                    >
                      + Agregar
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="ca-botones">
              <button className="ca-btn-cancelar" onClick={onClose} disabled={loading}>Cancelar</button>
              <button className="ca-btn-guardar" onClick={manejarEnvio} disabled={loading}>
                {loading ? <IconSpinner /> : 'Guardar cambios'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}