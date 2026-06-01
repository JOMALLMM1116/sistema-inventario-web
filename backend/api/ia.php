<?php
// backend/api/ia.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once __DIR__ . '/../config/db.php';
$db = DB::conectar();

// Por defecto lee los últimos 6 meses del historial de entrenamiento
$meses = isset($_GET['meses']) ? (int)$_GET['meses'] : 6;

$tsql = "{call sp_datos_entrenamiento_ventas(?)}";
$params = [[$meses, SQLSRV_PARAM_IN]];

$stmt = sqlsrv_query($db, $tsql, $params);
if ($stmt === false) {
    echo json_encode(["status" => "error", "errors" => sqlsrv_errors()]);
    exit;
}

$datos = [];
while ($fila = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    $datos[] = $fila;
}

echo json_encode([
    "status" => "success",
    "descripcion" => "Historial de ventas con tendencia para modelo de IA",
    "data" => $datos
]);

sqlsrv_free_stmt($stmt);
?>