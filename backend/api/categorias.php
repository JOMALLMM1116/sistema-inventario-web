<?php
// backend/api/categorias.php
// CRUD de categorias usando los SP del script 09.
//   GET    -> sp_listar_categorias
//   POST   -> sp_crear_categoria       (nombre, descripcion)
//   PUT    -> sp_actualizar_categoria  (id por ?id=N)
//   DELETE -> sp_desactivar_categoria  (id por ?id=N)

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

    case 'GET':
        $stmt = sqlsrv_query($conn, "{call sp_listar_categorias}");
        if ($stmt === false) {
            Respuesta::json("error", "Error al consultar categorias.", ["errors" => sqlsrv_errors()], 500);
        }
        $categorias = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $categorias[] = $row;
        }
        sqlsrv_free_stmt($stmt);
        Respuesta::json("success", "Categorias obtenidas.", ["categorias" => $categorias], 200);
        break;

    case 'POST':
        $b = Respuesta::leerBody();
        if (!isset($b['nombre'])) {
            Respuesta::json("error", "El nombre de la categoria es obligatorio.", [], 400);
        }
        $tsql = "{call sp_crear_categoria(?, ?)}";
        $params = [trim($b['nombre']), isset($b['descripcion']) ? trim($b['descripcion']) : ''];
        $fila = ejecutarSP($conn, $tsql, $params);
        if ($fila && isset($fila['Error'])) {
            Respuesta::json("error_negocio", $fila['Error'], [], 422);
        }
        Respuesta::json("success", $fila['Mensaje'] ?? "Categoria creada.", [
            "id_categoria" => isset($fila['IdCategoria']) ? (int)$fila['IdCategoria'] : null
        ], 201);
        break;

    case 'PUT':
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if ($id <= 0) {
            Respuesta::json("error", "Debe proporcionar el ID de la categoria (?id=X).", [], 400);
        }
        $b = Respuesta::leerBody();
        if (!isset($b['nombre'])) {
            Respuesta::json("error", "El nombre de la categoria es obligatorio.", [], 400);
        }
        $tsql = "{call sp_actualizar_categoria(?, ?, ?)}";
        $params = [$id, trim($b['nombre']), isset($b['descripcion']) ? trim($b['descripcion']) : ''];
        $fila = ejecutarSP($conn, $tsql, $params);
        if ($fila && isset($fila['Error'])) {
            Respuesta::json("error_negocio", $fila['Error'], [], 422);
        }
        Respuesta::json("success", $fila['Mensaje'] ?? "Categoria actualizada.", [], 200);
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if ($id <= 0) {
            Respuesta::json("error", "Debe proporcionar el ID de la categoria (?id=X).", [], 400);
        }
        $fila = ejecutarSP($conn, "{call sp_desactivar_categoria(?)}", [$id]);
        if ($fila && isset($fila['Error'])) {
            Respuesta::json("error_negocio", $fila['Error'], [], 422);
        }
        Respuesta::json("success", $fila['Mensaje'] ?? "Categoria desactivada.", [], 200);
        break;

    default:
        Respuesta::json("error", "Metodo HTTP no permitido.", [], 405);
        break;
}

sqlsrv_close($conn);
?>
