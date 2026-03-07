import React, { useEffect, useState } from "react";
import "./ActivityDetail.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://miniproyecto-1-zfn4.onrender.com";

function ActivityDetail({ actividad, onClose }) {

  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [mostrarInput, setMostrarInput] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");

  // ================= CARGAR SUBTAREAS =================
  const cargarSubtasks = () => {

    if (!actividad) return;

    setLoading(true);

    fetch(`${API_BASE}/api/subtasks/?activity=${actividad.id}`)
      .then(res => res.json())
      .then(data => {
        setSubtasks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

  };

  useEffect(() => {
    cargarSubtasks();
  }, [actividad]);



  // ================= CREAR SUBTAREA =================
  const crearSubtask = async () => {

    if (!nuevoTitulo.trim()) return;

    const nueva = {
      title: nuevoTitulo,
      activity: actividad.id
    };

    try {

      const res = await fetch(`${API_BASE}/api/subtasks/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(nueva)
      });

      if (res.status === 201) {

        setNuevoTitulo("");
        setMostrarInput(false);

        cargarSubtasks(); // refrescar lista

      }

    } catch (err) {
      console.error(err);
    }

  };



  // ================= MARCAR COMPLETADA =================
  const toggleSubtask = async (st) => {

    try {

      await fetch(`${API_BASE}/api/subtasks/${st.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          is_completed: !st.is_completed
        })
      });

      cargarSubtasks();

    } catch (err) {
      console.error(err);
    }

  };



  return (

    <div className="detail-overlay">

      <div className="detail-modal">

        <div className="detail-header">

          <h2>{actividad.title}</h2>

          <button onClick={onClose}>
            ✕
          </button>

        </div>


        {actividad.description && (
          <p className="detail-description">
            {actividad.description}
          </p>
        )}


        <div className="detail-info">

          <span>
            📅 Entrega: {actividad.due_date}
          </span>

          {actividad.start_date && (
            <span>
              Inicio: {actividad.start_date}
            </span>
          )}

        </div>



        <h3>Subtareas</h3>


        {loading ? (

          <p>Cargando subtareas...</p>

        ) : subtasks.length === 0 ? (

          <p>No hay subtareas</p>

        ) : (

          <ul className="detail-list">

            {subtasks.map(st => (

              <li
                key={st.id}
                className={`detail-item ${st.is_completed ? "done" : ""}`}
                onClick={() => toggleSubtask(st)}
              >

                <span className="check">
                  {st.is_completed ? "✅" : "⬜"}
                </span>

                <span>
                  {st.title}
                </span>

              </li>

            ))}

          </ul>

        )}



        {/* ================= AÑADIR SUBTAREA ================= */}

        {!mostrarInput && (

          <button
            className="btn-add-subtask"
            onClick={() => setMostrarInput(true)}
          >
            + Añadir subtarea
          </button>

        )}


        {mostrarInput && (

          <div className="subtask-input">

            <input
              type="text"
              placeholder="Ej: estudiar derivadas"
              value={nuevoTitulo}
              onChange={(e) => setNuevoTitulo(e.target.value)}
            />

            <button onClick={crearSubtask}>
              Guardar
            </button>

          </div>

        )}

      </div>

    </div>

  );
}

export default ActivityDetail;