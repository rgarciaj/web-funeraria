#!/usr/bin/env python3
"""
Trae las opiniones más recientes de Google Maps de Funeraria Jesús Te Espera
y las combina con las ya guardadas en assets/opiniones.json (el sitio las lee
con JavaScript). Sin iniciar sesión, Google muestra solo 5 reseñas por cada
orden, por eso no se puede descargar el listado completo: las reseñas que ya
estaban se conservan.

Uso:
    ./tools/actualizar-opiniones.sh          # recomendado (crea el entorno solo)
o bien:
    python3 tools/actualizar_opiniones.py

Después de ejecutarlo: revisar el JSON, y subir con git push (o FTP).
"""

import json
import re
import sys
import time
from pathlib import Path

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.chrome.options import Options
except ImportError:
    sys.exit("Falta selenium. Ejecuta:  ./tools/actualizar-opiniones.sh")

URL_LUGAR = "https://www.google.com/maps?cid=3490141509042910093&hl=es"
SALIDA = Path(__file__).resolve().parent.parent / "assets" / "opiniones.json"

def iniciar_navegador(visible: bool) -> webdriver.Chrome:
    opciones = Options()
    if not visible:
        opciones.add_argument("--headless=new")
    opciones.add_argument("--window-size=1280,1200")
    opciones.add_argument("--lang=es-419")
    opciones.add_argument("--disable-blink-features=AutomationControlled")
    # UA normal: sin esto Google sirve una "vista limitada" con menos reseñas
    opciones.add_argument(
        "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36"
    )
    return webdriver.Chrome(options=opciones)


def aceptar_consentimiento(driver):
    """Si Google muestra pantalla de consentimiento, rechazar/aceptar para continuar."""
    for texto in ("Rechazar todo", "Aceptar todo", "Reject all", "Accept all"):
        botones = driver.find_elements(By.XPATH, f'//button[.//span[text()="{texto}"]]')
        if botones:
            botones[0].click()
            time.sleep(2)
            return


def abrir_pestana_resenas(driver):
    """Abre la pestaña 'Reseñas' de la ficha del lugar."""
    for _ in range(10):
        for tab in driver.find_elements(By.CSS_SELECTOR, 'button[role="tab"]'):
            etiqueta = tab.get_attribute("aria-label") or ""
            if "Reseñas" in etiqueta or "Opiniones" in etiqueta or "Reviews" in etiqueta:
                tab.click()
                time.sleep(4)
                return True
        time.sleep(2)
    return False


def total_esperado(driver):
    """Cuántas reseñas declara Google en el encabezado (0 si no se encuentra)."""
    m = re.search(r"(\d+)\s*reseñas", driver.page_source)
    return int(m.group(1)) if m else 0


def ordenar_por_recientes(driver):
    """Cambia el orden del listado a 'Más recientes'."""
    driver.execute_script(
        "arguments[0].click()",
        driver.find_element(By.XPATH, '//button[@aria-label="Ordenar reseñas"]'),
    )
    time.sleep(2)
    for opcion in driver.find_elements(By.CSS_SELECTOR, '[role="menuitemradio"]'):
        if "reciente" in opcion.text.lower():
            driver.execute_script("arguments[0].click()", opcion)
            time.sleep(5)
            return True
    return False


def expandir_textos(driver):
    """Pulsa todos los botones 'Más' para obtener el texto completo."""
    for boton in driver.find_elements(
        By.XPATH, '//button[@aria-label="Ver más" or text()="Más" or text()="More"]'
    ):
        try:
            driver.execute_script("arguments[0].click()", boton)
        except Exception:
            pass
    time.sleep(1)


def extraer(driver):
    resenas, vistos = [], set()
    for tarjeta in driver.find_elements(By.CSS_SELECTOR, "div[data-review-id]"):
        rid = tarjeta.get_attribute("data-review-id")
        if not rid or rid in vistos:
            continue
        vistos.add(rid)
        try:
            autor = tarjeta.get_attribute("aria-label") or ""
            if not autor:
                autor = tarjeta.find_element(By.CSS_SELECTOR, "div.d4r55").text
        except Exception:
            autor = ""
        estrellas = 0
        try:
            aria = tarjeta.find_element(
                By.CSS_SELECTOR, 'span[role="img"]'
            ).get_attribute("aria-label") or ""
            m = re.search(r"(\d+)", aria)
            estrellas = int(m.group(1)) if m else 0
        except Exception:
            pass
        try:
            fecha = tarjeta.find_element(By.CSS_SELECTOR, "span.rsqaWe").text
        except Exception:
            fecha = ""
        try:
            texto = tarjeta.find_element(By.CSS_SELECTOR, "span.wiI7pd").text
        except Exception:
            texto = ""
        if autor and (texto or estrellas):
            resenas.append(
                {
                    "author_name": autor.strip(),
                    "rating": estrellas,
                    "relative_time_description": fecha,
                    "text": texto.strip(),
                }
            )
    return resenas


def combinar(nuevas, guardadas):
    """Las reseñas leídas ahora van primero; las demás guardadas se mantienen."""
    combinadas = {}
    for resena in nuevas + guardadas:
        combinadas.setdefault(resena["author_name"], resena)
    return list(combinadas.values())


def nota_global(driver):
    try:
        texto = driver.find_element(By.CSS_SELECTOR, "div.fontDisplayLarge").text
        return float(texto.replace(",", "."))
    except Exception:
        return None


def main():
    visible = "--visible" in sys.argv
    print("Abriendo Google Maps…")
    driver = iniciar_navegador(visible)
    try:
        driver.get(URL_LUGAR)
        time.sleep(8)
        aceptar_consentimiento(driver)

        if not abrir_pestana_resenas(driver):
            sys.exit("No apareció la pestaña de reseñas. Prueba con --visible")

        print("Leyendo las reseñas…")
        expandir_textos(driver)
        utiles = extraer(driver)
        if not ordenar_por_recientes(driver):
            sys.exit("No se pudo ordenar por 'Más recientes'. Prueba con --visible")
        expandir_textos(driver)
        recientes = extraer(driver)
        if not recientes:
            sys.exit("No se extrajo ninguna reseña. Google pudo cambiar el diseño.")

        guardadas = json.loads(SALIDA.read_text(encoding="utf-8"))["reviews"]
        resenas = combinar(recientes + utiles, guardadas)
        conocidas = {r["author_name"] for r in guardadas}
        nuevas = [r["author_name"] for r in resenas if r["author_name"] not in conocidas]

        datos = {
            "rating": nota_global(driver),
            "total": max(total_esperado(driver), len(resenas)),
            "actualizado": time.strftime("%Y-%m-%d"),
            "reviews": resenas,
        }
        SALIDA.write_text(
            json.dumps(datos, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"\nListo: {len(resenas)} reseñas guardadas en {SALIDA}")
        print(f"Nuevas: {', '.join(nuevas) or 'ninguna'}")
        print("Revisa el archivo y luego: git add -A && git commit -m 'Actualiza opiniones' && git push")
    finally:
        driver.quit()


if __name__ == "__main__":
    main()
