// src/pages/Movimientos.jsx
// Historial de movimientos de inventario (solo lectura).
// Muestra entradas/salidas con el stock antes/despues y quien lo hizo.

import { useState, useEffect } from "react";
import { listarMovimientos } from "../services/api";
import "../styles/inventario.css";

export default function Movimientos() {
  const [movs, setMovs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listarMovimientos()
      .then((res) => setMovs(res.movimientos || []))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p className="inv-cargando">Cargando movimientos...</p>;
  if (error) return <div className="inv-error">No se pudo cargar: {error}</div>;

  return (
    <div>
      <div className="inv-encabezado">
        <h1 className="inv-titulo">Movimientos de inventario</h1>
      </div>

      <div className="inv-panel">
        <div className="inv-panel-cab">
          <h2>Historial</h2>
        </div>
        <table className="inv-tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Stock antes</th>
              <th>Stock despues</th>
              <th>Motivo</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            {movs.map((m) => {
              const tipo = String(m.tipo_movimiento || "").toLowerCase();
              const clase = tipo.includes("entrada") || tipo.includes("compra")
                ? "ok"
                : tipo.includes("salida") || tipo.includes("venta")
                ? "sin"
                : "bajo";
              return (
                <tr key={m.id_movimiento}>
                  <td>
                    <div className="inv-prod-nombre">{m.producto_nombre}</div>
                    <div className="inv-codigo">{m.producto_codigo}</div>
                  </td>
                  <td>
                    <span className={`inv-badge ${clase}`}>
                      <span className="inv-dot"></span> {m.tipo_movimiento}
                    </span>
                  </td>
                  <td>{m.cantidad}</td>
                  <td>{m.stock_antes}</td>
                  <td>{m.stock_despues}</td>
                  <td>{m.motivo}</td>
                  <td>{m.usuario_nombre}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="inv-pie">{movs.length} movimientos</div>
      </div>
    </div>
  );
}
