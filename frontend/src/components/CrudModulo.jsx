// src/components/CrudModulo.jsx
// Componente reutilizable para los modulos de catalogo (clientes, proveedores,
// categorias). Recibe la configuracion (titulo, columnas, campos del formulario
// y las funciones de la API) y arma la tabla + el modal de crear/editar.

import { useState, useEffect } from "react";
import "../styles/crud.css";

export default function CrudModulo({
  titulo,
  idCampo,         // nombre del campo id (ej. "id_cliente")
  columnas,        // [{ clave, etiqueta }] para la tabla
  campos,          // [{ clave, etiqueta, tipo, opciones }] para el formulario
  cargarLista,     // funcion que devuelve { ...datos } (la lista esta en data[claveLista])
  claveLista,      // nombre de la propiedad con el array (ej. "clientes")
  crear,           // funcion crear(datos)
  actualizar,      // funcion actualizar(id, datos)
  eliminar,        // funcion eliminar(id)
}) {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // estado del modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null); // null = crear, objeto = editar
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  // cargar la lista
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

  // abrir modal para crear
  function abrirCrear() {
    setEditando(null);
    // form vacio, con valores por defecto de los campos tipo select
    const inicial = {};
    campos.forEach((c) => {
      inicial[c.clave] = c.opciones ? c.opciones[0] : "";
    });
    setForm(inicial);
    setErrorForm("");
    setModalAbierto(true);
  }

  // abrir modal para editar
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

  // guardar (crear o actualizar)
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

  // desactivar
  async function desactivar(item) {
    if (!confirm(`Desactivar "${item[columnas[1].clave] || ""}"?`)) return;
    try {
      await eliminar(item[idCampo]);
      recargar();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  // filtrar por busqueda (sobre todas las columnas de texto)
  const filtrados = items.filter((it) =>
    busqueda === ""
      ? true
      : columnas.some((col) =>
          String(it[col.clave] ?? "")
            .toLowerCase()
            .includes(busqueda.toLowerCase())
        )
  );

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

      <div className="crud-panel">
        <table className="crud-tabla">
          <thead>
            <tr>
              {columnas.map((col) => (
                <th key={col.clave}>{col.etiqueta}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((it) => (
              <tr key={it[idCampo]}>
                {columnas.map((col) => (
                  <td key={col.clave}>{it[col.clave]}</td>
                ))}
                <td className="crud-acciones">
                  <button onClick={() => abrirEditar(it)} title="Editar">
                    {"\u270E"}
                  </button>
                  <button onClick={() => desactivar(it)} title="Desactivar">
                    {"\u2715"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="crud-pie">
          {filtrados.length} {titulo.toLowerCase()}
        </div>
      </div>

      {/* Modal de crear/editar */}
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
