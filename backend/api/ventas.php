<?php
// backend/api/ventas.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Cargamos tu archivo de configuración usando rutas seguras
include_once __DIR__ . '/../config/db.php';

// ADAPTACIÓN A TU CLASE REAL: Invocamos el método estático conectar()
$db = DB::conectar();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['id_cliente'], $data['id_usuario'], $data['productos']) || !is_array($data['productos'])) {
        echo json_encode(["status" => "error", "message" => "Datos incompletos para procesar la venta."]);
        exit;
    }

    $id_cliente = $data['id_cliente'];
    $id_usuario = $data['id_usuario'];
    $metodo_pago = $data['metodo_pago'] ?? 'Efectivo';
    $productos = $data['productos'];

    // Estructura para el Table-Valued Parameter (TVP)
    $filas = [];
    foreach ($productos as $p) {
        $filas[] = [
            (int)$p['id_producto'], 
            (int)$p['cantidad'], 
            (float)($p['descuento'] ?? 0.00)
        ];
    }
    $tvp = ["tipo_detalle_venta" => $filas];

    $tsql = "{call sp_registrar_venta(?, ?, ?, ?)}";
    $params = [
        [$id_cliente, SQLSRV_PARAM_IN],
        [$id_usuario, SQLSRV_PARAM_IN],
        [$metodo_pago, SQLSRV_PARAM_IN],
        [$tvp, SQLSRV_PARAM_IN]
    ];

    $stmt = sqlsrv_query($db, $tsql, $params);

    if ($stmt === false) {
        echo json_encode(["status" => "error", "message" => "Error de ejecución en el servidor.", "errors" => sqlsrv_errors()]);
        exit;
    }

    // Saltamos los resultados intermedios provocados por los triggers
    $resultado = null;
    do {
        while ($fila = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            if ($fila !== null && (isset($fila['Mensaje']) || isset($fila['Error']))) {
                $resultado = $fila;
                break 2; 
            }
        }
    } while (sqlsrv_next_result($stmt));

    // Validamos la respuesta final del Stored Procedure
    if ($resultado && isset($resultado['Error'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => $resultado['Error']]);
    } elseif ($resultado && isset($resultado['Mensaje'])) {
        echo json_encode(["status" => "success", "message" => $resultado['Mensaje']]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Transacción procesada, pero no se recuperó el mensaje de confirmación."]);
    }

    sqlsrv_free_stmt($stmt);
}
?>