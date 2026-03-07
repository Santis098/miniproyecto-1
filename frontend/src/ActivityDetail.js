import React, { useState, useEffect } from 'react';
import SubtaskManager from './SubtaskManager';
import './ActivityDetail.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://miniproyecto-1-zfn4.onrender.com';

const TIPO_CONFIG = {
  exam:         { label: 'Examen',       clase: 'badge-exam' },
  project:      { label: 'Proyecto',     clase: 'badge-project' },
  presentation: { label: 'Presentacion', clase: 'badge-presentation' },
  homework:     { label: 'Tarea',        clase: 'badge-homework' },
};

const DIFICULTAD_CONFIG = {
  baja:    { label: 'Baja',    clase: 'dif-baja' },
  media:   { label: 'Media',   clase: 'dif-media' },
  alta:    { label: 'Alta',    clase: 'dif-alta' },
  critica: { label: 'Critica', clase: 'dif-critica' },
};

function ActivityDetail({ actividad, onClose }) {

  const [subtasks, setSubtasks] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);

  useEffect(() => {

    if (!actividad?.id) {
      setCargando(false);
      return;
    }

    console.log("Actividad recibida:", actividad);

    setCargando(true);
    setErrorCarga(false);

    fetch(`${API_BASE}/api/subtasks/?activity=${actividad.id}`)
      .then(res => {
        console.log("Status respuesta:", res.status);

        if (!res.ok) {
          throw new Error("Error HTTP " + res.status);
        }

        return res.json();
      })
      .then(data => {

        console.log("Subtasks recibidas:", data);

        // seguridad por si el backend no filtra
        const propias = data.filter(st => Number(st.activity) === Number(actividad.id));

        console.log("Subtasks filtradas:", propias);

        setSubtasks(propias);
        setCargando(false);

      })
      .catch(err => {
        console.error("Error cargando subtasks:", err);
        setErrorCarga(true);
        setCargando(false);
      });

  }, [actividad?.id]);

  if (!actividad) return null;

  const tipo = TIPO_CONFIG[actividad.activity_type] || { label: 'Otro', clase: 'badge-project' };
  const dif = actividad.difficulty ? (DIFICULTAD_CONFIG[actividad.difficulty] || null) : null;

  return (
    <div
  className="ad-overlay"
  onClick={(e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }}
>
      <div className="ad-modal" onClick={(e) => e.stopPropagation()}>

        <div className="ad-header">
          <div className="ad-badges">
            <span className={`badge ${tipo.clase}`}>{tipo.label}</span>
            {dif && <span className={`badge-dif ${dif.clase}`}>{dif.label}</span>}
          </div>
          <button className="ad-cerrar" onClick={onClose}>X</button>
        </div>

        <h2 className="ad-titulo">{actividad.title}</h2>

        {actividad.description && (
          <p className="ad-descripcion">{actividad.description}</p>
        )}

        <div className="ad-fechas">

          {actividad.start_date && (
            <div className="ad-fecha-item">
              <span className="ad-fecha-label">Inicio</span>
              <span className="ad-fecha-valor">
                {new Date(actividad.start_date + 'T00:00:00').toLocaleDateString('es-ES', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </span>
            </div>
          )}

          <div className="ad-fecha-item">
            <span className="ad-fecha-label">Vence</span>
            <span className="ad-fecha-valor">
              {new Date(actividad.due_date + 'T00:00:00').toLocaleDateString('es-ES', {
                day: '2-digit', month: 'long', year: 'numeric'
              })}
            </span>
          </div>

        </div>

        {cargando && (
          <p className="ad-cargando">Cargando subtareas...</p>
        )}

        {errorCarga && (
          <p className="ad-cargando">No se pudieron cargar las subtareas.</p>
        )}

        {!cargando && !errorCarga && subtasks.length === 0 && (
          <p className="ad-cargando">Esta actividad aún no tiene subtareas.</p>
        )}

        {!cargando && !errorCarga && subtasks.length > 0 && (
          <SubtaskManager
            activityId={actividad.id}
            subtasks={subtasks}
            onSubtaskAdded={(nueva) =>
              setSubtasks(prev => [...prev, nueva])
            }
          />
        )}

      </div>
    </div>
  );
}

export default ActivityDetail;