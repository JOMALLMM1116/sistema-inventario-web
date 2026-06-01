// src/pages/Olap.jsx
// Analisis OLAP multidimensional sobre el Data Warehouse.
// Permite elegir la dimension (tiempo, categoria, vendedor, cliente) y ver las
// medidas agregadas (monto, ganancia, unidades) en grafico y tabla.
// Es el "slice and dice": cambiar la dimension reorganiza el analisis.

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import "../styles/reportes.css";

const DIMENSIONES = [
  { clave: "categoria", nombre: "Por categoria" },
  { clave: "tiempo", nombre: "Por trimestre" },
  { clave: "vendedor", nombre: "Por vendedor" },
  { clave: "cliente", nombre: "Por cliente" },
];

export default function Olap() {
  const [dimension, setDimension] = useState("categoria");
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setCargando(true);
    setError("");
    fetch(`http://localhost:8080/api/olap.php?dimension=${dimension}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status !== "success") throw new Error(d.message);
        setDatos(d.datos || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [dimension]);

  // totales generales (la celda "gran total" del cubo)
  const totalMonto = datos.reduce((s, d) => s + d.monto, 0);
  const totalGanancia = datos.reduce((s, d) => s + d.ganancia, 0);
  const totalUnidades = datos.reduce((s, d) => s + d.unidades, 0);

  return (
    <div>
      <div className="inv-encabezado">
        <h1 className="inv-titulo">Analisis OLAP</h1>
      </div>

      {/* selector de dimension */}
      <div className="inv-filtros" style={{ marginBottom: 20 }}>
        {DIMENSIONES.map((d) => (
          <button
            key={d.clave}
            className={dimension === d.clave ? "activo" : ""}
            onClick={() => setDimension(d.clave)}
          >
            {d.nombre}
          </button>
        ))}
      </div>

      {cargando ? (
        <p className="inv-cargando">Consultando el cubo...</p>
      ) : error ? (
        <div className="inv-error">
          {error}
          <br />
          <small>
            Si el Data Warehouse esta vacio, ejecuta el ETL (script 18) en SSMS
            para poblar las tablas dw_ desde las ventas.
          </small>
        </div>
      ) : datos.length === 0 ? (
        <div className="inv-error">
          El Data Warehouse no tiene datos. Ejecuta el ETL (script 18) en SSMS
          para poblarlo desde las ventas registradas.
        </div>
      ) : (
        <>
          {/* medidas totales */}
          <div className="rep-resumen">
            <div className="metrica">
              <div className="metrica-etq">Monto total</div>
              <div className="metrica-valor">Q {totalMonto.toFixed(2)}</div>
            </div>
            <div className="metrica">
              <div className="metrica-etq">Ganancia total</div>
              <div className="metrica-valor">Q {totalGanancia.toFixed(2)}</div>
            </div>
            <div className="metrica">
              <div className="metrica-etq">Unidades vendidas</div>
              <div className="metrica-valor">{totalUnidades}</div>
            </div>
          </div>

          {/* grafico de barras por dimension */}
          <div className="rep-grafico" style={{ marginBottom: 24 }}>
            <h3>Monto y ganancia por dimension</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={datos}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--borde)" />
                <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => "Q " + Number(v).toFixed(2)} />
                <Legend />
                <Bar dataKey="monto" fill="#185fa5" name="Monto" radius={[5, 5, 0, 0]} />
                <Bar dataKey="ganancia" fill="#b68d40" name="Ganancia" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* tabla del cubo */}
          <div className="inv-panel">
            <div className="inv-panel-cab">
              <h2>Detalle del cubo</h2>
            </div>
            <table className="inv-tabla">
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>Unidades</th>
                  <th>Monto</th>
                  <th>Ganancia</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((d, i) => (
                  <tr key={i}>
                    <td className="inv-prod-nombre">{d.etiqueta}</td>
                    <td>{d.unidades}</td>
                    <td className="inv-precio">Q {d.monto.toFixed(2)}</td>
                    <td className="inv-precio">Q {d.ganancia.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="inv-pie">{datos.length} filas en esta dimension</div>
          </div>
        </>
      )}
    </div>
  );
}
