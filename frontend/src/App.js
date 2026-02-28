// ============================================================
// App.js - Dashboard Académico Moderno
// ============================================================

import React, { useState, useEffect } from 'react';
import './App.css';

function App() {

  const [tabActiva, setTabActiva] = useState('hoy');
  const [asignaturas, setAsignaturas] = useState([]);

  // 🔌 Conexión con Django
  useEffect(() => {
    fetch("https://miniproyecto-1-zfn4.onrender.com/api/asignaturas/")
      .then(res => res.json())
      .then(data => setAsignaturas(data))
      .catch(error => console.error("Error:", error));
  }, []);

  return (
    <div className="app">

      {/* ================= CABECERA ================= */}
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
            Hoy
          </button>

          <button
            className={tabActiva === 'asignaturas' ? 'tab activa' : 'tab'}
            onClick={() => setTabActiva('asignaturas')}
          >
            Asignaturas
          </button>

          <button className="tab">
            Actividades (Coming Soon)
          </button>

          <button className="tab">
            Avance (Coming Soon)
          </button>
        </nav>
      </header>

      {/* ================= PANEL HOY ================= */}
      {tabActiva === 'hoy' && (
        <main className="contenido">

          <div className="panel-titulo">
            <h2>Panel General</h2>
            <span className="fecha">
              {new Date().toLocaleDateString()}
            </span>
          </div>

          <div className="estadisticas">

            <div className="tarjeta">
              <span className="tarjeta-label">Asignaturas Activas</span>
              <span className="tarjeta-numero azul">
                {asignaturas.length}
              </span>
              <span className="tarjeta-descripcion">
                registradas en el sistema
              </span>
            </div>

            <div className="tarjeta">
              <span className="tarjeta-label">Carga Semanal</span>
              <span className="tarjeta-numero morado">
                —
              </span>
              <span className="tarjeta-descripcion">
                Coming Soon
              </span>
            </div>

            <div className="tarjeta">
              <span className="tarjeta-label">Conflictos</span>
              <span className="tarjeta-numero naranja">
                —
              </span>
              <span className="tarjeta-descripcion">
                Coming Soon
              </span>
            </div>

            <div className="tarjeta">
              <span className="tarjeta-label">Progreso General</span>
              <span className="tarjeta-numero rojo">
                —
              </span>
              <span className="tarjeta-descripcion">
                Coming Soon
              </span>
            </div>

          </div>

          <div className="seccion">
            <h3 className="seccion-titulo">
              Próximas Actividades
            </h3>

            <div className="vacio">
              <div className="check-verde">✓</div>
              <p>Módulo de actividades en desarrollo</p>
            </div>
          </div>

        </main>
      )}

      {/* ================= ASIGNATURAS ================= */}
      {tabActiva === 'asignaturas' && (
        <main className="contenido">

          <div className="panel-titulo">
            <h2>Asignaturas Registradas</h2>
            <span className="fecha">
              Gestión académica actual
            </span>
          </div>

          <div className="seccion">

            {asignaturas.length === 0 ? (
              <div className="vacio">
                <div className="check-verde">✓</div>
                <p>No hay asignaturas registradas</p>
              </div>
            ) : (
              <div className="lista-actividades">
                {asignaturas.map(asignatura => (
                  <div key={asignatura.id} className="actividad-fila">

                    <div className="actividad-info">
                      <span className="actividad-nombre">
                        {asignatura.codigo} - {asignatura.nombre}
                      </span>

                      <span className="actividad-fecha">
                        Créditos: {asignatura.creditos}
                      </span>

                      <span className="actividad-fecha">
                        {asignatura.descripcion}
                      </span>
                    </div>

                    <span className="badge badge-project">
                      Activa
                    </span>

                  </div>
                ))}
              </div>
            )}

          </div>

        </main>
      )}

    </div>
  );
}

export default App;