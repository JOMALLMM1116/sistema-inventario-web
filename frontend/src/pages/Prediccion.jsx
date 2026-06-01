// src/pages/Prediccion.jsx
// Modulo de prediccion con IA. Muestra el historico de ventas por mes y la
// prediccion del proximo mes (modelo de regresion lineal entrenado en Python).
// Boton para generar una prediccion nueva.

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceDot,
} from "recharts";
import "../styles/reportes.css";

export default function Prediccion() {
  const { usuario } = useAuth();
  const [predicciones, setPredicciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [generando, setGenerando] = useState(false);
  const [aviso, setAviso] = useState(null);

  function recargar() {
    setCargando(true);
    fetch(`http://localhost:8080/api/prediccion.php?id_usuario=${usuario.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status !== "success") throw new Error(d.message);
        setPredicciones(d.predicciones || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    recargar();
    // eslint-disable-next-line
  }, []);

  async function generar() {
    setAviso(null);
    setGenerando(true);
    try {
      const resp = await fetch("http://localhost:8080/api/prediccion.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: usuario.id }),
      });
      const d = await resp.json();
      if (d.status !== "success") throw new Error(d.message);
      setAviso({
        tipo: "exito",
        texto: `Prediccion generada: Q${d.valor_predicho} (tendencia ${d.tendencia}, confianza ${(d.confianza * 100).toFixed(1)}%).`,
      });
      recargar();
    } catch (e) {
      setAviso({ tipo: "error", texto: e.message });
    } finally {
      setGenerando(false);
    }
  }

  // la prediccion mas reciente
  const ultima = predicciones[0];

  // armar los datos del grafico desde los detalles de la ultima prediccion
  let datosGrafico = [];
  let puntoPrediccion = null;
  if (ultima && ultima.detalles) {
    try {
      const det = JSON.parse(ultima.detalles);
      datosGrafico = (det.historico || []).map((h) => ({
        etiqueta: `${h.mes}/${h.anio}`,
        periodo: h.periodo,
        total: h.total,
      }));
      // agregar el punto de prediccion al final
      const sigPeriodo = datosGrafico.length + 1;
      puntoPrediccion = {
        etiqueta: "Prediccion",
        periodo: sigPeriodo,
        prediccion: Number(ultima.valor_predicho),
      };
      datosGrafico.push(puntoPrediccion);
    } catch (e) {
      // si los detalles no son JSON valido, dejamos el grafico vacio
    }
  }

  return (
    <div>
      <div className="inv-encabezado">
        <h1 className="inv-titulo">Prediccion de ventas (IA)</h1>
        <button className="crud-boton-nuevo" onClick={generar} disabled={generando}>
          {generando ? "Entrenando modelo..." : "Generar prediccion"}
        </button>
      </div>

      {aviso && (
        <div className={aviso.tipo === "exito" ? "compra-ok" : "inv-error"} style={{ marginBottom: 20 }}>
          {aviso.texto}
        </div>
      )}

      {cargando ? (
        <p className="inv-cargando">Cargando...</p>
      ) : error ? (
        <div className="inv-error">{error}</div>
      ) : !ultima ? (
        <div className="resp-tarjeta">
          <p style={{ color: "var(--texto-suave)" }}>
            Aun no hay predicciones. Pulsa "Generar prediccion" para que el modelo
            analice el historial de ventas y calcule la tendencia del proximo mes.
          </p>
        </div>
      ) : (
        <>
          {/* tarjeta de la prediccion actual */}
          <div className="rep-resumen">
            <div className="metrica">
              <div className="metrica-etq">Prediccion proximo mes</div>
              <div className="metrica-valor">
                Q {Number(ultima.valor_predicho).toFixed(2)}
              </div>
              <div className="metrica-sub">{ultima.etiqueta}</div>
            </div>
            <div className="metrica">
              <div className="metrica-etq">Confianza del modelo</div>
              <div className="metrica-valor">
                {(Number(ultima.probabilidad) * 100).toFixed(1)}%
              </div>
              <div className="metrica-sub">R cuadrado de la regresion</div>
            </div>
            <div className="metrica">
              <div className="metrica-etq">Modelo</div>
              <div className="metrica-valor" style={{ fontSize: 18 }}>
                Regresion lineal
              </div>
              <div className="metrica-sub">scikit-learn (Python)</div>
            </div>
          </div>

          {/* grafico historico + prediccion */}
          <div className="rep-grafico" style={{ marginBottom: 24 }}>
            <h3>Ventas mensuales y prediccion</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={datosGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--borde)" />
                <XAxis dataKey="etiqueta" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => "Q " + Number(v).toFixed(2)} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#185fa5"
                  strokeWidth={2}
                  name="Ventas reales"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="prediccion"
                  stroke="#b68d40"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  name="Prediccion"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
            <p style={{ fontSize: 13, color: "var(--texto-suave)", marginTop: 10 }}>
              La linea azul es el historico real de ventas por mes. La linea dorada
              punteada es la prediccion del modelo para el proximo mes.
            </p>
          </div>

          {/* historial de predicciones */}
          <div className="inv-panel">
            <div className="inv-panel-cab">
              <h2>Historial de predicciones</h2>
            </div>
            <table className="inv-tabla">
              <thead>
                <tr>
                  <th>Valor predicho</th>
                  <th>Etiqueta</th>
                  <th>Confianza</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {predicciones.map((p) => (
                  <tr key={p.id_prediccion}>
                    <td className="inv-precio">Q {Number(p.valor_predicho).toFixed(2)}</td>
                    <td>{p.etiqueta}</td>
                    <td>{(Number(p.probabilidad) * 100).toFixed(1)}%</td>
                    <td className="inv-codigo">{p.fecha_prediccion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="inv-pie">{predicciones.length} predicciones</div>
          </div>
        </>
      )}
    </div>
  );
}
