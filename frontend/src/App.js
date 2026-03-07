// ============================================================
// App.js - Dashboard Académico Moderno
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import CreateActivity from './CreateActivity';
import ActivityDetail from './ActivityDetail';

const API_BASE = process.env.REACT_APP_API_URL || 'https://miniproyecto-1-zfn4.onrender.com';

const TIPO_CONFIG = {
  exam:         { label: 'Examen',       clase: 'badge-exam' },
  project:      { label: 'Proyecto',     clase: 'badge-project' },
  presentation: { label: 'Presentación', clase: 'badge-presentation' },
  homework:     { label: 'Tarea',        clase: 'badge-homework' },
};

const DIFICULTAD_CONFIG = {
  baja:    { label: 'Baja',    clase: 'dif-baja' },
  media:   { label: 'Media',   clase: 'dif-media' },
  alta:    { label: 'Alta',    clase: 'dif-alta' },
  critica: { label: 'Crítica', clase: 'dif-critica' },
};

function diasRestantes(fechaStr) {

  const hoy = new Date();
  hoy.setHours(0,0,0,0);

  const fecha = new Date(fechaStr + 'T00:00:00');
  const diff = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));

  if (diff === 0) return { texto: 'Hoy', clase: 'dias-hoy' };
  if (diff === 1) return { texto: 'Mañana', clase: 'dias-pronto' };
  if (diff <= 3)  return { texto: `En ${diff} días`, clase: 'dias-pronto' };

  return { texto: `En ${diff} días`, clase: 'dias-normal' };
}

function App() {

  const [tabActiva, setTabActiva] = useState('hoy');

  const [asignaturas, setAsignaturas] = useState([]);
  const [proximasActividades, setProximasActividades] = useState([]);

  const [cargandoActividades, setCargandoActividades] = useState(true);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);

  // ================= CARGAR ASIGNATURAS =================

  useEffect(() => {

    fetch(`${API_BASE}/api/asignaturas/`)
      .then(res => res.json())
      .then(data => setAsignaturas(data))
      .catch(err => console.error('Error cargando asignaturas:', err));

  }, []);

  // ================= CARGAR ACTIVIDADES =================

  const cargarActividades = useCallback(() => {

    setCargandoActividades(true);

    fetch(`${API_BASE}/api/activities/`)
      .then(res => res.json())
      .then(data => {

        const hoy = new Date();
        hoy.setHours(0,0,0,0);

        const proximas = data
          .filter(a => new Date(a.due_date + 'T00:00:00') >= hoy)
          .sort((a,b) => new Date(a.due_date) - new Date(b.due_date));

        setProximasActividades(proximas);
        setCargandoActividades(false);

      })
      .catch(err => {

        console.error('Error cargando actividades:', err);
        setCargandoActividades(false);

      });

  }, []);

  useEffect(() => {
    cargarActividades();
  }, [cargarActividades]);

  const handleActividadCreada = () => {

    cargarActividades();
    setMostrarFormulario(false);

  };

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

          <button className="tab">Actividades (Coming Soon)</button>
          <button className="tab">Avance (Coming Soon)</button>

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


          {/* BOTÓN CREAR ACTIVIDAD */}

          <button
            className="btn-nueva-actividad"
            onClick={() => setMostrarFormulario(true)}
          >
            + Nueva Actividad
          </button>


          {/* MODAL CREAR ACTIVIDAD */}

          {mostrarFormulario && (

            <CreateActivity
              onClose={() => setMostrarFormulario(false)}
              onActivityCreated={handleActividadCreada}
            />

          )}


          {/* ================= PRÓXIMAS ACTIVIDADES ================= */}

          <div className="seccion">

            <h3 className="seccion-titulo">
              Próximas Actividades
            </h3>

            {cargandoActividades ? (

              <div className="vacio">

                <div className="spinner"></div>

                <p>Cargando actividades...</p>

              </div>

            ) : (

              <div className="lista-actividades">

                {proximasActividades.map(actividad => {

                  const tipo = TIPO_CONFIG[actividad.activity_type] || {
                    label: actividad.activity_type,
                    clase: 'badge-project'
                  };

                  const dif = DIFICULTAD_CONFIG[actividad.difficulty] || null;
                  const dias = diasRestantes(actividad.due_date);

                  return (

                    <div
                      key={actividad.id}
                      className="actividad-fila clickeable"
                      title="Ver detalle y subtareas"
                      onClick={() => setActividadSeleccionada(actividad)}
                    >

                      <div className="actividad-izq">

                        <span className={`dias-badge ${dias.clase}`}>
                          {dias.texto}
                        </span>

                        <span className="fecha-vence">
                          {new Date(
                            actividad.due_date + 'T00:00:00'
                          ).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </span>

                      </div>


                      <div className="actividad-info">

                        <span className="actividad-nombre">
                          {actividad.title}
                        </span>

                        {actividad.description && (
                          <span className="actividad-fecha">
                            {actividad.description}
                          </span>
                        )}

                      </div>


                      <div className="actividad-badges">

                        <span className={`badge ${tipo.clase}`}>
                          {tipo.label}
                        </span>

                        {dif && (
                          <span className={`badge-dif ${dif.clase}`}>
                            {dif.label}
                          </span>
                        )}

                        <span className="ver-detalle">
                          Ver →
                        </span>

                      </div>

                    </div>

                  );

                })}

              </div>

            )}

          </div>

        </main>

      )}


      {/* ================= MODAL DETALLE ================= */}

      {actividadSeleccionada && (

        <ActivityDetail
          actividad={actividadSeleccionada}
          onClose={() => setActividadSeleccionada(null)}
        />

      )}

    </div>

  );

}

export default App;