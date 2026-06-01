<?php
// backend/api/login.php
require_once __DIR__ . '/../lib/respuesta.php';
require_once __DIR__ . '/../config/db.php';

Respuesta::inicializarAPI();

$body = Respuesta::leerBody();
$emailInput = isset($body['email']) ? trim($body['email']) : '';
$passInput = isset($body['contrasena']) ? trim($body['contrasena']) : '';

if (empty($emailInput) || empty($passInput)) {
    Respuesta::json("error", "Por favor, complete todos los campos.", [], 400);
}

$conn = DB::conectar();

$tsql = "{call sp_login(?, ?)}";
$params = array($emailInput, $passInput);
$stmt = sqlsrv_query($conn, $tsql, $params);

if ($stmt === false) {
    Respuesta::json("error", "Error critico en el servidor de base de datos.", ["errors" => sqlsrv_errors()], 500);
}

// recorrer TODOS los conjuntos de resultados (el insert en bitacora del SP
// dispara el trigger de auditoria, que genera resultados intermedios) y
// quedarnos con la fila que traiga Mensaje o Error (la respuesta real del SP)
$row = null;
do {
    $fila = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
    if ($fila !== null && (isset($fila['Mensaje']) || isset($fila['Error']))) {
        $row = $fila;
        break;
    }
} while (sqlsrv_next_result($stmt));

if ($row) {

    // si el SP devolvio columna Error, las credenciales fallaron
    if (isset($row['Error'])) {
        Respuesta::json("error", $row['Error'], ["error_number" => $row['NumeroError'] ?? null], 401);
    }

    // exito: armar los datos del usuario
    $dataUsuario = array(
        "usuario" => array(
            "id" => $row['id_usuario'],
            "nombre" => $row['nombre'] . " " . $row['apellido'],
            "email" => $row['email'],
            "id_rol" => $row['id_rol'],
            "rol" => $row['Rol'],
            "ultimo_acceso" => $row['ultimo_acceso']
        )
    );

    Respuesta::json("success", $row['Mensaje'], $dataUsuario, 200);

} else {
    Respuesta::json("error", "No se recibio respuesta del procedimiento de autenticacion.", [], 500);
}

sqlsrv_free_stmt($stmt);
sqlsrv_close($conn);