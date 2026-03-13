import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateActivity from './CreateActivity';
import './Dashboard.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState(null); 
  const [defaultDateForModal, setDefaultDateForModal] = useState('');
  
  const [toastMessage, setToastMessage] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: null });
  const [selectedActivity, setSelectedActivity] = useState(null);

  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);

  const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const currentDate = new Date().toLocaleDateString('es-ES', opcionesFecha);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const fetchActividades = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/activities/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setActividades(data);
        else if (data && data.data && Array.isArray(data.data)) setActividades(data.data);
        else if (data && data.results && Array.isArray(data.results)) setActividades(data.results);
        else setActividades([]); 
      }
    } catch (error) {
      console.error(error);
      setActividades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    setUserName(localStorage.getItem('username') || 'Usuario'); 
    fetchActividades();
  }, [navigate]);

  useEffect(() => {
    if (selectedActivity) {
      const updated = actividades.find(a => a.id === selectedActivity.id);
      if (updated) setSelectedActivity(updated);
    }
  }, [actividades]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleActivitySaved = (actionType) => {
    setIsModalOpen(false);
    setActivityToEdit(null);
    showToast(actionType === 'edit' ? '✏️ Actividad actualizada exitosamente' : '✅ Se creó exitosamente la actividad');
    fetchActividades(); 
  };

  // =============== MAGIA DE LAS FECHAS ===============
  const getFormattedDate = (daysToAdd = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    // Truco para evitar problemas de zona horaria: extraemos YYYY-MM-DD local
    const offset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - offset)).toISOString().split('T')[0];
  };

  const openCreateModal = (seccion) => {
    setActivityToEdit(null);
    if (seccion === 'hoy') setDefaultDateForModal(getFormattedDate(0));
    else if (seccion === 'proximas') setDefaultDateForModal(getFormattedDate(1));
    else setDefaultDateForModal('');
    setIsModalOpen(true);
  };

  const openEditModal = (actividad, e) => {
    if (e) e.stopPropagation();
    setActivityToEdit(actividad);
    setIsModalOpen(true);
  };

  const promptDelete = (id, e) => {
    if (e) e.stopPropagation();
    setDeleteConfirmation({ isOpen: true, id: id });
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/activities/${deleteConfirmation.id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok || response.status === 204) {
        setActividades(actividades.filter(act => act.id !== deleteConfirmation.id));
        setDeleteConfirmation({ isOpen: false, id: null });
        if (selectedActivity && selectedActivity.id === deleteConfirmation.id) setSelectedActivity(null);
        showToast('🗑️ La actividad fue eliminada correctamente');
      }
    } catch (error) {
      console.error(error);
      setDeleteConfirmation({ isOpen: false, id: null });
    }
  };

  const toggleSubtask = async (subtaskId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/subtasks/${subtaskId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ is_completed: !currentStatus }) 
      });
      if (response.ok) fetchActividades(); 
    } catch (error) {
      console.error("Error al actualizar subtarea:", error);
    }
  };

  // Lógica impecable de filtrado
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  
  const parseDate = (dateString) => {
    if (!dateString) return null;
    const datePart = dateString.split('T')[0];
    const parts = datePart.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]); 
  };

  const actividadesAtrasadas = actividades.filter(a => { const d = parseDate(a.due_date); return d && d < hoy; });
  const actividadesHoy = actividades.filter(a => {
    const s = parseDate(a.start_date); const d = parseDate(a.due_date);
    return (s && s.getTime() === hoy.getTime()) || (d && d.getTime() === hoy.getTime()) || (s && d && s <= hoy && d >= hoy);
  });
  const actividadesProximas = actividades.filter(a => { const s = parseDate(a.start_date); return s && s > hoy; });
  const semanaCount = actividadesProximas.length + actividadesHoy.length; 

  return (
    <div className="dashboard-container">
      
      {toastMessage && <div className="toast-success">{toastMessage}</div>}

      {deleteConfirmation.isOpen && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <div className="confirm-icon">⚠️</div>
            <div className="confirm-text"><span style={{color: '#dc2626'}}>¿Está seguro que desea eliminar esta actividad?</span></div>
            <div className="confirm-botones">
              <button className="btn-confirm-accept" onClick={confirmDelete}>Aceptar</button>
              <button className="btn-confirm-cancel" onClick={() => setDeleteConfirmation({isOpen: false, id: null})}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {selectedActivity && (
        <div className="detalle-overlay" onClick={() => setSelectedActivity(null)}>
          <div className="detalle-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detalle-header-cerrar"><button onClick={() => setSelectedActivity(null)}>X</button></div>
            
            <div className="actividad-card" style={{border: 'none', boxShadow: 'none', margin: 0, paddingTop: '10px'}}>
              <div className="actividad-header">
                <h3>{selectedActivity.title}</h3>
                <div className="actividad-acciones">
                  <button onClick={() => { setSelectedActivity(null); openEditModal(selectedActivity); }}>✏️</button>
                  <button onClick={() => promptDelete(selectedActivity.id)}>🗑️</button>
                </div>
              </div>
              
              <p className="actividad-desc">{selectedActivity.description}</p>
              <div className="badges-container">
                <span className="badge badge-tipo">{selectedActivity.activity_type}</span>
                <span className="badge badge-estado">En Progreso</span>
                <span className="badge badge-prioridad">Prioridad {selectedActivity.difficulty}</span>
              </div>
              <div className="actividad-info-grid">
                <div className="info-item"><span>Inicio</span><strong>{selectedActivity.start_date}</strong></div>
                <div className="info-item"><span>Entrega</span><strong>{selectedActivity.due_date}</strong></div>
                <div className="info-item"><span>Progreso</span><strong>{selectedActivity.progreso_subtareas?.porcentaje || 0}%</strong></div>
                <div className="info-item"><span>Horas</span><strong>{selectedActivity.horas_trabajadas || 0} / {selectedActivity.horas_estimadas}</strong></div>
              </div>
              <div className="progreso-container">
                <div className="progreso-header">
                  <span>Progreso General</span><span style={{color: '#dc2626'}}>{selectedActivity.progreso_subtareas?.porcentaje || 0}%</span>
                </div>
                <div className="progreso-barra">
                  <div className="progreso-fill" style={{width: `${selectedActivity.progreso_subtareas?.porcentaje || 0}%`}}></div>
                </div>
              </div>
              
              <div className="tareas-seccion">
                <div className="tareas-titulo">
                  <span>Tareas ({selectedActivity.progreso_subtareas?.completadas || 0}/{selectedActivity.progreso_subtareas?.total || 0})</span>
                </div>
                {/* CHECKLIST: Clic para marcar subtarea */}
                {selectedActivity.subtasks && selectedActivity.subtasks.map(tarea => (
                  <div key={tarea.id} className="tarea-item" style={{cursor: 'pointer'}} onClick={() => toggleSubtask(tarea.id, tarea.is_completed)}>
                    <div className={`tarea-check ${tarea.is_completed ? 'completada' : ''}`}>
                      {tarea.is_completed ? '✓' : ''}
                    </div>
                    <span style={{textDecoration: tarea.is_completed ? 'line-through' : 'none', color: tarea.is_completed ? '#999' : '#444'}}>
                      {tarea.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="cabecera">
        <div className="cabecera-titulo"><span role="img" aria-label="calendar" style={{color: '#2563eb', fontSize: '24px'}}>📅</span><h1>Gestión de Actividades</h1></div>
        <div className="user-actions"><span>👤 {userName}</span><button onClick={handleLogout}><span>🚪</span> Salir</button></div>
      </header>
      <div className="info-banner"><span style={{fontSize: '16px'}}>ℹ️</span> Priorizamos tu día: primero lo vencido, luego lo urgente de hoy, y finalmente lo próximo.</div>
      <div className="tabs-container">
        <nav className="tabs">
          <button className="tab activa">⊞ Hoy</button><button className="tab">📋 Actividades</button><button className="tab">📅 Planificación</button><button className="tab">📈 Avance</button>
        </nav>
      </div>

      <main className="contenido">
        <div className="panel-titulo"><h2>Panel de Hoy</h2><span className="fecha">{currentDate}</span></div>
        <div className="estadisticas">
          <div className="tarjeta"><span className="tarjeta-label">Hoy</span><span className="tarjeta-numero azul">{actividadesHoy.length}</span><span className="tarjeta-descripcion">actividades activas</span></div>
          <div className="tarjeta"><span className="tarjeta-label">Esta Semana</span><span className="tarjeta-numero morado">{semanaCount}</span><span className="tarjeta-descripcion">actividades programadas</span></div>
          <div className="tarjeta"><span className="tarjeta-label">Atrasadas</span><span className="tarjeta-numero rojo">{actividadesAtrasadas.length}</span><span className="tarjeta-descripcion">necesitan reprogramación</span></div>
        </div>

        {/* ================= ATRASADAS ================= */}
        <div className="seccion" style={{padding: actividadesAtrasadas.length > 0 ? '0' : '20px', overflow: 'hidden'}}>
          <div className="seccion-titulo" style={{color: '#dc2626', padding: actividadesAtrasadas.length > 0 ? '20px 20px 0 20px' : '0'}}>
            <span>❗</span> Actividades Atrasadas
          </div>
          {loading ? ( <p style={{textAlign: 'center'}}>Cargando...</p> ) : actividadesAtrasadas.length === 0 ? (
            <div className="vacio">
              <div className="check-verde">✓</div>
              <p style={{fontWeight: '600'}}>No tienes actividades atrasadas</p>
              <p className="vacio-sub">¡¡Muy bien, sigue así!!</p>
            </div>
          ) : (
            <div style={{marginTop: '15px'}}>
              {actividadesAtrasadas.map((actividad) => (
                <div key={actividad.id} className="actividad-fila" onClick={() => setSelectedActivity(actividad)}>
                  <div className="actividad-fila-izq">
                    <div className="check-circular" style={{borderColor: '#dc2626'}}></div>
                    <div><div className="actividad-fila-titulo" style={{color: '#dc2626'}}>{actividad.title}</div><div className="actividad-fila-fecha" style={{color: '#ef4444'}}>Venció: {actividad.due_date}</div></div>
                  </div>
                  <div className="actividad-fila-der">
                    <span className="badge badge-tipo">{actividad.activity_type}</span>
                    <button className="btn-icon" onClick={(e) => openEditModal(actividad, e)}>✏️</button>
                    <button className="btn-icon" onClick={(e) => promptDelete(actividad.id, e)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= HOY ================= */}
        <div className="seccion" style={{padding: actividadesHoy.length > 0 ? '0' : '20px', overflow: 'hidden'}}>
          <div className="seccion-titulo" style={{color: '#2563eb', padding: actividadesHoy.length > 0 ? '20px 20px 0 20px' : '0'}}>
            <span>🕒</span> Prioridades para Hoy
            <button className="btn-crear-actividad" style={{marginLeft: 'auto', border: '1px solid #ccc', padding: '5px 10px', borderRadius: '6px'}} onClick={() => openCreateModal('hoy')}>+ Agregar actividad</button>
          </div>
          {loading ? ( <p style={{textAlign: 'center'}}>Cargando...</p> ) : actividadesHoy.length === 0 ? (
            <div className="vacio">
              <div className="check-verde">✓</div>
              <p style={{fontWeight: '600'}}>No tienes actividades programadas para hoy</p>
            </div>
          ) : (
            <div style={{marginTop: '15px'}}>
              {actividadesHoy.map((actividad) => (
                <div key={actividad.id} className="actividad-fila" onClick={() => setSelectedActivity(actividad)}>
                  <div className="actividad-fila-izq">
                    <div className="check-circular"></div>
                    <div><div className="actividad-fila-titulo">{actividad.title}</div><div className="actividad-fila-fecha">Vence: {actividad.due_date}</div></div>
                  </div>
                  <div className="actividad-fila-der">
                    <span className="badge badge-tipo">{actividad.activity_type}</span>
                    <span className="badge badge-prioridad">Prioridad {actividad.difficulty}</span>
                    <button className="btn-icon" onClick={(e) => openEditModal(actividad, e)}>✏️</button>
                    <button className="btn-icon" onClick={(e) => promptDelete(actividad.id, e)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= PRÓXIMAS ================= */}
        <div className="seccion" style={{padding: actividadesProximas.length > 0 ? '0' : '20px', overflow: 'hidden'}}>
          <div className="seccion-titulo" style={{color: '#4b5563', padding: actividadesProximas.length > 0 ? '20px 20px 0 20px' : '0'}}>
            <span>📅</span> Próximas Actividades
            <button className="btn-crear-actividad" style={{marginLeft: 'auto', border: '1px solid #ccc', padding: '5px 10px', borderRadius: '6px'}} onClick={() => openCreateModal('proximas')}>+ Agregar actividad</button>
          </div>
          {loading ? ( <p style={{textAlign: 'center'}}>Cargando...</p> ) : actividadesProximas.length === 0 ? (
            <div className="vacio">
              <div className="check-verde">✓</div>
              <p style={{fontWeight: '600'}}>No tienes próximas Actividades</p>
            </div>
          ) : (
            <div style={{marginTop: '15px'}}>
              {actividadesProximas.map((actividad) => (
                <div key={actividad.id} className="actividad-fila" onClick={() => setSelectedActivity(actividad)}>
                  <div className="actividad-fila-izq">
                    <div className="check-circular"></div>
                    <div><div className="actividad-fila-titulo">{actividad.title}</div><div className="actividad-fila-fecha">Inicia: {actividad.start_date}</div></div>
                  </div>
                  <div className="actividad-fila-der">
                    <span className="badge badge-tipo">{actividad.activity_type}</span>
                    <button className="btn-icon" onClick={(e) => openEditModal(actividad, e)}>✏️</button>
                    <button className="btn-icon" onClick={(e) => promptDelete(actividad.id, e)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <CreateActivity onClose={() => setIsModalOpen(false)} onActivityCreated={handleActivitySaved} activityToEdit={activityToEdit} defaultDate={defaultDateForModal} />
      )}
    </div>
  );
};

export default Dashboard;