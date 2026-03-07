import React, { useState } from "react";
import "./AddSubtask.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://miniproyecto-1-zfn4.onrender.com";

function AddSubtask({ actividades, onClose, onCreated }) {

  const [actividadId, setActividadId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [loading, setLoading] = useState(false);

  const guardarSubtarea = async () => {

    if (!actividadId || !titulo) return;

    setLoading(true);

    const nueva = {
      title: titulo,
      activity: actividadId
    };

    try {

      const res = await fetch(API_BASE + "/api/subtasks/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nueva)
      });

      if (res.status === 201) {
        onCreated();
        onClose();
      }

    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (

    <div className="sub-overlay">

      <div className="sub-modal">

        <div className="sub-header">
          <h2>Nueva Subtarea</h2>
          <button onClick={onClose}>X</button>
        </div>

        <div className="sub-form">

          <label>Actividad</label>

          <select
            value={actividadId}
            onChange={(e) => setActividadId(e.target.value)}
          >
            <option value="">Selecciona actividad</option>

            {actividades.map(a => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}

          </select>

          <label>Subtarea</label>

          <input
            type="text"
            placeholder="Ej: estudiar derivadas"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <button
            className="btn-guardar-sub"
            onClick={guardarSubtarea}
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>

        </div>

      </div>

    </div>

  );
}

export default AddSubtask;