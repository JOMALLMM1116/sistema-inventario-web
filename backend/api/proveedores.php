<?php
// backend/api/proveedores.php
// CRUD de proveedores usando los SP del script 09.
//   GET    -> sp_listar_proveedores
//   POST   -> sp_crear_proveedor       (nombre, contacto, telefono, email, direccion, nit)
//   PUT    -> sp_actualizar_proveedor  (id por ?id=N)
//   DELETE -> sp_desactivar_proveedor  (id por ?id=N)
// En proveedor, tanto el email como el nit son unicos (lo valida el SP).

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
        $stmt = sqlsrv_query($conn, "{call sp_listar_proveedores}");
        if ($stmt === false) {
            Respuesta::json("error", "Error al consultar proveedores.", ["errors" => sqlsrv_errors()], 500);
        }
        $proveedores = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $proveedores[] = $row;
        }
        sqlsrv_free_stmt($stmt);
        Respuesta::json("success", "Proveedores obtenidos.", ["proveedores" => $proveedores], 200);
        break;

    case 'POST':
        $b = Respuesta::leerBody();
        if (!isset($b['nombre'], $b['email'], $b['nit'])) {
            Respuesta::json("error", "Nombre, email y nit son obligatorios.", [], 400);
        }
        // orden: nombre, contacto, telefono, email, direccion, nit
        $tsql = "{call sp_crear_proveedor(?, ?, ?, ?, ?, ?)}";
        $params = [
            trim($b['nombre']),
            isset($b['contacto']) ? trim($b['contacto']) : '',
            isset($b['telefono']) ? trim($b['telefono']) : '',
            trim($b['email']),
            isset($b['direccion']) ? trim($b['direccion']) : '',
            trim($b['nit'])
        ];
        $fila = ejecutarSP($conn, $tsql, $params);
        if ($fila && isset($fila['Error'])) {
            Respuesta::json("error_negocio", $fila['Error'], [], 422);
        }
        Respuesta::json("success", $fila['Mensaje'] ?? "Proveedor creado.", [
            "id_proveedor" => isset($fila['IdProveedor']) ? (int)$fila['IdProveedor'] : null
        ], 201);
        break;

    case 'PUT':
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if ($id <= 0) {
            Respuesta::json("error", "Debe proporcionar el ID del proveedor (?id=X).", [], 400);
        }
        $b = Respuesta::leerBody();
        if (!isset($b['nombre'], $b['email'], $b['nit'])) {
            Respuesta::json("error", "Nombre, email y nit son obligatorios.", [], 400);
        }
        // orden: id_proveedor, nombre, contacto, telefono, email, direccion, nit
        $tsql = "{call sp_actualizar_proveedor(?, ?, ?, ?, ?, ?, ?)}";
        $params = [
            $id,
            trim($b['nombre']),
            isset($b['contacto']) ? trim($b['contacto']) : '',
            isset($b['telefono']) ? trim($b['telefono']) : '',
            trim($b['email']),
            isset($b['direccion']) ? trim($b['direccion']) : '',
            trim($b['nit'])
        ];
        $fila = ejecutarSP($conn, $tsql, $params);
        if ($fila && isset($fila['Error'])) {
            Respuesta::json("error_negocio", $fila['Error'], [], 422);
        }
        Respuesta::json("success", $fila['Mensaje'] ?? "Proveedor actualizado.", [], 200);
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if ($id <= 0) {
            Respuesta::json("error", "Debe proporcionar el ID del proveedor (?id=X).", [], 400);
        }
        $fila = ejecutarSP($conn, "{call sp_desactivar_proveedor(?)}", [$id]);
        if ($fila && isset($fila['Error'])) {
            Respuesta::json("error_negocio", $fila['Error'], [], 422);
        }
        Respuesta::json("success", $fila['Mensaje'] ?? "Proveedor desactivado.", [], 200);
        break;

    default:
        Respuesta::json("error", "Metodo HTTP no permitido.", [], 405);
        break;
}

sqlsrv_close($conn);
?>
