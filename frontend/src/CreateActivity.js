import React, { useState, useEffect } from 'react';
import './CreateActivity.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

function CreateActivity({ onClose, onActivityCreated, activityToEdit, defaultDate }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [asignatura, setAsignatura] = useState('');
  const [tipo, setTipo] = useState('');
  const [prioridad, setPrioridad] = useState('');
  const [fechaActividad, setFechaActividad] = useState('');
  const [horasEstimadas, setHorasEstimadas] = useState('');
  
  const [subtareaInput, setSubtareaInput] = useState('');
  const [subtareasList, setSubtareasList] = useState([]);
  const [editandoId, setEditandoId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [topError, setTopError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (activityToEdit) {
      setTitulo(activityToEdit.title || '');
      setDescripcion(activityToEdit.description || '');
      setAsignatura(activityToEdit.asignatura || '');
      setTipo(activityToEdit.activity_type || '');
      setPrioridad(activityToEdit.difficulty || '');
      setFechaActividad(activityToEdit.start_date || '');
      setHorasEstimadas(activityToEdit.horas_estimadas ? `${activityToEdit.horas_estimadas}h` : '00 h');
      if (activityToEdit.subtasks) setSubtareasList(activityToEdit.subtasks);
    } else if (defaultDate) {
      // Magia: Asigna la fecha automáticamente según el botón que presionaste
      setFechaActividad(defaultDate);
    }
  }, [activityToEdit, defaultDate]);

  const agregarSubtarea = () => {
    if (subtareaInput.trim() === '') return;
    if (editandoId) {
      setSubtareasList(subtareasList.map(st => st.id === editandoId ? { ...st, title: subtareaInput } : st));
      setEditandoId(null);
    } else {
      setSubtareasList([...subtareasList, { id: `temp-${Date.now()}`, title: subtareaInput }]);
    }
    setSubtareaInput('');
  };

  const editarSubtarea = (st) => {
    setSubtareaInput(st.title);
    setEditandoId(st.id);
  };

  const eliminarSubtarea = (id) => {
    setSubtareasList(subtareasList.filter(st => st.id !== id));
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setTopError('');
    setFieldErrors({});
    let errores = {};

    // ================= VALIDACIONES CLARAS Y AMIGABLES =================
    if (!titulo.trim()) errores.titulo = 'Ingresa un título.';
    else if (titulo.length < 3) errores.titulo = 'Mínimo 3 caracteres.';

    if (!descripcion.trim()) errores.descripcion = 'Agrega una descripción.';
    else if (descripcion.length < 3) errores.descripcion = 'Mínimo 3 caracteres.';

    if (!asignatura.trim()) errores.asignatura = 'Falta la asignatura.';
    if (!tipo) errores.tipo = 'Selecciona el tipo.';
    if (!prioridad) errores.prioridad = 'Selecciona una prioridad.';
    if (!fechaActividad) errores.fechaActividad = 'Indica la fecha.';
    if (!horasEstimadas) errores.horasEstimadas = 'Indica el tiempo.';

    // Validar mínimo 1 subtarea
    if (subtareasList.length === 0) {
        setTopError('¡Casi listo! Pero necesitas agregar al menos una subtarea en el botón azul para poder guardar.');
        return;
    }

    if (Object.keys(errores).length > 0) {
      setFieldErrors(errores);
      setTopError('Faltan algunos datos importantes. Revisa los campos marcados en rojo.');
      return;
    }

    setLoading(true);

    let horasNumero = parseFloat(horasEstimadas.replace('h', '').replace('+', '')) || 0;

    const payloadActividad = {
      title: titulo,
      description: descripcion,
      activity_type: tipo,
      difficulty: prioridad, 
      start_date: fechaActividad,
      due_date: fechaActividad,
      horas_estimadas: horasNumero
    };

    try {
      const token = localStorage.getItem('token'); 
      const url = activityToEdit ? `${API_BASE}/api/activities/${activityToEdit.id}/` : `${API_BASE}/api/activities/`;
      const metodo = activityToEdit ? 'PATCH' : 'POST';

      // PASO 1: Guardar la Actividad
      const respuestaActividad = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payloadActividad),
      });

      if (respuestaActividad.ok || respuestaActividad.status === 201) {
        const dataActividad = await respuestaActividad.json();
        
        // PASO 2: Guardar las Subtareas
        const nuevasSubtareas = subtareasList.filter(st => typeof st.id === 'string' && st.id.startsWith('temp-'));
        for (let i = 0; i < nuevasSubtareas.length; i++) {
          await fetch(API_BASE + '/api/subtasks/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ title: nuevasSubtareas[i].title, activity: dataActividad.id || activityToEdit.id })
          });
        }

        setLoading(false);
        if (onActivityCreated) onActivityCreated(activityToEdit ? 'edit' : 'create');
        if (onClose) onClose();

      } else {
        const errorData = await respuestaActividad.json();
        // Le explicamos al usuario si el servidor rechazó la fecha
        if (errorData.start_date || errorData.due_date || errorData.data?.due_date) {
            setTopError("El sistema no permite crear actividades con fechas pasadas. Por favor, selecciona la fecha de hoy o una fecha futura.");
        } else {
             setTopError("Ocurrió un problema al guardar la actividad en el servidor.");
        }
        setLoading(false);
      }
    } catch (err) {
      setTopError('Problema de conexión. Revisa tu internet e inténtalo de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="ca-overlay">
      <div className="ca-modal">
        <div className="ca-header">
          <h2>{activityToEdit ? 'Editar Actividad' : 'Nueva Actividad'}</h2>
          <button className="ca-cerrar" onClick={onClose}>X</button>
        </div>

        {topError && <div className="ca-top-error"><span>⚠️</span> {topError}</div>}

        <form onSubmit={manejarEnvio}>
          <div className="ca-form-group">
            <label className="ca-label">Título *</label>
            <input className={`ca-input ${fieldErrors.titulo ? 'input-error' : ''}`} type="text" placeholder="Ej: Investigar sobre el medio ambiente" value={titulo} onChange={(e) => setTitulo(e.target.value)}/>
            {fieldErrors.titulo && <div className="ca-error-box"><span>⚠️</span> {fieldErrors.titulo}</div>}
          </div>

          <div className="ca-form-group">
            <label className="ca-label">Descripción *</label>
            <textarea className={`ca-textarea ${fieldErrors.descripcion ? 'input-error' : ''}`} placeholder="Describe la actividad o notas importantes..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows="2"/>
            {fieldErrors.descripcion && <div className="ca-error-box"><span>⚠️</span> {fieldErrors.descripcion}</div>}
          </div>

          <div className="ca-form-group">
            <label className="ca-label">Asignatura *</label>
            <input className={`ca-input ${fieldErrors.asignatura ? 'input-error' : ''}`} type="text" placeholder="Ej: Impactos Ambientales" value={asignatura} onChange={(e) => setAsignatura(e.target.value)}/>
            {fieldErrors.asignatura && <div className="ca-error-box"><span>⚠️</span> {fieldErrors.asignatura}</div>}
          </div>

          <div style={{display: 'flex', gap: '15px'}}>
            <div className="ca-form-group" style={{flex: 1}}>
              <label className="ca-label">Tipo *</label>
              <select className={`ca-select ${fieldErrors.tipo ? 'input-error' : ''}`} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="">Selecciona</option>
                <option value="homework">Tarea</option>
                <option value="exam">Examen</option>
                <option value="presentation">Presentación</option>
                <option value="project">Proyecto</option>
              </select>
               {fieldErrors.tipo && <div className="ca-error-box"><span>⚠️</span> {fieldErrors.tipo}</div>}
            </div>
            <div className="ca-form-group" style={{flex: 1}}>
              <label className="ca-label">Prioridad *</label>
              <select className={`ca-select ${fieldErrors.prioridad ? 'input-error' : ''}`} value={prioridad} onChange={(e) => setPrioridad(e.target.value)} translate="no">
                <option value="">Selecciona</option>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
               {fieldErrors.prioridad && <div className="ca-error-box"><span>⚠️</span> {fieldErrors.prioridad}</div>}
            </div>
          </div>

          <div style={{display: 'flex', gap: '15px'}}>
            <div className="ca-form-group" style={{flex: 1}}>
              <label className="ca-label">Fecha de actividad *</label>
              <input className={`ca-input ${fieldErrors.fechaActividad ? 'input-error' : ''}`} type="date" value={fechaActividad} onChange={(e) => setFechaActividad(e.target.value)}/>
              {fieldErrors.fechaActividad && <div className="ca-error-box"><span>⚠️</span> {fieldErrors.fechaActividad}</div>}
            </div>
            <div className="ca-form-group" style={{flex: 1}}>
              <label className="ca-label">Horas estimadas *</label>
              <select className={`ca-select ${fieldErrors.horasEstimadas ? 'input-error' : ''}`} value={horasEstimadas} onChange={(e) => setHorasEstimadas(e.target.value)}>
                <option value="">00 h</option>
                <option value="1h">1 h</option>
                <option value="2h">2 h</option>
                <option value="3h">3 h</option>
                <option value="4h">4 h</option>
                <option value="5h+">5+ h</option>
              </select>
               {fieldErrors.horasEstimadas && <div className="ca-error-box"><span>⚠️</span> {fieldErrors.horasEstimadas}</div>}
            </div>
          </div>

          <div className="ca-form-group" style={{marginTop: '20px'}}>
            <label className="ca-label" style={{fontSize: '16px', fontWeight: 'bold'}}>Subtareas *</label>
            <div className="st-list-container">
              {subtareasList.map((st) => (
                <div key={st.id} className="st-list-item">
                  <div className="st-item-izq"><div className="st-fake-check"></div><span>{st.title}</span></div>
                  <div className="st-item-der">
                    <button type="button" className="st-btn-editar" onClick={() => editarSubtarea(st)}>Editar</button>
                    <button type="button" className="st-btn-eliminar" onClick={() => eliminarSubtarea(st.id)}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="st-input-container">
              <div style={{position: 'relative', flex: 1}}>
                <span style={{position:'absolute', left:'12px', top:'12px', color:'#9ca3af', fontSize: '18px'}}>⊕</span>
                <input className="ca-input" style={{paddingLeft: '35px'}} type="text" placeholder="Ej: repasar ciclo del agua" value={subtareaInput} onChange={(e) => setSubtareaInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarSubtarea(); } }}/>
              </div>
              <button type="button" className="btn-add-st-blue" onClick={agregarSubtarea}>{editandoId ? 'Guardar' : '+ Añadir subtarea'}</button>
            </div>
          </div>

          <div className="ca-botones" style={{marginTop: '30px', borderTop: '1px solid #e5e7eb', paddingTop: '20px'}}>
            <button type="button" className="ca-btn-cancelar" onClick={onClose}>Cancelar</button>
            <button type="submit" className="ca-btn-guardar" disabled={loading}>
              {loading ? 'Guardando...' : (activityToEdit ? 'Guardar cambios' : 'Crear actividad')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateActivity;