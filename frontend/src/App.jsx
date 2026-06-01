// src/App.jsx
// Router principal. Login publico + sistema protegido con todas las rutas.

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Layout from "./components/Layout";
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


function Sistema() {
  const { usuario } = useAuth();
  if (!usuario) {
    return <Navigate to="/" replace />;
  }
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/movimientos" element={<Movimientos />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/compras" element={<Compras />} />
        <Route path="/atencion" element={<Atencion />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/respaldo" element={<Respaldo />} />
        <Route path="*" element={<Navigate to="/inventario" replace />} />
        <Route path="/monitoreo-rendimiento" element={<Monitoreo />} />
        <Route path="/prediccion" element={<Prediccion />} />
        <Route path="/olap" element={<Olap />} />
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
