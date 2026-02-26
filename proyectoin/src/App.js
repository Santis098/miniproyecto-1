// ============================================================
// App.js - Panel de Gestión de Actividades Evaluativas
// ============================================================

// Importamos React y el hook useState para manejar estados
import React, { useState } from 'react';

// Importamos los estilos CSS del archivo App.css
import './App.css';

// ============================================================
// DATOS DE EJEMPLO
// Aquí definimos los datos que se mostrarán en el panel.
// En un proyecto real, estos datos vendrían de una base de datos.
// ============================================================

const actividades = [
  {
    id: 1,
    nombre: 'Examen Final de Matemáticas',
    inicio: '26/2/2026',
    tipo: 'exam',
    conflictos: 0,
  },
  {
    id: 2,
    nombre: 'Proyecto de Programación Web',
    inicio: '26/2/2026',
    tipo: 'project',
    conflictos: 1,
  },
  {
    id: 3,
    nombre: 'Presentación de Literatura',
    inicio: '28/2/2026',
    tipo: 'presentation',
    conflictos: 1,
  },
];

// ============================================================
// COMPONENTE PRINCIPAL: App
// Un componente en React es una función que devuelve HTML (JSX)
// ============================================================

function App() {

  // useState nos permite guardar y cambiar datos en la pantalla
  // "tabActiva" guarda qué pestaña está seleccionada ahora mismo
  // "setTabActiva" es la función para cambiarla
  const [tabActiva, setTabActiva] = useState('hoy');

  // Calculamos cuántas actividades tienen conflictos
  const conConflictos = actividades.filter(a => a.conflictos > 0);

  // ============================================================
  // RETURN: Todo lo que está aquí adentro es lo que se muestra
  // en pantalla. Es JSX (mezcla de JavaScript y HTML).
  // ============================================================
  return (
    // El div principal que envuelve toda la aplicación
    <div className="app">

      {/* ---- CABECERA ---- */}
      <header className="cabecera">
        {/* Ícono de calendario + título */}
        <div className="cabecera-titulo">
          <span className="icono-cabecera">📅</span>
          <h1>Gestión de Actividades Evaluativas</h1>
        </div>

        {/* Menú de pestañas de navegación */}
        <nav className="tabs">
          {/* Cada botón cambia la pestaña activa al hacer clic */}
          {/* La clase "activa" cambia el estilo del botón seleccionado */}
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
          <button
            className={tabActiva === 'planificacion' ? 'tab activa' : 'tab'}
            onClick={() => setTabActiva('planificacion')}
          >
            📅 Planificación
          </button>
          <button
            className={tabActiva === 'avance' ? 'tab activa' : 'tab'}
            onClick={() => setTabActiva('avance')}
          >
            📈 Avance
          </button>
        </nav>
      </header>

      {/* ---- CONTENIDO PRINCIPAL ---- */}
      {/* Solo mostramos el panel de "Hoy" cuando esa pestaña está activa */}
      {tabActiva === 'hoy' && (
        <main className="contenido">

          {/* Título y fecha del panel */}
          <div className="panel-titulo">
            <h2>Panel de Hoy</h2>
            <p className="fecha">jueves, 26 de febrero de 2026</p>
          </div>

          {/* ---- TARJETAS DE ESTADÍSTICAS ---- */}
          {/* Estas 4 tarjetas muestran el resumen rápido */}
          <div className="estadisticas">

            {/* Tarjeta 1: Actividades de hoy */}
            <div className="tarjeta">
              <span className="tarjeta-label">Hoy</span>
              <span className="tarjeta-numero azul">0</span>
              <span className="tarjeta-descripcion">actividades activas</span>
            </div>

            {/* Tarjeta 2: Esta semana */}
            <div className="tarjeta">
              <span className="tarjeta-label">Esta Semana</span>
              {/* Mostramos el total de actividades de la semana dinámicamente */}
              <span className="tarjeta-numero morado">{actividades.length}</span>
              <span className="tarjeta-descripcion">actividades programadas</span>
            </div>

            {/* Tarjeta 3: Conflictos */}
            <div className="tarjeta">
              <span className="tarjeta-label">Conflictos</span>
              {/* Mostramos cuántas actividades tienen conflictos */}
              <span className="tarjeta-numero naranja">{conConflictos.length}</span>
              <span className="tarjeta-descripcion">requieren atención</span>
            </div>

            {/* Tarjeta 4: Retrasadas */}
            <div className="tarjeta">
              <span className="tarjeta-label">Retrasadas</span>
              <span className="tarjeta-numero rojo">0</span>
              <span className="tarjeta-descripcion">necesitan reprogramación</span>
            </div>

          </div>

          {/* ---- SECCIÓN: PRIORIDADES PARA HOY ---- */}
          <div className="seccion">
            <h3 className="seccion-titulo">
              <span>🕐</span> Prioridades para Hoy
            </h3>
            {/* Mensaje cuando no hay actividades para hoy */}
            <div className="vacio">
              <div className="check-verde">✓</div>
              <p>No tienes actividades programadas para hoy</p>
              <button className="btn-crear">Crear nueva actividad</button>
            </div>
          </div>

          {/* ---- SECCIÓN: PRÓXIMAS ACTIVIDADES ---- */}
          <div className="seccion">
            <h3 className="seccion-titulo">
              <span>→</span> Próximas Actividades (Esta Semana)
            </h3>

            {/* Recorremos el array de actividades y creamos una fila por cada una */}
            {/* .map() es como un "for" que genera elementos HTML */}
            <div className="lista-actividades">
              {actividades.map(actividad => (
                // Cada elemento necesita un "key" único (usamos el id)
                <div key={actividad.id} className="actividad-fila">
                  <div className="actividad-info">
                    <span className="actividad-nombre">{actividad.nombre}</span>
                    <span className="actividad-fecha">Inicia: {actividad.inicio}</span>
                  </div>
                  {/* Badge/etiqueta que muestra el tipo de actividad */}
                  <span className={`badge badge-${actividad.tipo}`}>
                    {actividad.tipo}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ---- SECCIÓN: ALERTAS ---- */}
          {/* Solo mostramos esta sección si hay conflictos */}
          {conConflictos.length > 0 && (
            <div className="seccion seccion-alerta">
              <h3 className="seccion-titulo alerta-titulo">
                ⚠️ Alertas y Acciones Requeridas
              </h3>
              <p className="alerta-subtitulo">
                <strong>{conConflictos.length} actividad(es) con conflictos</strong>
              </p>

              {/* Listamos solo las actividades que tienen conflictos */}
              {conConflictos.map(actividad => (
                <div key={actividad.id} className="alerta-fila">
                  <div className="actividad-info">
                    <span className="actividad-nombre">{actividad.nombre}</span>
                    <span className="actividad-fecha">
                      {actividad.conflictos} conflicto(s) sin resolver
                    </span>
                  </div>
                  <button className="btn-conflicto">Ver conflictos</button>
                </div>
              ))}
            </div>
          )}

        </main>
      )}

      {/* Mensaje para las otras pestañas (aún no implementadas) */}
      {tabActiva !== 'hoy' && (
        <main className="contenido">
          <div className="vacio">
            <p>Esta sección está en construcción 🚧</p>
          </div>
        </main>
      )}

    </div>
  );
}

// Exportamos el componente para que index.js pueda usarlo
export default App;