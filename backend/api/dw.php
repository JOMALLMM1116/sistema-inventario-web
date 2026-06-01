<?php
// backend/api/dw.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once __DIR__ . '/../config/db.php';
$db = DB::conectar();

$metodo = $_SERVER['REQUEST_METHOD'];

// -----------------------------------------------------------
// 1. PETICIÓN POST: Cargar/Actualizar el Data Warehouse
// -----------------------------------------------------------
if ($metodo === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    // Validamos que el frontend envíe el ID del usuario que ejecuta la acción
    if (!isset($data['id_usuario'])) {
        echo json_encode(["status" => "error", "message" => "Se requiere el ID de usuario para auditoría del proceso ETL."]);
        exit;
    }

    $id_usuario = (int)$data['id_usuario'];

    // Pasamos el parámetro obligatorio al SP
    $tsql = "{call sp_cargar_datawarehouse(?)}";
    $params = [
        [$id_usuario, SQLSRV_PARAM_IN]
    ];

    $stmt = sqlsrv_query($db, $tsql, $params);

    if ($stmt === false) {
        echo json_encode(["status" => "error", "message" => "Error al cargar el Data Warehouse.", "errors" => sqlsrv_errors()]);
        exit;
    }

    echo json_encode([
        "status" => "success",
        "message" => "Data Warehouse actualizado y consolidado correctamente para análisis OLAP."
    ]);
    
    sqlsrv_free_stmt($stmt);
    exit;
}

// -----------------------------------------------------------
// 2. PETICIÓN GET: Obtener el cubo de ventas consolidado para gráficos
// -----------------------------------------------------------
if ($metodo === 'GET') {
    $tsql = "
        SELECT 
            t.año,
            t.nombre_mes AS mes,
            p.nombre_producto AS producto,
            p.categoria,
            c.nombre_cliente AS cliente,
            v.nombre_vendedor AS vendedor,
            SUM(h.cantidad) AS total_unidades,
            SUM(h.monto_venta) AS total_ingresos,
            SUM(h.ganancia) AS total_ganancia
        FROM dw_hecho_ventas h
        INNER JOIN dw_dim_tiempo t ON h.id_tiempo = t.id_tiempo
        INNER JOIN dw_dim_producto p ON h.id_dim_producto = p.id_dim_producto
        INNER JOIN dw_dim_cliente c ON h.id_dim_cliente = c.id_dim_cliente
        INNER JOIN dw_dim_vendedor v ON h.id_dim_vendedor = v.id_dim_vendedor
        GROUP BY t.año, t.nombre_mes, t.mes_numero, p.nombre_producto, p.categoria, c.nombre_cliente, v.nombre_vendedor
        ORDER BY t.año DESC, t.mes_numero DESC, total_ingresos DESC
    ";

    $stmt = sqlsrv_query($db, $tsql);

    if ($stmt === false) {
        echo json_encode(["status" => "error", "message" => "Error al consultar reportes del DW.", "errors" => sqlsrv_errors()]);
        exit;
    }

    $reporte = [];
    while ($fila = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $reporte[] = $fila;
    }

    echo json_encode([
        "status" => "success",
        "records" => count($reporte),
        "data" => $reporte
    ]);

    sqlsrv_free_stmt($stmt);
    exit;
}
?>