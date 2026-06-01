<?php
// backend/api/monitoreo.php
// GET  -> lista el historial de mediciones (tabla monitoreo_consulta)
// POST -> mide una consulta SELECT con sp_monitorear_consulta y la registra
//
// El SP solo permite medir consultas SELECT (por seguridad) y valida el rol.
// POST recibe { id_usuario, nombre_consulta, sentencia_sql }

require_once __DIR__ . '/../lib/respuesta.php';
require_once __DIR__ . '/../config/db.php';

Respuesta::inicializarAPI();
$conn = DB::conectar();
$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {

    // ===== Historial de mediciones =====
    case 'GET':
        $tsql = "SELECT m.id_monitoreo, m.nombre_consulta, m.tiempo_ms,
                        m.filas_afectadas, m.fecha_hora,
                        (u.nombre + ' ' + u.apellido) AS usuario_nombre
                 FROM monitoreo_consulta m
                 LEFT JOIN usuario u ON m.id_usuario = u.id_usuario
                 ORDER BY m.id_monitoreo DESC";
        $stmt = sqlsrv_query($conn, $tsql);
        if ($stmt === false) {
            Respuesta::json("error", "Error al consultar el monitoreo.", ["errors" => sqlsrv_errors()], 500);
        }
        $filas = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            if (isset($row['fecha_hora']) && $row['fecha_hora'] instanceof DateTime) {
                $row['fecha_hora'] = $row['fecha_hora']->format('Y-m-d H:i:s');
            }
            $filas[] = $row;
        }
        sqlsrv_free_stmt($stmt);
        Respuesta::json("success", "Mediciones obtenidas.", ["mediciones" => $filas], 200);
        break;

    // ===== Medir una consulta =====
    case 'POST':
        $b = Respuesta::leerBody();
        $id_usuario = isset($b['id_usuario']) ? intval($b['id_usuario']) : 0;
        $nombre = isset($b['nombre_consulta']) ? trim($b['nombre_consulta']) : '';
        $sql = isset($b['sentencia_sql']) ? trim($b['sentencia_sql']) : '';

        if ($id_usuario <= 0 || $nombre === '' || $sql === '') {
            Respuesta::json("error", "Faltan datos (id_usuario, nombre_consulta, sentencia_sql).", [], 400);
        }

        $tsql = "{call sp_monitorear_consulta(?, ?, ?)}";
        $stmt = sqlsrv_query($conn, $tsql, [$id_usuario, $nombre, $sql]);
        if ($stmt === false) {
            Respuesta::json("error", "Error al medir la consulta.", ["errors" => sqlsrv_errors()], 500);
        }

        $resultado = null;
        do {
            $fila = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
            if ($fila !== null && (isset($fila['Mensaje']) || isset($fila['Error']))) {
                $resultado = $fila;
                break;
            }
        } while (sqlsrv_next_result($stmt));

        sqlsrv_free_stmt($stmt);

        if ($resultado && isset($resultado['Error'])) {
            Respuesta::json("error_negocio", $resultado['Error'], [], 422);
        }
        if ($resultado) {
            Respuesta::json("success", $resultado['Mensaje'] ?? "Consulta medida.", [
                "tiempo_ms" => $resultado['TiempoMs'] ?? null,
                "filas" => $resultado['FilasAfectadas'] ?? null,
            ], 200);
        } else {
            Respuesta::json("error", "No se recibio respuesta del monitoreo.", [], 500);
        }
        break;

    default:
        Respuesta::json("error", "Metodo no permitido.", [], 405);
        break;
}

sqlsrv_close($conn);
?>
