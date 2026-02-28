// ============================================================
// App.js - Conectado a Django Backend
// ============================================================

import React, { useState, useEffect } from 'react';
import './App.css';

function App() {

  const [tabActiva, setTabActiva] = useState('hoy');
  const [actividades, setActividades] = useState([]);

  // 🔌 CONEXIÓN CON DJANGO
  useEffect(() => {
    fetch("https://miniproyecto-1-zfn4.onrender.com/api/productos/")
      .then(res => res.json())
      .then(data => {
        console.log("Datos recibidos:", data);
        setActividades(data);
      })
      .catch(error => console.error("Error:", error));
  }, []);

  return (
    <div className="app">

      {/* ---- CABECERA ---- */}
      <header className="cabecera">
        <div className="cabecera-titulo">
          <span className="icono-cabecera">📅</span>
          <h1>Gestión de Actividades Evaluativas</h1>
        </div>

        <nav className="tabs">
          <button
            className={tabActiva === 'hoy' ? 'tab activa' : 'tab'}
            onClick={() => setTabActiva('hoy')}
          >
            🗂 Hoy
          </button>
          <button
            className={tabActiva === 'actividades' ? 'tab activa' : 'tab'}
            onClick={() => setTabActiva('actividades')}
          >
            📋 Actividades
          </button>
        </nav>
      </header>

      {/* ---- CONTENIDO ---- */}
      {tabActiva === 'hoy' && (
        <main className="contenido">

          <div className="panel-titulo">
            <h2>Panel General</h2>
          </div>

          {/* ---- ESTADÍSTICAS ---- */}
          <div className="estadisticas">

            <div className="tarjeta">
              <span className="tarjeta-label">Total Asignaturas</span>
              <span className="tarjeta-numero morado">
                {actividades.length}
              </span>
              <span className="tarjeta-descripcion">
                registradas en el sistema
              </span>
            </div>

          </div>

          {/* ---- LISTA DE ASIGNATURAS ---- */}
          <div className="seccion">
            <h3 className="seccion-titulo">
              → Asignaturas Registradas
            </h3>

            <div className="lista-actividades">
              {actividades.length === 0 ? (
                <p>No hay asignaturas registradas</p>
              ) : (
                actividades.map(actividad => (
                  <div key={actividad.id} className="actividad-fila">
                    <div className="actividad-info">
                      <span className="actividad-nombre">
                        {actividad.codigo} - {actividad.nombre}
                      </span>
                      <span className="actividad-fecha">
                        Créditos: {actividad.creditos}
                      </span>
                      <span className="actividad-fecha">
                        {actividad.descripcion}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </main>
      )}

      {tabActiva === 'actividades' && (
        <main className="contenido">
          <div className="vacio">
            <p>Sección en construcción 🚧</p>
          </div>
        </main>
      )}

    </div>
  );
}

export default App;