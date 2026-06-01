// src/App.jsx
// Router principal. Login publico + sistema protegido. Cada ruta ademas
// valida el rol con RutaProtegida (seguridad real, no solo ocultar el menu).

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import RutaProtegida from "./components/RutaProtegida";
import Inventario from "./pages/Inventario";
import Clientes from "./pages/Clientes";
import Proveedores from "./pages/Proveedores";
import Categorias from "./pages/Categorias";
import Movimientos from "./pages/Movimientos";
import Ventas from "./pages/Ventas";
import Compras from "./pages/Compras";
import Atencion from "./pages/Atencion";
import Reportes from "./pages/Reportes";
import Respaldo from "./pages/Respaldo";
import Monitoreo from "./pages/Monitoreo";
import Prediccion from "./pages/Prediccion";
import Olap from "./pages/Olap";

// los mismos roles que en el menu del Layout (deben coincidir)
const PERM = {
  inventario: ["Administrador", "Gerente", "Vendedor", "Inventario", "Compras"],
  ventas: ["Administrador", "Gerente", "Vendedor"],
  compras: ["Administrador", "Gerente", "Compras"],
  clientes: ["Administrador", "Gerente", "Vendedor"],
  proveedores: ["Administrador", "Gerente", "Compras"],
  categorias: ["Administrador", "Gerente", "Inventario"],
  atencion: ["Administrador", "Gerente", "Vendedor"],
  reportes: ["Administrador", "Gerente", "Reportes"],
  movimientos: ["Administrador", "Gerente", "Inventario"],
  rendimiento: ["Administrador", "Gerente"],
  prediccion: ["Administrador", "Gerente"],
  olap: ["Administrador", "Gerente", "Reportes"],
  respaldo: ["Administrador"],
};

function Sistema() {
  const { usuario } = useAuth();
  if (!usuario) {
    return <Navigate to="/" replace />;
  }
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/inventario" element={<RutaProtegida roles={PERM.inventario}><Inventario /></RutaProtegida>} />
        <Route path="/clientes" element={<RutaProtegida roles={PERM.clientes}><Clientes /></RutaProtegida>} />
        <Route path="/proveedores" element={<RutaProtegida roles={PERM.proveedores}><Proveedores /></RutaProtegida>} />
        <Route path="/categorias" element={<RutaProtegida roles={PERM.categorias}><Categorias /></RutaProtegida>} />
        <Route path="/movimientos" element={<RutaProtegida roles={PERM.movimientos}><Movimientos /></RutaProtegida>} />
        <Route path="/ventas" element={<RutaProtegida roles={PERM.ventas}><Ventas /></RutaProtegida>} />
        <Route path="/compras" element={<RutaProtegida roles={PERM.compras}><Compras /></RutaProtegida>} />
        <Route path="/atencion" element={<RutaProtegida roles={PERM.atencion}><Atencion /></RutaProtegida>} />
        <Route path="/reportes" element={<RutaProtegida roles={PERM.reportes}><Reportes /></RutaProtegida>} />
        <Route path="/respaldo" element={<RutaProtegida roles={PERM.respaldo}><Respaldo /></RutaProtegida>} />
        <Route path="/monitoreo-rendimiento" element={<RutaProtegida roles={PERM.rendimiento}><Monitoreo /></RutaProtegida>} />
        <Route path="/prediccion" element={<RutaProtegida roles={PERM.prediccion}><Prediccion /></RutaProtegida>} />
        <Route path="/olap" element={<RutaProtegida roles={PERM.olap}><Olap /></RutaProtegida>} />
        <Route path="*" element={<Navigate to="/inventario" replace />} />
      </Route>
    </Routes>
  );
}

function Contenido() {
  const { usuario } = useAuth();
  return (
    <Routes>
      <Route
        path="/"
        element={usuario ? <Navigate to="/inventario" replace /> : <Login />}
      />
      <Route path="/*" element={<Sistema />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Contenido />
      </BrowserRouter>
    </AuthProvider>
  );
}
