import React, { useState } from 'react';
import './Registrar.css'; // Usaremos su propio archivo de estilos

const Registrar = () => {
  // 1. Estados de los campos
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2. Estados de errores
  const [errorMessage, setErrorMessage] = useState('');
  const [errorFields, setErrorFields] = useState([]);

  // 3. Lógica de validación al enviar el formulario
  const handleRegister = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setErrorFields([]);

    // Validación A: Campos vacíos
    if (!username || !email || !password || !confirmPassword) {
      setErrorMessage('Ingresa los datos para el registro');
      setErrorFields(['username', 'email', 'password', 'confirmPassword']);
      return;
    }

    // Validación B: Mínimo 4 caracteres en usuario
    if (username.length < 4) {
      setErrorMessage('Ingresa mínimo 4 caracteres');
      setErrorFields(['username']);
      return;
    }

    // Validación C: Formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Ten en cuenta los parámetros para correo: 'usuario@ejemplo.com'");
      setErrorFields(['email']);
      return;
    }

    // Validación D: Mínimo 6 caracteres en contraseña
    if (password.length < 6) {
      setErrorMessage('Ingresa mínimo 6 caracteres');
      setErrorFields(['password', 'confirmPassword']);
      return;
    }

    // Validación E: Contraseñas no coinciden
    if (password !== confirmPassword) {
      setErrorMessage('Las dos contraseñas no coinciden');
      setErrorFields(['password', 'confirmPassword']);
      return;
    }

    // Si todo está correcto (Aquí luego enviaremos los datos al backend)
    alert('¡Formulario validado correctamente! Listo para enviar al backend.');
  };

  return (
    <div className="register-container">
      <div className="register-header">
        <div className="logo-icon">📅</div>
        <h1>Gestión de Actividades</h1>
        <p>Organiza, planifica y ejecuta tus actividades con eficiencia</p>
      </div>

      <div className="register-card">
        <h2>Registrarse</h2>
        <p className="subtitle">Completa el formulario con tus datos</p>

        {errorMessage && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span> {errorMessage}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label>Nombre de usuario</label>
            <input 
              type="text" 
              placeholder="Juan Perez" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={errorFields.includes('username') ? 'input-error' : ''}
            />
          </div>

          <div className="input-group">
            <label>Correo electrónico</label>
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
              placeholder="••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errorFields.includes('password') ? 'input-error' : ''}
            />
          </div>

          <div className="input-group">
            <label>Confirmar contraseña</label>
            <input 
              type="password" 
              placeholder="••••••" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={errorFields.includes('confirmPassword') ? 'input-error' : ''}
            />
          </div>

          <button type="submit" className="primary-button">
            Crear Cuenta
          </button>
        </form>

        <div className="redirect-link">
          <span>¿Ya tienes cuenta? <a href="/login">Inicia Sesión</a></span>
        </div>
      </div>
    </div>
  );
};

export default Registrar;