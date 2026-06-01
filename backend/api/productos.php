<?php
// backend/api/productos.php

require_once __DIR__ . '/../lib/respuesta.php';
include_once __DIR__ . '/../config/db.php';

// 1. Inicializar cabeceras CORS y Content-Type JSON
Respuesta::inicializarAPI();

// 2. Conectar a la base de datos SQL Server
$conn = DB::conectar();

// 3. Detectar el método HTTP de la petición
$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {

    // ============================================================
    // 📥 GET: LISTAR PRODUCTOS (O TRAER UNO SOLO POR ID)
    // ============================================================
    case 'GET':
        // Si mandan un ID por la URL (?id=5), filtramos ese producto. Si no, listamos todos.
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;

        if ($id > 0) {
            $tsql = "SELECT p.*, c.nombre AS categoria_nombre 
                     FROM producto p
                     INNER JOIN categoria c ON p.id_categoria = c.id_categoria
                     WHERE p.id_producto = ?";
            $params = array($id);
        } else {
            $tsql = "SELECT p.*, c.nombre AS categoria_nombre 
                     FROM producto p
                     INNER JOIN categoria c ON p.id_categoria = c.id_categoria
                     ORDER BY p.id_producto DESC";
            $params = array();
        }

        $stmt = sqlsrv_query($conn, $tsql, $params);
        if ($stmt === false) {
            Respuesta::json("error", "Error al consultar productos.", ["errors" => sqlsrv_errors()], 500);
        }

        $productos = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $productos[] = $row;
        }

        sqlsrv_free_stmt($stmt);

        if ($id > 0 && empty($productos)) {
            Respuesta::json("error", "Producto no encontrado.", [], 404);
        }

        Respuesta::json("success", "Datos obtenidos correctamente.", ["productos" => $productos], 200);
        break;

    // ============================================================
    // 📤 POST: CREAR NUEVO PRODUCTO
    // ============================================================
    case 'POST':
        $body = Respuesta::leerBody();

        // Validar campos requeridos obligatorios según tus restricciones NOT NULL
        if (!isset($body['id_categoria'], $body['codigo'], $body['nombre'], $body['precio_compra'], $body['precio_venta'], $body['stock_actual'], $body['stock_minimo'], $body['unidad_medida'])) {
            Respuesta::json("error", "Faltan campos obligatorios para registrar el producto.", [], 400);
        }

        // Tus CHECK constraints prohíben que el precio_venta sea menor al de compra
        if ($body['precio_venta'] < $body['precio_compra']) {
            Respuesta::json("error", "Regla de Negocio: El precio de venta no puede ser menor al precio de compra.", [], 400);
        }

        $tsql = "INSERT INTO producto (id_categoria, codigo, nombre, descripcion, precio_compra, precio_venta, stock_actual, stock_minimo, unidad_medida) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $params = array(
            $body['id_categoria'],
            trim($body['codigo']),
            trim($body['nombre']),
            isset($body['descripcion']) ? trim($body['descripcion']) : null,
            $body['precio_compra'],
            $body['precio_venta'],
            $body['stock_actual'],
            $body['stock_minimo'],
            trim($body['unidad_medida'])
        );

        $stmt = sqlsrv_query($conn, $tsql, $params);
        if ($stmt === false) {
            Respuesta::json("error", "No se pudo registrar el producto. Verifique duplicados o restricciones.", ["errors" => sqlsrv_errors()], 400);
        }

        sqlsrv_free_stmt($stmt);
        Respuesta::json("success", "Producto registrado exitosamente.", [], 201);
        break;

    // ============================================================
    // ✏️ PUT: ACTUALIZAR UN PRODUCTO EXISTENTE
    // ============================================================
    case 'PUT':
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if ($id <= 0) {
            Respuesta::json("error", "Debe proporcionar el ID del producto por la URL (?id=X).", [], 400);
        }

        $body = Respuesta::leerBody();

        if (!isset($body['id_categoria'], $body['codigo'], $body['nombre'], $body['precio_compra'], $body['precio_venta'], $body['stock_actual'], $body['stock_minimo'], $body['unidad_medida'])) {
            Respuesta::json("error", "Faltan campos obligatorios para actualizar.", [], 400);
        }

        if ($body['precio_venta'] < $body['precio_compra']) {
            Respuesta::json("error", "Regla de Negocio: El precio de venta no puede ser menor al precio de compra.", [], 400);
        }

        $tsql = "UPDATE producto 
                 SET id_categoria = ?, codigo = ?, nombre = ?, descripcion = ?, precio_compra = ?, precio_venta = ?, stock_actual = ?, stock_minimo = ?, unidad_medida = ?, activo = ? 
                 WHERE id_producto = ?";
        
        $params = array(
            $body['id_categoria'],
            trim($body['codigo']),
            trim($body['nombre']),
            isset($body['descripcion']) ? trim($body['descripcion']) : null,
            $body['precio_compra'],
            $body['precio_venta'],
            $body['stock_actual'],
            $body['stock_minimo'],
            trim($body['unidad_medida']),
            isset($body['activo']) ? intval($body['activo']) : 1,
            $id
        );

        $stmt = sqlsrv_query($conn, $tsql, $params);
        if ($stmt === false) {
            Respuesta::json("error", "Error al actualizar el producto.", ["errors" => sqlsrv_errors()], 400);
        }

        // Validar si realmente se modificó alguna fila
        $filasAfectadas = sqlsrv_rows_affected($stmt);
        sqlsrv_free_stmt($stmt);

        if ($filasAfectadas === 0) {
            Respuesta::json("error", "El producto no existe o no sufrió modificaciones.", [], 404);
        }

        Respuesta::json("success", "Producto actualizado exitosamente.", [], 200);
        break;

    // ============================================================
    // ❌ DELETE: DESACTIVACIÓN LÓGICA DEL PRODUCTO (Soft Delete)
    // ============================================================
    case 'DELETE':
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if ($id <= 0) {
            Respuesta::json("error", "Debe proporcionar el ID del producto por la URL (?id=X).", [], 400);
        }

        // En un sistema con historial e integridad referencial, NO borramos filas reales (causaría fallos con compras/ventas).
        // En su lugar, aplicamos una baja lógica cambiando tu columna activo a 0.
        $tsql = "UPDATE producto SET activo = 0 WHERE id_producto = ?";
        $params = array($id);

        $stmt = sqlsrv_query($conn, $tsql, $params);
        if ($stmt === false) {
            Respuesta::json("error", "Error al intentar dar de baja al producto.", ["errors" => sqlsrv_errors()], 500);
        }

        $filasAfectadas = sqlsrv_rows_affected($stmt);
        sqlsrv_free_stmt($stmt);

        if ($filasAfectadas === 0) {
            Respuesta::json("error", "El producto no existe.", [], 404);
        }

        Respuesta::json("success", "Producto desactivado correctamente en el inventario.", [], 200);
        break;

    // Método HTTP no soportado por esta ruta API
    default:
        Respuesta::json("error", "Método HTTP no permitido.", [], 405);
        break;
}

// Cerrar conexión general
sqlsrv_close($conn);
?>