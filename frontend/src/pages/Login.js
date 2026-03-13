import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

// Aquí está tu API_BASE apuntando a la nube de Render
const API_BASE = process.env.REACT_APP_API_URL || 'https://miniproyecto-1-x936.onrender.com';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorFields, setErrorFields] = useState([]);
  
  // Aquí está el navigate que se había perdido
  const navigate = useNavigate(); 

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setErrorFields([]);

    // 1. Validación: Campos vacíos
    if (!email || !password) {
      setErrorMessage('Ingresa los datos para acceder');
      const vacios = [];
      if (!email) vacios.push('email');
      if (!password) vacios.push('password');
      setErrorFields(vacios);
      return;
    }

    // ELIMINAMOS la validación estricta de la arroba (@) para que te deje poner tu Nombre de Usuario

    try {
      const response = await fetch(`${API_BASE}/api/auth/login/`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email, // Se envía como "email" que es lo que espera el backend
          password: password
        })
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        localStorage.setItem('token', data.data.access); 
        localStorage.setItem('username', data.data.username); // ⬅️ NUEVA LÍNEA: Guardamos el nombre
        navigate('/hoy');
      } else {
        setErrorMessage('Usuario y/o contraseña incorrecta');
        setErrorFields(['email', 'password']);
      }
    } catch (error) {
      console.error("Error conectando al backend:", error);
      setErrorMessage('Error de conexión con el servidor');
    }
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
            <label>Correo electrónico (o Usuario)</label>
            <input 
              type="text" 
              placeholder="usuario@ejemplo.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errorFields.includes('email') ? 'input-error' : ''}
            />
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              placeholder="•••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errorFields.includes('password') ? 'input-error' : ''}
            />
          </div>

          <button type="submit" className="primary-button">
            Iniciar Sesión
          </button>
        </form>

        <div className="redirect-link">
          <span>¿No tienes cuenta? <span style={{cursor: 'pointer', color: '#0f4cff', textDecoration: 'underline'}} onClick={() => navigate('/register')}>Regístrate</span></span>
        </div>
      </div>
    </div>
  );
};

export default Login;