<?php
// backend/api/compras.php
// GET  -> historial de compras (lectura)
// POST -> registrar compra con sp_registrar_compra (TVP)

require_once __DIR__ . '/../lib/respuesta.php';
require_once __DIR__ . '/../config/db.php';

Respuesta::inicializarAPI();
$conn = DB::conectar();
$metodo = $_SERVER['REQUEST_METHOD'];

// ============================================================
// GET: HISTORIAL DE COMPRAS
// ============================================================
if ($metodo === 'GET') {
    $tsql = "SELECT c.id_compra, c.fecha_compra, c.subtotal, c.total,
                    c.estado, c.observaciones,
                    p.nombre AS proveedor_nombre,
                    (u.nombre + ' ' + u.apellido) AS usuario_nombre
             FROM compra c
             INNER JOIN proveedor p ON c.id_proveedor = p.id_proveedor
             INNER JOIN usuario u ON c.id_usuario = u.id_usuario
             ORDER BY c.id_compra DESC";
    $stmt = sqlsrv_query($conn, $tsql);
    if ($stmt === false) {
        Respuesta::json("error", "Error al consultar el historial de compras.", ["errors" => sqlsrv_errors()], 500);
    }
    $compras = [];
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        if (isset($row['fecha_compra']) && $row['fecha_compra'] instanceof DateTime) {
            $row['fecha_compra'] = $row['fecha_compra']->format('Y-m-d');
        }
        $compras[] = $row;
    }
    sqlsrv_free_stmt($stmt);
    sqlsrv_close($conn);
    Respuesta::json("success", "Historial de compras obtenido.", ["compras" => $compras], 200);
}

// ============================================================
// POST: REGISTRAR COMPRA (TVP)
// ============================================================
if ($metodo === 'POST') {
    $data = Respuesta::leerBody();

    $id_proveedor  = $data['id_proveedor'] ?? null;
    $id_usuario    = $data['id_usuario'] ?? null;
    $observaciones = $data['observaciones'] ?? 'Compra registrada desde API Web';
    $productos     = $data['productos'] ?? null;

    if (!$id_usuario || !$id_proveedor || empty($productos) || !is_array($productos)) {
        Respuesta::json("error", "Datos de peticion malformados. Se requiere id_usuario, id_proveedor y el listado de productos.", [], 400);
    }

    // armar las filas del detalle: [id_producto, cantidad, precio_unitario]
    $filas = [];
    foreach ($productos as $p) {
        $filas[] = [
            (int)($p['id_producto'] ?? 0),
            (int)($p['cantidad'] ?? 0),
            (float)($p['precio_unitario'] ?? 0)
        ];
    }
    $tvp = ["tipo_detalle_compra" => $filas];

    $tsql = "{call sp_registrar_compra(?, ?, ?, ?)}";
    $params = [
        [$id_proveedor, SQLSRV_PARAM_IN],
        [$id_usuario, SQLSRV_PARAM_IN],
        [$observaciones, SQLSRV_PARAM_IN],
        [$tvp, SQLSRV_PARAM_IN]
    ];

    $stmt = sqlsrv_query($conn, $tsql, $params);
    if ($stmt === false) {
        Respuesta::json("error", "Error critico en el servidor de base de datos al preparar la compra.", ["errors" => sqlsrv_errors()], 500);
    }

    $resultado = null;
    do {
        $fila = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
        if ($fila !== null && (isset($fila['Mensaje']) || isset($fila['Error']))) {
            $resultado = $fila;
            break;
        }
    } while (sqlsrv_next_result($stmt));

    if ($resultado) {
        if (isset($resultado['Error'])) {
            Respuesta::json("error_negocio", $resultado['Error'], ["codigo_sql" => $resultado['NumeroError'] ?? null], 422);
        }
        Respuesta::json("success", $resultado['Mensaje'] ?? "Compra registrada correctamente", [
            "id_compra" => isset($resultado['IdCompra']) ? (int)$resultado['IdCompra'] : null,
            "total"     => isset($resultado['Total']) ? (float)$resultado['Total'] : 0.0
        ], 201);
    } else {
        Respuesta::json("error", "No se recibio respuesta estructurada del procedimiento transaccional.", [], 500);
    }

    sqlsrv_free_stmt($stmt);
    sqlsrv_close($conn);
}

if (!in_array($metodo, ['GET', 'POST'])) {
    Respuesta::json("error", "Metodo no permitido.", [], 405);
}
?>
