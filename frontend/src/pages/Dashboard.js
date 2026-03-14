import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import CreateActivity from '../CreateActivity';
import ActivityDetail from '../ActivityDetail';

const API_BASE = process.env.REACT_APP_API_URL || 'https://miniproyecto-1-x936.onrender.com';
const FILTROS = ['Progreso', 'Dificultad', 'Horas estimadas', 'Asignatura', 'Fecha'];
const FILTRO_PARAM = { 'Progreso': 'progreso', 'Dificultad': 'dificultad', 'Horas estimadas': 'horas_estimadas', 'Asignatura': 'asignatura', 'Fecha': 'fecha' };

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName]               = useState('');
  const [tareasData, setTareasData]           = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [loadingSeccion, setLoadingSeccion]   = useState({ hoy: false, proximas: false });
  const [mostrarCrear, setMostrarCrear]       = useState(false);
  const [actividadDetalle, setActividadDetalle] = useState(null);
  const [filtroHoy, setFiltroHoy]             = useState('Progreso');
  const [filtroProximas, setFiltroProximas]   = useState('Fecha');
  const [dropdownHoy, setDropdownHoy]         = useState(false);
  const [dropdownProximas, setDropdownProximas] = useState(false);
  const refHoy      = useRef(null);
  const refProximas = useRef(null);

  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const token = localStorage.getItem('token');

  useEffect(() => {
    const nombre = localStorage.getItem('username');
    setUserName(nombre || 'Usuario');
    cargarTareas();
  }, []);

  // Cerrar dropdowns al clickear fuera
  useEffect(() => {
    const handler = (e) => {
      if (refHoy.current && !refHoy.current.contains(e.target)) setDropdownHoy(false);
      if (refProximas.current && !refProximas.current.contains(e.target)) setDropdownProximas(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cargarTareas = async (filtrarHoy = filtroHoy, filtrarProximas = filtroProximas) => {
    setLoading(true);
    try {
      const param = FILTRO_PARAM[filtrarHoy] || 'progreso';
      const res = await fetch(`${API_BASE}/api/tasks/hoy/?filtrar_por=${param}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        setTareasData(json.data);
      } else {
        setTareasData({ vencidas: [], hoy: [], proximas: [], contadores: { hoy: 0, esta_semana: 0, atrasadas: 0 } });
      }
    } catch (err) {
      setTareasData({ vencidas: [], hoy: [], proximas: [], contadores: { hoy: 0, esta_semana: 0, atrasadas: 0 } });
    }
    setLoading(false);
  };

  const cambiarFiltroHoy = async (f) => {
    setFiltroHoy(f); setDropdownHoy(false);
    setLoadingSeccion(s => ({ ...s, hoy: true }));
    await cargarTareas(f, filtroProximas);
    setLoadingSeccion(s => ({ ...s, hoy: false }));
  };

  const cambiarFiltroProximas = async (f) => {
    setFiltroProximas(f); setDropdownProximas(false);
    setLoadingSeccion(s => ({ ...s, proximas: true }));
    await cargarTareas(filtroHoy, f);
    setLoadingSeccion(s => ({ ...s, proximas: false }));
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

  const formatFecha = (f) => {
    if (!f) return '';
    const [y, m, d] = f.split('-');
    return `${d}/${m}/${y}`;
  };

  const ActividadCard = ({ actividad, idx }) => (
    <div className="actividad-fila" onClick={() => setActividadDetalle(actividad)}>
      <div className="actividad-fila-izq">
        <div className="activity-number">{idx + 1}</div>
        <div>
          <div className="actividad-fila-titulo">{actividad.title}</div>
          <div className="actividad-fila-fecha">
            Entrega: {formatFecha(actividad.due_date)}
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

  // Dropdown de filtro reutilizable
  const FiltroDropdown = ({ filtro, dropdown, setDropdown, onChange, refEl, sinFecha }) => (
    <div className="filtro-wrapper" ref={refEl}>
      <button className="filtro-btn" onClick={() => setDropdown(d => !d)}>
        Filtrar por <span className="filtro-chevron">▾</span>
      </button>
      {dropdown && (
        <div className="filtro-menu">
          {FILTROS.filter(f => sinFecha ? f !== 'Fecha' : true).map(f => (
            <div
              key={f}
              className={`filtro-item ${filtro === f ? 'filtro-activo' : ''}`}
              onClick={() => onChange(f)}
            >
              {filtro === f && <span className="filtro-check">✓</span>} {f}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const contadores = tareasData?.contadores || { hoy: 0, esta_semana: 0, atrasadas: 0 };

  return (
    <div className="dashboard-container">

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

      <div className="info-banner">
        <span>ℹ️</span> Priorizamos tu día: primero lo vencido, luego lo urgente de hoy, y finalmente lo próximo.
      </div>

      <nav className="dashboard-nav">
        <div className="nav-tab active"><span>⊞</span> Hoy</div>
        <div className="nav-tab"><span>📋</span> Actividades</div>
        <div className="nav-tab"><span>📅</span> Planificación</div>
        <div className="nav-tab"><span>📈</span> Avance</div>
      </nav>

      <main className="dashboard-content">
        <div className="page-title">
          <h1>Panel de Hoy</h1>
          <p>{currentDate}</p>
        </div>

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
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Cargando actividades...</p>
          </div>
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
              <div className="section-header section-header-actions">
                <span><span>🕒</span> Prioridades para Hoy</span>
                <div className="section-acciones">
                  <FiltroDropdown
                    filtro={filtroHoy} dropdown={dropdownHoy}
                    setDropdown={setDropdownHoy} onChange={cambiarFiltroHoy}
                    refEl={refHoy} sinFecha={true}
                  />
                  <button className="create-btn" onClick={() => setMostrarCrear(true)}>+ Agregar actividad</button>
                </div>
              </div>
              {loadingSeccion.hoy ? (
                <div className="loading-state mini"><div className="loading-spinner small" /><p>Aplicando filtro...</p></div>
              ) : !tareasData?.hoy?.length ? (
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
              <div className="section-header section-header-actions">
                <span><span>📅</span> Próximas Actividades</span>
                <div className="section-acciones">
                  <FiltroDropdown
                    filtro={filtroProximas} dropdown={dropdownProximas}
                    setDropdown={setDropdownProximas} onChange={cambiarFiltroProximas}
                    refEl={refProximas}
                  />
                  <button className="create-btn" onClick={() => setMostrarCrear(true)}>+ Agregar actividad</button>
                </div>
              </div>
              {loadingSeccion.proximas ? (
                <div className="loading-state mini"><div className="loading-spinner small" /><p>Aplicando filtro...</p></div>
              ) : !tareasData?.proximas?.length ? (
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

      {mostrarCrear && (
        <CreateActivity
          onClose={() => setMostrarCrear(false)}
          onActivityCreated={() => { setMostrarCrear(false); cargarTareas(); }}
        />
      )}

      {actividadDetalle && (
        <ActivityDetail
          actividad={actividadDetalle}
          onClose={() => setActividadDetalle(null)}
          onActualizado={() => cargarTareas()}
        />
      )}

    </div>
  );
};

export default Dashboard;