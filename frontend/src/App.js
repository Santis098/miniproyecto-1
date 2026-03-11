// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importamos todas tus pantallas
import Login from './pages/Login';
import Registrar from './pages/Registrar';
import Dashboard from './pages/Dashboard'; // Este es tu código anterior

// El Guardián de Rutas
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registrar />} />

        {/* Ruta Protegida: Reemplazamos la vista temporal por tu Dashboard real */}
        <Route 
          path="/hoy" 
          element={
            <ProtectedRoute>
              <Dashboard /> 
            </ProtectedRoute>
          } 
        />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;