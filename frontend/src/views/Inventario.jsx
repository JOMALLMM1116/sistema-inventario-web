// src/views/Inventario.jsx
import { useEffect, useState } from 'react';
import { apiService } from '../services/api';

export default function Inventario({ busqueda, setTitulo }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setTitulo('Control de Inventario y Productos');
  }, [setTitulo]);

  useEffect(() => {
    apiService.listarCatalogo('producto')
      .then(data => {
        if (Array.isArray(data)) {
          setProductos(data);
        } else {
          setError('El formato de respuesta del servidor no es válido.');
        }
        setCargando(false);
      })
      .catch(err => {
        setError('Error al conectar con la API de PHP.');
        setCargando(false);
      });
  }, []);

  const productosFiltrados = productos.filter(p => 
    p.nombre_producto?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.proveedor?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalProductos = productos.length;
  const stockGlobal = productos.reduce((acc, p) => acc + (parseInt(p.stock) || 0), 0);
  const stockBajoCount = productos.filter(p => (parseInt(p.stock) || 0) > 0 && (parseInt(p.stock) || 0) <= 8).length;
  const sinStockCount = productos.filter(p => (parseInt(p.stock) || 0) === 0).length;

  return (
    <div style={estilos.vistaContenedor}>
      
      {/* 1. SECCIÓN DE TARJETAS DE MÉTRICAS */}
      <div style={estilos.metricasGrid}>
        <div style={estilos.tarjetaMetrica}>
          <div style={estilos.metricaEtiqueta}>
            <span style={{...estilos.puntoIndicador, backgroundColor: 'var(--info)'}}></span>
            Productos Totales
          </div>
          <div style={estilos.metricaValor}>{totalProductos}</div>
          <div style={estilos.metricaSubtitulo}>Ítems registrados en catálogo</div>
        </div>

        <div style={estilos.tarjetaMetrica}>
          <div style={estilos.metricaEtiqueta}>
            <span style={{...estilos.puntoIndicador, backgroundColor: 'var(--exito)'}}></span>
            Stock Disponible
          </div>
          <div style={estilos.metricaValor}>{stockGlobal.toLocaleString()}</div>
          <div style={estilos.metricaSubtitulo}>Unidades totales en bodega</div>
        </div>

        <div style={estilos.tarjetaMetrica}>
          <div style={estilos.metricaEtiqueta}>
            <span style={{...estilos.puntoIndicador, backgroundColor: 'var(--alerta)'}}></span>
            Stock Bajo
          </div>
          <div style={estilos.metricaValor}>{stockBajoCount}</div>
          <div style={estilos.metricaSubtitulo}>Requieren orden de compra</div>
        </div>

        <div style={estilos.tarjetaMetrica}>
          <div style={estilos.metricaEtiqueta}>
            <span style={{...estilos.puntoIndicador, backgroundColor: 'var(--error)'}}></span>
            Sin Stock
          </div>
          <div style={estilos.metricaValor}>{sinStockCount}</div>
          <div style={estilos.metricaSubtitulo}>Artículos agotados en piso</div>
        </div>
      </div>

      {/* 2. PANEL CONTENEDOR DE LA TABLA PRINCIPAL */}
      <div style={estilos.panel}>
        <div style={estilos.panelCabecera}>
          <h2 style={estilos.panelTitulo}>Existencias en Base de Datos Relacional</h2>
        </div>

        {cargando && <div style={estilos.estadoMensaje}>⏳ Extrayendo registros desde SQL Server...</div>}
        {error && <div style={{...estilos.estadoMensaje, color: 'var(--error)'}}>❌ {error}</div>}

        {!cargando && !error && (
          <div style={{ overflowX: 'auto' }}>
            <table style={estilos.tabla}>
              <thead>
                <tr>
                  <th style={estilos.th}>Código</th>
                  <th style={estilos.th}>Producto / Categoría</th>
                  <th style={estilos.th}>Proveedor</th>
                  <th style={estilos.th}>Existencias</th>
                  <th style={estilos.th}>Estado</th>
                  <th style={estilos.th}>Precio Unitario</th>
                  <th style={estilos.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{...estilos.td, textAlign: 'center', color: 'var(--texto-suave)'}}>
                      No se encontraron productos que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((prod, idx) => {
                    const cant = parseInt(prod.stock) || 0;
                    
                    let badgeEstilo = estilos.badgeOk;
                    let badgeTexto = 'Disponible';
                    if (cant === 0) {
                      badgeEstilo = styles => estilos.badgeSin;
                      badgeTexto = 'Sin stock';
                    } else if (cant <= 8) {
                      badgeEstilo = estilos.badgeBajo;
                      badgeTexto = 'Stock bajo';
                    }

                    return (
                      <tr key={prod.id_producto || idx} style={estilos.trHover}>
                        <td style={{...estilos.td, ...estilos.colCodigo}}>{prod.codigo || `P-00${prod.id_producto}`}</td>
                        <td style={estilos.td}>
                          <div style={estilos.prodNombre}>{prod.nombre_producto}</div>
                          <div style={estilos.prodCat}>{prod.categoria || 'Sin Categoría'}</div>
                        </td>
                        <td style={{...estilos.td, color: 'var(--texto-suave)'}}>{prod.proveedor || 'Distribuidor Central'}</td>
                        <td style={{...estilos.td, fontWeight: '600'}}>{cant}</td>
                        <td style={estilos.td}>
                          <span style={badgeEstilo === estilos.badgeSin ? estilos.badgeSin : (badgeEstilo === estilos.badgeBajo ? estilos.badgeBajo : estilos.badgeOk)}>
                            <span style={estilos.badgeDot}></span>
                            {badgeTexto}
                          </span>
                        </td>
                        <td style={{...estilos.td, ...estilos.colPrecio}}>
                          Q {parseFloat(prod.precio_venta || prod.precio || 0).toFixed(2)}
                        </td>
                        <td style={estilos.td}>
                          <div style={estilos.accionesContenedor}>
                            <button style={estilos.btnAccion} title="Editar Producto">✎</button>
                            <button style={estilos.btnAccion} title="Dar de baja">❑</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div style={estilos.pieTabla}>
          <span style={{color: 'var(--texto-suave)'}}>
            Mostrando {productosFiltrados.length} de {totalProductos} productos mapeados
          </span>
        </div>
      </div>

    </div>
  );
}

const estilos = {
  vistaContenedor: { display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' },
  metricasGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' },
  tarjetaMetrica: { backgroundColor: 'var(--superficie)', border: '1px solid var(--borde)', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  metricaEtiqueta: { fontSize: '13px', fontWeight: '600', color: 'var(--texto-suave)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
  puntoIndicador: { width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' },
  metricaValor: { fontSize: '28px', fontWeight: '700', color: 'var(--texto)', marginBottom: '4px' },
  metricaSubtitulo: { fontSize: '11px', color: 'var(--texto-suave)' },
  panel: { backgroundColor: 'var(--superficie)', border: '1px solid var(--borde)', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' },
  panelCabecera: { padding: '20px 24px', borderBottom: '1px solid var(--borde)' },
  panelTitulo: { fontSize: '15px', fontWeight: '700', color: 'var(--texto)' },
  estadoMensaje: { padding: '40px', textAlign: 'center', fontSize: '14px', fontWeight: '500', color: 'var(--texto-suave)' },
  tabla: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' },
  th: { backgroundColor: 'var(--superficie-2)', color: 'var(--texto-suave)', fontWeight: '600', padding: '14px 20px', borderBottom: '1px solid var(--borde)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' },
  td: { padding: '14px 20px', borderBottom: '1px solid var(--borde)', color: 'var(--texto)', verticalAlign: 'middle' },
  trHover: { transition: 'background-color 0.15s' },
  colCodigo: { fontFamily: 'monospace', fontWeight: '600', color: 'var(--info)', fontSize: '13px' },
  prodNombre: { fontWeight: '600', color: 'var(--texto)' },
  prodCat: { fontSize: '11px', color: 'var(--texto-suave)', marginTop: '2px' },
  colPrecio: { fontWeight: '700', color: 'var(--texto)', fontFamily: 'SFMono-Regular, Consolas, monospace' },
  badgeOk: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '50px', fontSize: '12px', fontWeight: '600', backgroundColor: 'var(--exito-fondo)', color: 'var(--exito)' },
  badgeBajo: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '50px', fontSize: '12px', fontWeight: '600', backgroundColor: 'var(--alerta-fondo)', color: 'var(--alerta)' },
  badgeSin: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '50px', fontSize: '12px', fontWeight: '600', backgroundColor: 'var(--error-fondo)', color: 'var(--error)' },
  badgeDot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' },
  accionesContenedor: { display: 'flex', gap: '6px' },
  btnAccion: { padding: '6px 10px', backgroundColor: 'var(--superficie-2)', border: '1px solid var(--borde)', borderRadius: '6px', cursor: 'pointer', color: 'var(--texto-suave)', fontWeight: '600', fontSize: '14px', transition: 'all 0.15s' },
  pieTabla: { padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--borde)', backgroundColor: 'var(--superficie-2)', borderRadius: '0 0 12px 12px' }
};