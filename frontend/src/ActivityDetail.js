import React, { useEffect, useState } from "react";
import "./ActivityDetail.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://miniproyecto-1-zfn4.onrender.com";

function ActivityDetail({ actividad, onClose }) {
  const [subtasks, setSubtasks]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [mostrarInput, setMostrarInput]   = useState(false);
  const [nuevoTitulo, setNuevoTitulo]     = useState("");
  const [editandoId, setEditandoId]       = useState(null);
  const [editandoTitulo, setEditandoTitulo] = useState("");
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);

  const cargarSubtasks = () => {
    if (!actividad) return;
    setLoading(true);
    fetch(`${API_BASE}/api/subtasks/`)
      .then(res => res.json())
      .then(data => {
        setSubtasks(data.filter(st => st.activity === actividad.id));
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { cargarSubtasks(); }, [actividad]);

  const crearSubtask = async () => {
    if (!nuevoTitulo.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/subtasks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nuevoTitulo, activity: actividad.id })
      });
      if (res.status === 201) { setNuevoTitulo(""); setMostrarInput(false); cargarSubtasks(); }
    } catch (err) { console.error(err); }
  };

  const toggleSubtask = async (st) => {
    try {
      await fetch(`${API_BASE}/api/subtasks/${st.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_completed: !st.is_completed })
      });
      cargarSubtasks();
    } catch (err) { console.error(err); }
  };

  const confirmarYEliminar = async () => {
    if (!confirmarEliminar) return;
    try {
      await fetch(`${API_BASE}/api/subtasks/${confirmarEliminar.id}/`, { method: "DELETE" });
      setConfirmarEliminar(null);
      cargarSubtasks();
    } catch (err) { console.error(err); }
  };

  const iniciarEdicion = (st) => { setEditandoId(st.id); setEditandoTitulo(st.title); };
  const cancelarEdicion = () => { setEditandoId(null); setEditandoTitulo(""); };

  const guardarEdicion = async (id) => {
    if (!editandoTitulo.trim()) return;
    try {
      await fetch(`${API_BASE}/api/subtasks/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editandoTitulo })
      });
      setEditandoId(null);
      setEditandoTitulo("");
      cargarSubtasks();
    } catch (err) { console.error(err); }
  };

  return (
    <>
      <div className="detail-overlay">
        <div className="detail-modal">
          <div className="detail-header">
            <h2>{actividad.title}</h2>
            <button onClick={onClose}>X</button>
          </div>

          {actividad.description && <p className="detail-description">{actividad.description}</p>}

          <div className="detail-info">
            <span>Entrega: {actividad.due_date}</span>
            {actividad.start_date && <span>Inicio: {actividad.start_date}</span>}
          </div>

          <h3>Subtareas</h3>

          {loading ? (
            <p>Cargando subtareas...</p>
          ) : subtasks.length === 0 ? (
            <p>No hay subtareas</p>
          ) : (
            <ul className="detail-list">
              {subtasks.map(st => (
                <li key={st.id} className={"detail-item " + (st.is_completed ? "done" : "")}>
                  <span className="check" onClick={() => toggleSubtask(st)} title={st.is_completed ? "Marcar pendiente" : "Marcar completada"}>
                    {st.is_completed ? "☑" : "☐"}
                  </span>

                  {editandoId === st.id ? (
                    <div className="edit-row">
                      <input
                        className="edit-input"
                        value={editandoTitulo}
                        onChange={e => setEditandoTitulo(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") guardarEdicion(st.id); if (e.key === "Escape") cancelarEdicion(); }}
                        autoFocus
                      />
                      <button className="btn-guardar-edit" onClick={() => guardarEdicion(st.id)}>Guardar</button>
                      <button className="btn-cancelar-edit" onClick={cancelarEdicion}>Cancelar</button>
                    </div>
                  ) : (
                    <span className="st-titulo-texto">{st.title}</span>
                  )}

                  {editandoId !== st.id && (
                    <div className="st-acciones">
                      <button className="btn-editar" onClick={() => iniciarEdicion(st)}>Editar</button>
                      <button className="btn-eliminar" onClick={() => setConfirmarEliminar(st)}>Eliminar</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {!mostrarInput && (
            <button className="btn-add-subtask" onClick={() => setMostrarInput(true)}>+ Anadir subtarea</button>
          )}

          {mostrarInput && (
            <div className="subtask-input">
              <input
                type="text"
                placeholder="Ej: estudiar derivadas"
                value={nuevoTitulo}
                onChange={e => setNuevoTitulo(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") crearSubtask(); }}
                autoFocus
              />
              <button onClick={crearSubtask}>Guardar</button>
              <button onClick={() => { setMostrarInput(false); setNuevoTitulo(""); }}>Cancelar</button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CONFIRMAR ELIMINAR SUBTAREA — fuera del detail-overlay para que se vea encima */}
      {confirmarEliminar && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3>Eliminar subtarea</h3>
            <p>Estas seguro que deseas eliminar <strong>{confirmarEliminar.title}</strong>?</p>
            <p className="confirm-aviso">Esta accion no se puede deshacer.</p>
            <div className="confirm-botones">
              <button className="confirm-btn-cancelar" onClick={() => setConfirmarEliminar(null)}>Cancelar</button>
              <button className="confirm-btn-eliminar" onClick={confirmarYEliminar}>Si, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ActivityDetail;