import React, { useState, useEffect } from 'react';
import './CreateActivity.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://miniproyecto-1-x936.onrender.com';

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
// CREAR ACTIVIDAD
// ─────────────────────────────────────────────────────────────
function CreateActivity({ onClose, onActivityCreated }) {
  const [titulo, setTitulo]             = useState('');
  const [descripcion, setDescripcion]   = useState('');
  const [asignatura, setAsignatura]     = useState('');
  const [tipo, setTipo]                 = useState('');
  const [dificultad, setDificultad]     = useState('');
  const [fecha, setFecha]               = useState('');
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

  const agregarSubtask = () => {
    if (!nuevoSub.trim())   { setErrorSub('Ingresa el título de la subtarea.'); return; }
    if (nuevoSub.trim().length < 3) { setErrorSub('Mínimo 3 caracteres.'); return; }
    if (!nuevoSubFecha)     { setErrorSub('Selecciona una fecha para la subtarea.'); return; }
    if (!nuevoSubHoras || parseFloat(nuevoSubHoras) <= 0) { setErrorSub('Las horas deben ser mayores a 0.'); return; }

    // Validar que la fecha de la subtarea no supere la fecha de la actividad
    if (fecha && nuevoSubFecha > fecha) {
      const [y, m, d] = fecha.split('-');
      setErrorSub(`La fecha de la subtarea no puede ser posterior a la fecha de la actividad (${d}/${m}/${y}).`);
      return;
    }
    setSubtasks([...subtasks, { titulo: nuevoSub.trim(), fecha: nuevoSubFecha, horas: parseFloat(nuevoSubHoras), id: Date.now() }]);
    setNuevoSub(''); setNuevoSubFecha(''); setNuevoSubHoras(''); setErrorSub('');
  };

  const eliminarSubtask = (id) => setSubtasks(subtasks.filter(s => s.id !== id));

  const iniciarEdicionSub = (st) => {
    setEditandoSubId(st.id); setEditandoSubTitulo(st.titulo);
    setEditandoSubFecha(st.fecha); setEditandoSubHoras(st.horas);
  };

  const guardarEdicionSub = (id) => {
    if (!editandoSubTitulo.trim() || !editandoSubFecha || !editandoSubHoras) return;
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, titulo: editandoSubTitulo.trim(), fecha: editandoSubFecha, horas: parseFloat(editandoSubHoras) } : s));
    setEditandoSubId(null); setEditandoSubTitulo(''); setEditandoSubFecha(''); setEditandoSubHoras('');
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

  const manejarEnvio = async () => {
    if (!titulo.trim())           { setError('Debe ingresar un titulo.'); return; }
    if (titulo.trim().length < 3) { setError('El titulo debe tener al menos 3 caracteres.'); return; }
    if (!descripcion.trim())      { setError('Debe ingresar una descripción.'); return; }
    if (!tipo)                    { setError('Selecciona el tipo de actividad.'); return; }
    if (!dificultad)              { setError('Selecciona la prioridad.'); return; }
    if (!fecha)                   { setError('Selecciona una fecha de actividad.'); return; }
    if (!horasEstimadas || parseFloat(horasEstimadas) <= 0) { setError('Las horas estimadas deben ser mayores a 0.'); return; }

    setError(''); setLoading(true);
    const token = localStorage.getItem('token');
    const asignaturaId = await resolverAsignatura(asignatura, token);

    try {
      const res = await fetch(API_BASE + '/api/activities/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: titulo, description: descripcion,
          start_date: fecha, due_date: fecha,
          activity_type: tipo, difficulty: dificultad,
          horas_estimadas: parseFloat(horasEstimadas),
          ...(asignaturaId && { asignatura: asignaturaId }),
        }),
      });

      if (res.status === 201) {
        const data = await res.json();
        const actividadId = data?.data?.id;
        if (actividadId && subtasks.length > 0) {
          await Promise.all(subtasks.map(st =>
            fetch(API_BASE + '/api/subtasks/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ title: st.titulo, activity: actividadId })
            })
          ));
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
    } catch (err) {
      setError('Error de conexión con el servidor.');
      setLoading(false);
    }
  };

  return (
    <div className="ca-overlay">
      <div className="ca-modal">
        <div className="ca-header">
          <h2 className="ca-titulo">Nueva Actividad</h2>
          <button className="ca-cerrar" onClick={onClose}>✕</button>
        </div>
        {success && <div className="ca-mensaje ca-exito">✅ Actividad creada exitosamente. Cerrando...</div>}
        {error   && <div className="ca-mensaje ca-error">⚠️ {error}</div>}
        {!success && (
          <div className="ca-form">
            <div className="ca-campo">
              <label className="ca-label">Título *</label>
              <input className="ca-input" type="text" placeholder="Ej: Investigar sobre el medio ambiente" value={titulo} onChange={e => setTitulo(e.target.value)} />
            </div>
            <div className="ca-campo">
              <label className="ca-label">Descripción</label>
              <textarea className="ca-textarea" placeholder="Describe la actividad o notas importante..." value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} />
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
                <input className="ca-input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
              </div>
              <div className="ca-campo">
                <label className="ca-label">Horas estimadas *</label>
                <div className="ca-horas-wrapper">
                  <input className="ca-input ca-input-horas" type="number" min="0" step="1" placeholder="00 h" value={horasEstimadas} onChange={e => setHorasEstimadas(e.target.value)} />
                </div>
              </div>
            </div>

            {/* SUBTAREAS */}
            <SubtareasEditor
              subtasks={subtasks}
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
              onCancelarEdicion={() => setEditandoSubId(null)}
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
// ─────────────────────────────────────────────────────────────
function SubtareasEditor({
  subtasks,
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
  return (
    <div className="ca-campo">
      <label className="ca-label">Subtareas <span style={{color:'#aaa', fontWeight:400}}>(opcional)</span></label>

      {/* Cabecera de columnas */}
      {(subtasks.length > 0 || true) && (
        <div className="ca-subtask-cols-header">
          <span>Título</span>
          <span>Fecha límite</span>
          <span>Horas</span>
          <span></span>
        </div>
      )}

      {/* Lista de subtareas existentes */}
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
                  <div className="ca-subtask-edit-grid" style={{opacity:1}}>
                    <span className="ca-subtask-texto">{st.titulo}</span>
                    <span className="ca-subtask-meta">📅 {st.fecha}</span>
                    <span className="ca-subtask-meta">⏱ {st.horas}h</span>
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

      {/* Fila para agregar nueva subtarea */}
      <div className="ca-subtask-input-grid">
        <input className="ca-input" type="text" placeholder="Título subtarea"
          value={nuevoSub}
          onChange={e => { setNuevoSub(e.target.value); setErrorSub(''); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAgregar(); } }}
        />
        <input className="ca-input" type="date"
          value={nuevoSubFecha}
          onChange={e => { setNuevoSubFecha(e.target.value); setErrorSub(''); }}
        />
        <input className="ca-input" type="number" min="0.5" step="0.5" placeholder="Horas"
          value={nuevoSubHoras}
          onChange={e => { setNuevoSubHoras(e.target.value); setErrorSub(''); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAgregar(); } }}
        />
        <button className="ca-subtask-add-btn" type="button" onClick={onAgregar}>+ Agregar</button>
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

  // Subtareas del servidor
  const [subtasks, setSubtasks]         = useState([]);
  const [loadingSubs, setLoadingSubs]   = useState(true);

  // Estados para nueva subtarea
  const [nuevoSub, setNuevoSub]         = useState('');
  const [nuevoSubFecha, setNuevoSubFecha] = useState('');
  const [nuevoSubHoras, setNuevoSubHoras] = useState('');
  const [errorSub, setErrorSub]         = useState('');

  // Estados para editar subtarea
  const [editandoSubId, setEditandoSubId] = useState(null);
  const [editandoSubTitulo, setEditandoSubTitulo] = useState('');
  const [editandoSubFecha, setEditandoSubFecha]   = useState('');
  const [editandoSubHoras, setEditandoSubHoras]   = useState('');

  const token = localStorage.getItem('token');

  // Cargar subtareas existentes de la actividad
  useEffect(() => {
    cargarSubtasks();
  }, []);

  const cargarSubtasks = async () => {
    setLoadingSubs(true);
    try {
      const res = await fetch(`${API_BASE}/api/subtasks/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      const lista = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      // Convertir formato servidor a formato local
      setSubtasks(lista
        .filter(st => st.activity === actividad.id)
        .map(st => ({ id: st.id, titulo: st.title, fecha: '', horas: 0, esServidor: true }))
      );
    } catch (err) { console.error(err); }
    setLoadingSubs(false);
  };

  const agregarSubtask = async () => {
    if (!nuevoSub.trim())   { setErrorSub('Ingresa el título de la subtarea.'); return; }
    if (nuevoSub.trim().length < 3) { setErrorSub('Mínimo 3 caracteres.'); return; }
    if (!nuevoSubFecha)     { setErrorSub('Selecciona una fecha.'); return; }
    if (!nuevoSubHoras || parseFloat(nuevoSubHoras) <= 0) { setErrorSub('Las horas deben ser mayores a 0.'); return; }

    // Validar que la fecha de la subtarea no supere la fecha de la actividad
    if (fecha && nuevoSubFecha > fecha) {
      setErrorSub(`La subtarea no puede tener fecha posterior a la actividad (${formatFechaLocal(fecha)}).`);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/subtasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: nuevoSub.trim(), activity: actividad.id })
      });
      if (res.status === 201) {
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
    setEditandoSubId(st.id); setEditandoSubTitulo(st.titulo);
    setEditandoSubFecha(st.fecha || ''); setEditandoSubHoras(st.horas || '');
  };

  const guardarEdicionSub = async (id) => {
    if (!editandoSubTitulo.trim()) return;

    // Validar que la fecha editada no supere la fecha de la actividad
    if (fecha && editandoSubFecha && editandoSubFecha > fecha) {
      setErrorSub(`La subtarea no puede tener fecha posterior a la actividad (${formatFechaLocal(fecha)}).`);
      return;
    }

    try {
      await fetch(`${API_BASE}/api/subtasks/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editandoSubTitulo.trim() })
      });
      setEditandoSubId(null); setEditandoSubTitulo('');
      cargarSubtasks();
    } catch (err) { console.error(err); }
  };

  // Formatea fecha YYYY-MM-DD a DD/MM/YYYY para mensajes
  const formatFechaLocal = (f) => {
    if (!f) return '';
    const [y, m, d] = f.split('-');
    return `${d}/${m}/${y}`;
  };

  const manejarEnvio = async () => {
    if (!titulo.trim())           { setError('Debe ingresar un titulo.'); return; }
    if (titulo.trim().length < 3) { setError('El titulo debe tener al menos 3 caracteres.'); return; }
    if (!descripcion.trim())      { setError('Debe ingresar una descripción.'); return; }
    if (!tipo)                    { setError('Selecciona el tipo de actividad.'); return; }
    if (!dificultad)              { setError('Selecciona la prioridad.'); return; }
    if (!fecha)                   { setError('Selecciona una fecha.'); return; }
    if (!horasEstimadas || parseFloat(horasEstimadas) <= 0) { setError('Las horas estimadas deben ser mayores a 0.'); return; }

    // Verificar si alguna subtarea tiene fecha posterior a la nueva fecha de la actividad
    const subsConFechaInvalida = subtasks.filter(st => st.fecha && st.fecha > fecha);
    if (subsConFechaInvalida.length > 0) {
      const nombres = subsConFechaInvalida.map(st => `"${st.titulo}"`).join(', ');
      setError(
        `⚠️ Las siguientes subtareas tienen fecha posterior al ${formatFechaLocal(fecha)}: ${nombres}. ` +
        `Debes reprogramarlas antes de guardar.`
      );
      return;
    }

    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/activities/${actividad.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: titulo, description: descripcion,
          start_date: fecha, due_date: fecha,
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
    } catch (err) {
      setError('Error de conexión.'); setLoading(false);
    }
  };

  return (
    <div className="ca-overlay">
      <div className="ca-modal">
        <div className="ca-header">
          <h2 className="ca-titulo">Editar Actividad</h2>
          <button className="ca-cerrar" onClick={onClose}>✕</button>
        </div>
        {success && <div className="ca-mensaje ca-exito">✅ Actividad actualizada. Cerrando...</div>}
        {error   && <div className="ca-mensaje ca-error">⚠️ {error}</div>}
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
                <input className="ca-input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
              </div>
              <div className="ca-campo">
                <label className="ca-label">Horas estimadas *</label>
                <input className="ca-input" type="number" min="0" step="1" placeholder="00 h" value={horasEstimadas} onChange={e => setHorasEstimadas(e.target.value)} />
              </div>
            </div>

            {/* SUBTAREAS EN EDICIÓN */}
            <div className="ca-campo">
              <label className="ca-label">
                Subtareas
                {loadingSubs && <span style={{color:'#aaa', fontWeight:400, marginLeft:8}}>cargando...</span>}
              </label>

              {!loadingSubs && (
                <>
                  {/* Cabecera columnas */}
                  <div className="ca-subtask-cols-header">
                    <span>Título</span>
                    <span>Fecha límite</span>
                    <span>Horas</span>
                    <span></span>
                  </div>

                  {/* Lista subtareas */}
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
                                  value={editandoSubFecha} onChange={e => setEditandoSubFecha(e.target.value)} />
                                <input className="ca-input" type="number" min="0.5" step="0.5" placeholder="h"
                                  value={editandoSubHoras} onChange={e => setEditandoSubHoras(e.target.value)} />
                              </div>
                              <div className="ca-subtask-acciones">
                                <button className="ca-sub-btn ca-sub-btn-ok" type="button" onClick={() => guardarEdicionSub(st.id)}>✓</button>
                                <button className="ca-sub-btn ca-sub-btn-cancel" type="button" onClick={() => setEditandoSubId(null)}>✕</button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="ca-subtask-edit-grid">
                                <span className="ca-subtask-texto">{st.titulo}</span>
                                <span className="ca-subtask-meta">{st.fecha ? `📅 ${st.fecha}` : '—'}</span>
                                <span className="ca-subtask-meta">{st.horas ? `⏱ ${st.horas}h` : '—'}</span>
                              </div>
                              <div className="ca-subtask-acciones">
                                <button className="ca-sub-btn ca-sub-btn-edit" type="button" onClick={() => iniciarEdicionSub(st)}><IconEdit /></button>
                                <button className="ca-sub-btn ca-sub-btn-del" type="button" onClick={() => eliminarSubtask(st.id)}><IconTrash /></button>
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Agregar nueva subtarea */}
                  <div className="ca-subtask-input-grid">
                    <input className="ca-input" type="text" placeholder="Título subtarea"
                      value={nuevoSub} onChange={e => { setNuevoSub(e.target.value); setErrorSub(''); }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarSubtask(); } }}
                    />
                    <input className="ca-input" type="date"
                      value={nuevoSubFecha} onChange={e => { setNuevoSubFecha(e.target.value); setErrorSub(''); }}
                    />
                    <input className="ca-input" type="number" min="0.5" step="0.5" placeholder="Horas"
                      value={nuevoSubHoras} onChange={e => { setNuevoSubHoras(e.target.value); setErrorSub(''); }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarSubtask(); } }}
                    />
                    <button className="ca-subtask-add-btn" type="button" onClick={agregarSubtask}>+ Agregar</button>
                  </div>
                  {errorSub && <p className="ca-sub-error">{errorSub}</p>}
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