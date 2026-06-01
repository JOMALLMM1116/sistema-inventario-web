// src/pages/Monitoreo.jsx
// Monitoreo de rendimiento: mide el tiempo de ejecucion de consultas SELECT
// (con sp_monitorear_consulta) y muestra el historial de mediciones.

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/inventario.css";

export default function Monitoreo() {
  const { usuario } = useAuth();
  const [mediciones, setMediciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // formulario de medicion
  const [nombre, setNombre] = useState("");
  const [sql, setSql] = useState("");
  const [resultado, setResultado] = useState(null);
  const [midiendo, setMidiendo] = useState(false);

  function recargar() {
    setCargando(true);
    fetch("http://localhost:8080/api/monitoreo.php")
      .then((r) => r.json())
      .then((d) => {
        if (d.status !== "success") throw new Error(d.message);
        setMediciones(d.mediciones || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    recargar();
    // eslint-disable-next-line
  }, []);

  async function medir(e) {
    e.preventDefault();
    setResultado(null);
    if (!nombre || !sql) {
      setResultado({ tipo: "error", texto: "Escribe un nombre y la consulta SELECT." });
      return;
    }
    setMidiendo(true);
    try {
      const resp = await fetch("http://localhost:8080/api/monitoreo.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_usuario: usuario.id,
          nombre_consulta: nombre,
          sentencia_sql: sql,
        }),
      });
      const d = await resp.json();
      if (d.status !== "success") throw new Error(d.message);
      setResultado({
        tipo: "exito",
        texto: `Consulta medida: ${d.tiempo_ms} ms, ${d.filas} filas.`,
      });
      setNombre("");
      setSql("");
      recargar();
    } catch (err) {
      setResultado({ tipo: "error", texto: err.message });
    } finally {
      setMidiendo(false);
    }
  }

  return (
    <div>
      <div className="inv-encabezado">
        <h1 className="inv-titulo">Monitoreo de rendimiento</h1>
      </div>

      {/* formulario para medir */}
      <div className="inv-panel" style={{ marginBottom: 24, padding: 22 }}>
        <h2 style={{ fontSize: 16, marginBottom: 14, color: "var(--texto)" }}>
          Medir una consulta
        </h2>
        {resultado && (
          <div className={resultado.tipo === "exito" ? "compra-ok" : "crud-form-error"}>
            {resultado.texto}
          </div>
        )}
        <form onSubmit={medir}>
          <input
            type="text"
            placeholder="Nombre de la consulta (ej. Ventas por producto)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={inp}
          />
          <textarea
            placeholder="SELECT ... (solo se permiten consultas SELECT)"
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            rows={3}
            style={{ ...inp, fontFamily: "monospace", resize: "vertical" }}
          />
          <button type="submit" className="crud-boton-nuevo" disabled={midiendo}>
            {midiendo ? "Midiendo..." : "Medir consulta"}
          </button>
        </form>
      </div>

      {/* historial */}
      <div className="inv-panel">
        <div className="inv-panel-cab">
          <h2>Historial de mediciones</h2>
        </div>
        {cargando ? (
          <p className="inv-cargando">Cargando...</p>
        ) : error ? (
          <div className="inv-error">{error}</div>
        ) : (
          <table className="inv-tabla">
            <thead>
              <tr>
                <th>Consulta</th>
                <th>Tiempo (ms)</th>
                <th>Filas</th>
                <th>Usuario</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {mediciones.map((m) => (
                <tr key={m.id_monitoreo}>
                  <td className="inv-prod-nombre">{m.nombre_consulta}</td>
                  <td>
                    <span className={`inv-badge ${m.tiempo_ms < 50 ? "ok" : m.tiempo_ms < 200 ? "bajo" : "sin"}`}>
                      <span className="inv-dot"></span> {m.tiempo_ms} ms
                    </span>
                  </td>
                  <td>{m.filas_afectadas}</td>
                  <td>{m.usuario_nombre}</td>
                  <td className="inv-codigo">{m.fecha_hora}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="inv-pie">{mediciones.length} mediciones</div>
      </div>
    </div>
  );
}

const inp = {
  width: "100%",
  marginBottom: 12,
  padding: "10px 12px",
  border: "1px solid var(--borde)",
  borderRadius: 9,
  fontSize: 14,
  fontFamily: "inherit",
  background: "var(--fondo)",
  color: "var(--texto)",
  outline: "none",
};
