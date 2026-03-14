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

const Registrar = () => {
  const [username, setUsername]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [password2, setPassword2] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorFields, setErrorFields]   = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading]     = useState(false);
  const navigate = useNavigate();

  // Mapa de traducciones de errores del backend
  const traducirError = (campo, mensaje) => {
    const CAMPO = {
      username: 'nombre de usuario',
      email: 'correo electrónico',
      password: 'contraseña',
      password2: 'confirmación de contraseña',
    };

    const TRADUCCIONES = {
      'This password is too short. It must contain at least 8 characters.': 'La contraseña debe tener al menos 8 caracteres.',
      'This password is too common.': 'La contraseña es demasiado común. Elige una más segura.',
      'This password is entirely numeric.': 'La contraseña no puede ser solo números.',
      'The password is too similar to the username.': 'La contraseña es muy similar al nombre de usuario.',
      'This field may not be blank.': 'Este campo no puede estar vacío.',
      'This field is required.': 'Este campo es obligatorio.',
      'Enter a valid email address.': 'Ingresa un correo electrónico válido.',
    };

    const msgTraducido = TRADUCCIONES[mensaje] || mensaje;
    const nombreCampo = CAMPO[campo];

    if (nombreCampo) {
      return `${msgTraducido.replace(/\.$/, '')} en el campo de ${nombreCampo}.`;
    }
    return msgTraducido;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage(''); setErrorFields([]);

    if (!username || !email || !password || !password2) {
      setErrorMessage('Por favor, completa todos los campos');
      const vacios = [];
      if (!username) vacios.push('username');
      if (!email) vacios.push('email');
      if (!password) vacios.push('password');
      if (!password2) vacios.push('password2');
      setErrorFields(vacios);
      return;
    }

    if (password !== password2) {
      setErrorMessage('Las contraseñas no coinciden');
      setErrorFields(['password', 'password2']);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, password2 })
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setIsSuccess(true);
      } else {
        let errorMsg = 'Error al registrar el usuario.';
        if (data.data) {
          const firstKey = Object.keys(data.data)[0];
          const firstMsg = Array.isArray(data.data[firstKey]) ? data.data[firstKey][0] : data.data[firstKey];
          errorMsg = traducirError(firstKey, firstMsg);
        } else if (data.message) {
          errorMsg = data.message;
        }
        setErrorMessage(errorMsg);
      }
    } catch (error) {
      setErrorMessage('Error de conexión con el servidor');
    }
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

        {isSuccess && <div className="success-alert">✅ El registro fue exitoso</div>}
        {!isSuccess && errorMessage && (
          <div className="error-alert"><span className="error-icon">⚠️</span> {errorMessage}</div>
        )}

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label>Nombre de usuario</label>
            <input type="text" placeholder="Ej: juanperez123"
              value={username} onChange={e => setUsername(e.target.value)}
              className={errorFields.includes('username') ? 'input-error' : ''}
              disabled={isSuccess || loading}
            />
          </div>
          <div className="input-group">
            <label>Correo electrónico</label>
            <input type="email" placeholder="juanperez@gmail.com"
              value={email} onChange={e => setEmail(e.target.value)}
              className={errorFields.includes('email') ? 'input-error' : ''}
              disabled={isSuccess || loading}
            />
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <input type="password" placeholder="••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              className={errorFields.includes('password') ? 'input-error' : ''}
              disabled={isSuccess || loading}
            />
          </div>
          <div className="input-group">
            <label>Confirmar contraseña</label>
            <input type="password" placeholder="••••••"
              value={password2} onChange={e => setPassword2(e.target.value)}
              className={errorFields.includes('password2') ? 'input-error' : ''}
              disabled={isSuccess || loading}
            />
          </div>

          {isSuccess ? (
            <button type="button" className="success-button" onClick={() => navigate('/login')}>
              Ir a Iniciar Sesión →
            </button>
          ) : (
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? <IconSpinner /> : 'Registrarme'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Registrar;