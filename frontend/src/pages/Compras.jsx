// src/pages/Compras.jsx
// Registro de compras con carrito. El detalle se manda como TVP a
// sp_registrar_compra. A diferencia de ventas, aqui se captura el
// precio_unitario de compra (no descuento), y se elige proveedor.
//
// Nota: el SP valida que el producto este asociado al proveedor
// (tabla productoproveedor). Si no lo esta, devuelve error de negocio.

import { useState, useEffect } from "react";
import {
  registrarCompra,
  listarProductos,
  listarProveedores,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/carrito.css";

export default function Compras() {
  const { usuario } = useAuth();
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [idProveedor, setIdProveedor] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [prodSel, setProdSel] = useState("");
  const [mensaje, setMensaje] = useState(null); // {tipo, texto}
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    Promise.all([listarProductos(), listarProveedores()])
      .then(([rp, rpr]) => {
        setProductos(rp.productos || []);
        setProveedores(rpr.proveedores || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  function agregar() {
    if (!prodSel) return;
    const p = productos.find((x) => String(x.id_producto) === String(prodSel));
    if (!p) return;
    if (carrito.some((x) => x.id_producto === p.id_producto)) {
      setMensaje({ tipo: "error", texto: "Ese producto ya esta en la lista." });
      return;
    }
    setMensaje(null);
    setCarrito([
      ...carrito,
      {
        id_producto: p.id_producto,
        nombre: p.nombre,
        cantidad: 1,
        precio_unitario: Number(p.precio_compra || 0),
      },
    ]);
    setProdSel("");
  }

  function cambiar(id, campo, valor) {
    setCarrito(
      carrito.map((x) =>
        x.id_producto === id ? { ...x, [campo]: Math.max(0, Number(valor)) } : x
      )
    );
  }

  function quitar(id) {
    setCarrito(carrito.filter((x) => x.id_producto !== id));
  }

  const total = carrito.reduce((s, x) => s + x.precio_unitario * x.cantidad, 0);

  async function guardar() {
    setMensaje(null);
    if (!idProveedor) {
      setMensaje({ tipo: "error", texto: "Selecciona un proveedor." });
      return;
    }
    if (carrito.length === 0) {
      setMensaje({ tipo: "error", texto: "Agrega al menos un producto." });
      return;
    }
    setGuardando(true);
    try {
      const res = await registrarCompra({
        id_proveedor: Number(idProveedor),
        id_usuario: usuario.id,
        observaciones: observaciones || "Compra desde la app",
        productos: carrito.map((x) => ({
          id_producto: x.id_producto,
          cantidad: x.cantidad,
          precio_unitario: x.precio_unitario,
        })),
      });
      setMensaje({ tipo: "exito", texto: res.message + " (Total Q" + total.toFixed(2) + ")" });
      setCarrito([]);
      setIdProveedor("");
      setObservaciones("");
    } catch (err) {
      setMensaje({ tipo: "error", texto: err.message });
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <p className="inv-cargando">Cargando...</p>;
  if (error) return <div className="inv-error">No se pudo cargar: {error}</div>;

  return (
    <div>
      <div className="inv-encabezado">
        <h1 className="inv-titulo">Registrar compra</h1>
      </div>

      <div className="carrito-panel">
        {mensaje && (
          <div className={mensaje.tipo === "exito" ? "compra-ok" : "crud-form-error"}>
            {mensaje.texto}
          </div>
        )}

        <div className="carrito-cabecera">
          <label>
            Proveedor
            <select value={idProveedor} onChange={(e) => setIdProveedor(e.target.value)}>
              <option value="">Selecciona...</option>
              {proveedores.map((p) => (
                <option key={p.id_proveedor} value={p.id_proveedor}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Observaciones
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Opcional"
            />
          </label>
        </div>

        <div className="carrito-agregar">
          <select value={prodSel} onChange={(e) => setProdSel(e.target.value)}>
            <option value="">Agregar producto...</option>
            {productos.map((p) => (
              <option key={p.id_producto} value={p.id_producto}>
                {p.nombre} — stock {p.stock_actual}
              </option>
            ))}
          </select>
          <button type="button" onClick={agregar}>
            Agregar
          </button>
        </div>

        <table className="carrito-tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio unitario</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {carrito.length === 0 ? (
              <tr>
                <td colSpan={5} className="carrito-vacio">
                  Sin productos aun
                </td>
              </tr>
            ) : (
              carrito.map((x) => (
                <tr key={x.id_producto}>
                  <td>{x.nombre}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={x.cantidad}
                      onChange={(e) => cambiar(x.id_producto, "cantidad", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={x.precio_unitario}
                      onChange={(e) =>
                        cambiar(x.id_producto, "precio_unitario", e.target.value)
                      }
                    />
                  </td>
                  <td>Q{(x.precio_unitario * x.cantidad).toFixed(2)}</td>
                  <td>
                    <button type="button" onClick={() => quitar(x.id_producto)}>
                      {"\u2715"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="carrito-total">
          Total: <b>Q {total.toFixed(2)}</b>
        </div>

        <div className="crud-modal-botones">
          <button
            type="button"
            className="crud-guardar"
            onClick={guardar}
            disabled={guardando}
          >
            {guardando ? "Registrando..." : "Registrar compra"}
          </button>
        </div>
      </div>
    </div>
  );
}
