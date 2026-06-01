// src/components/Topbar.jsx
import { useState, useEffect } from 'react';

export default function Topbar({ titulo, busqueda, setBusqueda }) {
  // Inicializamos el tema leyendo el atributo actual o por defecto 'claro'
  const [tema, setTema] = useState(() => {
    return document.documentElement.getAttribute('data-tema') || 'claro';
  });

  // Cada vez que el estado del tema cambie, lo inyectamos en el HTML raíz
  useEffect(() => {
    document.documentElement.setAttribute('data-tema', tema);
  }, [tema]);

  return (
    <div style={estilos.topbar}>
      
      {/* Título Dinámico de la sección */}
      <div style={estilos.tituloContenedor}>
        <h1 style={estilos.titulo}>{titulo}</h1>
      </div>

      {/* Buscador Sincronizado con la vista actual */}
      <div style={estilos.buscarContenedor}>
        <span style={estilos.iconoLupa}>🔍</span>
        <input
          type="text"
          placeholder="Buscar registros por coincidencia..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={estilos.inputBuscar}
        />
      </div>

      {/* Selector de Temas e Interacciones */}
      <div style={estilos.accionesDerecha}>
        <div style={estilos.temaSelector}>
          <button 
            style={{ ...estilos.btnTema, ...(tema === 'claro' ? estilos.btnTemaActivo : {}) }}
            onClick={() => setTema('claro')}
          >
            ☀️ Claro
          </button>
          <button 
            style={{ ...estilos.btnTema, ...(tema === 'oscuro' ? estilos.btnTemaActivo : {}) }}
            onClick={() => setTema('oscuro')}
          >
            🌙 Oscuro
          </button>
          <button 
            style={{ ...estilos.btnTema, ...(tema === 'gris' ? estilos.btnTemaActivo : {}) }}
            onClick={() => setTema('gris')}
          >
            🔘 Gris
          </button>
        </div>
      </div>

    </div>
  );
}

// Estilos de la Topbar basados en las reglas CSS de tu maqueta
const estilos = {
  topbar: {
    height: '70px',
    backgroundColor: 'var(--superficie)',
    borderBottom: '1px solid var(--borde)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 90,
    transition: 'background-color .25s, border-color .25s',
  },
  tituloContenedor: {
    minWidth: '180px',
  },
  titulo: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--texto)',
    letterSpacing: '-0.3px',
  },
  buscarContenedor: {
    position: 'relative',
    width: '100%',
    maxWidth: '400px',
    margin: '0 20px',
  },
  iconoLupa: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--texto-suave)',
    fontSize: '14px',
    pointerEvents: 'none',
  },
  inputBuscar: {
    width: '100%',
    padding: '10px 12px 10px 36px',
    backgroundColor: 'var(--superficie-2)',
    border: '1px solid var(--borde)',
    borderRadius: '8px',
    color: 'var(--texto)',
    fontSize: '13px',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  accionesDerecha: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  temaSelector: {
    display: 'flex',
    backgroundColor: 'var(--superficie-2)',
    padding: '4px',
    borderRadius: '8px',
    border: '1px solid var(--borde)',
    gap: '2px',
  },
  btnTema: {
    padding: '6px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--texto-suave)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  btnTemaActivo: {
    backgroundColor: 'var(--superficie)',
    color: 'var(--acento)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  }
};