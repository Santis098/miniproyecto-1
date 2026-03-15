import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import CreateActivity, { EditActivity } from '../CreateActivity';
import ActivityDetail from '../ActivityDetail';

const API_BASE = process.env.REACT_APP_API_URL || 'https://miniproyecto-1-x936.onrender.com';
const IconEdit = () => (
  <svg style={{width:15,height:15,display:'inline-block',verticalAlign:'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg style={{width:15,height:15,display:'inline-block',verticalAlign:'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconSpinner = () => (
  <svg style={{width:15,height:15,display:'inline-block',verticalAlign:'middle',animation:'spin 0.7s linear infinite'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
  </svg>
);
const FILTROS = ['Dificultad', 'Horas estimadas', 'Fecha', 'Progreso'];
const FILTROS_SIN_FECHA = ['Dificultad', 'Horas estimadas', 'Progreso'];

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName]               = useState('');
  const [tareasData, setTareasData]           = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [loadingSeccion, setLoadingSeccion]   = useState({ hoy: false, proximas: false });
  const [mostrarCrear, setMostrarCrear]       = useState(false);
  const [actividadDetalle, setActividadDetalle] = useState(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [eliminando, setEliminando]               = useState(false);
  const [exitoMsg, setExitoMsg]                   = useState('');
  const [editandoActividad, setEditandoActividad] = useState(null);
  const [asignaturasDisponibles, setAsignaturasDisponibles] = useState([]);

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
    cargarAsignaturas();
  }, []);

  // Cerrar dropdowns al clickear fuera
  useEffect(() => {
    const handler = (e) => {
      if (refHoy.current && !refHoy.current.contains(e.target)) setDropdownHoy(false);
      if (refProximas.current && !refProximas.current.contains(e.target)) setDropdownProximas(false);
      if (refAsigHoy.current && !refAsigHoy.current.contains(e.target)) setDropdownAsigHoy(false);
      if (refAsigProximas.current && !refAsigProximas.current.contains(e.target)) setDropdownAsigProximas(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cargarAsignaturas = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/asignaturas/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      const lista = Array.isArray(json?.data) ? json.data : [];
      setAsignaturasDisponibles(lista);
    } catch (err) { console.error(err); }
  };

  const DIFICULTAD_ORDEN = { critica: 0, alta: 1, media: 2, baja: 3 };

  const ordenarLista = (lista, filtro, filtroAsig = null) => {
    if (!lista) return [];
    let resultado = [...lista];
    if (filtroAsig) {
      resultado = resultado.filter(a => a.asignatura === filtroAsig.id);
    }
    if (filtro === 'Dificultad') {
      return resultado.sort((a, b) =>
        (DIFICULTAD_ORDEN[a.difficulty] ?? 99) - (DIFICULTAD_ORDEN[b.difficulty] ?? 99)
      );
    }
    if (filtro === 'Horas estimadas') {
      return resultado.sort((a, b) => (b.horas_estimadas || 0) - (a.horas_estimadas || 0));
    }
    if (filtro === 'Fecha') {
      return resultado.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    }
    if (filtro === 'Progreso') {
      const calcProg = (a) => {
        if (a.progreso_horas !== undefined) return a.progreso_horas;
        if (!a.horas_estimadas || a.horas_estimadas === 0) return 0;
        return Math.round((a.horas_trabajadas || 0) / a.horas_estimadas * 100);
      };
      return resultado.sort((a, b) => calcProg(a) - calcProg(b));
    }
    return resultado;
  };

  const cargarTareas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tasks/hoy/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        setTareasData(json.data);
        // Recargar asignaturas para tener nombres frescos
        cargarAsignaturas();
      } else {
        setTareasData({ vencidas: [], hoy: [], proximas: [], contadores: { hoy: 0, esta_semana: 0, atrasadas: 0 } });
      }
    } catch (err) {
      setTareasData({ vencidas: [], hoy: [], proximas: [], contadores: { hoy: 0, esta_semana: 0, atrasadas: 0 } });
    }
    setLoading(false);
  };

  const cambiarFiltroHoy = (f) => {
    setFiltroHoy(f); setDropdownHoy(false);
  };

  const cambiarFiltroProximas = (f) => {
    setFiltroProximas(f); setDropdownProximas(false);
  };

  const eliminarActividad = async (actividad) => {
    setEliminando(true);
    try {
      await fetch(`${API_BASE}/api/activities/${actividad.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfirmarEliminar(null);
      setExitoMsg(`"${actividad.title}" eliminada correctamente.`);
      cargarTareas();
      setTimeout(() => setExitoMsg(''), 3000);
    } catch (err) { console.error(err); }
    setEliminando(false);
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

  const ActividadCard = ({ actividad, idx, soloEliminar }) => (
    <div style={{display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid #f1f1f1', borderRadius:'8px', transition:'background 0.15s', cursor:'default'}}>
      <div style={{display:'flex', flexDirection:'row', alignItems:'center', gap:14, flex:1, minWidth:0, cursor:'pointer'}} onClick={() => setActividadDetalle(actividad)}>
        <div className="activity-number">{idx + 1}</div>
        <div>
          <div className="actividad-fila-titulo">{actividad.title}</div>
          <div className="actividad-fila-fecha" style={{display:'flex', alignItems:'center', flexWrap:'wrap', gap:6}}>
            Entrega: {formatFecha(actividad.due_date)}
            {actividad.activity_type && (
              <span className={`badge ${getDifClass(actividad.difficulty)}`} style={{fontSize:11}}>
                {getTipoBadge(actividad.activity_type)}
              </span>
            )}
            {actividad.difficulty && (
              <span className={`badge ${getDifClass(actividad.difficulty)}`} style={{fontSize:11}}>
                {actividad.difficulty.charAt(0).toUpperCase() + actividad.difficulty.slice(1)}
              </span>
            )}
          </div>
          <div style={{fontSize:12, color:'#aaa'}}>{actividad.horas_trabajadas||0}h / {actividad.horas_estimadas||0}h</div>
        </div>
      </div>
      <div style={{display:'flex', flexDirection:'row', alignItems:'center', gap:4, flexShrink:0, marginLeft:16}}>
        {!soloEliminar && (
          <button className="card-btn-edit" title="Editar" onClick={e => { e.stopPropagation(); setEditandoActividad(actividad); }}><IconEdit /></button>
        )}
        <button className="card-btn-del" title="Eliminar" onClick={e => { e.stopPropagation(); setConfirmarEliminar(actividad); }}><IconTrash /></button>
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
          {(sinFecha ? FILTROS_SIN_FECHA : FILTROS).map(f => (
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

  const [filtroAsignaturaHoy, setFiltroAsignaturaHoy]         = useState(null);
  const [filtroAsignaturaProximas, setFiltroAsignaturaProximas] = useState(null);
  const [dropdownAsigHoy, setDropdownAsigHoy]                 = useState(false);
  const [dropdownAsigProximas, setDropdownAsigProximas]       = useState(false);
  const refAsigHoy      = useRef(null);
  const refAsigProximas = useRef(null);

  // Obtener asignaturas únicas de las actividades — cruza con nombres disponibles
  const getAsignaturasUnicas = (lista) => {
    if (!lista) return [];
    const mapa = {};
    lista.forEach(a => {
      if (a.asignatura) {
        const info = asignaturasDisponibles.find(x => x.id === a.asignatura);
        if (info) mapa[a.asignatura] = info.nombre;
        else mapa[a.asignatura] = `Asignatura ${a.asignatura}`;
      }
    });
    return Object.entries(mapa).map(([id, nombre]) => ({ id: parseInt(id), nombre }));
  };

  const filtrarPorAsignatura = (lista, seccion) => {
    const filtro = seccion === 'hoy' ? filtroAsignaturaHoy : filtroAsignaturaProximas;
    if (!filtro) return lista;
    return lista.filter(a => a.asignatura === filtro);
  };

  const AsignaturaDropdown = ({ seccion }) => {
    const refEl = seccion === 'hoy' ? refAsigHoy : refAsigProximas;
    const dropdown = seccion === 'hoy' ? dropdownAsigHoy : dropdownAsigProximas;
    const setDropdown = seccion === 'hoy' ? setDropdownAsigHoy : setDropdownAsigProximas;
    const filtroActual = seccion === 'hoy' ? filtroAsignaturaHoy : filtroAsignaturaProximas;
    const setFiltro = seccion === 'hoy' ? setFiltroAsignaturaHoy : setFiltroAsignaturaProximas;
    const lista = getAsignaturasUnicas(seccion === 'hoy' ? tareasData?.hoy : tareasData?.proximas);

    // Solo mostrar si hay actividades con asignatura
    if (lista.length === 0) return null;

    const nombreActual = lista.find(a => a.id === filtroActual)?.nombre;

    return (
      <div className="filtro-wrapper" ref={refEl}>
        <button
          className="filtro-btn"
          style={filtroActual ? {borderColor:'#2563eb', color:'#2563eb', fontWeight:600} : {}}
          onClick={() => setDropdown(d => !d)}
        >
          {nombreActual || 'Asignatura'} <span className="filtro-chevron">▾</span>
        </button>
        {dropdown && (
          <div className="filtro-menu" style={{minWidth:180}}>
            <div
              className={`filtro-item ${!filtroActual ? 'filtro-activo' : ''}`}
              onClick={() => { setFiltro(null); setDropdown(false); }}
            >
              {!filtroActual && <span className="filtro-check">✓</span>} Todas
            </div>
            {lista.map(a => (
              <div
                key={a.id}
                className={`filtro-item ${filtroActual === a.id ? 'filtro-activo' : ''}`}
                onClick={() => { setFiltro(a.id); setDropdown(false); }}
              >
                {filtroActual === a.id && <span className="filtro-check">✓</span>} {a.nombre}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const contadores = tareasData?.contadores || { hoy: 0, esta_semana: 0, atrasadas: 0 };

  // Recalcular esta_semana = hoy + próximas dentro de 7 días
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  const finSemana = new Date(hoy); finSemana.setDate(hoy.getDate() + 7);
  const proximasSemana = (tareasData?.proximas || []).filter(a => {
    const d = new Date(a.due_date); return d >= hoy && d <= finSemana;
  }).length;
  const estaSemanaTotal = (tareasData?.hoy?.length || 0) + proximasSemana;

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
            <div className="stat-number purple">{estaSemanaTotal}</div>
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
                tareasData.vencidas.map((a, i) => <ActividadCard key={a.id} actividad={a} idx={i} soloEliminar={true} />)
              )}
            </div>

            {/* HOY */}
            <div className="section-card">
              <div className="section-header section-header-actions">
                <span><span>🕒</span> Prioridades para Hoy</span>
                <div className="section-acciones">
                  <AsignaturaDropdown seccion="hoy" />
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
                filtrarPorAsignatura(ordenarLista(tareasData.hoy, filtroHoy), 'hoy').map((a, i) => <ActividadCard key={a.id} actividad={a} idx={i} />)
              )}
            </div>

            {/* PRÓXIMAS */}
            <div className="section-card">
              <div className="section-header section-header-actions">
                <span><span>📅</span> Próximas Actividades</span>
                <div className="section-acciones">
                  <AsignaturaDropdown seccion="proximas" />
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
                filtrarPorAsignatura(ordenarLista(tareasData.proximas, filtroProximas), 'proximas').map((a, i) => <ActividadCard key={a.id} actividad={a} idx={i} />)
              )}
            </div>
          </>
        )}
      </main>

      {editandoActividad && (
        <EditActivity
          actividad={editandoActividad}
          onClose={() => setEditandoActividad(null)}
          onActualizado={() => { setEditandoActividad(null); cargarTareas(); setExitoMsg('Actividad actualizada correctamente.'); setTimeout(() => setExitoMsg(''), 3000); }}
        />
      )}

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

      {/* MODAL CONFIRMAR ELIMINAR */}
      {confirmarEliminar && (
        <div className="confirm-overlay-dash">
          <div className="confirm-modal-dash">
            <h3>Eliminar actividad</h3>
            <p>¿Estás seguro que deseas eliminar <strong>"{confirmarEliminar.title}"</strong>?</p>
            <p className="confirm-aviso-dash">Esta acción no se puede deshacer.</p>
            <div className="confirm-botones-dash">
              <button className="confirm-btn-cancelar-dash" onClick={() => setConfirmarEliminar(null)} disabled={eliminando}>Cancelar</button>
              <button className="confirm-btn-eliminar-dash" onClick={() => eliminarActividad(confirmarEliminar)} disabled={eliminando}>
                {eliminando ? <IconSpinner /> : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENSAJE ÉXITO */}
      {exitoMsg && (
        <div className="exito-toast">✅ {exitoMsg}</div>
      )}

    </div>
  );
};

export default Dashboard;