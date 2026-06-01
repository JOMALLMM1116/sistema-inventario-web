<?php
// backend/api/backup.php
// Genera un respaldo invocando sp_respaldar_base (script 15).

require_once __DIR__ . '/../lib/respuesta.php';
require_once __DIR__ . '/../config/db.php';

Respuesta::inicializarAPI();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Respuesta::json("error", "Metodo no permitido. Use POST para respaldar.", [], 405);
}

$body = Respuesta::leerBody();
$id_usuario = isset($body['id_usuario']) ? intval($body['id_usuario']) : 0;

if ($id_usuario <= 0) {
    Respuesta::json("error", "Se requiere id_usuario para realizar el respaldo.", [], 400);
}

$conn = DB::conectar();

// CLAVE: el BACKUP DATABASE emite mensajes informativos ("Processed N pages")
// que el driver trata como errores y corta el comando antes de que el backup
// termine de escribir el archivo. Desactivando esto, el backup se completa.
sqlsrv_configure("WarningsReturnAsErrors", 0);

$tsql = "{call sp_respaldar_base(?)}";
$stmt = sqlsrv_query($conn, $tsql, [$id_usuario]);

if ($stmt === false) {
    // error real al lanzar el comando
    Respuesta::json("error", "Error al ejecutar el respaldo.", ["errors" => sqlsrv_errors()], 500);
}

// IMPORTANTE: recorrer TODOS los resultados para que el backup termine de
// procesarse por completo (no cerrar el statement antes de tiempo).
$resultado = null;
do {
    $fila = @sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
    if ($fila !== null && (isset($fila['Mensaje']) || isset($fila['Error']))) {
        $resultado = $fila;
    }
} while (sqlsrv_next_result($stmt));

sqlsrv_free_stmt($stmt);
sqlsrv_close($conn);

if ($resultado && isset($resultado['Error'])) {
    Respuesta::json("error_negocio", $resultado['Error'], [], 422);
}

if ($resultado) {
    Respuesta::json("success", $resultado['Mensaje'] ?? "Respaldo realizado.", [
        "ruta" => $resultado['RutaArchivo'] ?? null
    ], 200);
} else {
    Respuesta::json("error", "No se recibio respuesta del procedimiento de respaldo.", [], 500);
}