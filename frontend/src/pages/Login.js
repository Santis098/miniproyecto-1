import React, { useState } from 'react';
import './Login.css';

const Login = () => {
  // 1. Estados para guardar lo que el usuario escribe
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 2. Estados para manejar los errores
  const [errorMessage, setErrorMessage] = useState('');
  const [errorFields, setErrorFields] = useState([]); // Guarda qué campos deben ponerse rojos

  // 3. Función que se ejecuta al hacer clic en "Iniciar Sesión"
  const handleLogin = (e) => {
    e.preventDefault(); // Evita que la página se recargue

    // Limpiamos errores previos antes de validar de nuevo
    setErrorMessage('');
    setErrorFields([]);

    // Validación A: Campos vacíos (Prototipo 2)
    if (!email || !password) {
      setErrorMessage('Ingresa los datos para acceder');
      setErrorFields(['email', 'password']);
      return; // Detiene la ejecución aquí
    }

    // Validación B: Formato de correo incorrecto (Prototipo 3)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Ten en cuenta los parámetros para correo: 'usuario@ejemplo.com'");
      setErrorFields(['email']);
      return;
    }

    // Simulación de Validación C: Credenciales incorrectas (Prototipo 4)
    // Nota: Aquí en el futuro harás la petición a tu backend. Por ahora simularemos que el correo correcto es "admin@ejemplo.com"
    if (email !== 'admin@ejemplo.com' || password !== '123456') {
      setErrorMessage('Usuario y/o contraseña incorrecta');
      setErrorFields(['email', 'password']);
      return;
    }

    // Si pasa todas las validaciones:
    alert('¡Login Exitoso! Redirigiendo...');
    // Aquí luego pondremos el código para redirigir a la vista de Actividades
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

        {/* 4. Caja de mensaje de error (Solo se muestra si hay un errorMessage) */}
        {errorMessage && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span> {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Correo electrónico</label>
            <input 
              type="text" 
              placeholder="usuario@ejemplo.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // Si 'email' está en la lista de errores, le agregamos la clase 'input-error'
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
          <span>¿No tienes cuenta? <a href="/register">Regístrate</a></span>
        </div>
      </div>
    </div>
  );
};

export default Login;