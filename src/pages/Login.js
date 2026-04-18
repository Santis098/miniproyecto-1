import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://miniproyecto-1-x936.onrender.com';

const IconSpinner = () => (
  <svg style={{width:18,height:18,display:'inline-block',verticalAlign:'middle',animation:'spin 0.7s linear infinite'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
  </svg>
);

const Login = () => {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorFields, setErrorFields]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(''); setErrorFields([]);

    if (!email || !password) {
      setErrorMessage('Ingresa los datos para acceder');
      const vacios = [];
      if (!email) vacios.push('email');
      if (!password) vacios.push('password');
      setErrorFields(vacios);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        localStorage.setItem('token', data.data.access);
        localStorage.setItem('username', data.data.username);
        navigate('/hoy');
      } else {
        setErrorMessage(data.message || 'Usuario y/o contraseña incorrecta');
        setErrorFields(['email', 'password']);
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
        <h2>Iniciar Sesión</h2>
        <p className="subtitle">Ingresa los datos para acceder</p>

        {errorMessage && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span> {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Correo electrónico</label>
            <input type="text" placeholder="usuario@ejemplo.com"
              value={email} onChange={e => setEmail(e.target.value)}
              className={errorFields.includes('email') ? 'input-error' : ''}
              disabled={loading}
            />
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <input type="password" placeholder="•••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              className={errorFields.includes('password') ? 'input-error' : ''}
              disabled={loading}
            />
          </div>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? <IconSpinner /> : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="redirect-link">
          <span>¿No tienes cuenta? <span style={{cursor:'pointer', color:'#0f4cff', textDecoration:'underline'}} onClick={() => navigate('/register')}>Regístrate</span></span>
        </div>
      </div>
    </div>
  );
};

export default Login;