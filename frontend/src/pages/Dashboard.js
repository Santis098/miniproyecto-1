import React, { useState, useEffect } from 'react'; // ⬅️ Agregamos useEffect
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Empezamos con un nombre en blanco
  const [userName, setUserName] = useState('');
  const currentDate = 'sábado, 7 de marzo de 2026';

  // ⬅️ NUEVO: Apenas carga la pantalla, buscamos el nombre guardado
  useEffect(() => {
    const nombreGuardado = localStorage.getItem('username');
    if (nombreGuardado) {
      setUserName(nombreGuardado);
    } else {
      setUserName('Usuario'); // Por si acaso no encuentra nada
    }
  }, []);

  const handleLogout = () => {
    // Borramos la llave y el nombre, y lo mandamos al login
    localStorage.removeItem('token');
    localStorage.removeItem('username'); // ⬅️ Limpiamos al salir
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      
      {/* 1. Barra Superior */}
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

      {/* 2. Banner Azul de Información */}
      <div className="info-banner">
        <span>ℹ️</span> Priorizamos tu día: primero lo vencido, luego lo urgente de hoy, y finalmente lo próximo. Ante fechas iguales, sugerimos completar primero las tareas más rápidas.
      </div>

      {/* 3. Menú de Navegación (Tabs) */}
      <nav className="dashboard-nav">
        <div className="nav-tab active"><span>⊞</span> Hoy</div>
        <div className="nav-tab"><span>📋</span> Actividades</div>
        <div className="nav-tab"><span>📅</span> Planificación</div>
        <div className="nav-tab"><span>📈</span> Avance</div>
      </nav>

      {/* 4. Contenido Principal */}
      <main className="dashboard-content">
        
        <div className="page-title">
          <h1>Panel de Hoy</h1>
          <p>{currentDate}</p>
        </div>

        {/* 5. Tarjetas de Estadísticas */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Hoy</h3>
            <div className="stat-number blue">0</div>
            <div className="stat-desc">actividades activas</div>
          </div>
          <div className="stat-card">
            <h3>Esta Semana</h3>
            <div className="stat-number purple">3</div>
            <div className="stat-desc">actividades programadas</div>
          </div>
          <div className="stat-card">
            <h3>Atrasadas</h3>
            <div className="stat-number red">0</div>
            <div className="stat-desc">necesitan reprogramación</div>
          </div>
        </div>

        {/* 6. Sección: Prioridades para Hoy */}
        <div className="section-card">
          <div className="section-header">
            <span>🕒</span> Prioridades para Hoy
          </div>
          <div className="empty-state">
            <div className="success-icon">✅</div>
            <p>No tienes actividades programadas para hoy</p>
            <button className="create-btn">Crear nueva actividad</button>
          </div>
        </div>

        {/* 7. Sección: Próximas Actividades */}
        <div className="section-card">
          <div className="section-header">
            <span>📅</span> Próximas Actividades
          </div>
          
          <div className="activities-list">
            
            {/* Actividad 1 (Con alerta) */}
            <div className="activity-item warning-border">
              <div className="activity-info-group">
                <div className="activity-number">1</div>
                <div className="activity-details">
                  <h4>Presentación de Literatura</h4>
                  <p>Inicia en 2 días - 9/3/2026</p>
                  <div className="conflict-alert">
                    <span>⚠️</span> 1 conflicto(s) sin resolver
                  </div>
                </div>
              </div>
              <button className="ajustar-btn">Ajustar</button>
            </div>

            {/* Actividad 2 */}
            <div className="activity-item">
              <div className="activity-info-group">
                <div className="activity-number">2</div>
                <div className="activity-details">
                  <h4>Quiz de Historia</h4>
                  <p>Inicia en 7 días - 14/3/2026</p>
                </div>
              </div>
              <button className="ajustar-btn">Ajustar</button>
            </div>

            {/* Actividad 3 */}
            <div className="activity-item">
              <div className="activity-info-group">
                <div className="activity-number">3</div>
                <div className="activity-details">
                  <h4>Tarea de Física</h4>
                  <p>Inicia en 10 días - 17/3/2026</p>
                </div>
              </div>
              <button className="ajustar-btn">Ajustar</button>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;