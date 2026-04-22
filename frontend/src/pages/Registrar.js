import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Registrar.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://miniproyecto-1-x936.onrender.com';

const IconSpinner = () => (
  <svg style={{width:18,height:18,display:'inline-block',verticalAlign:'middle',animation:'spin 0.7s linear infinite'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
  </svg>
);

// Genera un username único internamente — el usuario nunca lo ve
const generarUsername = (nombreCompleto) => {
  const base = nombreCompleto
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 12);
  const sufijo = Math.floor(1000 + Math.random() * 9000);
  return `${base}_${sufijo}`;
};

const Registrar = () => {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [password2, setPassword2]           = useState('');
  const [errorMessage, setErrorMessage]     = useState('');
  const [errorFields, setErrorFields]       = useState([]);
  const [isSuccess, setIsSuccess]           = useState(false);
  const [loading, setLoading]               = useState(false);
  const navigate = useNavigate();

  const traducirError = (campo, mensaje) => {
    const TRADUCCIONES = {
      'This password is too short. It must contain at least 8 characters.': 'La contraseña debe tener al menos 8 caracteres.',
      'This password is too common.': 'La contraseña es demasiado común. Elige una más segura.',
      'This password is entirely numeric.': 'La contraseña no puede ser solo números.',
      'The password is too similar to the username.': 'La contraseña es muy similar al nombre.',
      'This field may not be blank.': 'Este campo no puede estar vacío.',
      'This field is required.': 'Este campo es obligatorio.',
      'Enter a valid email address.': 'Ingresa un correo electrónico válido.',
      'user with this email already exists.': 'Ya existe una cuenta con ese correo electrónico.',
      'A user with that username already exists.': 'Error interno, intenta de nuevo.',
    };
    return TRADUCCIONES[mensaje] || mensaje;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage(''); setErrorFields([]);

    // Validaciones frontend
    const vacios = [];
    if (!nombreCompleto.trim()) vacios.push('nombreCompleto');
    if (!email.trim())          vacios.push('email');
    if (!password)              vacios.push('password');
    if (!password2)             vacios.push('password2');

    if (vacios.length > 0) {
      setErrorMessage('Por favor, completa todos los campos.');
      setErrorFields(vacios);
      return;
    }

    // ✅ FIX: Mínimo 3 caracteres en nombre (no más restricciones de apellido)
    if (nombreCompleto.trim().length < 3) {
      setErrorMessage('El nombre debe tener al menos 3 caracteres.');
      setErrorFields(['nombreCompleto']);
      return;
    }

    if (password !== password2) {
      setErrorMessage('Las contraseñas no coinciden.');
      setErrorFields(['password', 'password2']);
      return;
    }

    setLoading(true);

    // Reintenta hasta 3 veces por si el username generado ya existe
    for (let intento = 0; intento < 3; intento++) {
      const username = generarUsername(nombreCompleto.trim());
      try {
        const response = await fetch(`${API_BASE}/api/auth/register/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            nombre: nombreCompleto.trim().split(' ')[0],
            apellido: nombreCompleto.trim().split(' ').slice(1).join(' ') || nombreCompleto.trim().split(' ')[0],
            email: email.trim(),
            password,
            password2
          })
        });
        const data = await response.json();

        if (response.ok && data.status === 'success') {
          setIsSuccess(true);
          // ✅ FIX: No mostrar botón "Ir a iniciar sesión", simplemente redirigir con spinner
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const errData = data.data || {};
        const firstKey = Object.keys(errData)[0];
        const firstMsg = Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey];

        if (firstKey === 'username') continue;

        setErrorMessage(traducirError(firstKey, firstMsg));
        if (firstKey === 'email') setErrorFields(['email']);
        else if (firstKey === 'password' || firstKey === 'password2') setErrorFields(['password', 'password2']);
        setLoading(false);
        return;

      } catch {
        setErrorMessage('Error de conexión con el servidor.');
        setLoading(false);
        return;
      }
    }

    setErrorMessage('Error interno al registrar. Intenta de nuevo.');
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="logo-icon">📅</div>
        <h1>Gestión de Actividades</h1>
        <p>Organiza, planifica y ejecuta tus actividades con eficiencia</p>
      </div>

      <div className="login-card">
        <h2>Registrarse</h2>
        <p className="subtitle">Completa el formulario con tus datos</p>

        {/* ✅ FIX: En éxito solo mostramos mensaje + spinner, sin botón */}
        {isSuccess && (
          <div className="success-alert">
            ✅ Registro exitoso. Redirigiendo a inicio de sesión&nbsp;
            <IconSpinner />
          </div>
        )}
        {!isSuccess && errorMessage && (
          <div className="error-alert"><span className="error-icon">⚠️</span> {errorMessage}</div>
        )}

        {/* ✅ FIX: Ocultamos el form completo al registrar para no mostrar el botón */}
        {!isSuccess && (
          <form onSubmit={handleRegister}>
            <div className="input-group">
              <label>Nombre completo</label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez"
                value={nombreCompleto}
                onChange={e => { setNombreCompleto(e.target.value); setErrorFields(f => f.filter(x => x !== 'nombreCompleto')); }}
                className={errorFields.includes('nombreCompleto') ? 'input-error' : ''}
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label>Correo electrónico</label>
              <input
                type="email"
                placeholder="juanperez@gmail.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrorFields(f => f.filter(x => x !== 'email')); }}
                className={errorFields.includes('email') ? 'input-error' : ''}
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrorFields(f => f.filter(x => x !== 'password' && x !== 'password2')); }}
                className={errorFields.includes('password') ? 'input-error' : ''}
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label>Confirmar contraseña</label>
              <input
                type="password"
                placeholder="Repite tu contraseña"
                value={password2}
                onChange={e => { setPassword2(e.target.value); setErrorFields(f => f.filter(x => x !== 'password' && x !== 'password2')); }}
                className={errorFields.includes('password2') ? 'input-error' : ''}
                disabled={loading}
              />
            </div>

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? <IconSpinner /> : 'Registrarme'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Registrar;