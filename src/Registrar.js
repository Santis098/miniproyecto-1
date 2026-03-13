import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Registrar.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://miniproyecto-1-x936.onrender.com';

const Registrar = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  
  const [errorMessage, setErrorMessage] = useState('');
  const [errorFields, setErrorFields] = useState([]);
  
  const [isSuccess, setIsSuccess] = useState(false); 
  // NUEVO: Estado para la ruedita
  const [isLoading, setIsLoading] = useState(false); 
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setErrorFields([]);

    if (!username || !email || !password || !password2) {
      setErrorMessage('Ingresa los datos para el registro');
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

    setIsLoading(true); // ⬅️ Prendemos la ruedita

    try {
      const response = await fetch(`${API_BASE}/api/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
          password2: password2
        })
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        setIsSuccess(true);
      } else {
        // ⬅️ LÓGICA INTELIGENTE PARA PINTAR EL BORDE ROJO EXACTO
        let errorMsg = 'Error al registrar el usuario';
        
        if (data.data) {
           const firstErrorKey = Object.keys(data.data)[0];
           errorMsg = data.data[firstErrorKey][0]; 
           setErrorFields([firstErrorKey]); // Pinta de rojo el input que falló (ej: 'username' o 'email')
        } else if (data.message) {
           errorMsg = data.message;
        } else if (data.email) {
           errorMsg = data.email[0];
           setErrorFields(['email']);
        } else if (data.username) {
           errorMsg = data.username[0];
           setErrorFields(['username']);
        }
        
        setErrorMessage(errorMsg);
      }
    } catch (error) {
      console.error("Error conectando al backend:", error);
      setErrorMessage('Error de conexión con el servidor');
    } finally {
      setIsLoading(false); // ⬅️ Apagamos la ruedita
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
        <h2>Registrarse</h2>
        <p className="subtitle">Completa el formulario con tus datos</p>

        {isSuccess && (
          <div className="success-alert">
            El registro fue exitoso
          </div>
        )}

        {!isSuccess && errorMessage && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span> {errorMessage}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label>Nombre de usuario</label>
            <input 
              type="text" 
              placeholder="Ej: Juan Perez" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={errorFields.includes('username') ? 'input-error' : ''}
              disabled={isSuccess || isLoading} 
            />
          </div>

          <div className="input-group">
            <label>Correo electrónico</label>
            <input 
              type="email" 
              placeholder="usuario@ejemplo.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errorFields.includes('email') ? 'input-error' : ''}
              disabled={isSuccess || isLoading}
            />
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errorFields.includes('password') ? 'input-error' : ''}
              disabled={isSuccess || isLoading}
            />
          </div>

          <div className="input-group">
            <label>Confirmar contraseña</label>
            <input 
              type="password" 
              placeholder="••••••" 
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className={errorFields.includes('password2') ? 'input-error' : ''}
              disabled={isSuccess || isLoading}
            />
          </div>

          {isSuccess ? (
            <button 
              type="button" 
              className="success-button" 
              onClick={() => navigate('/login')}
            >
              Iniciar Sesión
            </button>
          ) : (
            <button type="submit" className="primary-button" disabled={isLoading}>
              {isLoading ? <div className="spinner-loader"></div> : 'Crear Cuenta'}
            </button>
          )}
        </form>
        
        {!isSuccess && (
          <div className="redirect-link">
            <span>¿Ya tienes cuenta? <span style={{cursor: 'pointer', color: '#0f4cff', textDecoration: 'underline'}} onClick={() => navigate('/login')}>Inicia Sesión</span></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Registrar;