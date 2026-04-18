import React, { useState } from 'react';
import './SubtaskManager.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://miniproyecto-1-x936.onrender.com';

function SubtaskManager({ activityId, subtasks, onSubtaskAdded }) {

  console.log("Subtasks en SubtaskManager:", subtasks);
  
  const [titulo, setTitulo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const agregarSubtarea = async () => {
    if (!titulo.trim()) {
      setError('Escribe un título para la subtarea.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/subtasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titulo, activity: activityId }),
      });

      if (res.status === 201) {
        const nueva = await res.json();
        setTitulo('');
        if (onSubtaskAdded) onSubtaskAdded(nueva);
      } else {
        setError('No se pudo guardar la subtarea. Intenta de nuevo.');
      }
    } catch (err) {
      setError('Error de conexión. Verifica tu red.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') agregarSubtarea();
  };

  return (
    <div className="st-container">
      <h4 className="st-titulo">Subtareas</h4>

      {/* Lista de subtareas existentes */}
      {subtasks.length === 0 ? (
        <p className="st-vacio">No hay subtareas aún.</p>
      ) : (
        <ul className="st-lista">
          {subtasks.map(st => (
            <li key={st.id} className={`st-item ${st.is_completed ? 'completada' : ''}`}>
              <span className="st-check">{st.is_completed ? '✅' : '⬜'}</span>
              <span className="st-nombre">{st.title}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Campo para agregar nueva subtarea */}
      <div className="st-agregar">
        <input
          className="st-input"
          type="text"
          placeholder="Nueva subtarea..."
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          className="st-btn"
          onClick={agregarSubtarea}
          disabled={loading}
        >
          {loading ? '...' : '+ Agregar'}
        </button>
      </div>

      {error && <p className="st-error">{error}</p>}
    </div>
  );
}

export default SubtaskManager;