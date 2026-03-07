import React, { useState, useEffect } from 'react';
import SubtaskManager from './SubtaskManager';
import './ActivityDetail.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://miniproyecto-1-zfn4.onrender.com';

const TIPO_CONFIG = {
  exam:         { label: 'Examen',       clase: 'badge-exam' },
  project:      { label: 'Proyecto',     clase: 'badge-project' },
  presentation: { label: 'Presentación', clase: 'badge-presentation' },
  homework:     { label: 'Tarea',        clase: 'badge-homework' },
};

const DIFICULTAD_CONFIG = {
  baja:    { label: 'Baja',    clase: 'dif-baja' },
  media:   { label: 'Media',   clase: 'dif-media' },
  alta:    { label: 'Alta',    clase: 'dif-alta' },
  critica: { label: 'Crítica', clase: 'dif-critica' },
};

function ActivityDetail({ actividad, onClose }) {
  const [subtasks, setSubtasks] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Cargar subtareas de esta actividad al abrir
  useEffect(() => {
    fetch(`${API_BASE}/api/subtasks/`)
      .then(res => res.json())
      .then(data => {
        // Filtramos solo las subtareas de esta actividad
        const propias = data.filter(st => st.activity === actividad.id);
        setSubtasks(propias);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, [actividad.id]);

  // Cuando se agrega una subtarea nueva, la agregamos al estado local
  const handleSubtaskAdded = (nueva) => {
    setSubtasks(prev => [...prev, nueva]);
  };

  const tipo = TIPO_CONFIG[actividad.activity_type] || { label: 'Otro', clase: 'badge-project' };
  const dif  = DIFICULTAD_CONFIG[actividad.difficulty] || null;

  return (
    <div className="ad-overlay" onClick={onClose}>
      <div className="ad-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="ad-header">
          <div className="ad-badges">
            <span className={`badge ${tipo.clase}`}>{tipo.label}</span>
            {dif && <span className={`badge-dif ${dif.clase}`}>{dif.label}</span>}
          </div>
          <button className="ad-cerrar" onClick={onClose}>✕</button>
        </div>

        {/* Info actividad */}
        <h2 className="ad-titulo">{actividad.title}</h2>

        {actividad.description && (
          <p className="ad-descripcion">{actividad.description}</p>
        )}

        <div className="ad-fechas">
          {actividad.start_date && (
            <div className="ad-fecha-item">
              <span className="ad-fecha-label">📅 Inicio</span>
              <span className="ad-fecha-valor">
                {new Date(actividad.start_date + 'T00:00:00').toLocaleDateString('es-ES', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </span>
            </div>
          )}
          <div className="ad-fecha-item">
            <span className="ad-fecha-label">⏰ Vence</span>
            <span className="ad-fecha-valor">
              {new Date(actividad.due_date + 'T00:00:00').toLocaleDateString('es-ES', {
                day: '2-digit', month: 'long', year: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Subtareas */}
        {cargando ? (
          <p className="ad-cargando">Cargando subtareas...</p>
        ) : (
          <SubtaskManager
            activityId={actividad.id}
            subtasks={subtasks}
            onSubtaskAdded={handleSubtaskAdded}
          />
        )}

      </div>
    </div>
  );
}

export default ActivityDetail;