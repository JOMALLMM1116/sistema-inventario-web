<?php
// backend/api/login.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once __DIR__ . '/../config/db.php';
$db = DB::conectar();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['usuario'], $data['password'])) {
        echo json_encode(["status" => "error", "message" => "Credenciales incompletas."]);
        exit;
    }

    $usuario = $data['usuario'];
    $password = $data['password'];

    $tsql = "{call sp_login(?, ?)}";
    $params = [
        [$usuario, SQLSRV_PARAM_IN],
        [$password, SQLSRV_PARAM_IN]
    ];

    $stmt = sqlsrv_query($db, $tsql, $params);
    if ($stmt === false) {
        echo json_encode(["status" => "error", "message" => "Error de autenticación.", "errors" => sqlsrv_errors()]);
        exit;
    }

    $respuesta = null;
    while ($fila = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $respuesta = $fila; // Tu SP devuelve columnas como id_usuario, nombre, rol, etc.
    }

    if ($respuesta) {
        echo json_encode([
            "status" => "success",
            "message" => "Acceso concedido",
            "usuario" => $respuesta
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Usuario o contraseña incorrectos."]);
    }

    sqlsrv_free_stmt($stmt);
}
?>