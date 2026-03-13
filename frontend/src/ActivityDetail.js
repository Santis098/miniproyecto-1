import React, { useEffect, useState } from "react";
import "./ActivityDetail.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://miniproyecto-1-x936.onrender.com";

function ActivityDetail({ actividad, onClose }) {
  const [subtasks, setSubtasks]                   = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [mostrarInput, setMostrarInput]           = useState(false);
  const [nuevoTitulo, setNuevoTitulo]             = useState("");
  const [errorNuevo, setErrorNuevo]               = useState("");
  const [editandoId, setEditandoId]               = useState(null);
  const [editandoTitulo, setEditandoTitulo]       = useState("");
  const [errorEdicion, setErrorEdicion]           = useState("");
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);

  const token = localStorage.getItem("token");

  const cargarSubtasks = () => {
    if (!actividad) return;
    setLoading(true);
    fetch(`${API_BASE}/api/subtasks/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const lista = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setSubtasks(lista.filter(st => st.activity === actividad.id));
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { cargarSubtasks(); }, [actividad]);

  const getTipoBadge = (type) => {
    const map = { exam: "Examen", project: "Proyecto", presentation: "Presentación", homework: "Tarea" };
    return map[type?.toLowerCase()] || type || "—";
  };

  const getDificultadLabel = (d) => {
    const map = { baja: "Prioridad Baja", media: "Prioridad Media", alta: "Prioridad Alta", critica: "Prioridad Crítica" };
    return map[d?.toLowerCase()] || d || "—";
  };

  const getDificultadClass = (d) => {
    const map = { baja: "badge-baja", media: "badge-media", alta: "badge-alta", critica: "badge-critica" };
    return map[d?.toLowerCase()] || "badge-media";
  };

  const getProgreso = () => {
    if (!actividad.horas_estimadas || actividad.horas_estimadas === 0) return 0;
    return Math.min(100, Math.round((actividad.horas_trabajadas / actividad.horas_estimadas) * 100));
  };

  const getProgresoSubtareas = () => {
    if (subtasks.length === 0) return { completadas: 0, total: 0 };
    const completadas = subtasks.filter(s => s.is_completed).length;
    return { completadas, total: subtasks.length };
  };

  const progreso = getProgreso();
  const progrSub = getProgresoSubtareas();

  const crearSubtask = async () => {
    if (!nuevoTitulo.trim()) { setErrorNuevo("Debe ingresar un titulo."); return; }
    if (nuevoTitulo.trim().length < 3) { setErrorNuevo("Mínimo 3 caracteres."); return; }
    setErrorNuevo("");
    try {
      const res = await fetch(`${API_BASE}/api/subtasks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: nuevoTitulo, activity: actividad.id })
      });
      if (res.status === 201) { setNuevoTitulo(""); setMostrarInput(false); cargarSubtasks(); }
    } catch (err) { console.error(err); }
  };

  const toggleSubtask = async (st) => {
    try {
      await fetch(`${API_BASE}/api/subtasks/${st.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_completed: !st.is_completed })
      });
      cargarSubtasks();
    } catch (err) { console.error(err); }
  };

  const confirmarYEliminar = async () => {
    if (!confirmarEliminar) return;
    try {
      await fetch(`${API_BASE}/api/subtasks/${confirmarEliminar.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfirmarEliminar(null);
      cargarSubtasks();
    } catch (err) { console.error(err); }
  };

  const iniciarEdicion = (st) => { setEditandoId(st.id); setEditandoTitulo(st.title); setErrorEdicion(""); };
  const cancelarEdicion = () => { setEditandoId(null); setEditandoTitulo(""); setErrorEdicion(""); };

  const guardarEdicion = async (id) => {
    if (!editandoTitulo.trim()) { setErrorEdicion("Debe ingresar un titulo."); return; }
    if (editandoTitulo.trim().length < 3) { setErrorEdicion("Mínimo 3 caracteres."); return; }
    setErrorEdicion("");
    try {
      await fetch(`${API_BASE}/api/subtasks/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editandoTitulo })
      });
      setEditandoId(null); setEditandoTitulo(""); cargarSubtasks();
    } catch (err) { console.error(err); }
  };

  return (
    <>
      <div className="detail-overlay" onClick={onClose}>
        <div className="detail-modal" onClick={e => e.stopPropagation()}>

          {/* HEADER */}
          <div className="detail-header">
            <div className="detail-header-text">
              <h2 className="detail-title">{actividad.title}</h2>
              {actividad.description && <p className="detail-description">{actividad.description}</p>}
            </div>
            <button className="detail-close-btn" onClick={onClose}>✕</button>
          </div>

          {/* BADGES */}
          <div className="detail-badges">
            <span className="badge badge-tipo">{getTipoBadge(actividad.activity_type)}</span>
            <span className="badge badge-estado">En Progreso</span>
            <span className={`badge ${getDificultadClass(actividad.difficulty)}`}>
              {getDificultadLabel(actividad.difficulty)}
            </span>
          </div>

          {/* GRID DE INFO */}
          <div className="detail-info-grid">
            <div className="detail-info-item">
              <span className="detail-info-label">Entrega:</span>
              <span className="detail-info-value">{actividad.due_date}</span>
            </div>
            {actividad.asignatura && (
              <div className="detail-info-item">
                <span className="detail-info-label">Asignatura:</span>
                <span className="detail-info-value">{actividad.asignatura}</span>
              </div>
            )}
            <div className="detail-info-item">
              <span className="detail-info-label">Horas:</span>
              <span className="detail-info-value">{actividad.horas_trabajadas || 0}h / {actividad.horas_estimadas || 0}h</span>
            </div>
            {actividad.difficulty && (
              <div className="detail-info-item">
                <span className="detail-info-label">Dificultad:</span>
                <span className="detail-info-value" style={{textTransform:"capitalize"}}>{actividad.difficulty}</span>
              </div>
            )}
          </div>

          {/* BARRA DE PROGRESO */}
          <div className="detail-progreso-section">
            <div className="detail-progreso-header">
              <span>Progreso General</span>
              <span className={`detail-progreso-pct ${progreso < 50 ? "pct-rojo" : "pct-verde"}`}>{progreso}%</span>
            </div>
            <div className="detail-progreso-bar-bg">
              <div className="detail-progreso-bar-fill" style={{ width: `${progreso}%` }} />
            </div>
          </div>

          {/* TIEMPO */}
          <div className="detail-tiempo-grid">
            <div className="detail-tiempo-item">
              <span className="detail-tiempo-icon">🕐</span>
              <div>
                <div className="detail-tiempo-label">Tiempo Invertido</div>
                <div className="detail-tiempo-valor">{actividad.horas_trabajadas || 0}h</div>
              </div>
            </div>
            <div className="detail-tiempo-item">
              <div>
                <div className="detail-tiempo-label">Tiempo Estimado</div>
                <div className="detail-tiempo-valor">{actividad.horas_estimadas || 0}h</div>
              </div>
            </div>
          </div>

          {/* ENCABEZADO SUBTAREAS */}
          <div className="detail-subtareas-header">
            <span className="detail-subtareas-titulo">
              Tareas ({progrSub.completadas}/{progrSub.total})
            </span>
            {!mostrarInput && (
              <button className="btn-agregar-sub" onClick={() => setMostrarInput(true)}>+ Agregar</button>
            )}
          </div>

          {/* LISTA SUBTAREAS */}
          {loading ? (
            <p className="detail-loading">Cargando subtareas...</p>
          ) : subtasks.length === 0 ? (
            <p className="detail-empty-sub">No hay subtareas aún.</p>
          ) : (
            <ul className="detail-list">
              {subtasks.map(st => (
                <li key={st.id} className={`detail-item ${st.is_completed ? "done" : ""}`}>
                  <input
                    type="checkbox"
                    className="detail-checkbox"
                    checked={st.is_completed}
                    onChange={() => toggleSubtask(st)}
                  />
                  {editandoId === st.id ? (
                    <div className="edit-col">
                      <div className="edit-row">
                        <input
                          className="edit-input"
                          value={editandoTitulo}
                          onChange={e => { setEditandoTitulo(e.target.value); setErrorEdicion(""); }}
                          onKeyDown={e => { if (e.key === "Enter") guardarEdicion(st.id); if (e.key === "Escape") cancelarEdicion(); }}
                          autoFocus
                        />
                        <button className="btn-guardar-edit" onClick={() => guardarEdicion(st.id)}>Guardar</button>
                        <button className="btn-cancelar-edit" onClick={cancelarEdicion}>Cancelar</button>
                      </div>
                      {errorEdicion && <p className="st-error-msg">{errorEdicion}</p>}
                    </div>
                  ) : (
                    <span className={`st-titulo-texto ${st.is_completed ? "tachado" : ""}`}>{st.title}</span>
                  )}
                  {editandoId !== st.id && (
                    <div className="st-acciones">
                      <button className="btn-icon-sub" title="Editar" onClick={() => iniciarEdicion(st)}>✏️</button>
                      <button className="btn-icon-sub btn-icon-del" title="Eliminar" onClick={() => setConfirmarEliminar(st)}>🗑️</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* INPUT NUEVA SUBTAREA */}
          {mostrarInput && (
            <div className="subtask-add-col">
              <div className="subtask-input">
                <input
                  type="text"
                  placeholder="Ej: estudiar derivadas"
                  value={nuevoTitulo}
                  onChange={e => { setNuevoTitulo(e.target.value); setErrorNuevo(""); }}
                  onKeyDown={e => { if (e.key === "Enter") crearSubtask(); }}
                  autoFocus
                />
                <button className="btn-guardar-sub" onClick={crearSubtask}>Guardar</button>
                <button className="btn-cancelar-sub" onClick={() => { setMostrarInput(false); setNuevoTitulo(""); setErrorNuevo(""); }}>Cancelar</button>
              </div>
              {errorNuevo && <p className="st-error-msg">{errorNuevo}</p>}
            </div>
          )}

        </div>
      </div>

      {/* MODAL CONFIRMAR ELIMINAR */}
      {confirmarEliminar && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3>Eliminar subtarea</h3>
            <p>¿Estás seguro que deseas eliminar <strong>{confirmarEliminar.title}</strong>?</p>
            <p className="confirm-aviso">Esta acción no se puede deshacer.</p>
            <div className="confirm-botones">
              <button className="confirm-btn-cancelar" onClick={() => setConfirmarEliminar(null)}>Cancelar</button>
              <button className="confirm-btn-eliminar" onClick={confirmarYEliminar}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ActivityDetail;