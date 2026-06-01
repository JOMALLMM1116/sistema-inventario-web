// src/components/Layout.jsx
// Estructura del sistema: sidebar (filtrado por rol) + topbar + contenido.
// Cada item del menu define que roles pueden verlo. El sidebar solo muestra
// los modulos que el rol del usuario logueado tiene permitidos, en linea con
// lo que validan los stored procedures en SQL Server.

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTema } from "../context/useTema";
import "../styles/layout.css";

// roles del sistema (coinciden con la tabla rol):
// Administrador, Gerente, Vendedor, Inventario, Compras, Reportes
//
// cada item lleva "roles": la lista de roles que pueden verlo.
const MENU = [
  {
    grupo: "Principal",
    items: [
      { ruta: "/inventario", nombre: "Inventario", icono: "\u25A0",
        roles: ["Administrador", "Gerente", "Vendedor", "Inventario", "Compras"] },
      { ruta: "/ventas", nombre: "Ventas", icono: "\u25B2",
        roles: ["Administrador", "Gerente", "Vendedor"] },
      { ruta: "/compras", nombre: "Compras", icono: "\u25BC",
        roles: ["Administrador", "Gerente", "Compras"] },
      { ruta: "/clientes", nombre: "Clientes", icono: "\u25CF",
        roles: ["Administrador", "Gerente", "Vendedor"] },
    ],
  },
  {
    grupo: "Gestion",
    items: [
      { ruta: "/proveedores", nombre: "Proveedores", icono: "\u25C6",
        roles: ["Administrador", "Gerente", "Compras"] },
      { ruta: "/categorias", nombre: "Categorias", icono: "\u25A6",
        roles: ["Administrador", "Gerente", "Inventario"] },
      { ruta: "/atencion", nombre: "Atencion cliente", icono: "\u2600",
        roles: ["Administrador", "Gerente", "Vendedor"] },
    ],
  },
  {
    grupo: "Analisis",
    items: [
      { ruta: "/reportes", nombre: "Reportes", icono: "\u25B2",
        roles: ["Administrador", "Gerente", "Reportes"] },
      { ruta: "/movimientos", nombre: "Movimientos", icono: "\u21C5",
        roles: ["Administrador", "Gerente", "Inventario"] },
      { ruta: "/monitoreo-rendimiento", nombre: "Rendimiento", icono: "\u26A1",
        roles: ["Administrador", "Gerente"] },
      { ruta: "/prediccion", nombre: "Prediccion IA", icono: "\u2728",
        roles: ["Administrador", "Gerente"] },
      { ruta: "/olap", nombre: "Analisis OLAP", icono: "\u25A4",
        roles: ["Administrador", "Gerente", "Reportes"] },
      { ruta: "/respaldo", nombre: "Respaldo", icono: "\u26C3",
        roles: ["Administrador"] },
    ],
  },
];

export default function Layout() {
  const { usuario, cerrarSesion } = useAuth();
  const [tema, setTema] = useTema();
  const navigate = useNavigate();

  const rolUsuario = usuario?.rol || "";

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

  // filtrar el menu: cada grupo solo muestra los items que el rol puede ver,
  // y un grupo que se queda sin items no se muestra.
  const menuFiltrado = MENU
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => item.roles.includes(rolUsuario)),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-marca">
          <div className="sidebar-logo">SI</div>
          <div className="sidebar-nombre">
            SistemaInventario
            <small>Gestion comercial</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuFiltrado.map((g) => (
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

      <div className="principal">
        <header className="topbar">
          <div className="topbar-titulo">Panel</div>
          <div className="topbar-derecha">
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

        <main className="contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
