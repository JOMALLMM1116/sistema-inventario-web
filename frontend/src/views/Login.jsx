// src/views/Login.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    // Validaciones básicas de entrada
    if (!email || !password) {
      setError('Por favor, complete todos los campos.');
      setCargando(false);
      return;
    }

    try {
      // Petición real a tu API login.php
      const respuesta = await apiService.login(email, password);

      if (respuesta.status === 'success') {
        // Guardamos en el contexto: id_usuario, nombre, apellido, email, id_rol, rol_nombre
        login(respuesta.usuario);
      } else {
        setError(respuesta.message || 'Credenciales incorrectas.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor. Verifique que la API de PHP esté corriendo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={estilos.contenedor}>
      <div style={estilos.tarjeta}>
        
        {/* Encabezado Corporativo */}
        <div style={estilos.encabezado}>
          <div style={estilos.logo}>
            <span style={estilos.iconoLogo}>🛡️</span>
          </div>
          <h2 style={estilos.titulo}>Sistema de Inventario Erp</h2>
          <p style={estilos.subtitulo}>Ingrese sus credenciales de acceso seguro</p>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div style={estilos.alertaError}>
            <span style={{ marginRight: '8px' }}>⚠️</span>
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={estilos.formulario}>
          <div style={estilos.grupoForm}>
            <label style={estilos.label}>Correo Electrónico</label>
            <input
              type="email"
              placeholder="manuel.lopez@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={estilos.input}
              disabled={cargando}
              required
            />
          </div>

          <div style={estilos.grupoForm}>
            <label style={estilos.label}>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={estilos.input}
              disabled={cargando}
              required
            />
          </div>

          <button
            type="submit"
            style={{
              ...estilos.boton,
              backgroundColor: cargando ? 'var(--texto-suave)' : 'var(--acento)',
              cursor: cargando ? 'not-allowed' : 'pointer'
            }}
            disabled={cargando}
          >
            {cargando ? 'Verificando con SQL Server...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Pie de página del Login */}
        <div style={estilos.pie}>
          <span>Conexión cifrada vía base de datos corporativa</span>
        </div>

      </div>
    </div>
  );
}

// Estilos embebidos utilizando las variables CSS nativas que definimos en index.css
const estilos = {
  contenedor: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100vw',
    height: '100vh',
    background: 'linear-gradient(135deg, #091235 0%, #060B1F 100%)',
    padding: '20px',
  },
  tarjeta: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
    padding: '40px 30px',
    border: '1px solid #2B4257',
  },
  encabezado: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  logo: {
    width: '60px',
    height: '60px',
    backgroundColor: '#E1F5EE',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 auto 15px auto',
  },
  iconoLogo: {
    fontSize: '28px',
  },
  titulo: {
    color: '#091235',
    fontSize: '22px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    marginBottom: '5px',
  },
  subtitulo: {
    color: '#5C6B7A',
    fontSize: '13px',
  },
  formulario: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  grupoForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    color: '#1A2533',
    fontWeight: '600',
    fontSize: '13px',
  },
  input: {
    padding: '12px 14px',
    borderRadius: '6px',
    border: '1px solid #E1E6ED',
    fontSize: '14px',
    outline: 'none',
    color: '#1A2533',
    transition: 'border-color 0.2s',
  },
  boton: {
    padding: '14px',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '15px',
    transition: 'background-color 0.2s',
    marginTop: '10px',
  },
  alertaError: {
    backgroundColor: '#FCEBEB',
    color: '#C0392B',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #E5675a',
  },
  pie: {
    textAlign: 'center',
    marginTop: '25px',
    color: '#88A9C3',
    fontSize: '11px',
    letterSpacing: '0.3px',
  }
};