<?php
// backend/api/prediccion.php
// GET  -> lee las predicciones guardadas (sp_consultar_predicciones)
// POST -> ejecuta el script Python que entrena el modelo y genera una
//         prediccion nueva, luego devuelve el resultado.
//
// La IA: Python (scikit-learn) calcula; SQL guarda. Este endpoint es el puente.
// Solo gerencia/admin deberia predecir (el SP valida el rol).

require_once __DIR__ . '/../lib/respuesta.php';
require_once __DIR__ . '/../config/db.php';

Respuesta::inicializarAPI();
$metodo = $_SERVER['REQUEST_METHOD'];

// ============================================================
// POST: generar una prediccion nueva (corre el script Python)
// ============================================================
if ($metodo === 'POST') {
    $b = Respuesta::leerBody();
    $id_usuario = isset($b['id_usuario']) ? intval($b['id_usuario']) : 0;
    if ($id_usuario <= 0) {
        Respuesta::json("error", "Se requiere id_usuario.", [], 400);
    }

    // ruta al script python (esta en backend/ia/)
    $script = __DIR__ . '/../ia/prediccion_ventas.py';
    if (!file_exists($script)) {
        Respuesta::json("error", "No se encontro el script de prediccion.", [], 500);
    }

    // ejecutar python. en Windows el ejecutable suele ser 'python'.
    // escapeshellarg protege los argumentos.
    $cmd = 'python ' . escapeshellarg($script) . ' ' . escapeshellarg((string)$id_usuario) . ' 2>&1';
    $salida = shell_exec($cmd);

    if ($salida === null) {
        Respuesta::json("error", "No se pudo ejecutar Python. Verifica que este en el PATH.", [], 500);
    }

    // el script imprime un JSON; tomar la ultima linea no vacia (por si hay warnings)
    $lineas = array_filter(array_map('trim', explode("\n", $salida)));
    $ultima = end($lineas);
    $resultado = json_decode($ultima, true);

    if (!is_array($resultado)) {
        Respuesta::json("error", "Respuesta inesperada del modelo.", ["salida" => $salida], 500);
    }
    if (isset($resultado['error'])) {
        Respuesta::json("error_negocio", $resultado['error'], [], 422);
    }

    Respuesta::json("success", "Prediccion generada.", $resultado, 200);
}

// ============================================================
// GET: leer las predicciones guardadas
// ============================================================
if ($metodo === 'GET') {
    $id_usuario = isset($_GET['id_usuario']) ? intval($_GET['id_usuario']) : 0;
    if ($id_usuario <= 0) {
        Respuesta::json("error", "Se requiere id_usuario.", [], 400);
    }

    $conn = DB::conectar();
    $stmt = sqlsrv_query($conn, "{call sp_consultar_predicciones(?)}", [$id_usuario]);
    if ($stmt === false) {
        Respuesta::json("error", "Error al consultar predicciones.", ["errors" => sqlsrv_errors()], 500);
    }

    $predicciones = [];
    do {
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            if (isset($row['Error'])) {
                sqlsrv_free_stmt($stmt);
                Respuesta::json("error_negocio", $row['Error'], [], 422);
            }
            if (isset($row['fecha_prediccion']) && $row['fecha_prediccion'] instanceof DateTime) {
                $row['fecha_prediccion'] = $row['fecha_prediccion']->format('Y-m-d H:i');
            }
            $predicciones[] = $row;
        }
    } while (sqlsrv_next_result($stmt));

    sqlsrv_free_stmt($stmt);
    sqlsrv_close($conn);

    Respuesta::json("success", "Predicciones obtenidas.", ["predicciones" => $predicciones], 200);
}

if (!in_array($metodo, ['GET', 'POST'])) {
    Respuesta::json("error", "Metodo no permitido.", [], 405);
}
?>
