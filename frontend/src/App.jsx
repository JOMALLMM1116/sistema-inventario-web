// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './views/Login';
import Inventario from './views/Inventario';

// Componente para proteger rutas privadas
const RutaProtegida = ({ children }) => {
  const { usuario } = useAuth();
  return usuario ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const { usuario } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const [tituloVista, setTituloVista] = useState('Panel de Inventario');

  return (
    <Router>
      <Routes>
        {/* Manejo explícito de la raíz '/' */}
        <Route 
          path="/" 
          element={<Navigate to={usuario ? "/inventario" : "/login"} replace />} 
        />

        {/* Ruta pública del Login */}
        <Route 
          path="/login" 
          element={!usuario ? <Login /> : <Navigate to="/inventario" replace />} 
        />

        {/* Todas las demás rutas quedan atrapadas y protegidas aquí */}
        <Route
          path="/*"
          element={
            <RutaProtegida>
              <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
                
                <Sidebar />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  
                  <Topbar 
                    titulo={tituloVista} 
                    busqueda={busqueda} 
                    setBusqueda={setBusqueda} 
                  />

                  <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                    <Routes>
                      <Route 
                        path="/inventario" 
                        element={<Inventario busqueda={busqueda} setTitulo={setTituloVista} />} 
                      />
                      {/* Redirección por si escriben cualquier otra ruta rota */}
                      <Route path="*" element={<Navigate to="/inventario" replace />} />
                    </Routes>
                  </div>

                </div>
              </div>
            </RutaProtegida>
          }
        />
      </Routes>
    </Router>
  );
}