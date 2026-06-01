// src/components/CrudModulo.jsx
// Componente reutilizable para catalogos (clientes, proveedores, categorias).
// Ahora incluye filtro por estado (Todos / Activos / Inactivos) y muestra
// el estado de cada registro con un badge. El boton de desactivar solo
// aparece en los registros activos.

import { useState, useEffect } from "react";
import "../styles/crud.css";

export default function CrudModulo({
  titulo,
  idCampo,
  columnas,
  campos,
  cargarLista,
  claveLista,
  crear,
  actualizar,
  eliminar,
}) {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("activos"); // todos | activos | inactivos

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  function recargar() {
    setCargando(true);
    cargarLista()
      .then((res) => setItems(res[claveLista] || []))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    recargar();
    // eslint-disable-next-line
  }, []);

  function abrirCrear() {
    setEditando(null);
    const inicial = {};
    campos.forEach((c) => {
      inicial[c.clave] = c.opciones ? c.opciones[0] : "";
    });
    setForm(inicial);
    setErrorForm("");
    setModalAbierto(true);
  }

  function abrirEditar(item) {
    setEditando(item);
    const inicial = {};
    campos.forEach((c) => {
      inicial[c.clave] = item[c.clave] ?? "";
    });
    setForm(inicial);
    setErrorForm("");
    setModalAbierto(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setErrorForm("");
    setGuardando(true);
    try {
      if (editando) {
        await actualizar(editando[idCampo], form);
      } else {
        await crear(form);
      }
      setModalAbierto(false);
      recargar();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function desactivar(item) {
    if (!confirm(`Desactivar "${item[columnas[1].clave] || ""}"?`)) return;
    try {
      await eliminar(item[idCampo]);
      recargar();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  // saber si un item esta activo (la columna activo viene como 1/0 o true/false)
  function esActivo(item) {
    return Number(item.activo) === 1;
  }

  // filtrar por estado y por busqueda
  const filtrados = items.filter((it) => {
    // filtro de estado
    const pasaEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "activos" && esActivo(it)) ||
      (filtroEstado === "inactivos" && !esActivo(it));
    // filtro de busqueda
    const pasaBusqueda =
      busqueda === ""
        ? true
        : columnas.some((col) =>
            String(it[col.clave] ?? "")
              .toLowerCase()
              .includes(busqueda.toLowerCase())
          );
    return pasaEstado && pasaBusqueda;
  });

  // conteos para mostrar en los botones
  const totalActivos = items.filter((it) => esActivo(it)).length;
  const totalInactivos = items.filter((it) => !esActivo(it)).length;

  if (cargando) return <p className="crud-cargando">Cargando {titulo.toLowerCase()}...</p>;
  if (error)
    return (
      <div className="crud-error">
        No se pudo cargar: {error}
        <br />
        <small>Verifica que el backend este corriendo.</small>
      </div>
    );

  return (
    <div>
      <div className="crud-encabezado">
        <h1 className="crud-titulo">{titulo}</h1>
        <div className="crud-acciones-top">
          <input
            className="crud-buscar"
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button className="crud-boton-nuevo" onClick={abrirCrear}>
            + Nuevo
          </button>
        </div>
      </div>

      {/* filtros de estado */}
      <div className="crud-filtros">
        <button
          className={filtroEstado === "todos" ? "activo" : ""}
          onClick={() => setFiltroEstado("todos")}
        >
          Todos ({items.length})
        </button>
        <button
          className={filtroEstado === "activos" ? "activo" : ""}
          onClick={() => setFiltroEstado("activos")}
        >
          Activos ({totalActivos})
        </button>
        <button
          className={filtroEstado === "inactivos" ? "activo" : ""}
          onClick={() => setFiltroEstado("inactivos")}
        >
          Inactivos ({totalInactivos})
        </button>
      </div>

      <div className="crud-panel">
        <table className="crud-tabla">
          <thead>
            <tr>
              {columnas.map((col) => (
                <th key={col.clave}>{col.etiqueta}</th>
              ))}
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((it) => (
              <tr key={it[idCampo]}>
                {columnas.map((col) => (
                  <td key={col.clave}>{it[col.clave]}</td>
                ))}
                <td>
                  <span className={`crud-badge ${esActivo(it) ? "activo" : "inactivo"}`}>
                    <span className="crud-dot"></span>
                    {esActivo(it) ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="crud-acciones">
                  <button onClick={() => abrirEditar(it)} title="Editar">
                    {"\u270E"}
                  </button>
                  {esActivo(it) && (
                    <button onClick={() => desactivar(it)} title="Desactivar">
                      {"\u2715"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="crud-pie">
          {filtrados.length} {titulo.toLowerCase()}
        </div>
      </div>

      {modalAbierto && (
        <div className="crud-modal-fondo" onClick={() => setModalAbierto(false)}>
          <div className="crud-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editando ? "Editar" : "Nuevo"} {titulo.replace(/s$/, "").toLowerCase()}</h2>

            {errorForm && <div className="crud-form-error">{errorForm}</div>}

            <form onSubmit={guardar}>
              {campos.map((c) => (
                <label key={c.clave}>
                  {c.etiqueta}
                  {c.opciones ? (
                    <select
                      value={form[c.clave] ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, [c.clave]: e.target.value })
                      }
                    >
                      {c.opciones.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={c.tipo || "text"}
                      value={form[c.clave] ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, [c.clave]: e.target.value })
                      }
                    />
                  )}
                </label>
              ))}

              <div className="crud-modal-botones">
                <button
                  type="button"
                  className="crud-cancelar"
                  onClick={() => setModalAbierto(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="crud-guardar" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
