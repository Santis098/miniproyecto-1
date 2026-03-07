import React, { useState, useEffect } from "react";
import "./ActivityDetail.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://miniproyecto-1-zfn4.onrender.com";

function ActivityDetail({ actividad, onClose }) {

  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [mostrarInput, setMostrarInput] = useState(false);
  const [nuevaSubtarea, setNuevaSubtarea] = useState("");

  useEffect(() => {
    cargarSubtareas();
  }, [actividad]);

  const cargarSubtareas = async () => {
    try {
      const res = await fetch(API_BASE + "/api/subtasks/");
      const data = await res.json();

      const filtradas = data.filter(
        s => Number(s.activity) === Number(actividad.id)
      );

      setSubtasks(filtradas);
      setLoading(false);

    } catch (err) {
      console.error("Error cargando subtareas", err);
      setLoading(false);
    }
  };

  const agregarSubtarea = async () => {

    if (!nuevaSubtarea.trim()) return;

    const nueva = {
      title: nuevaSubtarea,
      activity: actividad.id
    };

    try {
      const res = await fetch(API_BASE + "/api/subtasks/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(nueva)
      });

      if (res.status === 201) {

        setNuevaSubtarea("");
        setMostrarInput(false);
        cargarSubtareas();

      }

    } catch (err) {
      console.error("Error creando subtarea", err);
    }
  };

  const toggleSubtask = async (subtask) => {

    const actualizado = {
      ...subtask,
      is_completed: !subtask.is_completed
    };

    try {
      await fetch(API_BASE + "/api/subtasks/" + subtask.id + "/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(actualizado)
      });

      cargarSubtareas();

    } catch (err) {
      console.error("Error actualizando subtarea", err);
    }
  };

  return (
    <div className="ad-overlay">

      <div className="ad-modal">

        <div className="ad-header">
          <h2>{actividad.title}</h2>
          <button className="ad-close" onClick={onClose}>X</button>
        </div>

        <p className="ad-description">{actividad.description}</p>

        <div className="ad-subtasks">

          <h3>Subtareas</h3>

          {loading ? (
            <p>Cargando...</p>
          ) : subtasks.length === 0 ? (
            <p className="ad-empty">No hay subtareas aún</p>
          ) : (
            <ul className="ad-list">
              {subtasks.map(s => (
                <li
                  key={s.id}
                  className={`ad-item ${s.is_completed ? "done" : ""}`}
                  onClick={() => toggleSubtask(s)}
                >
                  <span className="check">
                    {s.is_completed ? "✅" : "⬜"}
                  </span>

                  <span className="nombre">
                    {s.title}
                  </span>

                </li>
              ))}
            </ul>
          )}

          {/* BOTON AGREGAR SUBTAREA */}

          {!mostrarInput && (
            <button
              className="btn-add-subtask"
              onClick={() => setMostrarInput(true)}
            >
              + Agregar subtarea
            </button>
          )}

          {mostrarInput && (
            <div className="subtask-input">

              <input
                type="text"
                placeholder="Nueva subtarea..."
                value={nuevaSubtarea}
                onChange={(e) => setNuevaSubtarea(e.target.value)}
              />

              <button onClick={agregarSubtarea}>
                Guardar
              </button>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default ActivityDetail;