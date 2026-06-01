// src/pages/Atencion.jsx
// Casos de atencion al cliente: listar, crear y cerrar.
// Todos los SP requieren id_usuario (el agente que opera el caso).

import { useState, useEffect } from "react";
import {
  listarAtencion,
  crearAtencion,
  cerrarAtencion,
  listarClientes,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/carrito.css";

export default function Atencion() {
  const { usuario } = useAuth();
  const [casos, setCasos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // modal crear
  const [modalCrear, setModalCrear] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState({ id_cliente: "", tipo: "consulta", descripcion: "", prioridad: "normal" });
  const [errorForm, setErrorForm] = useState("");
  const [guardando, setGuardando] = useState(false);

  // modal cerrar
  const [casoCerrar, setCasoCerrar] = useState(null);
  const [resolucion, setResolucion] = useState("");

  function recargar() {
    setCargando(true);
    listarAtencion(usuario.id)
      .then((res) => setCasos(res.casos || []))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    recargar();
    // eslint-disable-next-line
  }, []);

  function abrirCrear() {
    setForm({ id_cliente: "", tipo: "consulta", descripcion: "", prioridad: "normal" });
    setErrorForm("");
    listarClientes()
      .then((r) => setClientes(r.clientes || []))
      .catch((e) => setErrorForm(e.message));
    setModalCrear(true);
  }

  async function guardarCaso(e) {
    e.preventDefault();
    setErrorForm("");
    if (!form.id_cliente || !form.descripcion) {
      setErrorForm("Selecciona cliente y escribe la descripcion.");
      return;
    }
    setGuardando(true);
    try {
      await crearAtencion({
        id_usuario: usuario.id,
        id_cliente: Number(form.id_cliente),
        tipo: form.tipo,
        descripcion: form.descripcion,
        prioridad: form.prioridad,
      });
      setModalCrear(false);
      recargar();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function guardarCierre(e) {
    e.preventDefault();
    if (!resolucion) return;
    try {
      await cerrarAtencion({
        id_usuario: usuario.id,
        id_atencion: casoCerrar.id_atencion,
        resolucion,
      });
      setCasoCerrar(null);
      setResolucion("");
      recargar();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  if (cargando) return <p className="inv-cargando">Cargando casos...</p>;
  if (error) return <div className="inv-error">No se pudo cargar: {error}</div>;

  return (
    <div>
      <div className="inv-encabezado">
        <h1 className="inv-titulo">Atencion al cliente</h1>
        <button className="crud-boton-nuevo" onClick={abrirCrear}>
          + Nuevo caso
        </button>
      </div>

      <div className="inv-panel">
        <div className="inv-panel-cab">
          <h2>Casos</h2>
        </div>
        <table className="inv-tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Descripcion</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {casos.map((c) => {
              const cerrado = String(c.estado).toLowerCase() === "cerrado";
              const prioAlta = String(c.prioridad).toLowerCase() === "alta";
              return (
                <tr key={c.id_atencion}>
                  <td className="inv-codigo">#{c.id_atencion}</td>
                  <td>{c.cliente}</td>
                  <td>{c.tipo}</td>
                  <td>{c.descripcion}</td>
                  <td>
                    <span className={`inv-badge ${prioAlta ? "sin" : "bajo"}`}>
                      <span className="inv-dot"></span> {c.prioridad}
                    </span>
                  </td>
                  <td>
                    <span className={`inv-badge ${cerrado ? "ok" : "bajo"}`}>
                      <span className="inv-dot"></span> {c.estado}
                    </span>
                  </td>
                  <td className="crud-acciones">
                    {!cerrado && (
                      <button
                        onClick={() => {
                          setCasoCerrar(c);
                          setResolucion("");
                        }}
                        title="Cerrar caso"
                      >
                        {"\u2713"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="inv-pie">{casos.length} casos</div>
      </div>

      {/* Modal crear caso */}
      {modalCrear && (
        <div className="crud-modal-fondo" onClick={() => setModalCrear(false)}>
          <div className="crud-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nuevo caso</h2>
            {errorForm && <div className="crud-form-error">{errorForm}</div>}
            <form onSubmit={guardarCaso}>
              <label>
                Cliente
                <select
                  value={form.id_cliente}
                  onChange={(e) => setForm({ ...form, id_cliente: e.target.value })}
                >
                  <option value="">Selecciona...</option>
                  {clientes.map((c) => (
                    <option key={c.id_cliente} value={c.id_cliente}>
                      {c.nombre} {c.apellido}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tipo
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                >
                  <option value="consulta">Consulta</option>
                  <option value="queja">Queja</option>
                  <option value="reclamo">Reclamo</option>
                  <option value="sugerencia">Sugerencia</option>
                </select>
              </label>
              <label>
                Prioridad
                <select
                  value={form.prioridad}
                  onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
                >
                  <option value="baja">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                </select>
              </label>
              <label>
                Descripcion
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </label>
              <div className="crud-modal-botones">
                <button type="button" className="crud-cancelar" onClick={() => setModalCrear(false)}>
                  Cancelar
                </button>
                <button type="submit" className="crud-guardar" disabled={guardando}>
                  {guardando ? "Guardando..." : "Crear caso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal cerrar caso */}
      {casoCerrar && (
        <div className="crud-modal-fondo" onClick={() => setCasoCerrar(null)}>
          <div className="crud-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Cerrar caso #{casoCerrar.id_atencion}</h2>
            <form onSubmit={guardarCierre}>
              <label>
                Resolucion
                <input
                  type="text"
                  value={resolucion}
                  onChange={(e) => setResolucion(e.target.value)}
                  placeholder="Como se resolvio el caso"
                />
              </label>
              <div className="crud-modal-botones">
                <button type="button" className="crud-cancelar" onClick={() => setCasoCerrar(null)}>
                  Cancelar
                </button>
                <button type="submit" className="crud-guardar">
                  Cerrar caso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
