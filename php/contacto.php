<?php
/**
 * Formulario de contacto — Funeraria Jesús Te Espera
 * Recibe POST (nombre, telefono, email, mensaje) y envía correo.
 * Responde JSON: {"ok": true} o {"ok": false, "error": "..."}
 */

// ===== Configuración =====
$DESTINATARIOS = ['rosaillesca@jesusteespera.cl', 'felipedanyan@jesusteespera.cl'];
$REMITENTE     = 'sitio@jesusteespera.cl'; // debe ser un correo del mismo dominio
$ASUNTO        = 'Nuevo mensaje desde jesusteespera.cl';
// =========================

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
    exit;
}

// Honeypot: si el campo oculto "empresa" viene lleno, es un bot.
if (!empty($_POST['empresa'])) {
    echo json_encode(['ok' => true]); // respuesta silenciosa
    exit;
}

$nombre   = trim($_POST['nombre'] ?? '');
$telefono = trim($_POST['telefono'] ?? '');
$email    = trim($_POST['email'] ?? '');
$mensaje  = trim($_POST['mensaje'] ?? '');

if ($nombre === '' || $telefono === '' || $mensaje === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Complete los campos requeridos']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Email inválido']);
    exit;
}

// Evitar inyección de cabeceras
$nombre = str_replace(["\r", "\n"], ' ', $nombre);
$email  = str_replace(["\r", "\n"], '', $email);

$cuerpo = "Nuevo mensaje desde el sitio web\n"
        . "--------------------------------\n"
        . "Nombre:   $nombre\n"
        . "Teléfono: $telefono\n"
        . "Email:    $email\n"
        . "--------------------------------\n\n"
        . $mensaje . "\n";

$cabeceras = "From: Funeraria Jesús Te Espera <$REMITENTE>\r\n"
           . "Reply-To: $nombre <$email>\r\n"
           . "MIME-Version: 1.0\r\n"
           . "Content-Type: text/plain; charset=UTF-8\r\n";

$enviado = mail(implode(',', $DESTINATARIOS), '=?UTF-8?B?' . base64_encode($ASUNTO) . '?=', $cuerpo, $cabeceras);

if ($enviado) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'No se pudo enviar el correo']);
}
