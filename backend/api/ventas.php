<?php
// backend/api/ventas.php
// POST registra venta via sp_registrar_venta con TVP.
// El TVP se pasa como ["tipo_detalle_venta" => filas], nombre del tipo como clave.

require_once __DIR__ . '/../lib/respuesta.php';
require_once __DIR__ . '/../config/db.php';

Respuesta::inicializarAPI();
$conn = DB::conectar();
$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {

    case 'GET':
        $tsql = "SELECT v.id_venta, v.fecha_venta, v.subtotal, v.descuento, v.total,
                        v.metodo_pago, v.estado,
                        (c.nombre + ' ' + c.apellido) AS cliente_nombre,
                        (u.nombre + ' ' + u.apellido) AS usuario_nombre
                 FROM venta v
                 INNER JOIN cliente c ON v.id_cliente = c.id_cliente
                 INNER JOIN usuario u ON v.id_usuario = u.id_usuario
                 ORDER BY v.id_venta DESC";
        $stmt = sqlsrv_query($conn, $tsql);
        if ($stmt === false) {
            Respuesta::json("error", "Error al consultar ventas.", ["errors" => sqlsrv_errors()], 500);
        }
        $ventas = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $ventas[] = $row;
        }
        sqlsrv_free_stmt($stmt);
        Respuesta::json("success", "Historial de ventas obtenido.", ["ventas" => $ventas], 200);
        break;

    case 'POST':
        $b = Respuesta::leerBody();
        $id_cliente  = $b['id_cliente'] ?? null;
        $id_usuario  = $b['id_usuario'] ?? null;
        $metodo_pago = $b['metodo_pago'] ?? null;
        $productos   = $b['productos'] ?? null;

        if (!$id_cliente || !$id_usuario || !$metodo_pago || empty($productos) || !is_array($productos)) {
            Respuesta::json("error", "Datos incompletos.", [], 400);
        }

        $filas = [];
        foreach ($productos as $p) {
            $filas[] = [
                (int)($p['id_producto'] ?? 0),
                (int)($p['cantidad'] ?? 0),
                (float)($p['descuento'] ?? 0)
            ];
        }
        $tvp = ["tipo_detalle_venta" => $filas];

        $tsql = "{call sp_registrar_venta(?, ?, ?, ?)}";
        $params = [
            [$id_cliente, SQLSRV_PARAM_IN],
            [$id_usuario, SQLSRV_PARAM_IN],
            [$metodo_pago, SQLSRV_PARAM_IN],
            [$tvp, SQLSRV_PARAM_IN]
        ];

        $stmt = sqlsrv_query($conn, $tsql, $params);
        if ($stmt === false) {
            Respuesta::json("error", "Error critico al registrar la venta.", ["errors" => sqlsrv_errors()], 500);
        }

        // recorrer TODOS los conjuntos de resultados (los triggers generan varios)
        // y quedarnos con la fila que traiga Mensaje o Error (el SELECT final del SP)
        $resultado = null;
        do {
            $fila = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
            if ($fila !== null && (isset($fila['Mensaje']) || isset($fila['Error']))) {
                $resultado = $fila;
                break;
            }
        } while (sqlsrv_next_result($stmt));

        if ($resultado && isset($resultado['Error'])) {
            Respuesta::json("error_negocio", $resultado['Error'], [], 422);
        }
        if ($resultado) {
            Respuesta::json("success", $resultado['Mensaje'] ?? "Venta registrada", [
                "id_venta" => isset($resultado['IdVenta']) ? (int)$resultado['IdVenta'] : null,
                "total"    => isset($resultado['Total']) ? (float)$resultado['Total'] : 0.0
            ], 201);
        } else {
            Respuesta::json("error", "No se recibio respuesta del procedimiento de venta.", [], 500);
        }
        sqlsrv_free_stmt($stmt);
        break;

    default:
        Respuesta::json("error", "Metodo HTTP no permitido.", [], 405);
        break;
}

sqlsrv_close($conn);