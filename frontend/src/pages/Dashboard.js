import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import CreateActivity, { EditActivity } from '../CreateActivity';
import ActivityDetail from '../ActivityDetail';

const API_BASE = process.env.REACT_APP_API_URL || 'https://miniproyecto-1-x936.onrender.com';

const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const diaSiguiente = (f) => {
  const d = new Date(f + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const IconEdit = () => (
  <svg style={{width:15,height:15,display:'inline-block',verticalAlign:'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconClock = () => (
  <svg style={{width:15,height:15,display:'inline-block',verticalAlign:'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
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

const IconLogout = () => (
  <svg style={{width:16,height:16,display:'inline-block',verticalAlign:'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconUser = () => (
  <svg style={{width:15,height:15,display:'inline-block',verticalAlign:'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
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
  const [fechaDefecto, setFechaDefecto] = useState(null);
  const [asignaturasDisponibles, setAsignaturasDisponibles] = useState([]);
  
  const [reprogramando, setReprogramando] = useState(null);
  const [horasHoy, setHorasHoy] = useState(0);

  // 🟢 Estados para el límite dinámico (ahora correctamente dentro del componente)
  const [limiteDiario, setLimiteDiario] = useState(6);
  const [mostrarConfigLimite, setMostrarConfigLimite] = useState(false);
  const [inputLimite, setInputLimite] = useState(6);
  const [guardandoLimite, setGuardandoLimite] = useState(false);
  const [errorLimite, setErrorLimite] = useState('');

  // Conflicto de límite horario: días que superan el nuevo límite propuesto
  const [conflictoLimite, setConflictoLimite] = useState(null);
  // Banner de conflictos pendientes (cuando el usuario forzó un cambio con conflictos)
  const [conflictosPendientes, setConflictosPendientes] = useState(null);

  // Sprint 10: actividades completadas al 100%
  const [actividadesCompletadas, setActividadesCompletadas] = useState([]);
  const [filtroCompletadas, setFiltroCompletadas] = useState('Fecha');
  const [dropdownCompletadas, setDropdownCompletadas] = useState(false);
  const refCompletadas = useRef(null);

  const [filtroHoy, setFiltroHoy]             = useState('Progreso');
  const [filtroProximas, setFiltroProximas]   = useState('Fecha');
  const [dropdownHoy, setDropdownHoy]         = useState(false);
  const [dropdownProximas, setDropdownProximas] = useState(false);
  const refHoy      = useRef(null);
  const refProximas = useRef(null);

  const [filtroAsignaturaHoy, setFiltroAsignaturaHoy]         = useState(null);
  const [filtroAsignaturaProximas, setFiltroAsignaturaProximas] = useState(null);
  const [dropdownAsigHoy, setDropdownAsigHoy]                 = useState(false);
  const [dropdownAsigProximas, setDropdownAsigProximas]       = useState(false);
  const refAsigHoy      = useRef(null);
  const refAsigProximas = useRef(null);

  // Estado para el modal rápido de ajustar horas
  const [ajustandoHoras, setAjustandoHoras] = useState(null);

  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const token = localStorage.getItem('token');

  useEffect(() => {
    const nombre = localStorage.getItem('nombre') || localStorage.getItem('username') || 'Usuario';
    setUserName(nombre);
    
    // 🟢 Cargar el límite desde el backend (incluye alerta_conflictos si existen)
    fetch(`${API_BASE}/api/usuario/limite-horas/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data?.data?.limite_horas_diarias) {
          setLimiteDiario(data.data.limite_horas_diarias);
          setInputLimite(data.data.limite_horas_diarias);
        }
        if (data?.data?.alerta_conflictos) {
          setConflictosPendientes(data.data.alerta_conflictos);
        } else {
          setConflictosPendientes(null);
        }
      })
      .catch(err => console.error(err));

    cargarTareas();
    cargarAsignaturas();
    cargarCompletadas();
  }, []);

  // 🟢 Función para actualizar el límite
  // Maneja 3 escenarios del backend:
  //   1. Sin conflicto -> aplica directo
  //   2. Conflicto sin confirmar -> warning con días en conflicto -> abre modal de decisión
  //   3. Conflicto con confirmar:true -> aplica y persiste conflictos pendientes
  const guardarLimite = async (forzar = false) => {
    const val = parseFloat(inputLimite);
    if (isNaN(val) || val <= 0 || val > 24) {
      setErrorLimite('Ingresa un número válido entre 1 y 24.');
      return;
    }
    setGuardandoLimite(true);
    setErrorLimite('');
    try {
      const res = await fetch(`${API_BASE}/api/usuario/limite-horas/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ limite_horas_diarias: val, confirmar: forzar })
      });
      const json = await res.json().catch(() => ({}));

      // Caso 2: warning con conflicto -> abrir modal de decisión
      if (res.ok && json?.status === 'warning' && json?.data?.dias_en_conflicto) {
        setMostrarConfigLimite(false);
        setConflictoLimite({
          nuevoLimite: json.data.nuevo_limite,
          dias: json.data.dias_en_conflicto,
          mensaje: json.data.mensaje,
        });
        setGuardandoLimite(false);
        return;
      }

      // Caso 1 o 3: aplicado correctamente
      if (res.ok) {
        setLimiteDiario(val);
        setMostrarConfigLimite(false);
        setConflictoLimite(null);
        if (json?.data?.conflictos) {
          // Conflicto persistido: mostrar banner permanente
          setConflictosPendientes({
            limite_aplicado: val,
            dias_en_conflicto: json.data.dias_en_conflicto,
            mensaje: json.data.mensaje,
          });
          setExitoMsg(`Límite actualizado a ${val}h con ${json.data.dias_en_conflicto.length} día(s) en conflicto.`);
        } else {
          setConflictosPendientes(null);
          setExitoMsg(`Límite diario actualizado a ${val}h.`);
        }
        setTimeout(() => setExitoMsg(''), 3500);
      } else {
        setErrorLimite(json?.message || 'Error al guardar el límite.');
      }
    } catch (e) {
      setErrorLimite('Error de conexión.');
    }
    setGuardandoLimite(false);
  };

  // Sprint 10: cargar actividades completadas al 100%
  const cargarCompletadas = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v2/activities/completadas/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json?.status === 'success' && Array.isArray(json?.data?.actividades)) {
        setActividadesCompletadas(json.data.actividades);
      } else {
        setActividadesCompletadas([]);
      }
    } catch (err) {
      setActividadesCompletadas([]);
    }
  };

  // Cerrar dropdowns al clickear fuera
  useEffect(() => {
    const handler = (e) => {
      if (refHoy.current && !refHoy.current.contains(e.target)) setDropdownHoy(false);
      if (refProximas.current && !refProximas.current.contains(e.target)) setDropdownProximas(false);
      if (refAsigHoy.current && !refAsigHoy.current.contains(e.target)) setDropdownAsigHoy(false);
      if (refAsigProximas.current && !refAsigProximas.current.contains(e.target)) setDropdownAsigProximas(false);
      if (refCompletadas.current && !refCompletadas.current.contains(e.target)) setDropdownCompletadas(false);
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
        // 🟢 CORRECCIÓN: Priorizar el campo nuevo porcentaje_completado
        if (a.porcentaje_completado !== undefined) return a.porcentaje_completado;
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
      // V2: excluye actividades completadas automáticamente.
      // Una actividad desaparece de aquí cuando horas_trabajadas >= horas_estimadas.
      const res = await fetch(`${API_BASE}/api/v2/tasks/hoy/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        setTareasData(json.data);
        const horasDelDia = (json.data.hoy || []).reduce((s, a) => s + (parseFloat(a.horas_estimadas) || 0), 0);
        setHorasHoy(horasDelDia);
        cargarAsignaturas();
      } else {
        setTareasData({ vencidas: [], hoy: [], proximas: [], contadores: { hoy: 0, esta_semana: 0, atrasadas: 0 } });
      }
    } catch (err) {
      setTareasData({ vencidas: [], hoy: [], proximas: [], contadores: { hoy: 0, esta_semana: 0, atrasadas: 0 } });
    }
    setLoading(false);
  };

  const cambiarFiltroHoy = (f) => { setFiltroHoy(f); setDropdownHoy(false); };
  const cambiarFiltroProximas = (f) => { setFiltroProximas(f); setDropdownProximas(false); };

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
      cargarCompletadas();
      setTimeout(() => setExitoMsg(''), 3000);
    } catch (err) { console.error(err); }
    setEliminando(false);
  };

  const guardarReprogramacion = async () => {
    if (!reprogramando?.nuevaFecha) return;
    try {
      await fetch(`${API_BASE}/api/activities/${reprogramando.actividad.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ due_date: reprogramando.nuevaFecha, start_date: reprogramando.nuevaFecha })
      });
      setReprogramando(null);
      cargarTareas();
      cargarCompletadas();
      setExitoMsg('Actividad reprogramada correctamente.');
      setTimeout(() => setExitoMsg(''), 3000);
    } catch (err) { console.error(err); }
  };

  // Recarga el estado del límite (incluye alerta_conflictos persistidos).
  // Se invoca después de editar una actividad en conflicto: si los días
  // ya bajaron del límite, el banner desaparece automáticamente.
  const recargarLimite = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/usuario/limite-horas/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data?.data?.limite_horas_diarias) {
        setLimiteDiario(data.data.limite_horas_diarias);
      }
      setConflictosPendientes(data?.data?.alerta_conflictos || null);
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('nombre');
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
    <div style={{display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:'10px 8px', borderBottom:'1px solid #f1f1f1', borderRadius:'6px', transition:'background 0.15s', cursor:'default', gap:8}}>
      <div style={{display:'flex', flexDirection:'row', alignItems:'flex-start', gap:8, flex:1, minWidth:0, cursor:'pointer'}} onClick={() => setActividadDetalle(actividad)}>
        <div className="activity-number" style={{flexShrink:0}}>{idx + 1}</div>
        <div style={{minWidth:0, flex:1}}>
          <div className="actividad-fila-titulo" style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{actividad.title}</div>
          <div className="actividad-fila-fecha" style={{display:'flex', alignItems:'center', flexWrap:'wrap', gap:4, fontSize:12}}>
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

            {(() => {
              // Si el backend envía el porcentaje, lo usamos. Si no, hacemos el cálculo manual por si acaso.
              const pct = actividad.porcentaje_completado !== undefined 
                          ? parseFloat(actividad.porcentaje_completado) 
                          : (actividad.horas_estimadas > 0 
                              ? Math.min(100, Math.round(((actividad.horas_trabajadas || 0) / actividad.horas_estimadas) * 100)) 
                              : 0);
              
              return (
                <div style={{marginTop:6, width:'100%'}}>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:11, color:'#94a3b8', marginBottom:3}}>
                    <span>Progreso</span>
                    <span style={{fontWeight:600, color: pct >= 100 ? '#16a34a' : '#2563eb'}}>{pct}%</span>
                  </div>
                  <div style={{height:5, background:'#e2e8f0', borderRadius:99, overflow:'hidden'}}>
                    <div style={{
                      height:'100%', borderRadius:99,
                      width:`${pct}%`,
                      background: pct >= 100 ? '#16a34a' : 'linear-gradient(90deg,#2563eb,#60a5fa)',
                      transition:'width 0.4s ease'
                    }}/>
                  </div>
                </div>
              );
            })()}
          </div>
          <div style={{fontSize:12, color:'#aaa'}}>
            {/* Opcional: Si quieres mostrar las horas proporcionales calculadas a partir del porcentaje */}
            {actividad.porcentaje_completado !== undefined
               ? `${((parseFloat(actividad.porcentaje_completado) / 100) * (parseFloat(actividad.horas_estimadas) || 0)).toFixed(1)}h`
               : (actividad.horas_trabajadas || 0)} / {actividad.horas_estimadas||0}h
          </div>
        </div>
      </div>
      <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:2, flexShrink:0}}>
        {!soloEliminar && (
          <button className="card-btn-edit" title="Editar" onClick={e => { e.stopPropagation(); setEditandoActividad(actividad); }}><IconEdit /></button>
        )}
        {!soloEliminar && (
          <button className="card-btn-clock" title="Reprogramar fecha" onClick={e => { e.stopPropagation();
            setReprogramando({ actividad, nuevaFecha: actividad.due_date || '' });
            }}
          >
            <IconClock />
          </button>
        )}

        <button className="card-btn-del" title="Eliminar" onClick={e => { e.stopPropagation(); setConfirmarEliminar(actividad); }}><IconTrash /></button>
      </div>
    </div>
  );

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

  const hoyDate = new Date();
  hoyDate.setHours(0,0,0,0);
  const finSemana = new Date(hoyDate); finSemana.setDate(hoyDate.getDate() + 7);
  const proximasSemana = (tareasData?.proximas || []).filter(a => {
    const d = new Date(a.due_date); return d >= hoyDate && d <= finSemana;
  }).length;
  const estaSemanaTotal = (tareasData?.hoy?.length || 0) + proximasSemana;

  const isCompletelyEmpty = tareasData &&
    (tareasData.vencidas?.length || 0) === 0 &&
    (tareasData.hoy?.length || 0) === 0 &&
    (tareasData.proximas?.length || 0) === 0 &&
    (actividadesCompletadas?.length || 0) === 0;

  return (
    <div className="dashboard-container">

      <header className="dashboard-topbar">
        <div className="brand">
          <span role="img" aria-label="calendar">📅</span> Gestión de Actividades
        </div>
        <div className="user-actions">
          {/* 🟢 Botón para cambiar el límite */}
          <button 
            onClick={() => { setInputLimite(limiteDiario); setMostrarConfigLimite(true); setErrorLimite(''); }}
            style={{ background: 'none', border: '1px solid #dfe1e6', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#5e6c84', fontSize: '0.85rem', fontWeight: 600 }}
            title="Configurar límite de horas diarias"
          >
            ⚙️ Límite: {limiteDiario}h / día
          </button>

          <span style={{display:'flex', alignItems:'center', gap:6}}>
            <IconUser /> {userName}
          </span>
          <button className="logout-btn" onClick={handleLogout} style={{display:'flex', alignItems:'center', gap:6}}>
            <IconLogout /> Salir
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

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Cargando actividades...</p>
          </div>
        ) : isCompletelyEmpty ? (
          <div className="global-empty-state">
            <div className="success-icon" style={{fontSize: '4rem'}}>✅</div>
            <h2 style={{ color: '#172b4d', margin: '15px 0' }}>No tienes actividades registradas</h2>
            <p style={{ color: '#5e6c84', marginBottom: '30px' }}>
              ¡Todo está al día! Disfruta tu tiempo o comienza a planificar.
            </p>
            <button className="create-btn-primary" onClick={() => { setFechaDefecto(null); setMostrarCrear(true); }}>
              Crear nueva actividad
            </button>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Atrasadas</h3>
                <div className="stat-number red">{contadores.atrasadas}</div>
                <div className="stat-desc">necesitan reprogramación</div>
              </div>
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
                <h3>Completadas</h3>
                <div className="stat-number" style={{color:'#16a34a'}}>{actividadesCompletadas.length}</div>
                <div className="stat-desc">actividades completadas</div>
              </div>
            </div>

            {/* Banner de conflictos pendientes del límite horario */}
            {conflictosPendientes && conflictosPendientes.dias_en_conflicto?.length > 0 && (
              <div style={{
                background: '#fef2f2',
                border: '1.5px solid #ef4444',
                borderRadius: 10,
                padding: '12px 18px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: 14,
                color: '#991b1b',
              }}>
                <span style={{fontSize: 20}}>⚠️</span>
                <div style={{flex:1}}>
                  <strong>Conflicto con tu límite diario ({conflictosPendientes.limite_aplicado}h)</strong>
                  <div style={{marginTop:4, fontSize:13, color:'#7f1d1d'}}>
                    {conflictosPendientes.dias_en_conflicto.length} día(s) superan el límite:&nbsp;
                    {conflictosPendientes.dias_en_conflicto.map(d => `${d.fecha} (${d.horas}h)`).join(' · ')}
                  </div>
                  <div style={{marginTop:6, fontSize:12, color:'#7f1d1d'}}>
                    Edita o reprograma esas actividades para resolverlo.
                  </div>
                </div>
              </div>
            )}

            {/* 🟢 Usa limiteDiario en lugar de 6 */}
            {horasHoy >= limiteDiario && (
              <div style={{
                background: '#fff7ed',
                border: '1.5px solid #fb923c',
                borderRadius: 10,
                padding: '12px 18px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 14,
                color: '#9a3412',
              }}>
                <span style={{fontSize: 20}}>⚠️</span>
                <div>
                  <strong>Límite diario alcanzado</strong>
                  <span style={{marginLeft: 6}}>
                    Ya tienes <strong>{horasHoy}h</strong> de trabajo programadas para hoy (tu límite es <strong>{limiteDiario}h</strong>). No puedes agregar más actividades para este día.
                  </span>
                </div>
              </div>
            )}           

            <div className="sections-grid">

              {/* === ATRASADAS === */}
              <div className="section-card">
                <div className="section-header-area">
                  <div className="section-header">
                    <span>⚠️</span> Actividades Atrasadas
                  </div>
                </div>
                <div className="section-body">
                  {!tareasData?.vencidas?.length ? (
                    <div className="empty-state">
                      <div className="success-icon">✅</div>
                      <p>No tienes actividades atrasadas</p>
                    </div>
                  ) : (
                    tareasData.vencidas.map((a, i) => <ActividadCard key={a.id} actividad={a} idx={i} soloEliminar={true} />)
                  )}
                </div>
              </div>

              {/* === HOY === */}
              <div className="section-card">
                <div className="section-header-area">
                  <div className="section-header section-header-actions">
                    <span><span>🕒</span> Prioridades para Hoy</span>
                    <div className="section-acciones">
                      <button
                        className="create-btn"
                        onClick={() => { setFechaDefecto('hoy'); setMostrarCrear(true); }}
                        disabled={horasHoy >= limiteDiario}
                        title={horasHoy >= limiteDiario ? `Ya alcanzaste tu límite de ${limiteDiario}h programadas para hoy` : ''}
                        style={{
                          marginTop: 0, padding: '6px 12px', fontSize: '13px',
                          opacity: horasHoy >= limiteDiario ? 0.45 : 1,
                          cursor: horasHoy >= limiteDiario ? 'not-allowed' : 'pointer'
                        }}
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>
                  <div className="filtros-container" style={{display: 'flex', gap: 10}}>
                    <AsignaturaDropdown seccion="hoy" />
                    <FiltroDropdown
                      filtro={filtroHoy} dropdown={dropdownHoy}
                      setDropdown={setDropdownHoy} onChange={cambiarFiltroHoy}
                      refEl={refHoy} sinFecha={true}
                    />
                  </div>
                </div>
                <div className="section-body">
                  {loadingSeccion.hoy ? (
                    <div className="loading-state mini"><div className="loading-spinner small" /><p>Aplicando filtro...</p></div>
                  ) : !tareasData?.hoy?.length ? (
                    <div className="empty-state">
                      <div className="success-icon">✅</div>
                      <p>No tienes actividades programadas para hoy</p>
                    </div>
                  ) : (
                    filtrarPorAsignatura(ordenarLista(tareasData.hoy, filtroHoy), 'hoy').map((a, i) => <ActividadCard key={a.id} actividad={a} idx={i} />)
                  )}
                </div>
              </div>

              {/* === ESTA SEMANA === */}
              <div className="section-card">
                <div className="section-header-area">
                  <div className="section-header section-header-actions">
                    <span><span>📅</span> Esta Semana</span>
                    <div className="section-acciones">
                      <button
                        className="create-btn"
                        onClick={() => { setFechaDefecto('manana'); setMostrarCrear(true); }}
                        style={{marginTop: 0, padding: '6px 12px', fontSize: '13px'}}
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>
                  <div className="filtros-container" style={{display: 'flex', gap: 10}}>
                    <AsignaturaDropdown seccion="proximas" />
                    <FiltroDropdown
                      filtro={filtroProximas} dropdown={dropdownProximas}
                      setDropdown={setDropdownProximas} onChange={cambiarFiltroProximas}
                      refEl={refProximas}
                    />
                  </div>
                </div>
                <div className="section-body">
                  {loadingSeccion.proximas ? (
                    <div className="loading-state mini"><div className="loading-spinner small" /><p>Aplicando filtro...</p></div>
                  ) : !tareasData?.proximas?.length ? (
                    <div className="empty-state">
                      <div className="success-icon">✅</div>
                      <p>No tienes actividades programadas esta semana</p>
                    </div>
                  ) : (
                    filtrarPorAsignatura(ordenarLista(tareasData.proximas, filtroProximas), 'proximas').map((a, i) => <ActividadCard key={a.id} actividad={a} idx={i} />)
                  )}
                </div>
              </div>

              {/* === COMPLETADAS === */}
              <div className="section-card">
                <div className="section-header-area">
                  <div className="section-header section-header-actions">
                    <span><span style={{color:'#16a34a'}}>✓</span> Actividades Completadas</span>
                    <span style={{
                      background:'#dcfce7', color:'#15803d', padding:'2px 10px',
                      borderRadius:99, fontSize:12, fontWeight:600
                    }}>
                      {actividadesCompletadas.length}
                    </span>
                  </div>
                </div>
                <div className="section-body">
                  {actividadesCompletadas.length === 0 ? (
                    <div className="empty-state">
                      <div className="success-icon" style={{fontSize:'2rem'}}>🎯</div>
                      <p>Aún no has completado actividades al 100%.</p>
                    </div>
                  ) : (
                    actividadesCompletadas
                      .slice()
                      .sort((a, b) => new Date(b.due_date) - new Date(a.due_date))
                      .map((a, i) => (
                        <div key={a.id} style={{
                          display:'flex', alignItems:'center', justifyContent:'space-between',
                          padding:'10px 8px', borderBottom:'1px solid #f1f1f1', borderRadius:6,
                          background: a.forzar ? '#fffbeb' : 'transparent', gap:8
                        }}>
                          <div style={{display:'flex', alignItems:'flex-start', gap:8, flex:1, minWidth:0, cursor:'pointer'}}
                            onClick={() => setActividadDetalle(a)}>
                            <div style={{
                              width:24, height:24, borderRadius:99, background:'#dcfce7',
                              color:'#16a34a', display:'flex', alignItems:'center',
                              justifyContent:'center', fontWeight:700, flexShrink:0, fontSize:13
                            }}>✓</div>
                            <div style={{flex:1, minWidth:0}}>
                              <div className="actividad-fila-titulo" style={{textDecoration:'line-through', color:'#64748b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                                {a.title}
                              </div>
                              <div className="actividad-fila-fecha" style={{display:'flex', alignItems:'center', flexWrap:'wrap', gap:4, fontSize:12}}>
                                Entregada: {formatFecha(a.due_date)}
                                {a.tipo === 'con_subtareas' && (
                                  <span className="badge" style={{background:'#e0f2fe', color:'#0369a1', fontSize:10}}>
                                    {a.subtareas_hechas}/{a.subtareas_total}
                                  </span>
                                )}
                                {a.forzar && (
                                  <span className="badge" style={{background:'#fef3c7', color:'#92400e', fontSize:10}}>
                                    Forzada
                                  </span>
                                )}
                                {a.asignatura && (
                                  <span className="badge" style={{background:'#f1f5f9', color:'#475569', fontSize:10}}>
                                    {a.asignatura}
                                  </span>
                                )}
                              </div>
                              <div style={{fontSize:11, color:'#16a34a', fontWeight:600, marginTop:3}}>
                                {a.horas_invertidas}h / {a.horas_estimadas}h
                              </div>
                            </div>
                          </div>
                          <button className="card-btn-del" title="Eliminar"
                            style={{flexShrink:0}}
                            onClick={(e) => { e.stopPropagation(); setConfirmarEliminar(a); }}>
                            <IconTrash />
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </main>

      {editandoActividad && (
        <EditActivity
          actividad={editandoActividad}
          onClose={() => setEditandoActividad(null)}
          onActualizado={() => {
            setEditandoActividad(null);
            cargarTareas();
            cargarCompletadas();
            recargarLimite();
            setExitoMsg('Actividad actualizada correctamente.');
            setTimeout(() => setExitoMsg(''), 3000);
          }}
        />
      )}

      {mostrarCrear && (
        <CreateActivity
          fechaInicial={
            fechaDefecto === 'hoy' ? hoy() :
            fechaDefecto === 'manana' ? diaSiguiente(hoy()) :
            undefined
          }
          onClose={() => { setMostrarCrear(false); setFechaDefecto(null); }}
          onActivityCreated={() => {
            setMostrarCrear(false);
            setFechaDefecto(null);
            cargarTareas();
            cargarCompletadas();
          }}
        />
      )}

      {actividadDetalle && (
        <ActivityDetail
          actividad={actividadDetalle}
          onClose={() => { setActividadDetalle(null); cargarTareas(); cargarCompletadas(); }}
          onActualizado={() => { cargarTareas(); cargarCompletadas(); }}
        />
      )}

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

      {reprogramando && (
        <div className="confirm-overlay-dash">
          <div className="confirm-modal-dash">
            <h3>Reprogramar actividad</h3>
            <p>Selecciona la nueva fecha para <strong>"{reprogramando.actividad.title}"</strong>:</p>
            <input
              type="date"
              style={{width:'100%', padding:'8px 12px', border:'1.5px solid #2563eb', borderRadius:8, fontSize:14, marginTop:8, boxSizing:'border-box'}}
              value={reprogramando.nuevaFecha}
              onChange={e => setReprogramando(r => ({ ...r, nuevaFecha: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="confirm-aviso-dash" style={{marginTop:10}}>
              La actividad se moverá a la nueva fecha seleccionada.
            </p>
            <div className="confirm-botones-dash">
              <button className="confirm-btn-cancelar-dash" onClick={() => setReprogramando(null)}>Cancelar</button>
              <button
                className="confirm-btn-eliminar-dash"
                style={{background:'#2563eb'}}
                onClick={guardarReprogramacion}
                disabled={!reprogramando.nuevaFecha || reprogramando.nuevaFecha < new Date().toISOString().split('T')[0]}
              >
                ✓ Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 Modal de configuración de límite AHORA SÍ ESTÁ DENTRO DEL COMPONENTE */}
      {mostrarConfigLimite && (
        <div className="confirm-overlay-dash">
          <div className="confirm-modal-dash">
            <h3>Configurar Límite Diario</h3>
            <p>¿Cuántas horas máximo quieres dedicarle a tus actividades por día?</p>
            <input
              type="number"
              min="1" max="24" step="0.5"
              style={{width:'100%', padding:'8px 12px', border:'1.5px solid #2563eb', borderRadius:8, fontSize:14, marginTop:10, boxSizing:'border-box'}}
              value={inputLimite}
              onChange={e => { setInputLimite(e.target.value); setErrorLimite(''); }}
              onKeyDown={e => { if (e.key === 'Enter') guardarLimite(false); }}
              autoFocus
            />
            {errorLimite && <p className="confirm-aviso-dash" style={{marginTop:8}}>⚠ {errorLimite}</p>}
            <div className="confirm-botones-dash" style={{marginTop: 20}}>
              <button className="confirm-btn-cancelar-dash" onClick={() => setMostrarConfigLimite(false)} disabled={guardandoLimite}>Cancelar</button>
              <button
                className="confirm-btn-eliminar-dash"
                style={{background:'#2563eb'}}
                onClick={() => guardarLimite(false)}
                disabled={guardandoLimite || !inputLimite}
              >
                {guardandoLimite ? <IconSpinner /> : '✓ Guardar límite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de conflicto: el nuevo límite hace que ciertos días superen el máximo */}
      {conflictoLimite && (
        <div className="confirm-overlay-dash">
          <div className="confirm-modal-dash" style={{maxWidth: 560}}>
            <h3>⚠️ Conflicto con el nuevo límite</h3>
            <p style={{color:'#475569', fontSize:14}}>
              Quieres bajar tu límite a <strong>{conflictoLimite.nuevoLimite}h</strong>, pero
              {' '}<strong>{conflictoLimite.dias.length} día(s)</strong> ya tienen actividades programadas que superan ese límite.
            </p>

            {/* Lista de días en conflicto con sus actividades */}
            <div style={{
              background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:8,
              padding:12, marginTop:12, maxHeight:240, overflowY:'auto'
            }}>
              {conflictoLimite.dias.map((d) => {
                const actsDelDia = [
                  ...(tareasData?.vencidas || []),
                  ...(tareasData?.hoy || []),
                  ...(tareasData?.proximas || []),
                ].filter(a => a.due_date === d.fecha);
                return (
                  <div key={d.fecha} style={{marginBottom:10, paddingBottom:8, borderBottom:'1px dashed #fdba74'}}>
                    <div style={{fontWeight:600, color:'#9a3412', fontSize:13}}>
                      📅 {formatFecha(d.fecha)} — {d.horas}h programadas (límite {conflictoLimite.nuevoLimite}h)
                    </div>
                    {actsDelDia.length > 0 ? (
                      <div style={{marginTop:6, display:'flex', flexDirection:'column', gap:4}}>
                        {actsDelDia.map(a => (
                          <div key={a.id} style={{
                            display:'flex', justifyContent:'space-between', alignItems:'center',
                            background:'#fff', borderRadius:6, padding:'6px 10px', fontSize:13
                          }}>
                            <span>{a.title} <span style={{color:'#94a3b8'}}>({a.horas_estimadas}h)</span></span>
                            <button
                              style={{
                                background:'#2563eb', color:'#fff', border:'none',
                                padding:'4px 10px', borderRadius:6, fontSize:12, cursor:'pointer'
                              }}
                              onClick={() => { 
                                // 🟢 CORRECCIÓN: Quitamos el setConflictoLimite(null) para que no se cierre el fondo
                                setAjustandoHoras(a); 
                              }}
                            >
                              Ajustar Horas
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{marginTop:4, fontSize:12, color:'#64748b', fontStyle:'italic'}}>
                        Las horas de este día provienen de subtareas. Abre la actividad padre desde el dashboard y edita allí sus subtareas.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="confirm-aviso-dash" style={{marginTop:12, fontSize:13}}>
              Tienes dos opciones:
            </p>
            <ul style={{margin:'0 0 14px 18px', fontSize:13, color:'#475569', lineHeight:1.6}}>
              <li><strong>Editar las actividades</strong> para que respeten el nuevo límite (recomendado).</li>
              <li><strong>Cambiar el límite igual</strong> y dejar las actividades como están — verás un aviso permanente hasta resolverlas.</li>
            </ul>
            <div className="confirm-botones-dash" style={{flexWrap:'wrap', gap:8}}>
              <button
                className="confirm-btn-cancelar-dash"
                onClick={() => setConflictoLimite(null)}
                disabled={guardandoLimite}
              >
                Cancelar
              </button>
              <button
                className="confirm-btn-eliminar-dash"
                style={{background:'#f59e0b'}}
                onClick={() => guardarLimite(true)}
                disabled={guardandoLimite}
              >
                {guardandoLimite ? <IconSpinner /> : 'Cambiar límite igual'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 Mini-modal para ajustar horas rápidamente */}
      {ajustandoHoras && (
        <ModalAjusteHoras
          actividad={ajustandoHoras}
          token={token}
          limiteObjetivo={conflictoLimite ? conflictoLimite.nuevoLimite : null} 
          onClose={() => setAjustandoHoras(null)}
          onGuardado={async () => {
            // Cerramos la ventanita pequeña
            setAjustandoHoras(null);
            
            // Recargamos tareas en el fondo
            await cargarTareas();
            
            if (conflictoLimite) {
               const limiteIntentado = conflictoLimite.nuevoLimite;
               try {
                 const res = await fetch(`${API_BASE}/api/usuario/limite-horas/`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ limite_horas_diarias: limiteIntentado, confirmar: false })
                 });
                 const json = await res.json().catch(() => ({}));
                 
                 if (res.ok && json?.status === 'warning' && json?.data?.dias_en_conflicto) {
                   setConflictoLimite({
                     nuevoLimite: limiteIntentado,
                     dias: json.data.dias_en_conflicto,
                     mensaje: json.data.mensaje,
                   });
                   // 🟢 FEEDBACK CLARO: Te avisamos que se guardó, pero aún falta bajarle más al día
                   setExitoMsg(`Se guardó. Pero la suma del día aún supera las ${limiteIntentado}h.`);
                   setTimeout(() => setExitoMsg(''), 4000);
                 } 
                 else if (res.ok) {
                   setLimiteDiario(limiteIntentado);
                   setConflictoLimite(null);
                   setExitoMsg(`¡Excelente! Todos los conflictos resueltos. Límite aplicado: ${limiteIntentado}h.`);
                   setTimeout(() => setExitoMsg(''), 4000);
                 }
               } catch (err) {
                 console.error("Error validando el límite tras el ajuste:", err);
               }
            } else {
               setExitoMsg('Horas ajustadas correctamente.');
               setTimeout(() => setExitoMsg(''), 3000);
            }
          }}
        />
      )}

      {exitoMsg && (
        <div className="exito-toast">✅ {exitoMsg}</div>
      )}

    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE NUEVO: MINI-MODAL PARA AJUSTAR HORAS RÁPIDAMENTE
// ─────────────────────────────────────────────────────────────
function ModalAjusteHoras({ actividad, token, limiteObjetivo, onClose, onGuardado }) {
  const [horas, setHoras] = useState(actividad.horas_estimadas || 0);
  const [subtareas, setSubtareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/subtasks/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => {
        const list = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
        setSubtareas(list.filter(st => st.activity === actividad.id).map(st => ({
          ...st, inputHoras: st.horas_estimadas
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actividad.id, token]);

  const guardar = async () => {
    setGuardando(true);
    setError('');
    try {
      if (subtareas.length > 0) {
        let sumaTotal = 0;
        for (let st of subtareas) {
          sumaTotal += (parseFloat(st.inputHoras) || 0);
        }

        const horasParentActuales = parseFloat(actividad.horas_estimadas) || 0;

        // REGLA DE DJANGO: Si vamos a AUMENTAR el total, primero actualizamos el padre para hacer "espacio".
        if (sumaTotal > horasParentActuales) {
          const resPadre = await fetch(`${API_BASE}/api/activities/${actividad.id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ horas_estimadas: sumaTotal })
          });
          if (!resPadre.ok) throw new Error("Error al aumentar horas de la actividad.");
        }

        // Actualizamos cada subtarea
        for (let st of subtareas) {
          const val = parseFloat(st.inputHoras) || 0;
          if (val !== parseFloat(st.horas_estimadas)) {
            const resSt = await fetch(`${API_BASE}/api/v2/subtasks/${st.id}/patch/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ horas_estimadas: val })
            });
            if (!resSt.ok) {
              const errData = await resSt.json().catch(()=>({}));
              throw new Error(errData.message || "Error al actualizar una subtarea.");
            }
          }
        }

        // REGLA DE DJANGO: Si vamos a DISMINUIR el total, actualizamos el padre al final.
        if (sumaTotal <= horasParentActuales) {
          const resPadre = await fetch(`${API_BASE}/api/activities/${actividad.id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ horas_estimadas: sumaTotal })
          });
          if (!resPadre.ok) throw new Error("Error al reducir horas de la actividad.");
        }

      } else {
        // Ajuste directo si no hay subtareas
        const res = await fetch(`${API_BASE}/api/activities/${actividad.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ horas_estimadas: parseFloat(horas) })
        });
        if (!res.ok) throw new Error("Error al guardar las horas de la actividad.");
      }
      onGuardado();
    } catch (e) {
      setError(e.message || 'Ocurrió un error de conexión.');
    }
    setGuardando(false);
  };

  const sumaActual = subtareas.length > 0 
    ? subtareas.reduce((acc, st) => acc + (parseFloat(st.inputHoras) || 0), 0)
    : parseFloat(horas) || 0;

  return (
    // 🟢 CORRECCIÓN NUCLEAR: position fixed y zIndex gigantesco para forzarlo al frente.
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="confirm-modal-dash" style={{ maxWidth: 450, width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ marginBottom: 10 }}>Ajuste Rápido de Horas</h3>
        
        {limiteObjetivo && (
           <div style={{ background: '#eff6ff', padding: '8px 12px', borderRadius: 6, marginBottom: 15, border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <span style={{ fontSize: 13, color: '#1e3a8a' }}>Límite que quieres alcanzar:</span>
             <span style={{ fontSize: 14, fontWeight: 700, color: '#1d4ed8' }}>{limiteObjetivo}h / día</span>
           </div>
        )}

        <p style={{ fontSize: 13, color: '#475569', marginBottom: 15 }}>
          Ajustando horas de: <strong style={{color: '#1e293b'}}>{actividad.title}</strong>
        </p>
        
        {loading ? (
          <p style={{textAlign:'center', padding:20}}><IconSpinner /> Cargando...</p>
        ) : subtareas.length > 0 ? (
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>ESTA ACTIVIDAD TIENE SUBTAREAS:</p>
            {subtareas.map((st) => (
              <div key={st.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, background: '#fff', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 13, color: '#334155', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: 10 }}>
                  {st.title || st.titulo}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input 
                    type="number" min="0.5" step="0.5" 
                    value={st.inputHoras} 
                    onChange={e => {
                      const val = e.target.value;
                      setSubtareas(prev => prev.map(item => item.id === st.id ? { ...item, inputHoras: val } : item));
                    }}
                    style={{ width: 60, padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>h</span>
                </div>
              </div>
            ))}
            
            <div style={{ 
               textAlign: 'right', fontSize: 13, fontWeight: 600, marginTop: 10,
               color: limiteObjetivo && sumaActual > limiteObjetivo ? '#dc2626' : '#2563eb'
            }}>
              Suma Total: {sumaActual}h
            </div>
          </div>
        ) : (
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
               <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>NUEVAS HORAS ESTIMADAS:</label>
               {limiteObjetivo && sumaActual > limiteObjetivo && (
                 <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Aún supera el límite</span>
               )}
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input 
                  type="number" min="0.5" step="0.5" 
                  value={horas} 
                  onChange={e => setHoras(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }}
                  autoFocus
                />
                <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>horas</span>
             </div>
          </div>
        )}

        {error && <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', padding: '8px 12px', borderRadius: 6, color: '#dc2626', fontSize: 13, marginTop: 12, fontWeight: 500 }}>⚠ {error}</div>}

        <div className="confirm-botones-dash" style={{ marginTop: 20 }}>
          <button className="confirm-btn-cancelar-dash" onClick={onClose} disabled={guardando}>Cancelar</button>
          <button className="confirm-btn-eliminar-dash" style={{ background: '#2563eb' }} onClick={guardar} disabled={guardando}>
            {guardando ? <IconSpinner /> : '✓ Guardar Horas'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;