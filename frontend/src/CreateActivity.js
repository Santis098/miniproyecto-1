import React, { useState } from 'react';
import './CreateActivity.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://miniproyecto-1-zfn4.onrender.com';

function CreateActivity({ onClose, onActivityCreated }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipo, setTipo] = useState('exam');
  const [dificultad, setDificultad] = useState('media');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const manejarEnvio = async () => {
    if (!titulo || !descripcion || !fechaInicio || !fechaFin) {
      setError('Por favor completa todos los campos.');
      return;
    }
    if (fechaFin < fechaInicio) {
      setError('La fecha de cierre no puede ser antes de la fecha de inicio.');
      return;
    }
    setError('');
    setLoading(true);

    const nuevaActividad = {
      title: titulo,
      description: descripcion,
      start_date: fechaInicio,
      due_date: fechaFin,
      activity_type: tipo,
      difficulty: dificultad,
    };

    try {
      const respuesta = await fetch(API_BASE + '/api/activities/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaActividad),
      });

      if (respuesta.status === 201) {
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
          if (onActivityCreated) onActivityCreated();
          if (onClose) onClose();
        }, 2000);
      } else if (respuesta.status === 400) {
        const datos = await respuesta.json();
        setError(datos.message || 'Datos incorrectos. Verifica el formulario.');
        setLoading(false);
      } else {
        setError('Error del servidor. Intenta de nuevo mas tarde.');
        setLoading(false);
      }
    } catch (err) {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    }
  };

  const infoDificultad = {
    baja:    { emoji: '🟢', texto: 'Baja - Poca preparacion necesaria' },
    media:   { emoji: '🟡', texto: 'Media - Requiere preparacion moderada' },
    alta:    { emoji: '🟠', texto: 'Alta - Requiere bastante preparacion' },
    critica: { emoji: '🔴', texto: 'Critica - Maxima prioridad' },
  };

  return (
    <div className="ca-overlay">
      <div className="ca-modal">
        <div className="ca-header">
          <div>
            <h2 className="ca-titulo">Nueva Actividad</h2>
            <p className="ca-fecha-registro">Registrada el: {fechaHoy}</p>
          </div>
          <button className="ca-cerrar" onClick={onClose}>X</button>
        </div>

        {success && (
          <div className="ca-mensaje ca-exito">
            <p>Actividad creada exitosamente! Cerrando...</p>
          </div>
        )}

        {error && (
          <div className="ca-mensaje ca-error">
            <p>{error}</p>
          </div>
        )}

        {!success && (
          <div className="ca-form">
            <div className="ca-campo">
              <label className="ca-label">Titulo *</label>
              <input
                className="ca-input"
                type="text"
                placeholder="Ej: Examen Final de Matematicas"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            <div className="ca-campo">
              <label className="ca-label">Descripcion *</label>
              <textarea
                className="ca-textarea"
                placeholder="Describe los detalles de la actividad..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
              />
            </div>

            <div className="ca-fechas">
              <div className="ca-campo">
                <label className="ca-label">Fecha de inicio *</label>
                <input
                  className="ca-input"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div className="ca-campo">
                <label className="ca-label">Fecha de cierre *</label>
                <input
                  className="ca-input"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
            </div>

            <div className="ca-campo">
              <label className="ca-label">Tipo de actividad</label>
              <select
                className="ca-select"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="exam">Examen</option>
                <option value="project">Proyecto</option>
                <option value="presentation">Presentacion</option>
                <option value="homework">Tarea</option>
              </select>
            </div>

            <div className="ca-campo">
              <label className="ca-label">Importancia / Dificultad</label>
              <div className="ca-dificultad-opciones">
                {['baja', 'media', 'alta', 'critica'].map(nivel => (
                  <button
                    key={nivel}
                    className={'ca-dificultad-btn ' + (dificultad === nivel ? 'seleccionado ' : '') + 'ca-dif-' + nivel}
                    onClick={() => setDificultad(nivel)}
                    type="button"
                  >
                    {infoDificultad[nivel].emoji} {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
                  </button>
                ))}
              </div>
              <p className="ca-dificultad-desc">
                {infoDificultad[dificultad].texto}
              </p>
            </div>

            <div className="ca-botones">
              <button
                className="ca-btn-cancelar"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="ca-btn-guardar"
                onClick={manejarEnvio}
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar actividad'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateActivity;