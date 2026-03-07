import React, { useEffect, useState } from "react";
import "./ActivityDetail.css";

const API_BASE =
  process.env.REACT_APP_API_URL || "https://miniproyecto-1-zfn4.onrender.com";

function ActivityDetail({ actividad, onClose }) {
  const [subtasks, setSubtasks] = useState([]);
  const [nuevaSubtask, setNuevaSubtask] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarSubtasks();
  }, [actividad]);

  const cargarSubtasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/subtasks/`);
      const data = await res.json();

      const filtradas = data.filter((s) => s.activity === actividad.id);
      setSubtasks(filtradas);
      setLoading(false);
    } catch (err) {
      console.error("Error cargando subtasks:", err);
      setLoading(false);
    }
  };

  const crearSubtask = async () => {
    if (!nuevaSubtask.trim()) return;

    const nueva = {
      title: nuevaSubtask,
      activity: actividad.id,
      is_completed: false,
    };

    try {
      const res = await fetch(`${API_BASE}/api/subtasks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nueva),
      });

      if (res.status === 201) {
        setNuevaSubtask("");
        cargarSubtasks();
      }
    } catch (err) {
      console.error("Error creando subtask:", err);
    }
  };

  const toggleSubtask = async (subtask) => {
    try {
      await fetch(`${API_BASE}/api/subtasks/${subtask.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_completed: !subtask.is_completed,
        }),
      });

      cargarSubtasks();
    } catch (err) {
      console.error("Error actualizando subtask:", err);
    }
  };

  return (
    <div className="ad-overlay">
      <div className="ad-modal">
        <div className="ad-header">
          <div>
            <h2 className="ad-title">{actividad.title}</h2>
            <p className="ad-desc">{actividad.description}</p>
          </div>

          <button className="ad-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="ad-info">
          <span>
            📅 Inicio:{" "}
            {new Date(actividad.start_date + "T00:00:00").toLocaleDateString(
              "es-ES"
            )}
          </span>

          <span>
            ⏰ Entrega:{" "}
            {new Date(actividad.due_date + "T00:00:00").toLocaleDateString(
              "es-ES"
            )}
          </span>
        </div>

        <div className="ad-subtasks">
          <h3>Subtareas</h3>

          <div className="ad-crear">
            <input
              type="text"
              placeholder="Nueva subtarea..."
              value={nuevaSubtask}
              onChange={(e) => setNuevaSubtask(e.target.value)}
              className="ad-input"
            />

            <button className="ad-btn-add" onClick={crearSubtask}>
              +
            </button>
          </div>

          {loading ? (
            <p className="ad-loading">Cargando subtareas...</p>
          ) : subtasks.length === 0 ? (
            <p className="ad-vacio">No hay subtareas aún</p>
          ) : (
            <ul className="ad-lista">
              {subtasks.map((s) => (
                <li
                  key={s.id}
                  className={
                    s.is_completed ? "ad-subtask completada" : "ad-subtask"
                  }
                  onClick={() => toggleSubtask(s)}
                >
                  <span className="ad-check">
                    {s.is_completed ? "✅" : "⬜"}
                  </span>

                  <span className="ad-nombre">{s.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActivityDetail;