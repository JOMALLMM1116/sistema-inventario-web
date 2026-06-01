// src/pages/Ventas.jsx
// Historial de ventas + registro con carrito completo.
// El carrito arma el detalle que se manda como TVP a sp_registrar_venta.

import { useState, useEffect } from "react";
import {
  listarVentas,
  registrarVenta,
  listarProductos,
  listarClientes,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/carrito.css";

export default function Ventas() {
  const { usuario } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);

  // datos para el formulario
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);

  // estado del carrito
  const [idCliente, setIdCliente] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [carrito, setCarrito] = useState([]); // [{id_producto, nombre, precio, cantidad, descuento}]
  const [prodSel, setProdSel] = useState("");
  const [errorForm, setErrorForm] = useState("");
  const [guardando, setGuardando] = useState(false);

  function recargar() {
    setCargando(true);
    listarVentas()
      .then((res) => setVentas(res.ventas || []))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    recargar();
  }, []);

  // al abrir el modal, cargar productos y clientes
  function abrirModal() {
    setIdCliente("");
    setMetodoPago("efectivo");
    setCarrito([]);
    setProdSel("");
    setErrorForm("");
    Promise.all([listarProductos(), listarClientes()])
      .then(([rp, rc]) => {
        setProductos(rp.productos || []);
        setClientes(rc.clientes || []);
      })
      .catch((e) => setErrorForm(e.message));
    setModal(true);
  }

  // agregar producto seleccionado al carrito
  function agregarAlCarrito() {
    if (!prodSel) return;
    const p = productos.find((x) => String(x.id_producto) === String(prodSel));
    if (!p) return;
    // si ya esta, no duplicar (el SP no permite repetidos)
    if (carrito.some((x) => x.id_producto === p.id_producto)) {
      setErrorForm("Ese producto ya esta en el carrito.");
      return;
    }
    setErrorForm("");
    setCarrito([
      ...carrito,
      {
        id_producto: p.id_producto,
        nombre: p.nombre,
        precio: Number(p.precio_venta),
        cantidad: 1,
        descuento: 0,
      },
    ]);
    setProdSel("");
  }

  function cambiarCantidad(id, cantidad) {
    setCarrito(
      carrito.map((x) =>
        x.id_producto === id ? { ...x, cantidad: Math.max(1, Number(cantidad)) } : x
      )
    );
  }

  function cambiarDescuento(id, descuento) {
    setCarrito(
      carrito.map((x) =>
        x.id_producto === id ? { ...x, descuento: Math.max(0, Number(descuento)) } : x
      )
    );
  }

  function quitar(id) {
    setCarrito(carrito.filter((x) => x.id_producto !== id));
  }

  // total en vivo
  const total = carrito.reduce(
    (s, x) => s + (x.precio * x.cantidad - x.descuento),
    0
  );

  async function guardarVenta(e) {
    e.preventDefault();
    setErrorForm("");
    if (!idCliente) {
      setErrorForm("Selecciona un cliente.");
      return;
    }
    if (carrito.length === 0) {
      setErrorForm("Agrega al menos un producto.");
      return;
    }
    setGuardando(true);
    try {
      await registrarVenta({
        id_cliente: Number(idCliente),
        id_usuario: usuario.id,
        metodo_pago: metodoPago,
        productos: carrito.map((x) => ({
          id_producto: x.id_producto,
          cantidad: x.cantidad,
          descuento: x.descuento,
        })),
      });
      setModal(false);
      recargar();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <p className="inv-cargando">Cargando ventas...</p>;
  if (error) return <div className="inv-error">No se pudo cargar: {error}</div>;

  return (
    <div>
      <div className="inv-encabezado">
        <h1 className="inv-titulo">Ventas</h1>
        <button className="crud-boton-nuevo" onClick={abrirModal}>
          + Nueva venta
        </button>
      </div>

      <div className="inv-panel">
        <div className="inv-panel-cab">
          <h2>Historial de ventas</h2>
        </div>
        <table className="inv-tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th>Metodo</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => (
              <tr key={v.id_venta}>
                <td className="inv-codigo">#{v.id_venta}</td>
                <td>{v.cliente_nombre}</td>
                <td>{v.usuario_nombre}</td>
                <td>{v.metodo_pago}</td>
                <td className="inv-precio">Q {Number(v.total).toFixed(2)}</td>
                <td>
                  <span className="inv-badge ok">
                    <span className="inv-dot"></span> {v.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="inv-pie">{ventas.length} ventas</div>
      </div>

      {/* Modal de nueva venta con carrito */}
      {modal && (
        <div className="crud-modal-fondo" onClick={() => setModal(false)}>
          <div className="carrito-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva venta</h2>
            {errorForm && <div className="crud-form-error">{errorForm}</div>}

            <div className="carrito-cabecera">
              <label>
                Cliente
                <select value={idCliente} onChange={(e) => setIdCliente(e.target.value)}>
                  <option value="">Selecciona...</option>
                  {clientes.map((c) => (
                    <option key={c.id_cliente} value={c.id_cliente}>
                      {c.nombre} {c.apellido}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Metodo de pago
                <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </label>
            </div>

            {/* agregar productos */}
            <div className="carrito-agregar">
              <select value={prodSel} onChange={(e) => setProdSel(e.target.value)}>
                <option value="">Agregar producto...</option>
                {productos.map((p) => (
                  <option key={p.id_producto} value={p.id_producto}>
                    {p.nombre} (Q{Number(p.precio_venta).toFixed(2)}) — stock {p.stock_actual}
                  </option>
                ))}
              </select>
              <button type="button" onClick={agregarAlCarrito}>
                Agregar
              </button>
            </div>

            {/* tabla del carrito */}
            <table className="carrito-tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Cant.</th>
                  <th>Desc.</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {carrito.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="carrito-vacio">
                      Sin productos aun
                    </td>
                  </tr>
                ) : (
                  carrito.map((x) => (
                    <tr key={x.id_producto}>
                      <td>{x.nombre}</td>
                      <td>Q{x.precio.toFixed(2)}</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={x.cantidad}
                          onChange={(e) => cambiarCantidad(x.id_producto, e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={x.descuento}
                          onChange={(e) => cambiarDescuento(x.id_producto, e.target.value)}
                        />
                      </td>
                      <td>Q{(x.precio * x.cantidad - x.descuento).toFixed(2)}</td>
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
              <button type="button" className="crud-cancelar" onClick={() => setModal(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="crud-guardar"
                onClick={guardarVenta}
                disabled={guardando}
              >
                {guardando ? "Registrando..." : "Registrar venta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
