import React, { useEffect, useState } from "react";
import "./ActivityDetail.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://miniproyecto-1-x936.onrender.com";

function ActivityDetail({ actividad, onClose, onActualizado }) {
  const [subtasks, setSubtasks]                   = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [mostrarInput, setMostrarInput]           = useState(false);
  const [nuevoTitulo, setNuevoTitulo]             = useState("");
  const [errorNuevo, setErrorNuevo]               = useState("");
  const [editandoId, setEditandoId]               = useState(null);
  const [editandoTitulo, setEditandoTitulo]       = useState("");
  const [errorEdicion, setErrorEdicion]           = useState("");
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [horasTrabajadas, setHorasTrabajadas]     = useState(actividad?.horas_trabajadas || 0);
  const [editandoHoras, setEditandoHoras]         = useState(false);
  const [horasInput, setHorasInput]               = useState(String(actividad?.horas_trabajadas || 0));

  const token = localStorage.getItem("token");

  const [loadingToggle, setLoadingToggle]     = useState(null);
  const [loadingEliminar, setLoadingEliminar] = useState(null);
  const [loadingGuardar, setLoadingGuardar]   = useState(false);
  const [loadingEditar, setLoadingEditar]     = useState(null);

  const formatFecha = (f) => {
    if (!f) return "—";
    const [y, m, d] = f.split("-");
    return `${d}/${m}/${y}`;
  };

  const cargarSubtasks = () => {
    if (!actividad) return;
    setLoading(true);
    fetch(`${API_BASE}/api/subtasks/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(json => {
        const lista = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        setSubtasks(lista.filter(st => st.activity === actividad.id));
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { cargarSubtasks(); }, [actividad]);

  if (!actividad) return null;

  // ===== GUARDAR HORAS TRABAJADAS =====
  const guardarHoras = async () => {
    const val = parseFloat(horasInput);
    if (isNaN(val) || val < 0) return;
    setLoadingGuardar(true);
    try {
      await fetch(`${API_BASE}/api/activities/${actividad.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ horas_trabajadas: val })
      });
      setHorasTrabajadas(val);
      setEditandoHoras(false);
      if (onActualizado) onActualizado();
    } catch (err) { console.error(err); }
    setLoadingGuardar(false);
  };

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
    const progrSubs = subtasks.length > 0
      ? Math.round((subtasks.filter(s => s.is_completed).length / subtasks.length) * 100)
      : 0;
    const progrHoras = actividad.horas_estimadas > 0
      ? Math.min(100, Math.round((horasTrabajadas / actividad.horas_estimadas) * 100))
      : 0;
    // Si hay horas trabajadas, combina ambos. Si no, usa solo subtareas.
    if (horasTrabajadas > 0 && subtasks.length > 0) return Math.round((progrHoras + progrSubs) / 2);
    if (horasTrabajadas > 0) return progrHoras;
    if (subtasks.length > 0) return progrSubs;
    return 0;
  };

  const getProgresoSubtareas = () => {
    if (subtasks.length === 0) return { completadas: 0, total: 0 };
    const completadas = subtasks.filter(s => s.is_completed).length;
    return { completadas, total: subtasks.length };
  };

  const progreso = getProgreso();
  const progrSub = getProgresoSubtareas();

  // ===== SUBTAREAS =====
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
      if (res.status === 201) {
        setNuevoTitulo(""); setMostrarInput(false); cargarSubtasks();
      } else {
        const err = await res.json();
        setErrorNuevo(err?.data?.title?.[0] || "Error al crear la subtarea.");
      }
    } catch (err) { console.error(err); }
  };

  const toggleSubtask = async (st) => {
    setLoadingToggle(st.id);
    try {
      await fetch(`${API_BASE}/api/subtasks/${st.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_completed: !st.is_completed })
      });
      cargarSubtasks();
    } catch (err) { console.error(err); }
    setLoadingToggle(null);
  };

  const confirmarYEliminar = async () => {
    if (!confirmarEliminar) return;
    setLoadingEliminar(confirmarEliminar.id);
    try {
      await fetch(`${API_BASE}/api/subtasks/${confirmarEliminar.id}/`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` }
      });
      setConfirmarEliminar(null); cargarSubtasks();
    } catch (err) { console.error(err); }
    setLoadingEliminar(null);
  };

  const iniciarEdicion = (st) => { setEditandoId(st.id); setEditandoTitulo(st.title); setErrorEdicion(""); };
  const cancelarEdicion = () => { setEditandoId(null); setEditandoTitulo(""); setErrorEdicion(""); };

  const guardarEdicion = async (id) => {
    if (!editandoTitulo.trim()) { setErrorEdicion("Debe ingresar un titulo."); return; }
    if (editandoTitulo.trim().length < 3) { setErrorEdicion("Mínimo 3 caracteres."); return; }
    setErrorEdicion(""); setLoadingEditar(id);
    try {
      await fetch(`${API_BASE}/api/subtasks/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editandoTitulo })
      });
      setEditandoId(null); setEditandoTitulo(""); cargarSubtasks();
    } catch (err) { console.error(err); }
    setLoadingEditar(null);
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

          {/* GRID INFO */}
          <div className="detail-info-grid">
            <div className="detail-info-item">
              <span className="detail-info-label">Entrega:</span>
              <span className="detail-info-value">{formatFecha(actividad.due_date)}</span>
            </div>
            {actividad.asignatura && (
              <div className="detail-info-item">
                <span className="detail-info-label">Asignatura:</span>
                <span className="detail-info-value">{actividad.asignatura}</span>
              </div>
            )}
            <div className="detail-info-item">
              <span className="detail-info-label">Horas:</span>
              <span className="detail-info-value">{horasTrabajadas}h / {actividad.horas_estimadas || 0}h</span>
            </div>
            {actividad.difficulty && (
              <div className="detail-info-item">
                <span className="detail-info-label">Dificultad:</span>
                <span className="detail-info-value" style={{textTransform:"capitalize"}}>{actividad.difficulty}</span>
              </div>
            )}
          </div>

          {/* BARRA PROGRESO */}
          <div className="detail-progreso-section">
            <div className="detail-progreso-header">
              <span>Progreso General</span>
              <span className={`detail-progreso-pct ${progreso < 50 ? "pct-rojo" : "pct-verde"}`}>{progreso}%</span>
            </div>
            <div className="detail-progreso-bar-bg">
              <div className="detail-progreso-bar-fill" style={{ width: `${progreso}%` }} />
            </div>
          </div>

          {/* TIEMPO — editable */}
          <div className="detail-tiempo-grid">
            <div className="detail-tiempo-item">
              <span className="detail-tiempo-icon">🕐</span>
              <div>
                <div className="detail-tiempo-label">Tiempo Invertido</div>
                {editandoHoras ? (
                  <div className="horas-edit-row">
                    <input
                      className="horas-input"
                      type="number" min="0" step="0.5"
                      value={horasInput}
                      onChange={e => setHorasInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") guardarHoras(); if (e.key === "Escape") setEditandoHoras(false); }}
                      autoFocus
                    />
                    <button className="horas-btn-ok" onClick={guardarHoras} disabled={loadingGuardar}>
                      {loadingGuardar ? '...' : '✓'}
                    </button>
                    <button className="horas-btn-cancel" onClick={() => setEditandoHoras(false)}>✕</button>
                  </div>
                ) : (
                  <div className="detail-tiempo-valor-row">
                    <span className="detail-tiempo-valor">{horasTrabajadas}h</span>
                    <button className="horas-editar-btn" onClick={() => { setHorasInput(String(horasTrabajadas)); setEditandoHoras(true); }} title="Editar horas">✏️</button>
                  </div>
                )}
              </div>
            </div>
            <div className="detail-tiempo-item">
              <div>
                <div className="detail-tiempo-label">Tiempo Estimado</div>
                <div className="detail-tiempo-valor">{actividad.horas_estimadas || 0}h</div>
              </div>
            </div>
          </div>

          {/* SUBTAREAS */}
          <div className="detail-subtareas-header">
            <span className="detail-subtareas-titulo">Tareas ({progrSub.completadas}/{progrSub.total})</span>
            {!mostrarInput && (
              <button className="btn-agregar-sub" onClick={() => setMostrarInput(true)}>+ Agregar</button>
            )}
          </div>

          {loading ? (
            <p className="detail-loading">Cargando subtareas...</p>
          ) : subtasks.length === 0 ? (
            <p className="detail-empty-sub">No hay subtareas aún.</p>
          ) : (
            <ul className="detail-list">
              {subtasks.map(st => (
                <li key={st.id} className={`detail-item ${st.is_completed ? "done" : ""}`}>
                  <input type="checkbox" className="detail-checkbox"
                    checked={st.is_completed}
                    onChange={() => toggleSubtask(st)}
                    disabled={loadingToggle === st.id}
                    style={{opacity: loadingToggle === st.id ? 0.4 : 1}}
                  />
                  {editandoId === st.id ? (
                    <div className="edit-col">
                      <div className="edit-row">
                        <input className="edit-input" value={editandoTitulo}
                          onChange={e => { setEditandoTitulo(e.target.value); setErrorEdicion(""); }}
                          onKeyDown={e => { if (e.key === "Enter") guardarEdicion(st.id); if (e.key === "Escape") cancelarEdicion(); }}
                          autoFocus />
                        <button className="btn-guardar-edit" onClick={() => guardarEdicion(st.id)} disabled={loadingEditar === st.id}>
                          {loadingEditar === st.id ? '...' : 'Guardar'}
                        </button>
                        <button className="btn-cancelar-edit" onClick={cancelarEdicion}>Cancelar</button>
                      </div>
                      {errorEdicion && <p className="st-error-msg">{errorEdicion}</p>}
                    </div>
                  ) : (
                    <span className={`st-titulo-texto ${st.is_completed ? "tachado" : ""}`}>{st.title}</span>
                  )}
                  {editandoId !== st.id && (
                    <div className="st-acciones">
                      <button className="btn-icon-sub" onClick={() => iniciarEdicion(st)}>✏️</button>
                      <button className="btn-icon-sub btn-icon-del" onClick={() => setConfirmarEliminar(st)}>🗑️</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {mostrarInput && (
            <div className="subtask-add-col">
              <div className="subtask-input">
                <input type="text" placeholder="Ej: estudiar derivadas" value={nuevoTitulo}
                  onChange={e => { setNuevoTitulo(e.target.value); setErrorNuevo(""); }}
                  onKeyDown={e => { if (e.key === "Enter") crearSubtask(); }}
                  autoFocus />
                <button className="btn-guardar-sub" onClick={crearSubtask}>Guardar</button>
                <button className="btn-cancelar-sub" onClick={() => { setMostrarInput(false); setNuevoTitulo(""); setErrorNuevo(""); }}>Cancelar</button>
              </div>
              {errorNuevo && <p className="st-error-msg">{errorNuevo}</p>}
            </div>
          )}

        </div>
      </div>

      {confirmarEliminar && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3>Eliminar subtarea</h3>
            <p>¿Estás seguro que deseas eliminar <strong>{confirmarEliminar.title}</strong>?</p>
            <p className="confirm-aviso">Esta acción no se puede deshacer.</p>
            <div className="confirm-botones">
              <button className="confirm-btn-cancelar" onClick={() => setConfirmarEliminar(null)}>Cancelar</button>
              <button className="confirm-btn-eliminar" onClick={confirmarYEliminar} disabled={!!loadingEliminar}>
                {loadingEliminar ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ActivityDetail;