<?php
// backend/api/soporte.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once __DIR__ . '/../config/db.php';
$db = DB::conectar();

$accion = $_GET['accion'] ?? null;

if (!$accion) {
    echo json_encode(["status" => "error", "message" => "No se especificó la acción de soporte o mantenimiento."]);
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'];

// -----------------------------------------------------------
// 1. ACCIÓN: BACKUP (Crear respaldo físico y llenar `historial_backup`)
// -----------------------------------------------------------
if ($metodo === 'POST' && $accion === 'backup') {
    $tsql = "{call sp_respaldar_base}";
    $stmt = sqlsrv_query($db, $tsql);

    if ($stmt === false) {
        echo json_encode(["status" => "error", "message" => "Error al generar el respaldo.", "errors" => sqlsrv_errors()]);
        exit;
    }

    echo json_encode([
        "status" => "success",
        "message" => "Respaldo físico generado en el servidor y registrado en historial_backup correctamente."
    ]);
    sqlsrv_free_stmt($stmt);
    exit;
}

// -----------------------------------------------------------
// 2. ACCIÓN: MONITOREO (Registrar telemetría en `monitore_consulta`)
// -----------------------------------------------------------
if ($metodo === 'POST' && $accion === 'monitorear') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $consulta = $data['consulta'] ?? 'Consulta Web Anónima';
    $tiempo_ms = (int)($data['tiempo_ms'] ?? 0);

    $tsql = "{call sp_monitorear_consulta(?, ?)}";
    $params = [
        [$consulta, SQLSRV_PARAM_IN], 
        [$tiempo_ms, SQLSRV_PARAM_IN]
    ];

    $stmt = sqlsrv_query($db, $tsql, $params);
    if ($stmt === false) {
        echo json_encode(["status" => "error", "errors" => sqlsrv_errors()]);
        exit;
    }

    echo json_encode(["status" => "success", "message" => "Métrica de rendimiento guardada en monitore_consulta."]);
    sqlsrv_free_stmt($stmt);
    exit;
}

// -----------------------------------------------------------
// 3. ACCIÓN: GUARDAR PREDICCIÓN (Llenar `prediccion_ia` desde Python/React)
// -----------------------------------------------------------
if ($metodo === 'POST' && $accion === 'guardar_prediccion') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['id_producto'], $data['mes_predicho'], $data['cantidad_predicha'])) {
        echo json_encode(["status" => "error", "message" => "Datos de predicción incompletos."]);
        exit;
    }

    $id_producto = (int)$data['id_producto'];
    $mes_predicho = (int)$data['mes_predicho'];
    $cantidad_predicha = (float)$data['cantidad_predicha'];

    $tsql = "{call sp_guardar_prediccion(?, ?, ?)}";
    $params = [
        [$id_producto, SQLSRV_PARAM_IN],
        [$mes_predicho, SQLSRV_PARAM_IN],
        [$cantidad_predicha, SQLSRV_PARAM_IN]
    ];

    $stmt = sqlsrv_query($db, $tsql, $params);
    if ($stmt === false) {
        echo json_encode(["status" => "error", "errors" => sqlsrv_errors()]);
        exit;
    }

    echo json_encode(["status" => "success", "message" => "Predicción de IA almacenada con éxito en la tabla prediccion_ia."]);
    sqlsrv_free_stmt($stmt);
    exit;
}

// -----------------------------------------------------------
// 4. ACCIÓN: ALERTAS (Consultar stock bajo activo desde `alerta_inventario`)
// -----------------------------------------------------------
if ($metodo === 'GET' && $accion === 'alertas') {
    // Eliminamos el filtro 'leida = 0' para evitar el error de columna inválida
    $tsql = "SELECT * FROM alerta_inventario ORDER BY fecha_alerta DESC";
    $stmt = sqlsrv_query($db, $tsql);

    if ($stmt === false) {
        echo json_encode(["status" => "error", "errors" => sqlsrv_errors()]);
        exit;
    }

    $alertas = [];
    while ($fila = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $alertas[] = $fila;
    }

    echo json_encode($alertas);
    sqlsrv_free_stmt($stmt);
    exit;
}

// -----------------------------------------------------------
// 5. ACCIÓN: DESHACER CAMBIOS (Recuperar producto desde la bitácora)
// -----------------------------------------------------------
if ($metodo === 'POST' && $accion === 'deshacer_producto') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['id_bitacora'])) {
        echo json_encode(["status" => "error", "message" => "ID de bitácora requerido para la restauración."]);
        exit;
    }
    
    $id_bitacora = (int)$data['id_bitacora'];

    $tsql = "{call sp_recuperar_producto_bitacora(?)}";
    $params = [[$id_bitacora, SQLSRV_PARAM_IN]];

    $stmt = sqlsrv_query($db, $tsql, $params);
    if ($stmt === false) {
        echo json_encode(["status" => "error", "message" => "No se pudo restaurar el estado.", "errors" => sqlsrv_errors()]);
        exit;
    }

    echo json_encode(["status" => "success", "message" => "Producto restaurado con éxito a su estado anterior usando los registros de la bitácora."]);
    sqlsrv_free_stmt($stmt);
    exit;
}

// -----------------------------------------------------------
// 6. ACCIÓN: ATENCIÓN AL CLIENTE (CRUD de Tickets para `atenciocliente`)
// -----------------------------------------------------------
if ($accion === 'atencion') {
    if ($metodo === 'GET') {
        $tsql = "{call sp_consultar_atencion}";
        $stmt = sqlsrv_query($db, $tsql);

        if ($stmt === false) {
            echo json_encode(["status" => "error", "errors" => sqlsrv_errors()]);
            exit;
        }

        $tickets = [];
        while ($fila = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $tickets[] = $fila;
        }
        echo json_encode($tickets);
        sqlsrv_free_stmt($stmt);
        exit;
    } 
    
    if ($metodo === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['id_cliente'], $data['id_usuario'], $data['descripcion'])) {
            echo json_encode(["status" => "error", "message" => "Datos incompletos para el ticket de soporte."]);
            exit;
        }

        $tsql = "{call sp_crear_atencion(?, ?, ?)}";
        $params = [
            [(int)$data['id_cliente'], SQLSRV_PARAM_IN],
            [(int)$data['id_usuario'], SQLSRV_PARAM_IN],
            [$data['descripcion'], SQLSRV_PARAM_IN]
        ];

        $stmt = sqlsrv_query($db, $tsql, $params);
        if ($stmt === false) {
            echo json_encode(["status" => "error", "errors" => sqlsrv_errors()]);
            exit;
        }

        echo json_encode(["status" => "success", "message" => "Ticket de atención al cliente abierto correctamente."]);
        sqlsrv_free_stmt($stmt);
        exit;
    }
}

// Error por si se digita mal la acción en la URL
echo json_encode(["status" => "error", "message" => "Acción o método HTTP no configurado en el servidor de soporte."]);
?>