<?php
// backend/api/catalogos.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once __DIR__ . '/../config/db.php';
$db = DB::conectar();

// Detectar qué catálogo quiere operar el Frontend (categoria, cliente, proveedor, producto)
$catalogo = $_GET['tabla'] ?? null;
$accion = $_GET['accion'] ?? 'listar'; // listar, crear, actualizar, desactivar, reactivar

$catalogos_permitidos = ['categoria', 'cliente', 'proveedor', 'producto'];

if (!$catalogo || !in_array($catalogo, $catalogos_permitidos)) {
    echo json_encode(["status" => "error", "message" => "Catálogo no válido o no especificado."]);
    exit;
}

// -----------------------------------------------------------
// 1. OPERACIÓN: LISTAR (Método GET)
// -----------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $accion === 'listar') {
    // Manejo de plural para el nombre del SP de listado
    $plural = ($catalogo === 'categoria') ? 'categorias' : $catalogo . 's';
    $tsql = "{call sp_listar_" . $plural . "}";
    
    $stmt = sqlsrv_query($db, $tsql);
    if ($stmt === false) {
        echo json_encode(["status" => "error", "errors" => sqlsrv_errors()]);
        exit;
    }

    $resultados = [];
    while ($fila = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $resultados[] = $fila;
    }
    echo json_encode($resultados);
    sqlsrv_free_stmt($stmt);
    exit;
}

// -----------------------------------------------------------
// 2. OPERACIONES DE ESCRITURA (Método POST)
// -----------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    switch ($accion) {
        case 'crear':
            // Extrae los parámetros dinámicamente según el JSON recibido
            $params = [];
            foreach ($data as $key => $value) {
                $params[] = [$value, SQLSRV_PARAM_IN];
            }
            // Construye los signos de interrogación necesarios (?, ?, ...)
            $interrogaciones = implode(', ', array_fill(0, count($params), '?'));
            $tsql = "{call sp_crear_" . $catalogo . "(" . $interrogaciones . ")}";
            break;

        case 'actualizar':
            $params = [];
            foreach ($data as $key => $value) {
                $params[] = [$value, SQLSRV_PARAM_IN];
            }
            $interrogaciones = implode(', ', array_fill(0, count($params), '?'));
            $tsql = "{call sp_actualizar_" . $catalogo . "(" . $interrogaciones . ")}";
            break;

        case 'desactivar':
            if (!isset($data['id'])) {
                echo json_encode(["status" => "error", "message" => "ID requerido para desactivar."]);
                exit;
            }
            $tsql = "{call sp_desactivar_" . $catalogo . "(?)}";
            $params = [[(int)$data['id'], SQLSRV_PARAM_IN]];
            break;

        case 'reactivar':
            if (!isset($data['id'])) {
                echo json_encode(["status" => "error", "message" => "ID requerido para reactivar."]);
                exit;
            }
            $tsql = "{call sp_reactivar_" . $catalogo . "(?)}";
            $params = [[(int)$data['id'], SQLSRV_PARAM_IN]];
            break;

        default:
            echo json_encode(["status" => "error", "message" => "Acción POST no reconocida."]);
            exit;
    }

    $stmt = sqlsrv_query($db, $tsql, $params);
    if ($stmt === false) {
        echo json_encode(["status" => "error", "message" => "Error de ejecución en catálogo.", "errors" => sqlsrv_errors()]);
        exit;
    }

    // Saltar resultados intermedios de los Triggers de Auditoría
    $resultado_final = ["status" => "success", "message" => "Operación ejecutada con éxito."];
    do {
        while ($fila = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            if ($fila !== null && (isset($fila['Mensaje']) || isset($fila['Error']))) {
                $resultado_final = $fila;
                break 2;
            }
        }
    } while (sqlsrv_next_result($stmt));

    echo json_encode($resultado_final);
    sqlsrv_free_stmt($stmt);
}
?>