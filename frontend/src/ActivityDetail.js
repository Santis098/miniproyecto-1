import React, { useEffect, useState } from "react";
import "./ActivityDetail.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://miniproyecto-1-zfn4.onrender.com";

function ActivityDetail({ actividad, onClose }) {

  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

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

  }, [actividad]);

  return (

    <div className="detail-overlay">

      <div className="detail-modal">

        <div className="detail-header">

          <h2>{actividad.title}</h2>

          <button onClick={onClose}>
            X
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

              <li key={st.id} className="detail-item">

                <span>
                  {st.is_completed ? "✅" : "⬜"}
                </span>

                <span>
                  {st.title}
                </span>

              </li>

            ))}

          </ul>

        )}

      </div>

    </div>

  );
}

export default ActivityDetail;