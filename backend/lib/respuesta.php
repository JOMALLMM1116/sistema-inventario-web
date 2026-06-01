<?php
// backend/lib/respuesta.php

class Respuesta {
    // Configura los encabezados CORS para cualquier petición de la API
    public static function inicializarAPI() {
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Headers: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
        
        ob_clean(); // Limpia cualquier salida basura o espacios en blanco
    }

    // Retorna el body recibido en JSON parseado a un array de PHP
    public static function leerBody() {
        return json_decode(file_get_contents("php://input"), true) ?? [];
    }

    // Método estándar para responder con éxito o error en formato JSON
    public static function json($status, $message, $datos = [], $codigoHTTP = 200) {
        http_response_code($codigoHTTP);
        $respuesta = array(
            "status" => $status,
            "message" => $message
        );
        
        if (!empty($datos)) {
            $respuesta = array_merge($respuesta, $datos);
        }

        echo json_encode($respuesta);
        exit();
    }
}