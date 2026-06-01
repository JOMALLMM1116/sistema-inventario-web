// src/components/Sidebar.jsx
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Roles mapeados según tu base de datos SQL Server
  // id_rol === 1 (Administrador), id_rol === 2 (Gerente), id_rol === 3 (Vendedor/Operador)
  const esAdmin = usuario?.id_rol === 1;
  const esGerente = usuario?.id_rol === 2 || esAdmin;

  const cambiarRuta = (ruta) => {
    navigate(ruta);
  };

  return (
    <div style={estilos.sidebar}>
      
      {/* Sección Perfil / Encabezado */}
      <div style={estilos.perfilSeccion}>
        <div style={estilos.avatarContenedor}>
          <div style={estilos.avatar}>
            {usuario?.nombre?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span style={estilos.dotActivo}></span>
        </div>
        <div style={estilos.usuarioInfo}>
          <h3 style={estilos.nombre}>{usuario?.nombre} {usuario?.apellido}</h3>
          <span style={estilos.rolBadge}>
            {usuario?.rol_nombre || 'Usuario'}
          </span>
        </div>
      </div>

      {/* Menú de Navegación */}
      <div style={estilos.menuContenedor}>
        
        <div style={estilos.grupoTitulo}>OPERACIONES</div>
        
        <button 
          style={{ ...estilos.navLink, ...(location.pathname === '/inventario' ? estilos.navLinkActivo : {}) }}
          onClick={() => cambiarRuta('/inventario')}
        >
          <span style={estilos.icono}>📦</span> Inventario / Productos
        </button>

        {/* Las siguientes rutas se habilitarán visualmente a medida que agreguemos las pantallas */}
        <button style={estilos.navLink} onClick={() => alert('Próximamente Módulo de Ventas')}>
          <span style={estilos.icono}>🛒</span> Punto de Venta (Facturar)
        </button>

        <button style={estilos.navLink} onClick={() => alert('Próximamente Módulo de Compras')}>
          <span style={estilos.icono}>📥</span> Compras / Abastecer
        </button>

        {/* Módulos Exclusivos para Gerente o Administrador (BI e Inteligencia Artificial) */}
        {esGerente && (
          <>
            <div style={estilos.grupoTitulo}>ANALÍTICA Y BI</div>
            
            <button style={estilos.navLink} onClick={() => alert('Próximamente Tableros OLAP')}>
              <span style={estilos.icono}>📊</span> Data Warehouse Cubo
            </button>
            
            <button style={estilos.navLink} onClick={() => alert('Próximamente Predicciones de IA')}>
              <span style={estilos.icono}>🧠</span> Inteligencia Artificial
            </button>
          </>
        )}

        {/* Módulos Exclusivos para el Administrador (Mantenimiento, Backups, Seguridad) */}
        {esAdmin && (
          <>
            <div style={estilos.grupoTitulo}>MANTENIMIENTO</div>
            
            <button style={estilos.navLink} onClick={() => alert('Próximamente Notificaciones de Stock Bajo')}>
              <span style={estilos.icono}>🔔</span> Alertas de Soporte
            </button>
            
            <button style={estilos.navLink} onClick={() => alert('Próximamente Sistema de Respaldos')}>
              <span style={estilos.icono}>🖴</span> Copias de Seguridad
            </button>
          </>
        )}

      </div>

      {/* Botón de Cerrar Sesión en el Pie */}
      <div style={estilos.pieSidebar}>
        <button style={estilos.btnLogout} onClick={logout}>
          <span style={{ marginRight: '8px' }}>🚪</span> Cerrar Sesión
        </button>
      </div>

    </div>
  );
}

// Estilos replicados del CSS nativo de tu plantilla adaptados a JS Objects
const estilos = {
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--sidebar-bg)',
    borderRight: '1px solid var(--sidebar-borde)',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  perfilSeccion: {
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    borderBottom: '1px solid var(--sidebar-borde)',
  },
  avatarContenedor: {
    position: 'relative',
  },
  avatar: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    backgroundColor: 'var(--acento)',
    color: 'var(--acento-txt)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: '700',
    fontSize: '18px',
  },
  dotActivo: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: 'var(--exito)',
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    border: '2px solid var(--sidebar-bg)',
  },
  usuarioInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  nombre: {
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rolBadge: {
    color: 'var(--sidebar-txt)',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '600',
  },
  menuContenedor: {
    padding: '20px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    overflowY: 'auto',
  },
  grupoTitulo: {
    color: 'var(--sidebar-titulo)',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '1px',
    marginTop: '16px',
    marginBottom: '6px',
    paddingLeft: '10px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '11px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: 'var(--sidebar-txt)',
    fontSize: '13px',
    fontWeight: '500',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  navLinkActivo: {
    backgroundColor: 'var(--sidebar-hover)',
    color: '#FFFFFF',
    fontWeight: '600',
    borderLeft: '3px solid var(--acento)',
    borderRadius: '0px 6px 6px 0px',
  },
  icono: {
    marginRight: '12px',
    fontSize: '15px',
    display: 'inline-block',
    width: '20px',
    textAlign: 'center',
  },
  pieSidebar: {
    padding: '16px',
    borderTop: '1px solid var(--sidebar-borde)',
  },
  btnLogout: {
    width: '100%',
    padding: '10px',
    backgroundColor: 'rgba(192, 57, 43, 0.15)',
    border: '1px solid var(--error)',
    borderRadius: '6px',
    color: '#E5675a',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  }
};