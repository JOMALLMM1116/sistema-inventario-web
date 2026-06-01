<?php
// backend/api/productos.php
// CRUD de productos usando los STORED PROCEDURES del proyecto (script 09).
// Principio: toda la logica vive en SQL Server; aqui solo invocamos los SP.
//   GET    -> sp_listar_productos
//   POST   -> sp_crear_producto
//   PUT    -> sp_actualizar_producto      (NO toca stock_actual: ver nota abajo)
//   DELETE -> sp_desactivar_producto
//
// NOTA SOBRE EL STOCK:
// sp_actualizar_producto NO modifica stock_actual a proposito (el stock solo se
// mueve con ventas/compras/ajustes para no descuadrar el inventario). Para que
// la web pueda "editar el stock", el PUT detecta si llego un stock_actual nuevo
// distinto al que ya tiene el producto y, en ese caso, invoca sp_ajustar_inventario
// (que registra el movimiento, deja rastro en la bitacora y levanta alerta si toca).
// Asi el usuario edita el stock desde la interfaz, pero por dentro se hace bien.

require_once __DIR__ . '/../lib/respuesta.php';
require_once __DIR__ . '/../config/db.php';

Respuesta::inicializarAPI();

$conn = DB::conectar();
$metodo = $_SERVER['REQUEST_METHOD'];

// helper local: ejecuta un SP, salta los resultados intermedios de los triggers
// y devuelve la primera fila real (la del SELECT final del SP).
function ejecutarSP($conn, $tsql, $params)
{
    $stmt = sqlsrv_query($conn, $tsql, $params);
    if ($stmt === false) {
        Respuesta::json("error", "Error al ejecutar la operacion en la base de datos.", ["errors" => sqlsrv_errors()], 500);
    }
    // saltar conteos de filas y resultados de los triggers hasta el SELECT final
    $fila = null;
    do {
        $fila = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
        if ($fila !== null) break;
    } while (sqlsrv_next_result($stmt));
    sqlsrv_free_stmt($stmt);
    return $fila;
}

