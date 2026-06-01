<?php
// backend/api/clientes.php
// CRUD de clientes usando los SP del script 09.
//   GET    -> sp_listar_clientes
//   POST   -> sp_crear_cliente
//   PUT    -> sp_actualizar_cliente   (id por ?id=N)
//   DELETE -> sp_desactivar_cliente   (id por ?id=N)

require_once __DIR__ . '/../lib/respuesta.php';
require_once __DIR__ . '/../config/db.php';

Respuesta::inicializarAPI();
$conn = DB::conectar();
$metodo = $_SERVER['REQUEST_METHOD'];

// ejecuta un SP y devuelve la primera fila real (saltando triggers)
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
        $stmt = sqlsrv_query($conn, "{call sp_listar_clientes}");
        if ($stmt === false) {
            Respuesta::json("error", "Error al consultar clientes.", ["errors" => sqlsrv_errors()], 500);
        }
        $clientes = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $clientes[] = $row;
        }
        sqlsrv_free_stmt($stmt);
        Respuesta::json("success", "Clientes obtenidos.", ["clientes" => $clientes], 200);
        break;

    case 'POST':
        $b = Respuesta::leerBody();
        if (!isset($b['nombre'], $b['email'])) {
            Respuesta::json("error", "El nombre y el email son obligatorios.", [], 400);
        }
        // orden: nombre, apellido, telefono, email, direccion, nit, tipo_cliente
        $tsql = "{call sp_crear_cliente(?, ?, ?, ?, ?, ?, ?)}";
        $params = [
            trim($b['nombre']),
            isset($b['apellido']) ? trim($b['apellido']) : '',
            isset($b['telefono']) ? trim($b['telefono']) : '',
            trim($b['email']),
            isset($b['direccion']) ? trim($b['direccion']) : '',
            isset($b['nit']) ? trim($b['nit']) : 'CF',
            isset($b['tipo_cliente']) ? trim($b['tipo_cliente']) : 'regular'
        ];
        $fila = ejecutarSP($conn, $tsql, $params);
        if ($fila && isset($fila['Error'])) {
            Respuesta::json("error_negocio", $fila['Error'], [], 422);
        }
        Respuesta::json("success", $fila['Mensaje'] ?? "Cliente creado.", [
            "id_cliente" => isset($fila['IdCliente']) ? (int)$fila['IdCliente'] : null
        ], 201);
        break;

    case 'PUT':
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if ($id <= 0) {
            Respuesta::json("error", "Debe proporcionar el ID del cliente (?id=X).", [], 400);
        }
        $b = Respuesta::leerBody();
        if (!isset($b['nombre'], $b['email'])) {
            Respuesta::json("error", "El nombre y el email son obligatorios.", [], 400);
        }
        // orden: id_cliente, nombre, apellido, telefono, email, direccion, nit, tipo_cliente
        $tsql = "{call sp_actualizar_cliente(?, ?, ?, ?, ?, ?, ?, ?)}";
        $params = [
            $id,
            trim($b['nombre']),
            isset($b['apellido']) ? trim($b['apellido']) : '',
            isset($b['telefono']) ? trim($b['telefono']) : '',
            trim($b['email']),
            isset($b['direccion']) ? trim($b['direccion']) : '',
            isset($b['nit']) ? trim($b['nit']) : 'CF',
            isset($b['tipo_cliente']) ? trim($b['tipo_cliente']) : 'regular'
        ];
        $fila = ejecutarSP($conn, $tsql, $params);
        if ($fila && isset($fila['Error'])) {
            Respuesta::json("error_negocio", $fila['Error'], [], 422);
        }
        Respuesta::json("success", $fila['Mensaje'] ?? "Cliente actualizado.", [], 200);
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if ($id <= 0) {
            Respuesta::json("error", "Debe proporcionar el ID del cliente (?id=X).", [], 400);
        }
        $fila = ejecutarSP($conn, "{call sp_desactivar_cliente(?)}", [$id]);
        if ($fila && isset($fila['Error'])) {
            Respuesta::json("error_negocio", $fila['Error'], [], 422);
        }
        Respuesta::json("success", $fila['Mensaje'] ?? "Cliente desactivado.", [], 200);
        break;

    default:
        Respuesta::json("error", "Metodo HTTP no permitido.", [], 405);
        break;
}

sqlsrv_close($conn);
?>
