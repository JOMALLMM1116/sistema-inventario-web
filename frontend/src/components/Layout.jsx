// src/components/Layout.jsx
// Estructura del sistema: sidebar a la izquierda, topbar arriba, y el contenido
// (las paginas de cada modulo) en el centro via <Outlet> de react-router.

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTema } from "../context/useTema";
import "../styles/layout.css";

// los modulos del menu, agrupados como en la maqueta
const MENU = [
  {
    grupo: "Principal",
    items: [
      { ruta: "/inventario", nombre: "Inventario", icono: "\u25A0" },
      { ruta: "/ventas", nombre: "Ventas", icono: "\u25B2" },
      { ruta: "/compras", nombre: "Compras", icono: "\u25BC" },
      { ruta: "/clientes", nombre: "Clientes", icono: "\u25CF" },
    ],
  },
  {
    grupo: "Gestion",
    items: [
      { ruta: "/proveedores", nombre: "Proveedores", icono: "\u25C6" },
      { ruta: "/categorias", nombre: "Categorias", icono: "\u25A6" },
      { ruta: "/atencion", nombre: "Atencion cliente", icono: "\u2600" },
    ],
  },
  {
    grupo: "Analisis",
    items: [
      { ruta: "/reportes", nombre: "Reportes", icono: "\u25B2" },
      { ruta: "/movimientos", nombre: "Movimientos", icono: "\u21C5" },
    ],
  },
];

export default function Layout() {
  const { usuario, cerrarSesion } = useAuth();
  const [tema, setTema] = useTema();
  const navigate = useNavigate();

  // iniciales del usuario para el avatar
  const iniciales = (usuario?.nombre || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function salir() {
    cerrarSesion();
    navigate("/");
  }

  return (
    <div className="layout">
      {/* ===== Sidebar ===== */}
      <aside className="sidebar">
        <div className="sidebar-marca">
          <div className="sidebar-logo">SI</div>
          <div className="sidebar-nombre">
            SistemaInventario
            <small>Gestion comercial</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {MENU.map((g) => (
            <div key={g.grupo}>
              <div className="sidebar-grupo">{g.grupo}</div>
              {g.items.map((item) => (
                <NavLink
                  key={item.ruta}
                  to={item.ruta}
                  className={({ isActive }) =>
                    "sidebar-link" + (isActive ? " activo" : "")
                  }
                >
                  <span className="sidebar-ico">{item.icono}</span>
                  {item.nombre}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-usuario">
          <div className="sidebar-avatar">{iniciales}</div>
          <div className="sidebar-datos">
            <b>{usuario?.nombre}</b>
            <span>{usuario?.rol}</span>
          </div>
        </div>
      </aside>

      {/* ===== Contenido ===== */}
      <div className="principal">
        <header className="topbar">
          <div className="topbar-titulo">Panel</div>

          <div className="topbar-derecha">
            {/* selector de tema */}
            <div className="tema-selector">
              {["claro", "oscuro", "gris"].map((t) => (
                <button
                  key={t}
                  className={tema === t ? "activo" : ""}
                  onClick={() => setTema(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <button className="boton-salir" onClick={salir}>
              Cerrar sesion
            </button>
          </div>
        </header>

        {/* aqui se renderiza la pagina del modulo activo */}
        <main className="contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
