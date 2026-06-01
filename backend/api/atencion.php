<?php
// backend/api/atencion.php
// Atencion al cliente usando los SP del script 27.
// TODOS reciben @id_usuario primero (el agente que opera el caso).
//   GET    -> sp_consultar_atencion (filtros opcionales ?id_cliente=N&estado=abierto)
//   POST   -> sp_crear_atencion
//   PUT    -> sp_actualizar_atencion  (cambiar estado/prioridad/descripcion)
//   PATCH  -> sp_cerrar_atencion      (cerrar con resolucion obligatoria)
//
// El id_usuario se manda en el body (o query) porque el SP lo necesita para
// el permiso de rol y la auditoria (session_context).

require_once __DIR__ . '/../lib/respuesta.php';
require_once __DIR__ . '/../config/db.php';

Respuesta::inicializarAPI();
$conn = DB::conectar();
$metodo = $_SERVER['REQUEST_METHOD'];

function ejecutarSP($conn, $tsql, $params = [])
{
    $stmt = sqlsrv_query($conn, $tsql, $params);
    if ($stmt === false) {
        Respuesta::json("error", "Error al ejecutar la operacion.", ["errors" => sqlsrv_errors()], 500);
    }
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
    // GET: CONSULTAR CASOS  ->  sp_consultar_atencion
    // requiere id_usuario (?id_usuario=N), filtros opcionales
    // ============================================================
    case 'GET':
        $id_usuario = isset($_GET['id_usuario']) ? intval($_GET['id_usuario']) : 0;
        if ($id_usuario <= 0) {
            Respuesta::json("error", "Se requiere id_usuario para consultar atencion.", [], 400);
        }
        $id_cliente = isset($_GET['id_cliente']) && $_GET['id_cliente'] !== '' ? intval($_GET['id_cliente']) : null;
        $estado     = isset($_GET['estado']) && $_GET['estado'] !== '' ? $_GET['estado'] : null;

        $tsql = "{call sp_consultar_atencion(?, ?, ?)}";
        $stmt = sqlsrv_query($conn, $tsql, [$id_usuario, $id_cliente, $estado]);
        if ($stmt === false) {
            Respuesta::json("error", "Error al consultar atencion.", ["errors" => sqlsrv_errors()], 500);
        }
        // el SELECT puede venir despues de validaciones; recogemos todas las filas
        // del primer conjunto de datos que tenga columnas de caso (no la de Error)
        $casos = [];
        do {
            while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                if (isset($row['Error'])) {
                    sqlsrv_free_stmt($stmt);
                    Respuesta::json("error_negocio", $row['Error'], [], 422);
                }
                $casos[] = $row;
            }
        } while (sqlsrv_next_result($stmt));
        sqlsrv_free_stmt($stmt);
        Respuesta::json("success", "Casos de atencion obtenidos.", ["casos" => $casos], 200);
        break;

    // ============================================================
    // POST: CREAR CASO  ->  sp_crear_atencion
    // ============================================================
    case 'POST':
        $b = Respuesta::leerBody();
        if (!isset($b['id_usuario'], $b['id_cliente'], $b['tipo'], $b['descripcion'])) {
            Respuesta::json("error", "Faltan datos (id_usuario, id_cliente, tipo, descripcion).", [], 400);
        }
        // orden: id_usuario, id_cliente, tipo, descripcion, prioridad
        $tsql = "{call sp_crear_atencion(?, ?, ?, ?, ?)}";
        $params = [
            intval($b['id_usuario']),
            intval($b['id_cliente']),
            trim($b['tipo']),
            trim($b['descripcion']),
            isset($b['prioridad']) ? trim($b['prioridad']) : 'normal'
        ];
        $fila = ejecutarSP($conn, $tsql, $params);
        if ($fila && isset($fila['Error'])) {
            Respuesta::json("error_negocio", $fila['Error'], [], 422);
        }
        Respuesta::json("success", $fila['Mensaje'] ?? "Caso registrado.", [
            "id_atencion" => isset($fila['IdAtencion']) ? (int)$fila['IdAtencion'] : null
        ], 201);
        break;

    // ============================================================
    // PUT: ACTUALIZAR CASO  ->  sp_actualizar_atencion
    // (estado / prioridad / descripcion, todos opcionales)
    // ============================================================
    case 'PUT':
        $b = Respuesta::leerBody();
        if (!isset($b['id_usuario'], $b['id_atencion'])) {
            Respuesta::json("error", "Faltan datos (id_usuario, id_atencion).", [], 400);
        }
        // orden: id_usuario, id_atencion, estado, prioridad, descripcion
        $tsql = "{call sp_actualizar_atencion(?, ?, ?, ?, ?)}";
        $params = [
            intval($b['id_usuario']),
            intval($b['id_atencion']),
            isset($b['estado']) && $b['estado'] !== '' ? trim($b['estado']) : null,
            isset($b['prioridad']) && $b['prioridad'] !== '' ? trim($b['prioridad']) : null,
            isset($b['descripcion']) && $b['descripcion'] !== '' ? trim($b['descripcion']) : null
        ];
        $fila = ejecutarSP($conn, $tsql, $params);
        if ($fila && isset($fila['Error'])) {
            Respuesta::json("error_negocio", $fila['Error'], [], 422);
        }
        Respuesta::json("success", $fila['Mensaje'] ?? "Caso actualizado.", [], 200);
        break;

    // ============================================================
    // PATCH: CERRAR CASO  ->  sp_cerrar_atencion (resolucion obligatoria)
    // ============================================================
    case 'PATCH':
        $b = Respuesta::leerBody();
        if (!isset($b['id_usuario'], $b['id_atencion'], $b['resolucion'])) {
            Respuesta::json("error", "Faltan datos (id_usuario, id_atencion, resolucion).", [], 400);
        }
        $tsql = "{call sp_cerrar_atencion(?, ?, ?)}";
        $params = [intval($b['id_usuario']), intval($b['id_atencion']), trim($b['resolucion'])];
        $fila = ejecutarSP($conn, $tsql, $params);
        if ($fila && isset($fila['Error'])) {
            Respuesta::json("error_negocio", $fila['Error'], [], 422);
        }
        Respuesta::json("success", $fila['Mensaje'] ?? "Caso cerrado.", [], 200);
        break;

    default:
        Respuesta::json("error", "Metodo HTTP no permitido.", [], 405);
        break;
}

sqlsrv_close($conn);
?>
