<?php
// backend/api/olap.php
// Analisis OLAP (multidimensional) sobre el Data Warehouse (esquema estrella).
// Hace agregaciones de la tabla de hechos dw_hecho_ventas cruzada con las
// dimensiones. Es el clasico "slice and dice": se elige una dimension y se
// agregan las medidas (monto, ganancia, cantidad) por esa dimension.
//
// GET ?dimension=tiempo|categoria|vendedor|cliente
//     devuelve las medidas agregadas por la dimension elegida.

require_once __DIR__ . '/../lib/respuesta.php';
require_once __DIR__ . '/../config/db.php';

Respuesta::inicializarAPI();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Respuesta::json("error", "Metodo no permitido.", [], 405);
}

$dimension = isset($_GET['dimension']) ? $_GET['dimension'] : 'categoria';

// segun la dimension elegida, se arma el group by sobre la columna
// correspondiente de la dimension. (whitelist para evitar inyeccion)
switch ($dimension) {
    case 'tiempo':
        // por trimestre y anio (roll up temporal)
        $select = "t.anio AS etiqueta_anio, t.trimestre,
                   ('Q' + cast(t.trimestre as varchar) + ' ' + cast(t.anio as varchar)) AS etiqueta";
        $join = "INNER JOIN dw_dim_tiempo t ON h.id_tiempo = t.id_tiempo";
        $group = "GROUP BY t.anio, t.trimestre ORDER BY t.anio, t.trimestre";
        break;
    case 'vendedor':
        $select = "v.nombre_completo AS etiqueta";
        $join = "INNER JOIN dw_dim_vendedor v ON h.id_dim_vendedor = v.id_dim_vendedor";
        $group = "GROUP BY v.nombre_completo ORDER BY sum(h.monto_venta) DESC";
        break;
    case 'cliente':
        $select = "c.nombre_completo AS etiqueta";
        $join = "INNER JOIN dw_dim_cliente c ON h.id_dim_cliente = c.id_dim_cliente";
        $group = "GROUP BY c.nombre_completo ORDER BY sum(h.monto_venta) DESC";
        break;
    case 'categoria':
    default:
        $select = "p.nombre_categoria AS etiqueta";
        $join = "INNER JOIN dw_dim_producto p ON h.id_dim_producto = p.id_dim_producto";
        $group = "GROUP BY p.nombre_categoria ORDER BY sum(h.monto_venta) DESC";
        break;
}

// las medidas (los numeros que se agregan): los hechos del DW
$tsql = "SELECT $select,
                sum(h.cantidad) AS unidades,
                sum(h.monto_venta) AS monto,
                sum(h.ganancia) AS ganancia
         FROM dw_hecho_ventas h
         $join
         $group";

$conn = DB::conectar();
$stmt = sqlsrv_query($conn, $tsql);
if ($stmt === false) {
    Respuesta::json("error", "Error al consultar el cubo OLAP.", ["errors" => sqlsrv_errors()], 500);
}

$filas = [];
while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    $filas[] = [
        "etiqueta" => $row['etiqueta'],
        "unidades" => (int)$row['unidades'],
        "monto" => (float)$row['monto'],
        "ganancia" => (float)$row['ganancia'],
    ];
}
sqlsrv_free_stmt($stmt);
sqlsrv_close($conn);

Respuesta::json("success", "Cubo OLAP consultado.", [
    "dimension" => $dimension,
    "datos" => $filas,
], 200);
?>
