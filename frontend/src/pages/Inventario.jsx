// src/pages/Inventario.jsx
// Pantalla de inventario: carga los productos reales desde productos.php,
// muestra metricas arriba y la tabla con estados de stock.

import { useState, useEffect } from "react";
import { listarProductos } from "../services/api";
import "../styles/inventario.css";

// decide el estado del stock comparando actual vs minimo
function estadoStock(actual, minimo) {
  const a = Number(actual);
  const m = Number(minimo);
  if (a <= 0) return { clase: "sin", texto: "Sin stock" };
  if (a <= m) return { clase: "bajo", texto: "Stock bajo" };
  return { clase: "ok", texto: "Disponible" };
}

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    listarProductos()
      .then((res) => setProductos(res.productos || []))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  // metricas calculadas sobre los productos
  const totalProductos = productos.length;
  const stockTotal = productos.reduce((s, p) => s + Number(p.stock_actual), 0);
  const stockBajo = productos.filter(
    (p) => Number(p.stock_actual) > 0 && Number(p.stock_actual) <= Number(p.stock_minimo)
  ).length;
  const sinStock = productos.filter((p) => Number(p.stock_actual) <= 0).length;

  // aplicar filtro y busqueda
  const productosFiltrados = productos.filter((p) => {
    const est = estadoStock(p.stock_actual, p.stock_minimo);
    const pasaFiltro =
      filtro === "todos" ||
      (filtro === "bajo" && est.clase === "bajo") ||
      (filtro === "sin" && est.clase === "sin");
    const pasaBusqueda =
      busqueda === "" ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase());
    return pasaFiltro && pasaBusqueda;
  });

  if (cargando) return <p className="inv-cargando">Cargando productos...</p>;
  if (error)
    return (
      <div className="inv-error">
        No se pudieron cargar los productos: {error}
        <br />
        <small>Asegurate de que el backend este corriendo en localhost:8080</small>
      </div>
    );

  return (
    <div>
      <div className="inv-encabezado">
        <h1 className="inv-titulo">Inventario</h1>
        <div className="inv-buscar">
          <input
            type="text"
            placeholder="Buscar por nombre o codigo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* metricas */}
      <div className="inv-metricas">
        <div className="metrica">
          <div className="metrica-etq">
            <span className="metrica-punto info">{"\u25A6"}</span> Productos totales
          </div>
          <div className="metrica-valor">{totalProductos}</div>
        </div>
        <div className="metrica">
          <div className="metrica-etq">
            <span className="metrica-punto exito">{"\u2713"}</span> Stock disponible
          </div>
          <div className="metrica-valor">{stockTotal.toLocaleString()}</div>
          <div className="metrica-sub">unidades en bodega</div>
        </div>
        <div className="metrica">
          <div className="metrica-etq">
            <span className="metrica-punto alerta">{"\u26A0"}</span> Stock bajo
          </div>
          <div className="metrica-valor">{stockBajo}</div>
          <div className="metrica-sub">bajo el minimo</div>
        </div>
        <div className="metrica">
          <div className="metrica-etq">
            <span className="metrica-punto error">{"\u2715"}</span> Sin stock
          </div>
          <div className="metrica-valor">{sinStock}</div>
          <div className="metrica-sub">requieren compra</div>
        </div>
      </div>

      {/* tabla */}
      <div className="inv-panel">
        <div className="inv-panel-cab">
          <h2>Listado de productos</h2>
          <div className="inv-filtros">
            <button
              className={filtro === "todos" ? "activo" : ""}
              onClick={() => setFiltro("todos")}
            >
              Todos
            </button>
            <button
              className={filtro === "bajo" ? "activo" : ""}
              onClick={() => setFiltro("bajo")}
            >
              Stock bajo
            </button>
            <button
              className={filtro === "sin" ? "activo" : ""}
              onClick={() => setFiltro("sin")}
            >
              Sin stock
            </button>
          </div>
        </div>

        <table className="inv-tabla">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Producto</th>
              <th>Categoria</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Precio</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((p) => {
              const est = estadoStock(p.stock_actual, p.stock_minimo);
              return (
                <tr key={p.id_producto}>
                  <td className="inv-codigo">{p.codigo}</td>
                  <td>
                    <div className="inv-prod-nombre">{p.nombre}</div>
                  </td>
                  <td>{p.categoria_nombre}</td>
                  <td>{p.stock_actual}</td>
                  <td>
                    <span className={`inv-badge ${est.clase}`}>
                      <span className="inv-dot"></span> {est.texto}
                    </span>
                  </td>
                  <td className="inv-precio">
                    Q {Number(p.precio_venta).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="inv-pie">
          Mostrando {productosFiltrados.length} de {totalProductos} productos
        </div>
      </div>
    </div>
  );
}
