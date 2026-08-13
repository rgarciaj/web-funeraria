<?php
/**
 * Opiniones de Google — Funeraria Jesús Te Espera
 *
 * Consulta la API de Google Places (Place Details) desde el servidor,
 * guarda el resultado en caché por 12 horas y lo entrega al sitio como JSON.
 *
 * CÓMO ACTIVARLO:
 * 1. Crear un proyecto en https://console.cloud.google.com
 * 2. Habilitar "Places API" y crear una clave de API (restringirla a Places API
 *    y, opcionalmente, a la IP del servidor).
 * 3. Obtener el Place ID del negocio en:
 *    https://developers.google.com/maps/documentation/places/web-service/place-id
 *    (buscar "Funeraria Jesús Te Espera, Carmen 1590, Santiago")
 * 4. Completar las dos constantes de abajo.
 *
 * Mientras API_KEY esté vacío, el sitio muestra opiniones de ejemplo.
 * Nota: Google entrega un máximo de 5 opiniones ("las más relevantes").
 */

// ===== Configuración =====
const API_KEY  = '';           // ej: 'AIzaSy...'
const PLACE_ID = '';           // ej: 'ChIJPbi6ImnFYpYRjTNZ_jV5bzA'
const CACHE_HORAS = 12;
// =========================

header('Content-Type: application/json; charset=utf-8');

if (API_KEY === '' || PLACE_ID === '') {
    http_response_code(204); // sin contenido: el sitio usará los ejemplos
    exit;
}

$cacheFile = __DIR__ . '/../cache/reviews.json';

// Entregar caché vigente
if (is_file($cacheFile) && (time() - filemtime($cacheFile)) < CACHE_HORAS * 3600) {
    readfile($cacheFile);
    exit;
}

$url = 'https://maps.googleapis.com/maps/api/place/details/json'
     . '?place_id=' . urlencode(PLACE_ID)
     . '&fields=rating,user_ratings_total,reviews'
     . '&language=es&reviews_sort=newest'
     . '&key=' . urlencode(API_KEY);

$respuesta = @file_get_contents($url);
$datos = $respuesta ? json_decode($respuesta, true) : null;

if (!$datos || ($datos['status'] ?? '') !== 'OK') {
    // Si falla la API pero hay caché antigua, usarla igual
    if (is_file($cacheFile)) { readfile($cacheFile); exit; }
    http_response_code(204);
    exit;
}

$resultado = $datos['result'];
$salida = [
    'rating'  => $resultado['rating'] ?? null,
    'total'   => $resultado['user_ratings_total'] ?? null,
    'reviews' => array_map(function ($r) {
        return [
            'author_name' => $r['author_name'] ?? '',
            'rating' => $r['rating'] ?? 5,
            'relative_time_description' => $r['relative_time_description'] ?? '',
            'text' => $r['text'] ?? '',
        ];
    }, array_values(array_filter($resultado['reviews'] ?? [], function ($r) {
        return ($r['rating'] ?? 0) >= 4 && trim($r['text'] ?? '') !== '';
    }))),
];

$json = json_encode($salida, JSON_UNESCAPED_UNICODE);
@file_put_contents($cacheFile, $json);
echo $json;