switch ($metodo) {

    // ============================================================
    // GET: LISTAR PRODUCTOS  ->  sp_listar_productos
    // (uno solo por ?id=N se filtra en PHP sobre el listado)
    // ============================================================
    case 'GET':
        $fila = null;
        $stmt = sqlsrv_query($conn, "{call sp_listar_productos}");
        if ($stmt === false) {
            Respuesta::json("error", "Error al consultar productos.", ["errors" => sqlsrv_errors()], 500);
        }
        $productos = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $productos[] = $row;
        }
        sqlsrv_free_stmt($stmt);

        // si pidieron un id puntual, filtrar el listado
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if ($id > 0) {
            $productos = array_values(array_filter($productos, fn($p) => intval($p['id_producto']) === $id));
            if (empty($productos)) {
                Respuesta::json("error", "Producto no encontrado.", [], 404);
            }
        }

        Respuesta::json("success", "Datos obtenidos correctamente.", ["productos" => $productos], 200);
        break;

    // ============================================================
    // POST: CREAR PRODUCTO  ->  sp_crear_producto
    // ============================================================
    case 'POST':
        $b = Respuesta::leerBody();

        if (!isset($b['id_categoria'], $b['codigo'], $b['nombre'], $b['precio_compra'],
                   $b['precio_venta'], $b['stock_actual'], $b['stock_minimo'], $b['unidad_medida'])) {
            Respuesta::json("error", "Faltan campos obligatorios para registrar el producto.", [], 400);
        }

        // orden del SP: id_categoria, codigo, nombre, descripcion, precio_compra,
        //               precio_venta, stock_actual, stock_minimo, unidad_medida
        $tsql = "{call sp_crear_producto(?, ?, ?, ?, ?, ?, ?, ?, ?)}";
        $params = [
            $b['id_categoria'],
            trim($b['codigo']),
            trim($b['nombre']),
            isset($b['descripcion']) ? trim($b['descripcion']) : null,
            $b['precio_compra'],
            $b['precio_venta'],
            $b['stock_actual'],
            $b['stock_minimo'],
            trim($b['unidad_medida'])
        ];

        $fila = ejecutarSP($conn, $tsql, $params);

        if ($fila && isset($fila['Error'])) {
            Respuesta::json("error_negocio", $fila['Error'], ["codigo_sql" => $fila['NumeroError'] ?? null], 422);
        }
        Respuesta::json("success", $fila['Mensaje'] ?? "Producto registrado.", [
            "id_producto" => isset($fila['IdProducto']) ? (int)$fila['IdProducto'] : null
        ], 201);
        break;

    // ============================================================
    // PUT: ACTUALIZAR PRODUCTO  ->  sp_actualizar_producto
    //      (+ sp_ajustar_inventario si cambio el stock_actual)
    // ============================================================
    case 'PUT':
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if ($id <= 0) {
            Respuesta::json("error", "Debe proporcionar el ID del producto por la URL (?id=X).", [], 400);
        }

        $b = Respuesta::leerBody();
        if (!isset($b['id_categoria'], $b['codigo'], $b['nombre'], $b['precio_compra'],
                   $b['precio_venta'], $b['stock_minimo'], $b['unidad_medida'])) {
            Respuesta::json("error", "Faltan campos obligatorios para actualizar.", [], 400);
        }

        // 1) actualizar los datos del producto (sin stock) via sp_actualizar_producto
        // orden del SP: id_producto, id_categoria, codigo, nombre, descripcion,
        //               precio_compra, precio_venta, stock_minimo, unidad_medida
        $tsql = "{call sp_actualizar_producto(?, ?, ?, ?, ?, ?, ?, ?, ?)}";
        $params = [
            $id,
            $b['id_categoria'],
            trim($b['codigo']),
            trim($b['nombre']),
            isset($b['descripcion']) ? trim($b['descripcion']) : null,
            $b['precio_compra'],
            $b['precio_venta'],
            $b['stock_minimo'],
            trim($b['unidad_medida'])
        ];
        $fila = ejecutarSP($conn, $tsql, $params);
        if ($fila && isset($fila['Error'])) {
            Respuesta::json("error_negocio", $fila['Error'], ["codigo_sql" => $fila['NumeroError'] ?? null], 422);
        }

        // 2) si la web mando un stock_actual nuevo, hacerlo via ajuste de inventario
        //    (asi queda registrado el movimiento y la auditoria, no es un update crudo)
        if (isset($b['stock_actual'])) {
            // necesitamos saber quien hace el ajuste (para la auditoria y el permiso de rol)
            $id_usuario = $b['id_usuario'] ?? null;
            if (!$id_usuario) {
                Respuesta::json("error", "Para ajustar el stock se requiere id_usuario.", [], 400);
            }

            // leer el stock que tiene ahora el producto para ver si de verdad cambio
            $stmtS = sqlsrv_query($conn, "select stock_actual from producto where id_producto = ?", [$id]);
            $rowS = $stmtS ? sqlsrv_fetch_array($stmtS, SQLSRV_FETCH_ASSOC) : null;
            if ($stmtS) sqlsrv_free_stmt($stmtS);
            $stock_antes = $rowS ? intval($rowS['stock_actual']) : null;

            // solo ajustar si el valor nuevo es distinto al actual
            if ($stock_antes !== null && intval($b['stock_actual']) !== $stock_antes) {
                $motivo = $b['motivo_ajuste'] ?? 'Ajuste manual desde la web';
                $tsqlAj = "{call sp_ajustar_inventario(?, ?, ?, ?)}";
                $paramsAj = [$id_usuario, $id, intval($b['stock_actual']), $motivo];
                $filaAj = ejecutarSP($conn, $tsqlAj, $paramsAj);
                if ($filaAj && isset($filaAj['Error'])) {
                    Respuesta::json("error_negocio", "Producto actualizado, pero el ajuste de stock fallo: " . $filaAj['Error'], [], 422);
                }
            }
        }

        Respuesta::json("success", "Producto actualizado exitosamente.", [], 200);
        break;

    // ============================================================
    // DELETE: DESACTIVAR PRODUCTO  ->  sp_desactivar_producto
    // ============================================================
    case 'DELETE':
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if ($id <= 0) {
            Respuesta::json("error", "Debe proporcionar el ID del producto por la URL (?id=X).", [], 400);
        }
        $fila = ejecutarSP($conn, "{call sp_desactivar_producto(?)}", [$id]);
        if ($fila && isset($fila['Error'])) {
            Respuesta::json("error_negocio", $fila['Error'], ["codigo_sql" => $fila['NumeroError'] ?? null], 422);
        }
        Respuesta::json("success", $fila['Mensaje'] ?? "Producto desactivado.", [], 200);
        break;

    default:
        Respuesta::json("error", "Metodo HTTP no permitido.", [], 405);
        break;
}

sqlsrv_close($conn);
?>