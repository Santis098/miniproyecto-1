import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Registrar.css'; // Asegúrate de que el nombre coincida con tu archivo CSS

const API_BASE = process.env.REACT_APP_API_URL || 'https://miniproyecto-1-x936.onrender.com';

const Registrar = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  
  const [errorMessage, setErrorMessage] = useState('');
  const [errorFields, setErrorFields] = useState([]);
  
  // NUEVO: Estado para saber si el registro fue exitoso
  const [isSuccess, setIsSuccess] = useState(false); 
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setErrorFields([]);

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
        // En lugar de alert(), activamos la pantalla verde
        setIsSuccess(true);
      } else {
        let errorMsg = 'Error al registrar el usuario';
        if (data.data) {
           const firstErrorKey = Object.keys(data.data)[0];
           errorMsg = data.data[firstErrorKey][0]; 
        } else if (data.message) {
           errorMsg = data.message;
        }
        setErrorMessage(errorMsg);
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
        <h2>Registrarse</h2>
        <p className="subtitle">Completa el formulario con tus datos</p>

        {/* ALERTA DE ÉXITO (Verde) */}
        {isSuccess && (
          <div className="success-alert">
            El registro fue exitoso
          </div>
        )}

        {/* ALERTA DE ERROR (Roja - Se oculta si hay éxito) */}
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
              placeholder="Ej: juanperez123" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={errorFields.includes('username') ? 'input-error' : ''}
              disabled={isSuccess} /* Deshabilita el input si ya fue exitoso */
            />
          </div>

          <div className="input-group">
            <label>Correo electrónico</label>
            <input 
              type="email" 
              placeholder="juanperez@gmail.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errorFields.includes('email') ? 'input-error' : ''}
              disabled={isSuccess}
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
              disabled={isSuccess}
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
              disabled={isSuccess}
            />
          </div>

          {/* CAMBIO DE BOTÓN DINÁMICO */}
          {isSuccess ? (
            <button 
              type="button" 
              className="success-button" 
              onClick={() => navigate('/login')}
            >
              Iniciar Sesión
            </button>
          ) : (
            <button type="submit" className="primary-button">
              Registrarme
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Registrar;