<?php
// ============================================================================
// ENDPOINT: backend/api/compras.php
// Proposito: Registrar transacciones de compras enviando los datos al TVP de SQL
// Invoca: sp_registrar_compra (Script 10) usando la extension sqlsrv nativa
// Soporta: Triggers de auditoria JSON activos (Script 13)
// ============================================================================
// NOTA: el TVP se pasa con la estructura que documenta Microsoft y que probamos:
//   array("tipo_detalle_compra" => array( [id_producto, cantidad, precio_unitario], ... ))
// el NOMBRE DEL TIPO va como clave del array, y como parametro solo
// array($tvp, SQLSRV_PARAM_IN). El driver detecta el tipo desde la clave.

require_once __DIR__ . '/../lib/respuesta.php';
require_once __DIR__ . '/../config/db.php';

Respuesta::inicializarAPI();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Respuesta::json("error", "Metodo no permitido. Use POST para registrar compras.", [], 405);
}

$data = Respuesta::leerBody();

$id_proveedor  = $data['id_proveedor'] ?? null;
$id_usuario    = $data['id_usuario'] ?? null;
$observaciones = $data['observaciones'] ?? 'Compra registrada desde API Web';
$productos     = $data['productos'] ?? null;

if (!$id_usuario || !$id_proveedor || empty($productos) || !is_array($productos)) {
    Respuesta::json("error", "Datos de peticion malformados. Se requiere id_usuario, id_proveedor y el listado de productos.", [], 400);
}

$conn = DB::conectar();

// armar las filas del detalle: [id_producto, cantidad, precio_unitario]
$filas = [];
foreach ($productos as $p) {
    $filas[] = [
        (int)($p['id_producto'] ?? 0),
        (int)($p['cantidad'] ?? 0),
        (float)($p['precio_unitario'] ?? 0)
    ];
}

// estructura correcta del TVP: nombre del tipo como clave
$tvp = ["tipo_detalle_compra" => $filas];

// orden del SP: @id_proveedor, @id_usuario, @observaciones, @detalle (TVP)
$tsql = "{call sp_registrar_compra(?, ?, ?, ?)}";
$params = [
    [$id_proveedor, SQLSRV_PARAM_IN],
    [$id_usuario, SQLSRV_PARAM_IN],
    [$observaciones, SQLSRV_PARAM_IN],
    [$tvp, SQLSRV_PARAM_IN]
];

$stmt = sqlsrv_query($conn, $tsql, $params);

if ($stmt === false) {
    Respuesta::json("error", "Error critico en el servidor de base de datos al preparar la compra.", ["errors" => sqlsrv_errors()], 500);
}

// recorrer todos los conjuntos de resultados (los triggers generan varios)
// y quedarnos con la fila que traiga Mensaje o Error
$resultado = null;
do {
    $fila = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
    if ($fila !== null && (isset($fila['Mensaje']) || isset($fila['Error']))) {
        $resultado = $fila;
        break;
    }
} while (sqlsrv_next_result($stmt));

if ($resultado) {

    if (isset($resultado['Error'])) {
        Respuesta::json("error_negocio", $resultado['Error'], ["codigo_sql" => $resultado['NumeroError'] ?? null], 422);
    }

    $payloadExito = [
        "id_compra" => isset($resultado['IdCompra']) ? (int)$resultado['IdCompra'] : null,
        "total"     => isset($resultado['Total']) ? (float)$resultado['Total'] : 0.0
    ];

    Respuesta::json("success", $resultado['Mensaje'] ?? "Compra registrada correctamente", $payloadExito, 201);

} else {
    Respuesta::json("error", "No se recibio respuesta estructurada del procedimiento transaccional.", [], 500);
}

sqlsrv_free_stmt($stmt);
sqlsrv_close($conn);
?>