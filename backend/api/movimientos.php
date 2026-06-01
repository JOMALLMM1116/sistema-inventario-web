<?php
// backend/api/movimientos.php
// GET  -> historial de movimientos (consulta de lectura, se queda como SELECT)
// POST -> ajuste de inventario usando sp_ajustar_inventario (script 17)
//
// Antes este POST reimplementaba a mano toda la logica del ajuste (leer stock,
// calcular, insertar movimiento, update, transaccion). Eso duplicaba lo que el SP
// ya hace y se saltaba el session_context de la auditoria y la validacion de rol.
// Ahora simplemente invoca el SP, que ademas levanta alerta si el stock queda bajo.
//
// Importante: sp_ajustar_inventario recibe el STOCK NUEVO (el valor final que debe
// quedar), no una cantidad a sumar/restar. El SP calcula la diferencia solo.

require_once __DIR__ . '/../lib/respuesta.php';
require_once __DIR__ . '/../config/db.php';

Respuesta::inicializarAPI();

$conn = DB::conectar();
$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {

    // ============================================================
    // GET: HISTORIAL DE MOVIMIENTOS (lectura)
    // ============================================================
    case 'GET':
        $tsql = "SELECT m.id_movimiento, m.tipo_movimiento, m.cantidad,
                        m.stock_antes, m.stock_despues, m.motivo,
                        m.tabla_origen, m.id_referencia, m.fecha_hora,
                        p.nombre AS producto_nombre, p.codigo AS producto_codigo,
                        (u.nombre + ' ' + u.apellido) AS usuario_nombre
                 FROM movimiento_inventario m
                 INNER JOIN producto p ON m.id_producto = p.id_producto
                 INNER JOIN usuario u ON m.id_usuario = u.id_usuario
                 ORDER BY m.id_movimiento DESC";

        $stmt = sqlsrv_query($conn, $tsql);
        if ($stmt === false) {
            Respuesta::json("error", "Error al consultar el historial de movimientos.", ["errors" => sqlsrv_errors()], 500);
        }
        $movimientos = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $movimientos[] = $row;
        }
        sqlsrv_free_stmt($stmt);
        Respuesta::json("success", "Historial de movimientos obtenido.", ["movimientos" => $movimientos], 200);
        break;

    // ============================================================
    // POST: AJUSTE DE INVENTARIO  ->  sp_ajustar_inventario
    // ============================================================
    case 'POST':
        $b = Respuesta::leerBody();

        // el SP necesita: id_usuario, id_producto, stock_nuevo, motivo
        if (!isset($b['id_usuario'], $b['id_producto'], $b['stock_nuevo'])) {
            Respuesta::json("error", "Faltan datos obligatorios (id_usuario, id_producto, stock_nuevo).", [], 400);
        }

        $motivo = isset($b['motivo']) && trim($b['motivo']) !== ''
                ? trim($b['motivo'])
                : 'Ajuste manual de inventario desde la web';

        $tsql = "{call sp_ajustar_inventario(?, ?, ?, ?)}";
        $params = [
            intval($b['id_usuario']),
            intval($b['id_producto']),
            intval($b['stock_nuevo']),
            $motivo
        ];

        $stmt = sqlsrv_query($conn, $tsql, $params);
        if ($stmt === false) {
            Respuesta::json("error", "Error al ejecutar el ajuste de inventario.", ["errors" => sqlsrv_errors()], 500);
        }

        // saltar resultados intermedios de los triggers hasta el SELECT final del SP
        $fila = null;
        do {
            $fila = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
            if ($fila !== null) break;
        } while (sqlsrv_next_result($stmt));
        sqlsrv_free_stmt($stmt);

        if ($fila && isset($fila['Error'])) {
            Respuesta::json("error_negocio", $fila['Error'], ["codigo_sql" => $fila['NumeroError'] ?? null], 422);
        }

        Respuesta::json("success", $fila['Mensaje'] ?? "Ajuste registrado.", [
            "stock_antes"  => isset($fila['StockAntes']) ? (int)$fila['StockAntes'] : null,
            "stock_nuevo"  => isset($fila['StockNuevo']) ? (int)$fila['StockNuevo'] : null,
            "diferencia"   => isset($fila['Diferencia']) ? (int)$fila['Diferencia'] : null
        ], 201);
        break;

    default:
        Respuesta::json("error", "Metodo HTTP no permitido.", [], 405);
        break;
}

sqlsrv_close($conn);
?>