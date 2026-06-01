// src/services/api.js
const BASE_URL = 'http://localhost:8080/api';

export const apiService = {
  // Autenticación segura (Conecta a tu login.php con contraseñas en hash)
  login: async (usuario, password) => {
    const res = await fetch(`${BASE_URL}/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    });
    return res.json();
  },

  // CRUD Dinámico de Catálogos (Productos, Clientes, Proveedores, Categorías)
  listarCatalogo: async (tabla) => {
    const res = await fetch(`${BASE_URL}/catalogos.php?tabla=${tabla}&accion=listar`);
    return res.json();
  },

  crearEnCatalogo: async (tabla, datos) => {
    const res = await fetch(`${BASE_URL}/catalogos.php?tabla=${tabla}&accion=crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    return res.json();
  },

  // Módulo del Data Warehouse (OLAP)
  obtenerCuboDW: async () => {
    const res = await fetch(`${BASE_URL}/dw.php`);
    return res.json();
  },

  actualizarDW: async (idUsuario) => {
    const res = await fetch(`${BASE_URL}/dw.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_usuario: idUsuario })
    });
    return res.json();
  },

  // Soporte (Alertas automáticas de stock bajo)
  obtenerAlertas: async () => {
    const res = await fetch(`${BASE_URL}/soporte.php?accion=alertas`);
    return res.json();
  },

  // Backups de la Base de Datos desde la App
  ejecutarBackup: async () => {
    const res = await fetch(`${BASE_URL}/soporte.php?accion=backup`, { method: 'POST' });
    return res.json();
  }
};
