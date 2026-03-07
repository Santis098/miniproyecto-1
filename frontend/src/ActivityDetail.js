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
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!actividad || !actividad.id) {
      setCargando(false);
      return;
    }
    fetch(API_BASE + '/api/subtasks/')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var propias = data.filter(function(st) { return st.activity === actividad.id; });
        setSubtasks(propias);
        setCargando(false);
      })
      .catch(function() {
        setError(true);
        setCargando(false);
      });
  }, [actividad.id]);

  if (!actividad) return null;

  var tipo = TIPO_CONFIG[actividad.activity_type] || { label: 'Otro', clase: 'badge-project' };
  var dif  = actividad.difficulty ? (DIFICULTAD_CONFIG[actividad.difficulty] || null) : null;

  return (
    <div className="ad-overlay" onClick={onClose}>
      <div className="ad-modal" onClick={function(e) { e.stopPropagation(); }}>

        <div className="ad-header">
          <div className="ad-badges">
            <span className={'badge ' + tipo.clase}>{tipo.label}</span>
            {dif && <span className={'badge-dif ' + dif.clase}>{dif.label}</span>}
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

        {cargando && <p className="ad-cargando">Cargando subtareas...</p>}

        {error && <p className="ad-cargando">No se pudieron cargar las subtareas.</p>}

        {!cargando && !error && (
          <SubtaskManager
            activityId={actividad.id}
            subtasks={subtasks}
            onSubtaskAdded={function(nueva) { setSubtasks(function(prev) { return prev.concat([nueva]); }); }}
          />
        )}

      </div>
    </div>
  );
}

export default ActivityDetail;