import React, { useEffect, useState } from "react";
import "./ActivityDetail.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://miniproyecto-1-x936.onrender.com";

const IconEdit = () => (
  <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconTrash = () => (
  <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const IconSpinner = () => (
  <svg className="spinner-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
  </svg>
);

function ActivityDetail({ actividad, onClose, onActualizado }) {
  const [editandoAsignatura, setEditandoAsignatura] = useState(false);
  const [asignaturaInput, setAsignaturaInput]       = useState('');
  const [asignaturaMostrada, setAsignaturaMostrada] = useState(null);
  const [asignaturaCargada, setAsignaturaCargada]   = useState(false);

  const [subtasks, setSubtasks]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [mostrarInput, setMostrarInput]       = useState(false);
  const [nuevoTitulo, setNuevoTitulo]         = useState("");
  const [nuevoFecha, setNuevoFecha]           = useState("");
  const [nuevoHoras, setNuevoHoras]           = useState("");
  const [errorNuevo, setErrorNuevo]           = useState("");
  const [errorHoras, setErrorHoras]           = useState('');
  const [editandoId, setEditandoId]           = useState(null);
  const [editandoTitulo, setEditandoTitulo]   = useState("");
  const [editandoFecha, setEditandoFecha]     = useState("");
  const [editandoHorasSub, setEditandoHorasSub] = useState("");
  const [errorEdicion, setErrorEdicion]       = useState("");
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [horasTrabajadas, setHorasTrabajadas] = useState(0);
  const [horasEstimadasState, setHorasEstimadasState] = useState(0);
  const [editandoHoras, setEditandoHoras]     = useState(false);
  const [horasInput, setHorasInput]           = useState("0");
  const [loadingToggle, setLoadingToggle]     = useState(null);
  const [loadingEliminar, setLoadingEliminar] = useState(null);
  const [loadingGuardar, setLoadingGuardar]   = useState(false);
  const [loadingEditar, setLoadingEditar]     = useState(null);
  const [fechaPosponer, setFechaPosponer] = useState('');

  // ── Sprint 6/7: estado de subtarea + progreso oficial del backend ──
  const [editandoEstado, setEditandoEstado]         = useState(null); 
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('hecha');
  const [notaPosponer, setNotaPosponer]             = useState('');
  const [errorEstado, setErrorEstado]               = useState('');
  const [loadingEstado, setLoadingEstado]           = useState(false);
  const [progresoBackend, setProgresoBackend]       = useState(null);
  const [exitoEstadoMsg, setExitoEstadoMsg]         = useState('');

  // Sprint 9: warning cuando todas las subtareas están "hecha" pero suman menos
  const [warningCompletar, setWarningCompletar]     = useState(null);
  const [forzandoCompletar, setForzandoCompletar]   = useState(false);
  const [actividadCompletada, setActividadCompletada] = useState(false);

  const token = localStorage.getItem("token");

  const abrirPosponer = (st) => {
    setEditandoEstado(st);
    setEstadoSeleccionado('pospuesta');
    setNotaPosponer(st.nota || '');
    setFechaPosponer(st.estado === 'pospuesta' ? (st.fechaMeta || '') : ''); 
    setErrorEstado('');
  };

  useEffect(() => {
    if (actividad) {
      const horasReales = actividad.horas_trabajadas !== undefined 
          ? actividad.horas_trabajadas 
          : (actividad.horas_invertidas || 0);
          
      setHorasTrabajadas(horasReales);
      setHorasInput(String(horasReales));
      setHorasEstimadasState(actividad.horas_estimadas || 0);
      
      if (actividad.asignatura && typeof actividad.asignatura === 'number') {
        setAsignaturaCargada(false);
        fetch(`${API_BASE}/api/asignaturas/${actividad.asignatura}/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
          .then(r => r.json())
          .then(d => { setAsignaturaMostrada(d?.data?.nombre || null); setAsignaturaCargada(true); })
          .catch(() => { setAsignaturaMostrada(null); setAsignaturaCargada(true); });
      } else if (actividad.asignatura && typeof actividad.asignatura === 'object') {
        setAsignaturaMostrada(actividad.asignatura.nombre);
        setAsignaturaCargada(true);
      } else {
        setAsignaturaMostrada(null);
        setAsignaturaCargada(true);
      }
    }
  }, [actividad]);

  useEffect(() => {
    if (actividad) {
      cargarSubtasks();
      cargarProgreso();
    }
  }, [actividad]);

  if (!actividad) return null;

  const formatFecha = (f) => {
    if (!f) return "—";
    const [y, m, d] = f.split("-");
    return `${d}/${m}/${y}`;
  };

  const cargarProgreso = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v2/activities/${actividad.id}/progreso/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json?.success && json.data) {
        setProgresoBackend(json.data);
      } else if (res.status === 404) {
        setProgresoBackend(null);
      }
    } catch (err) { console.error(err); }
  };

  const cargarSubtasks = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/subtasks/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(json => {
        const lista = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        const enriquecidas = lista
          .filter(st => st.activity === actividad.id)
          .map(st => ({
            ...st,
            fechaMeta: st.fecha || '',
            horasMeta: parseFloat(st.horas_estimadas) || 0,
          }));
        setSubtasks(enriquecidas);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  };

  const getTipoBadge = (type) => {
    const map = { exam: "Examen", project: "Proyecto", presentation: "Presentación", homework: "Tarea" };
    return map[type?.toLowerCase()] || type || "—";
  };

  const getDificultadLabel = (d) => {
    const map = { baja: "Prioridad Baja", media: "Prioridad Media", alta: "Prioridad Alta", critica: "Prioridad Crítica" };
    return map[d?.toLowerCase()] || d || "—";
  };

  const getDificultadClass = (d) => {
    const map = { baja: "badge-baja", media: "badge-media", alta: "badge-alta", critica: "badge-critica" };
    return map[d?.toLowerCase()] || "badge-media";
  };

  const getProgreso = () => {
    if (progresoBackend && typeof progresoBackend.progress === 'number') {
      const progrSubs = Math.round(progresoBackend.progress);
      const progrHoras = horasEstimadasState > 0
        ? Math.min(100, Math.round((horasTrabajadas / horasEstimadasState) * 100))
        : 0;
      if (horasTrabajadas > 0 && subtasks.length > 0) {
        return Math.round((progrHoras + progrSubs) / 2);
      }
      return horasTrabajadas > 0 ? progrHoras : progrSubs;
    }
    const total = subtasks.length;
    const hechas = subtasks.filter(s => s.estado === 'hecha').length;
    return total > 0 ? Math.round((hechas / total) * 100) : 0;
  };

  const getProgresoSubtareas = () => {
    if (progresoBackend) {
      return {
        completadas: progresoBackend.completed_subtasks ?? 0,
        total: progresoBackend.total_subtasks ?? 0,
      };
    }
    const completadas = subtasks.filter(s => s.estado === 'hecha').length;
    return { completadas, total: subtasks.length };
  };

  const getTotalHorasSubtareas = () => {
    return subtasks.reduce((acc, st) => acc + (st.horasMeta || 0), 0);
  };

  const progreso = getProgreso();
  const progrSub = getProgresoSubtareas();
  const totalHorasSubs = getTotalHorasSubtareas();

  const guardarHoras = async () => {
    if (subtasks.length > 0) {
      setErrorHoras('No se pueden usar horas invertidas en actividades con subtareas.');
      return;
    }
    const val = parseFloat(horasInput);
    if (isNaN(val) || val < 0) {
      setErrorHoras("Ingresa un número válido mayor o igual a 0.");
      return;
    }
    if (val % 0.5 !== 0) {
      setErrorHoras("Debe ser múltiplo de 0.5 (ej: 0.5, 1, 1.5, 2).");
      return;
    }
    if (val > horasEstimadasState) {
      setErrorHoras(`Las horas invertidas no pueden ser mayores a las horas estimadas de la actividad.`);
      return;
    }
    setErrorHoras('');
    setLoadingGuardar(true);
    try {
      const res = await fetch(`${API_BASE}/api/v2/activities/${actividad.id}/horas/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ horas_invertidas: val })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        setErrorHoras(json?.message || 'No pudimos registrar las horas. Intenta de nuevo.');
        setLoadingGuardar(false);
        return;
      }
      setHorasTrabajadas(val);
      setEditandoHoras(false);
      if (json?.data?.estado === 'completada') {
        setActividadCompletada(true);
        setExitoEstadoMsg('🎯 ¡Actividad completada al 100%!');
        setTimeout(() => setExitoEstadoMsg(''), 3500);
      }
      if (onActualizado) onActualizado();
    } catch (err) { console.error(err); }
    setLoadingGuardar(false);
  };

  const resolverAsignatura = async (nombre) => {
    if (!nombre.trim()) return null;
    try {
      const res = await fetch(`${API_BASE}/api/asignaturas/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const lista = Array.isArray(data?.data) ? data.data : [];
      const existe = lista.find(a => a.nombre.toLowerCase() === nombre.trim().toLowerCase());
      if (existe) return { id: existe.id, nombre: existe.nombre };
      const crear = await fetch(`${API_BASE}/api/asignaturas/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: nombre.trim(), codigo: nombre.trim().substring(0,10).toUpperCase().replace(/ /g,'_'), creditos: 0 })
      });
      const nueva = await crear.json();
      return nueva?.data ? { id: nueva.data.id, nombre: nueva.data.nombre } : null;
    } catch { return null; }
  };

  const guardarAsignatura = async () => {
    try {
      const resultado = await resolverAsignatura(asignaturaInput);
      await fetch(`${API_BASE}/api/activities/${actividad.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ asignatura: resultado?.id || null })
      });
      setAsignaturaMostrada(resultado?.nombre || null);
      setEditandoAsignatura(false);
      if (onActualizado) onActualizado();
    } catch (err) { console.error(err); }
  };

  const crearSubtask = async () => {
    if (!nuevoTitulo.trim())  { setErrorNuevo("Debe ingresar un título."); return; }
    if (nuevoTitulo.trim().length < 3) { setErrorNuevo("Mínimo 3 caracteres."); return; }
    if (!nuevoFecha)  { setErrorNuevo("Selecciona una fecha."); return; }
    const hoyStr = new Date().toISOString().split('T')[0];
    if (nuevoFecha < hoyStr) {
      setErrorNuevo("La fecha no puede ser anterior a hoy.");
      return;
    }
    if (!nuevoHoras || parseFloat(nuevoHoras) <= 0) { setErrorNuevo("Las horas deben ser mayores a 0."); return; }
    if (parseFloat(nuevoHoras) % 0.5 !== 0) { setErrorNuevo("Las horas deben ser múltiplos de 0.5 (ej: 0.5, 1, 1.5, 2)."); return; }

    if (actividad.due_date && nuevoFecha > actividad.due_date) {
      setErrorNuevo(`La fecha no puede ser mayor a la fecha de entrega (${actividad.due_date}).`);
      return;
    }

    const horasActuales = subtasks.reduce((acc, s) => acc + (s.horasMeta || 0), 0);
    const horasMax = horasEstimadasState;
    if (horasMax > 0 && horasActuales + parseFloat(nuevoHoras) > horasMax) {
      const horasDisponibles = +(horasMax - horasActuales).toFixed(1);
      setErrorNuevo(`No puedes agregar más horas. Disponibles: ${horasDisponibles}h de ${horasMax}h estimadas.`);
      return;
    }

    setErrorNuevo("");
    try {
      const res = await fetch(`${API_BASE}/api/subtasks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: nuevoTitulo.trim(),
          activity: actividad.id,
          fecha: nuevoFecha,
          horas_estimadas: parseFloat(nuevoHoras),
        })
      });
      if (res.status === 201) {
        const json = await res.json().catch(() => ({}));
        if (json?.data?.horas_trabajadas_reseteadas) {
          setHorasTrabajadas(0);
          setHorasInput("0");
          setExitoEstadoMsg('Horas invertidas resetadas a 0. El progreso ahora se gestiona por subtareas.');
          setTimeout(() => setExitoEstadoMsg(''), 4000);
        }
        setNuevoTitulo(""); setNuevoFecha(""); setNuevoHoras("");
        setMostrarInput(false);
        cargarSubtasks();
        cargarProgreso();
        if (onActualizado) onActualizado();
      } else {
        const e = await res.json();
        const msg =
          e?.message ||
          e?.data?.title?.[0] ||
          e?.data?.fecha?.[0] ||
          e?.data?.horas_estimadas?.[0] ||
          "No pudimos crear la subtarea. Revisa los datos.";
        setErrorNuevo(msg);
      }
    } catch (err) { console.error(err); }
  };

  const intentarCompletarActividad = async (forzar = false) => {
    setForzandoCompletar(true);
    try {
      const res = await fetch(`${API_BASE}/api/v2/activities/${actividad.id}/completar/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(forzar ? { forzar: true } : {})
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json?.success && json?.data?.status === 'completada') {
        setActividadCompletada(true);
        setWarningCompletar(null);

        // 🟢 ACTUALIZACIÓN DE ESTADOS LOCALES
        if (typeof json.data.suma_horas_subtareas === 'number') {
          setHorasTrabajadas(json.data.suma_horas_subtareas);
        }
        // Actualizamos las horas estimadas con el nuevo valor reducido que envió el back
        if (json.data.horas_estimadas !== undefined) {
          setHorasEstimadasState(json.data.horas_estimadas);
        }

        await cargarProgreso(); 
        cargarSubtasks();

        setExitoEstadoMsg(
          forzar
            ? `Actividad finalizada con ${json.data.suma_horas_subtareas}h. ¡Listo!`
            : '🎯 ¡Actividad completada al 100%!'
        );
        
        setTimeout(() => setExitoEstadoMsg(''), 3500);
        if (onActualizado) onActualizado();
        setForzandoCompletar(false);
        return { ok: true, status: 'completada' };
      }

      if (res.ok && json?.status === 'warning_horas') {
        setWarningCompletar({
          horasEstimadas: json.data.horas_estimadas,
          sumaHoras:      json.data.suma_horas_subtareas,
          faltantes:      json.data.horas_faltantes,
          totalSubtasks:  json.data.total_subtasks,
        });
        setForzandoCompletar(false);
        return { ok: true, status: 'warning_horas' };
      }

      setForzandoCompletar(false);
      return { ok: false };
    } catch (err) {
      console.error(err);
      setForzandoCompletar(false);
      return { ok: false };
    }
  };

  const todasHechas = (lista) =>
    lista.length > 0 && lista.every(s => (s.estado || (s.is_completed ? 'hecha' : 'pendiente')) === 'hecha');

  const toggleSubtask = async (st) => {
    const willBeCompleted = !st.is_completed;
    setLoadingToggle(st.id);
    try {
      // SubtaskEstadoView ya sincroniza is_completed con el estado server-side,
      // por lo que un único PATCH basta.
      await fetch(`${API_BASE}/api/v2/subtasks/${st.id}/estado/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          estado: willBeCompleted ? 'hecha' : 'pendiente',
          nota: null,
        })
      });

      const subtasksProyectadas = subtasks.map(s => s.id === st.id
        ? { ...s, is_completed: willBeCompleted, estado: willBeCompleted ? 'hecha' : 'pendiente' }
        : s
      );

      const horasSub = subtasksProyectadas
        .filter(s => s.estado === 'hecha')
        .reduce((acc, s) => acc + (s.horasMeta || 0), 0);

      setHorasTrabajadas(horasSub);
      if (!willBeCompleted) {
        // Al desmarcar, la actividad ya no está completada: refleja el cambio en el badge.
        setActividadCompletada(false);
      }
      if (onActualizado) onActualizado();

      cargarSubtasks();
      cargarProgreso();

      if (willBeCompleted && todasHechas(subtasksProyectadas)) {
        await intentarCompletarActividad(false);
      }
    } catch (err) { console.error(err); }
    setLoadingToggle(null);
  };

  const confirmarYEliminar = async () => {
    if (!confirmarEliminar) return;
    setLoadingEliminar(confirmarEliminar.id);
    try {
      await fetch(`${API_BASE}/api/subtasks/${confirmarEliminar.id}/`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` }
      });
      setConfirmarEliminar(null); cargarSubtasks(); cargarProgreso();
    } catch (err) { console.error(err); }
    setLoadingEliminar(null);
  };

  const iniciarEdicion = (st) => {
    setEditandoId(st.id);
    setEditandoTitulo(st.title);
    setEditandoFecha(st.fechaMeta || "");
    setEditandoHorasSub(String(st.horasMeta || ""));
    setErrorEdicion("");
  };
  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditandoTitulo("");
    setEditandoFecha("");
    setEditandoHorasSub("");
    setErrorEdicion("");
  };

  const cerrarEditorEstado = () => {
    setEditandoEstado(null);
    setEstadoSeleccionado('hecha');
    setNotaPosponer('');
    setFechaPosponer(''); 
    setErrorEstado('');
    setLoadingEstado(false);
  };

  const guardarEstado = async () => {
    setErrorEstado('');

    if (estadoSeleccionado === 'pospuesta') {
      if (!fechaPosponer) {
        setErrorEstado('Debes seleccionar la nueva fecha a la que pospondrás la tarea.');
        return;
      }
      if (actividad.due_date && fechaPosponer > actividad.due_date) {
        setErrorEstado(
          `No puedes posponer más allá de la entrega de la actividad (${formatFecha(actividad.due_date)}). ` +
          `Si necesitas más tiempo, primero reprograma la fecha de entrega de la actividad.`
        );
        return;
      }
      //if (!notaPosponer.trim()) {
      //  setErrorEstado('Debes indicar un motivo cuando la subtarea se pospone.');
      //  return;
      //}
    }
    
    setLoadingEstado(true);
    try {
      const body = { estado: estadoSeleccionado };
      if (estadoSeleccionado === 'pospuesta') {
        body.nota = notaPosponer.trim();
        body.fecha = fechaPosponer; 
      } else {
        body.nota = null;
      }
      
      const res = await fetch(`${API_BASE}/api/v2/subtasks/${editandoEstado.id}/estado/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json?.success) {
        const targetIsCompleted = estadoSeleccionado === 'hecha';
        // SubtaskEstadoView sincroniza is_completed server-side; no se requiere segundo PATCH.

        const subtasksProyectadas = subtasks.map(s => s.id === editandoEstado.id
          ? { 
              ...s, 
              is_completed: targetIsCompleted, 
              estado: estadoSeleccionado, 
              nota: estadoSeleccionado === 'pospuesta' ? notaPosponer.trim() : null,
              fechaMeta: estadoSeleccionado === 'pospuesta' ? fechaPosponer : s.fechaMeta 
            }
          : s
        );

        cerrarEditorEstado();
        setExitoEstadoMsg(
          estadoSeleccionado === 'hecha'
            ? 'Subtarea marcada como Hecha.'
            : 'Subtarea pospuesta correctamente.'
        );
        setTimeout(() => setExitoEstadoMsg(''), 3000);
        cargarSubtasks();
        cargarProgreso();
        if (onActualizado) onActualizado();

        if (estadoSeleccionado === 'hecha' && todasHechas(subtasksProyectadas)) {
          await intentarCompletarActividad(false);
        }
        return;
      }

      const fallback = res.status === 404
        ? 'No encontramos esta subtarea o no tienes permiso para modificarla.'
        : 'No pudimos actualizar el estado. Revisa los datos e intenta de nuevo.';
      setErrorEstado(json?.message || fallback);
    } catch (err) {
      setErrorEstado('No pudimos conectar con el servidor. Intenta de nuevo.');
    }
    setLoadingEstado(false);
  };

  const guardarEdicion = async (id) => {
    if (!editandoTitulo.trim()) { setErrorEdicion("Debe ingresar un titulo."); return; }
    if (editandoTitulo.trim().length < 3) { setErrorEdicion("Mínimo 3 caracteres."); return; }
    if (!editandoFecha) { setErrorEdicion("Selecciona una fecha."); return; }
    const hoyStr = new Date().toISOString().split('T')[0];
    if (editandoFecha < hoyStr) {
      setErrorEdicion("La fecha no puede ser anterior a hoy.");
      return;
    }
    if (!editandoHorasSub || parseFloat(editandoHorasSub) <= 0) { setErrorEdicion("Las horas deben ser mayores a 0."); return; }
    if (parseFloat(editandoHorasSub) % 0.5 !== 0) { setErrorEdicion("Las horas deben ser múltiplos de 0.5 (ej: 0.5, 1, 1.5, 2)."); return; }

    if (actividad.due_date && editandoFecha > actividad.due_date) {
      setErrorEdicion(`La fecha no puede ser mayor a la fecha de entrega (${actividad.due_date}).`);
      return;
    }

    const horasOtras = subtasks.filter(s => s.id !== id).reduce((acc, s) => acc + (s.horasMeta || 0), 0);
    const horasMax = horasEstimadasState;
    if (horasMax > 0 && horasOtras + parseFloat(editandoHorasSub) > horasMax) {
      const horasDisponibles = +(horasMax - horasOtras).toFixed(1);
      setErrorEdicion(`Horas excedidas. Disponibles: ${horasDisponibles}h de ${horasMax}h estimadas.`);
      return;
    }

    setErrorEdicion(""); setLoadingEditar(id);
    try {
      const res = await fetch(`${API_BASE}/api/subtasks/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: editandoTitulo,
          fecha: editandoFecha,
          horas_estimadas: parseFloat(editandoHorasSub),
        })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        const msg =
          e?.message ||
          e?.data?.title?.[0] ||
          e?.data?.fecha?.[0] ||
          e?.data?.horas_estimadas?.[0] ||
          "No pudimos guardar los cambios. Revisa los datos.";
        setErrorEdicion(msg);
        setLoadingEditar(null);
        return;
      }
      setEditandoId(null); setEditandoTitulo(""); setEditandoFecha(""); setEditandoHorasSub("");
      cargarSubtasks();
      cargarProgreso();
    } catch (err) { console.error(err); }
    setLoadingEditar(null);
  };

  return (
    <>
      <div className="detail-overlay" onClick={onClose}>
        <div className="detail-modal" onClick={e => e.stopPropagation()}>

          <div className="detail-header">
            <div className="detail-header-text">
              <h2 className="detail-title">{actividad.title}</h2>
              {actividad.description && <p className="detail-description">{actividad.description}</p>}
            </div>
            <button className="detail-close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="detail-badges">
            <span className="badge badge-tipo">{getTipoBadge(actividad.activity_type)}</span>
            {(() => {
              const completadaSinSubs = subtasks.length === 0
                && horasEstimadasState > 0
                && horasTrabajadas >= horasEstimadasState;
              const completadaConSubs = subtasks.length > 0
                && actividadCompletada;
              const estaCompletada = completadaSinSubs || completadaConSubs;
              return estaCompletada
                ? <span className="badge" style={{background:'#dcfce7', color:'#15803d'}}>✓ Completada</span>
                : <span className="badge badge-estado">En Progreso</span>;
            })()}
            <span className={`badge ${getDificultadClass(actividad.difficulty)}`}>
              {getDificultadLabel(actividad.difficulty)}
            </span>
          </div>

          <div className="detail-info-grid">
            <div className="detail-info-item">
              <span className="detail-info-label">Entrega:</span>
              <span className="detail-info-value">{formatFecha(actividad.due_date)}</span>
            </div>
            {actividad.difficulty && (
              <div className="detail-info-item">
                <span className="detail-info-label">Dificultad:</span>
                <span className="detail-info-value" style={{textTransform:"capitalize"}}>{actividad.difficulty}</span>
              </div>
            )}
            <div className="detail-info-item">
              <span className="detail-info-label">Horas:</span>
              <span className="detail-info-value">{horasTrabajadas}h / {horasEstimadasState}h</span>
            </div>
            <div className="detail-info-item">
              <span className="detail-info-label">Asignatura:</span>
              {editandoAsignatura ? (
                <div style={{display:'flex', gap:6, alignItems:'center', marginTop:2}}>
                  <input
                    style={{flex:1, padding:'4px 8px', border:'1px solid #2563eb', borderRadius:6, fontSize:13, outline:'none'}}
                    value={asignaturaInput}
                    onChange={e => setAsignaturaInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') guardarAsignatura(); if (e.key === 'Escape') setEditandoAsignatura(false); }}
                    placeholder="Ej: Matemáticas"
                    autoFocus
                  />
                  <button className="horas-btn-ok" onClick={guardarAsignatura}>✓</button>
                  <button className="horas-btn-cancel" onClick={() => setEditandoAsignatura(false)}>✕</button>
                </div>
              ) : (
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <span className="detail-info-value">
                    {!asignaturaCargada
                      ? <span style={{color:'#aaa', fontStyle:'italic'}}>...</span>
                      : asignaturaMostrada || <span style={{color:'#aaa', fontStyle:'italic'}}>Sin asignatura</span>
                    }
                  </span>
                  <button className="horas-editar-btn" onClick={() => { setAsignaturaInput(asignaturaMostrada || ''); setEditandoAsignatura(true); }}>
                    <IconEdit />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="detail-progreso-section">
            <div className="detail-progreso-header">
              <span>Progreso General</span>
              <span className={`detail-progreso-pct ${progreso < 50 ? "pct-rojo" : "pct-verde"}`}>{progreso}%</span>
            </div>
            <div className="detail-progreso-bar-bg">
              <div className="detail-progreso-bar-fill" style={{ width: `${progreso}%` }} />
            </div>
            {subtasks.length > 0 && (
              <div className="detail-progreso-subs">
                <span>
                  Subtareas: {progrSub.completadas}/{progrSub.total} completadas
                </span>
                {totalHorasSubs > 0 && (
                  <span>· {totalHorasSubs}h estimadas en subtareas</span>
                )}
              </div>
            )}
          </div>

          <div className="detail-tiempo-grid">
            <div className="detail-tiempo-item">
              <span className="detail-tiempo-icon">🕐</span>
              <div>
                <div className="detail-tiempo-label">Tiempo Invertido</div>
                {subtasks.length > 0 ? (
                  <div className="detail-tiempo-valor-row" title="No se pueden usar horas invertidas en actividades con subtareas.">
                    <span className="detail-tiempo-valor" style={{color:'#94a3b8'}}>{horasTrabajadas}h</span>
                    <span style={{
                      marginLeft:8, fontSize:11, color:'#64748b',
                      background:'#f1f5f9', padding:'2px 8px', borderRadius:99
                    }}>
                      🔒 Gestionado por subtareas
                    </span>
                  </div>
                ) : editandoHoras ? (
                  <>
                  <div className="horas-edit-row">
                    <input className="horas-input" type="number" min="0" step="0.5"
                      value={horasInput}
                      onChange={e => { setHorasInput(e.target.value); setErrorHoras(''); }}
                      onKeyDown={e => { if (e.key === "Enter") guardarHoras(); if (e.key === "Escape") setEditandoHoras(false); }}
                      autoFocus />
                    <button className="horas-btn-ok" onClick={guardarHoras} disabled={loadingGuardar}>
                      {loadingGuardar ? <IconSpinner /> : "✓"}
                    </button>
                    <button className="horas-btn-cancel" onClick={() => setEditandoHoras(false)}>✕</button>
                  </div>
                  {errorHoras && (
                    <p style={{color:'#dc2626', fontSize:12, margin:'4px 0 0'}}>⚠ {errorHoras}</p>
                  )}
                  </>
                ) : (
                  <div className="detail-tiempo-valor-row">
                    <span className="detail-tiempo-valor">{horasTrabajadas}h</span>
                    <button className="horas-editar-btn"
                      onClick={() => { setHorasInput(String(horasTrabajadas)); setEditandoHoras(true); }}>
                      <IconEdit />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="detail-tiempo-item">
              <div>
                <div className="detail-tiempo-label">Tiempo Estimado</div>
                <div className="detail-tiempo-valor">{horasEstimadasState}h</div>
              </div>
            </div>
          </div>

          <div className="detail-subtareas-header">
            <span className="detail-subtareas-titulo">
              Tareas ({progrSub.completadas}/{progrSub.total})
            </span>
            {!mostrarInput && (
              <button className="btn-agregar-sub" onClick={() => setMostrarInput(true)}>+ Agregar</button>
            )}
          </div>

          {loading ? (
            <p className="detail-loading">Cargando subtareas...</p>
          ) : subtasks.length === 0 ? (
            <p className="detail-empty-sub">No hay subtareas aún.</p>
          ) : (
            <>
              <div className="detail-subtask-cols-header">
                <span></span>
                <span>Título</span>
                <span>Fecha</span>
                <span>Horas</span>
                <span></span>
              </div>
              <ul className="detail-list">
                {subtasks.map(st => (
                  <li key={st.id} className={`detail-item ${st.is_completed ? "done" : ""}`}>
                    {loadingToggle === st.id ? (
                      <span style={{ 
                        color: '#2563eb',
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: '16px', 
                        height: '16px', 
                        marginRight: '12px' 
                      }}>
                        <IconSpinner />
                      </span>
                    ) : (
                      <input type="checkbox" className="detail-checkbox"
                        checked={st.estado === 'hecha'}
                        onChange={() => toggleSubtask(st)}
                        title={st.estado === 'pospuesta'
                          ? 'Esta subtarea está pospuesta. Cambia el estado desde el badge para volver a marcarla.'
                          : ''}
                        style={{opacity: st.estado === 'pospuesta' ? 0.4 : 1}}
                      />
                    )}
                    {editandoId === st.id ? (
                      <div className="edit-col" style={{flex:1}}>
                        <div className="edit-row-3">
                          <input className="edit-input" placeholder="Título"
                            value={editandoTitulo}
                            onChange={e => { setEditandoTitulo(e.target.value); setErrorEdicion(""); }}
                            onKeyDown={e => { if (e.key === "Escape") cancelarEdicion(); }}
                            autoFocus />
                          <input className="edit-input-sm" type="date"
                            value={editandoFecha}
                            min={new Date().toISOString().split('T')[0]}
                            max={actividad.due_date || undefined}
                            onChange={e => { setEditandoFecha(e.target.value); setErrorEdicion(""); }}
                          />
                          <input className="edit-input-sm" type="number" min="0.5" step="0.5" placeholder="Horas"
                            value={editandoHorasSub}
                            onChange={e => { setEditandoHorasSub(e.target.value); setErrorEdicion(""); }}
                          />
                          <button className="btn-guardar-edit" onClick={() => guardarEdicion(st.id)} disabled={loadingEditar === st.id}>
                            {loadingEditar === st.id ? <IconSpinner /> : "Guardar"}
                          </button>
                          <button className="btn-cancelar-edit" onClick={cancelarEdicion}>Cancelar</button>
                        </div>
                        {errorEdicion && <p className="st-error-msg">{errorEdicion}</p>}
                      </div>
                    ) : (
                      <>
                        <div className="st-titulo-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                          <span className={`st-titulo-texto ${st.is_completed ? "tachado" : ""}`}>
                            {st.title}
                          </span>
                          {st.estado === 'pospuesta' && st.nota && (
                            <span style={{ fontSize: '11px', color: '#f59e0b', marginTop: '2px' }}>
                              ⏸ Pospuesta: {st.nota}
                            </span>
                          )}
                        </div>

                        <span className="st-meta-col" style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          {st.fechaMeta
                            ? <span className="st-meta-badge">📅 {formatFecha(st.fechaMeta)}</span>
                            : <span className="st-meta-vacio">—</span>
                          }
                          
                          {!st.is_completed && (
                            <button
                              type="button"
                              style={{
                                background: '#fffbeb',
                                border: '1px solid #fde68a',
                                color: '#d97706',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: (actividad.due_date <= new Date().toISOString().split('T')[0]) ? 'not-allowed' : 'pointer',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                opacity: (actividad.due_date <= new Date().toISOString().split('T')[0]) ? 0.5 : 1
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const hoyStr = new Date().toISOString().split('T')[0];
                                if (actividad.due_date <= hoyStr) {
                                    return; 
                                }
                                abrirPosponer(st);
                              }}
                              disabled={actividad.due_date <= new Date().toISOString().split('T')[0]}
                              title={actividad.due_date <= new Date().toISOString().split('T')[0] ? "No se puede posponer: la actividad se entrega hoy o ya venció." : "Posponer para otra fecha"}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                              {st.estado === 'pospuesta' ? 'Modificar' : 'Posponer'}
                            </button>
                          )}
                        </span>

                        <span className="st-meta-col">
                          {st.horasMeta > 0
                            ? <span className="st-meta-badge">⏱ {st.horasMeta}h</span>
                            : <span className="st-meta-vacio">—</span>
                          }
                        </span>
                      </>
                    )}
                    {editandoId !== st.id && (
                      <div className="st-acciones">
                        {!st.is_completed && (
                          <>
                            <button className="btn-icon-sub" onClick={() => iniciarEdicion(st)} title="Editar">
                              <IconEdit />
                            </button>
                            <button className="btn-icon-sub btn-icon-del" onClick={() => setConfirmarEliminar(st)} title="Eliminar">
                              <IconTrash />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {mostrarInput && (
            <div className="subtask-add-col">
              <div className="subtask-add-grid">
                <input
                  className="subtask-add-input"
                  type="text"
                  placeholder="Título subtarea"
                  value={nuevoTitulo}
                  onChange={e => { setNuevoTitulo(e.target.value); setErrorNuevo(""); }}
                  onKeyDown={e => { if (e.key === "Escape") { setMostrarInput(false); setNuevoTitulo(""); setNuevoFecha(""); setNuevoHoras(""); setErrorNuevo(""); } }}
                  autoFocus
                />
                <input
                  className="subtask-add-input"
                  type="date"
                  value={nuevoFecha}
                  min={new Date().toISOString().split('T')[0]}
                  max={actividad.due_date || undefined}
                  onChange={e => { setNuevoFecha(e.target.value); setErrorNuevo(""); }}
                />
                <input
                  className="subtask-add-input"
                  type="number"
                  min="0.5" step="0.5"
                  placeholder="Horas"
                  value={nuevoHoras}
                  onChange={e => { setNuevoHoras(e.target.value); setErrorNuevo(""); }}
                />
              </div>
              <div className="subtask-add-btns">
                <button className="btn-guardar-sub" onClick={crearSubtask}>Guardar</button>
                <button className="btn-cancelar-sub" onClick={() => { setMostrarInput(false); setNuevoTitulo(""); setNuevoFecha(""); setNuevoHoras(""); setErrorNuevo(""); }}>Cancelar</button>
              </div>
              {errorNuevo && <p className="st-error-msg">{errorNuevo}</p>}
            </div>
          )}

        </div>
      </div>

      {confirmarEliminar && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3>Eliminar subtarea</h3>
            <p>¿Estás seguro que deseas eliminar <strong>{confirmarEliminar.title}</strong>?</p>
            <p className="confirm-aviso">Esta acción no se puede deshacer.</p>
            <div className="confirm-botones">
              <button className="confirm-btn-cancelar" onClick={() => setConfirmarEliminar(null)}>Cancelar</button>
              <button className="confirm-btn-eliminar" onClick={confirmarYEliminar} disabled={!!loadingEliminar}>
                {loadingEliminar ? <IconSpinner /> : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editandoEstado && (
        <div className="confirm-overlay" onClick={cerrarEditorEstado}>
          <div className="confirm-modal estado-modal" onClick={e => e.stopPropagation()}>
            <h3>Estado de la subtarea</h3>
            <p className="estado-modal-sub">
              <strong>{editandoEstado.title}</strong>
            </p>

            <div className="estado-radio-group">
              <label className={`estado-radio ${estadoSeleccionado === 'hecha' ? 'estado-radio-activo' : ''}`}>
                <input
                  type="radio"
                  name="estado"
                  value="hecha"
                  checked={estadoSeleccionado === 'hecha'}
                  onChange={() => { setEstadoSeleccionado('hecha'); setErrorEstado(''); }}
                />
                <span>✓ Hecha</span>
              </label>
              <label className={`estado-radio ${estadoSeleccionado === 'pospuesta' ? 'estado-radio-activo' : ''}`}>
                <input
                  type="radio"
                  name="estado"
                  value="pospuesta"
                  checked={estadoSeleccionado === 'pospuesta'}
                  onChange={() => { setEstadoSeleccionado('pospuesta'); setErrorEstado(''); }}
                />
                <span>⏸ Pospuesta</span>
              </label>
            </div>

            {estadoSeleccionado === 'pospuesta' && (
              <>
                <div className="estado-nota-wrap" style={{marginBottom: '12px'}}>
                  <label className="estado-nota-label">
                    Nueva Fecha <span className="estado-nota-obligatorio">(obligatorio)</span>
                  </label>
                  <input
                    type="date"
                    className="estado-nota-input"
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                    value={fechaPosponer}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                    max={actividad.due_date || undefined} 
                    onChange={e => { setFechaPosponer(e.target.value); setErrorEstado(''); }}
                  />
                </div>

                <div className="estado-nota-wrap">
                  <label className="estado-nota-label">
                    Motivo <span style={{ color: '#94a3b8', fontWeight: 400 }}>(opcional)</span>
                  </label>
                  <textarea
                    className="estado-nota-input"
                    rows={3}
                    placeholder="Ej: Material pendiente, esperando feedback del profesor, etc."
                    value={notaPosponer}
                    onChange={e => { setNotaPosponer(e.target.value); setErrorEstado(''); }}
                    autoFocus
                    maxLength={500}
                  />
                  <div className="estado-nota-hint">{notaPosponer.length}/500</div>
                </div>
              </>
            )}

            {errorEstado && (
              <p className="estado-error-msg">⚠ {errorEstado}</p>
            )}

            <div className="confirm-botones" style={{marginTop:14}}>
              <button
                className="confirm-btn-cancelar"
                onClick={cerrarEditorEstado}
                disabled={loadingEstado}
              >
                Cancelar
              </button>
              <button
                className="confirm-btn-eliminar"
                style={{background:'#2563eb'}}
                onClick={guardarEstado}
                disabled={loadingEstado}
              >
                {loadingEstado ? <IconSpinner /> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {exitoEstadoMsg && (
        <div className="exito-toast">✅ {exitoEstadoMsg}</div>
      )}

      {warningCompletar && (
        <div className="confirm-overlay" onClick={() => setWarningCompletar(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()} style={{maxWidth: 480}}>
            <h3>✅ Subtareas completadas</h3>
            <p style={{color:'#475569', fontSize:14, lineHeight:1.5}}>
              Marcaste todas las subtareas como <strong>hechas</strong>, pero suman{' '}
              <strong>{warningCompletar.sumaHoras}h</strong> y la actividad estima{' '}
              <strong>{warningCompletar.horasEstimadas}h</strong>.
              <br/>
              Aún faltan <strong>{warningCompletar.faltantes}h</strong> para completarla. ¿Qué prefieres hacer?
            </p>

            <div style={{
              display:'flex', flexDirection:'column', gap:10, marginTop:16
            }}>
              <button
                onClick={async () => {
                  await intentarCompletarActividad(true);
                }}
                disabled={forzandoCompletar}
                style={{
                  background:'#16a34a', color:'#fff', border:'none',
                  padding:'12px 14px', borderRadius:8, fontSize:14, fontWeight:600,
                  cursor: forzandoCompletar ? 'wait' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                }}
              >
                {forzandoCompletar ? <IconSpinner /> : '✓'}
                Reducir horas a {warningCompletar.sumaHoras}h y finalizar
              </button>
              <button
                onClick={() => {
                  setWarningCompletar(null);
                  setMostrarInput(true);
                }}
                disabled={forzandoCompletar}
                style={{
                  background:'#fff', color:'#2563eb', border:'1.5px solid #2563eb',
                  padding:'12px 14px', borderRadius:8, fontSize:14, fontWeight:600,
                  cursor:'pointer'
                }}
              >
                + Agregar más subtareas
              </button>
              <button
                onClick={() => setWarningCompletar(null)}
                disabled={forzandoCompletar}
                style={{
                  background:'transparent', color:'#64748b', border:'none',
                  padding:'8px', fontSize:13, cursor:'pointer', textDecoration:'underline'
                }}
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ActivityDetail;