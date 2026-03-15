import React, { useState } from 'react';
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

function CreateActivity({ onClose, onActivityCreated }) {
  const [titulo, setTitulo]               = useState('');
  const [descripcion, setDescripcion]     = useState('');
  const [asignatura, setAsignatura]       = useState('');
  const [tipo, setTipo]                   = useState('');
  const [dificultad, setDificultad]       = useState('');
  const [fecha, setFecha]                 = useState('');
  const [horasEstimadas, setHorasEstimadas] = useState('');
  const [subtasks, setSubtasks]           = useState([]);
  const [nuevoSub, setNuevoSub]           = useState('');
  const [errorSub, setErrorSub]           = useState('');
  const [editandoSubId, setEditandoSubId] = useState(null);
  const [editandoSubTitulo, setEditandoSubTitulo] = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState(false);

  const agregarSubtask = () => {
    if (!nuevoSub.trim()) { setErrorSub('Ingresa un titulo.'); return; }
    if (nuevoSub.trim().length < 3) { setErrorSub('Mínimo 3 caracteres.'); return; }
    setSubtasks([...subtasks, { titulo: nuevoSub.trim(), id: Date.now() }]);
    setNuevoSub(''); setErrorSub('');
  };

  const eliminarSubtask = (id) => setSubtasks(subtasks.filter(s => s.id !== id));

  const iniciarEdicionSub = (st) => { setEditandoSubId(st.id); setEditandoSubTitulo(st.titulo); };
  const guardarEdicionSub = (id) => {
    if (!editandoSubTitulo.trim() || editandoSubTitulo.trim().length < 3) return;
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, titulo: editandoSubTitulo.trim() } : s));
    setEditandoSubId(null); setEditandoSubTitulo('');
  };

  const resolverAsignatura = async (nombre, token) => {
    if (!nombre.trim()) return null;
    try {
      const res = await fetch(`${API_BASE}/api/asignaturas/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
    if (subtasks.length === 0)    { setError('Agrega al menos una subtarea.'); return; }
    if (!horasEstimadas || parseFloat(horasEstimadas) <= 0) { setError('Las horas estimadas deben ser mayores a 0.'); return; }

    setError(''); setLoading(true);
    const token = localStorage.getItem('token');
    const asignaturaId = await resolverAsignatura(asignatura, token);

    const nuevaActividad = {
      title: titulo,
      description: descripcion,
      start_date: fecha,
      due_date: fecha,
      activity_type: tipo,
      difficulty: dificultad,
      horas_estimadas: horasEstimadas ? parseFloat(horasEstimadas) : 0,
      ...(asignaturaId && { asignatura: asignaturaId }),
    };

    try {
      const res = await fetch(API_BASE + '/api/activities/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(nuevaActividad),
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

        {/* HEADER */}
        <div className="ca-header">
          <h2 className="ca-titulo">Nueva Actividad</h2>
          <button className="ca-cerrar" onClick={onClose}>✕</button>
        </div>

        {success && <div className="ca-mensaje ca-exito">✅ Actividad creada exitosamente. Cerrando...</div>}
        {error   && <div className="ca-mensaje ca-error">⚠️ {error}</div>}

        {!success && (
          <div className="ca-form">

            {/* TITULO */}
            <div className="ca-campo">
              <label className="ca-label">Título *</label>
              <input className="ca-input" type="text" placeholder="Ej: Investigar sobre el medio ambiente"
                value={titulo} onChange={e => setTitulo(e.target.value)} />
            </div>

            {/* DESCRIPCION */}
            <div className="ca-campo">
              <label className="ca-label">Descripción</label>
              <textarea className="ca-textarea" placeholder="Describe la actividad o notas importante..."
                value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} />
            </div>

            {/* ASIGNATURA */}
            <div className="ca-campo">
              <label className="ca-label">Asignatura</label>
              <input className="ca-input" type="text" placeholder="Ej: Matemáticas"
                value={asignatura} onChange={e => setAsignatura(e.target.value)} />
            </div>

            {/* TIPO Y PRIORIDAD */}
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

            {/* FECHA Y HORAS */}
            <div className="ca-fila-2">
              <div className="ca-campo">
                <label className="ca-label">Fecha de actividad *</label>
                <div className="ca-select-wrapper">
                  <input className="ca-input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
                </div>
              </div>
              <div className="ca-campo">
                <label className="ca-label">Horas estimadas*</label>
                <div className="ca-horas-wrapper">
                  <input className="ca-input ca-input-horas" type="number" min="0" step="1" placeholder="00 h"
                    value={horasEstimadas} onChange={e => setHorasEstimadas(e.target.value)} />
                </div>
              </div>
            </div>

            {/* SUBTAREAS */}
            <div className="ca-campo">
              <label className="ca-label">Subtarea</label>

              {subtasks.length > 0 && (
                <ul className="ca-subtasks-lista">
                  {subtasks.map(st => (
                    <li key={st.id} className="ca-subtask-item">
                      {editandoSubId === st.id ? (
                        <>
                          <input className="ca-input ca-subtask-edit-input" type="text"
                            value={editandoSubTitulo}
                            onChange={e => setEditandoSubTitulo(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') guardarEdicionSub(st.id); if (e.key === 'Escape') setEditandoSubId(null); }}
                            autoFocus />
                          <button className="ca-sub-btn ca-sub-btn-ok" type="button" onClick={() => guardarEdicionSub(st.id)}>✓</button>
                          <button className="ca-sub-btn ca-sub-btn-cancel" type="button" onClick={() => setEditandoSubId(null)}>✕</button>
                        </>
                      ) : (
                        <>
                          <span className="ca-subtask-punto">⊕</span>
                          <span className="ca-subtask-texto">{st.titulo}</span>
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

              <div className="ca-subtask-input-row">
                <input className="ca-input" type="text" placeholder="Ej: repasar capítulo 3"
                  value={nuevoSub}
                  onChange={e => { setNuevoSub(e.target.value); setErrorSub(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarSubtask(); } }}
                />
                <button className="ca-subtask-add-btn" type="button" onClick={agregarSubtask}>+ Agregar</button>
              </div>
              {errorSub && <p className="ca-sub-error">{errorSub}</p>}
            </div>

            {/* BOTONES */}
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

// ============================================================
// EDITAR ACTIVIDAD — mismo archivo, mismos estilos
// ============================================================
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

  const manejarEnvio = async () => {
    if (!titulo.trim())           { setError('Debe ingresar un titulo.'); return; }
    if (titulo.trim().length < 3) { setError('El titulo debe tener al menos 3 caracteres.'); return; }
    if (!descripcion.trim())      { setError('Debe ingresar una descripción.'); return; }
    if (!tipo)                    { setError('Selecciona el tipo de actividad.'); return; }
    if (!dificultad)              { setError('Selecciona la prioridad.'); return; }
    if (!fecha)                   { setError('Selecciona una fecha.'); return; }
    if (!horasEstimadas || parseFloat(horasEstimadas) <= 0) { setError('Las horas estimadas deben ser mayores a 0.'); return; }

    setError(''); setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE}/api/activities/${actividad.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: titulo,
          description: descripcion,
          start_date: fecha,
          due_date: fecha,
          activity_type: tipo,
          difficulty: dificultad,
          horas_estimadas: horasEstimadas ? parseFloat(horasEstimadas) : 0,
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
          <h2 className="ca-titulo">Editar Actividad</h2>
          <button className="ca-cerrar" onClick={onClose}>✕</button>
        </div>

        {success && <div className="ca-mensaje ca-exito">✅ Actividad actualizada. Cerrando...</div>}
        {error   && <div className="ca-mensaje ca-error">⚠️ {error}</div>}

        {!success && (
          <div className="ca-form">

            <div className="ca-campo">
              <label className="ca-label">Título *</label>
              <input className="ca-input" type="text" placeholder="Ej: Examen Final de Matemáticas"
                value={titulo} onChange={e => setTitulo(e.target.value)} />
            </div>

            <div className="ca-campo">
              <label className="ca-label">Descripción</label>
              <textarea className="ca-textarea" placeholder="Describe los detalles..."
                value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} />
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
                <label className="ca-label">Horas estimadas</label>
                <input className="ca-input" type="number" min="0" step="1" placeholder="00 h"
                  value={horasEstimadas} onChange={e => setHorasEstimadas(e.target.value)} />
              </div>
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