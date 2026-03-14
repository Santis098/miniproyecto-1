import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import CreateActivity from '../CreateActivity';
import ActivityDetail from '../ActivityDetail';

const API_BASE = process.env.REACT_APP_API_URL || 'https://miniproyecto-1-x936.onrender.com';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName]             = useState('');
  const [tareasData, setTareasData]         = useState(null);
  const [loading, setLoading]               = useState(true);
  const [mostrarCrear, setMostrarCrear]     = useState(false);
  const [actividadDetalle, setActividadDetalle] = useState(null);

  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    const nombre = localStorage.getItem('username');
    setUserName(nombre || 'Usuario');
    cargarTareas();
  }, []);

  const cargarTareas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tasks/hoy/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      // El backend devuelve { status, message, data: { vencidas, hoy, proximas, contadores } }
      if (json.status === 'success' && json.data) {
        setTareasData(json.data);
      } else {
        setTareasData({ vencidas: [], hoy: [], proximas: [], contadores: { hoy: 0, esta_semana: 0, atrasadas: 0 } });
      }
    } catch (err) {
      console.error('Error cargando tareas:', err);
      setTareasData({ vencidas: [], hoy: [], proximas: [], contadores: { hoy: 0, esta_semana: 0, atrasadas: 0 } });
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const getTipoBadge = (type) => {
    const map = { exam: 'Examen', project: 'Proyecto', presentation: 'Presentación', homework: 'Tarea' };
    return map[type?.toLowerCase()] || type || '';
  };

  const getDifClass = (d) => {
    const map = { baja: 'badge-baja', media: 'badge-media', alta: 'badge-alta', critica: 'badge-critica' };
    return map[d?.toLowerCase()] || 'badge-media';
  };

  // Tarjeta de actividad clickeable
  const ActividadCard = ({ actividad, idx }) => (
    <div className="actividad-fila" onClick={() => setActividadDetalle(actividad)}>
      <div className="actividad-fila-izq">
        <div className="activity-number">{idx + 1}</div>
        <div>
          <div className="actividad-fila-titulo">{actividad.title}</div>
          <div className="actividad-fila-fecha">
            Entrega: {actividad.due_date}
            {actividad.activity_type && (
              <span className={`badge ${getDifClass(actividad.difficulty)}`} style={{marginLeft:8, fontSize:11}}>
                {getTipoBadge(actividad.activity_type)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="actividad-fila-der">
        <span style={{fontSize:12, color:'#888'}}>{actividad.horas_trabajadas||0}h / {actividad.horas_estimadas||0}h</span>
        <span style={{fontSize:12, color:'#aaa'}}>›</span>
      </div>
    </div>
  );

  const contadores = tareasData?.contadores || { hoy: 0, esta_semana: 0, atrasadas: 0 };

  return (
    <div className="dashboard-container">

      {/* BARRA SUPERIOR */}
      <header className="dashboard-topbar">
        <div className="brand">
          <span role="img" aria-label="calendar">📅</span> Gestión de Actividades
        </div>
        <div className="user-actions">
          <span>👤 {userName}</span>
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span> Salir
          </button>
        </div>
      </header>

      {/* BANNER */}
      <div className="info-banner">
        <span>ℹ️</span> Priorizamos tu día: primero lo vencido, luego lo urgente de hoy, y finalmente lo próximo.
      </div>

      {/* TABS */}
      <nav className="dashboard-nav">
        <div className="nav-tab active"><span>⊞</span> Hoy</div>
        <div className="nav-tab"><span>📋</span> Actividades</div>
        <div className="nav-tab"><span>📅</span> Planificación</div>
        <div className="nav-tab"><span>📈</span> Avance</div>
      </nav>

      {/* CONTENIDO */}
      <main className="dashboard-content">

        <div className="page-title">
          <h1>Panel de Hoy</h1>
          <p>{currentDate}</p>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Hoy</h3>
            <div className="stat-number blue">{contadores.hoy}</div>
            <div className="stat-desc">actividades activas</div>
          </div>
          <div className="stat-card">
            <h3>Esta Semana</h3>
            <div className="stat-number purple">{contadores.esta_semana}</div>
            <div className="stat-desc">actividades programadas</div>
          </div>
          <div className="stat-card">
            <h3>Atrasadas</h3>
            <div className="stat-number red">{contadores.atrasadas}</div>
            <div className="stat-desc">necesitan reprogramación</div>
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><p>Cargando actividades...</p></div>
        ) : (
          <>
            {/* ATRASADAS */}
            <div className="section-card">
              <div className="section-header">
                <span>⚠️</span> Actividades Atrasadas
              </div>
              {!tareasData?.vencidas?.length ? (
                <div className="empty-state">
                  <div className="success-icon">✅</div>
                  <p>No tienes actividades atrasadas</p>
                  <p><strong>¡¡Muy bien, sigue así!!</strong></p>
                </div>
              ) : (
                tareasData.vencidas.map((a, i) => <ActividadCard key={a.id} actividad={a} idx={i} />)
              )}
            </div>

            {/* HOY */}
            <div className="section-card">
              <div className="section-header" style={{justifyContent:'space-between'}}>
                <span><span>🕒</span> Prioridades para Hoy</span>
                <button className="create-btn" onClick={() => setMostrarCrear(true)}>+ Agregar actividad</button>
              </div>
              {!tareasData?.hoy?.length ? (
                <div className="empty-state">
                  <div className="success-icon">✅</div>
                  <p>No tienes actividades programadas para hoy</p>
                  <button className="create-btn" onClick={() => setMostrarCrear(true)}>Crear nueva actividad</button>
                </div>
              ) : (
                tareasData.hoy.map((a, i) => <ActividadCard key={a.id} actividad={a} idx={i} />)
              )}
            </div>

            {/* PRÓXIMAS */}
            <div className="section-card">
              <div className="section-header" style={{justifyContent:'space-between'}}>
                <span><span>📅</span> Próximas Actividades</span>
                <button className="create-btn" onClick={() => setMostrarCrear(true)}>+ Agregar actividad</button>
              </div>
              {!tareasData?.proximas?.length ? (
                <div className="empty-state">
                  <div className="success-icon">✅</div>
                  <p>No tienes próximas actividades</p>
                  <button className="create-btn" onClick={() => setMostrarCrear(true)}>Crear nueva actividad</button>
                </div>
              ) : (
                tareasData.proximas.map((a, i) => <ActividadCard key={a.id} actividad={a} idx={i} />)
              )}
            </div>
          </>
        )}

      </main>

      {/* MODAL CREAR */}
      {mostrarCrear && (
        <CreateActivity
          onClose={() => setMostrarCrear(false)}
          onActivityCreated={() => { setMostrarCrear(false); cargarTareas(); }}
        />
      )}

      {/* MODAL DETALLE */}
      {actividadDetalle && (
        <ActivityDetail
          actividad={actividadDetalle}
          onClose={() => setActividadDetalle(null)}
        />
      )}

    </div>
  );
};

export default Dashboard;