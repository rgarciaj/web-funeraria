/* Funeraria Jesús Te Espera — interacciones */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Menú móvil ---------- */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");

  burger.addEventListener("click", function () {
    var abierto = nav.classList.toggle("abierto");
    burger.setAttribute("aria-expanded", abierto ? "true" : "false");
  });

  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      nav.classList.remove("abierto");
      burger.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- Sombra del header al hacer scroll ---------- */
  var header = document.getElementById("header");
  var nubes = document.querySelector(".hero__nubes");
  var ticking = false;

  function alScroll() {
    header.classList.toggle("con-sombra", window.scrollY > 10);
    if (nubes && !reduceMotion) {
      var y = Math.min(window.scrollY, 900);
      nubes.style.transform = "translateY(" + y * 0.25 + "px)";
    }
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(alScroll);
      ticking = true;
    }
  }, { passive: true });

  /* ---------- Aparición de elementos al hacer scroll ---------- */
  var revelables = document.querySelectorAll(".revelar");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("visible");
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revelables.forEach(function (el) { observador.observe(el); });
  } else {
    revelables.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Filtro de urnas ---------- */
  var filtros = document.querySelectorAll(".filtro");
  var planes = document.querySelectorAll(".plan");

  filtros.forEach(function (boton) {
    boton.addEventListener("click", function () {
      filtros.forEach(function (b) { b.classList.remove("activo"); });
      boton.classList.add("activo");
      var clave = boton.dataset.filtro;
      planes.forEach(function (plan) {
        var mostrar = clave === "todas" || plan.dataset.linea === clave;
        plan.classList.toggle("oculto", !mostrar);
      });
    });
  });

  /* ---------- Lightbox de urnas ---------- */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxCaption = document.getElementById("lightboxCaption");
  var lightboxCerrar = document.getElementById("lightboxCerrar");

  planes.forEach(function (plan) {
    plan.addEventListener("click", function () {
      var img = plan.querySelector("img");
      var nombre = plan.querySelector("h3").textContent;
      var linea = plan.querySelector(".plan__linea").textContent;
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightboxCaption.textContent = linea + " — " + nombre;
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
    });
  });

  function cerrarLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
  }

  lightboxCerrar.addEventListener("click", cerrarLightbox);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) cerrarLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !lightbox.hidden) cerrarLightbox();
  });

  /* ---------- Opiniones de Google ----------
     1º assets/opiniones.json (generado con tools/actualizar-opiniones.sh)
     2º php/reviews.php (Google Places API, si está configurada)
     3º ejemplos de respaldo */

  var EJEMPLOS = [
    {
      author_name: "María González",
      rating: 5,
      relative_time_description: "hace 2 meses",
      text: "Excelente atención en un momento muy difícil para nuestra familia. Se preocuparon de cada detalle y nos acompañaron en todo el proceso. Muy agradecidos."
    },
    {
      author_name: "Carlos Fuentes",
      rating: 5,
      relative_time_description: "hace 5 meses",
      text: "Un servicio serio y respetuoso. Nos ayudaron con todos los trámites de la cuota mortuoria y estuvieron disponibles a toda hora. Los recomiendo totalmente."
    },
    {
      author_name: "Ana Riquelme",
      rating: 5,
      relative_time_description: "hace 8 meses",
      text: "Gracias por la dedicación y el cariño con que atendieron a nuestra familia. Todo impecable, desde el velatorio hasta el último detalle."
    }
  ];

  var opinionesGrid = document.getElementById("opinionesGrid");
  var opinionesNota = document.getElementById("opinionesNota");
  var opinionesAviso = document.getElementById("opinionesAviso");

  function pintarOpiniones(datos, esDemo) {
    var reviews = (datos.reviews || []).filter(function (r) { return r.text; });
    opinionesGrid.innerHTML = "";

    if (datos.rating) {
      opinionesNota.textContent = datos.rating.toFixed(1) + " / 5 — " +
        (datos.total ? datos.total + " opiniones en Google" : "Opiniones en Google");
    }

    reviews.forEach(function (r) {
      var articulo = document.createElement("article");
      articulo.className = "opinion";
      var estrellas = "★★★★★".slice(0, r.rating) + "☆☆☆☆☆".slice(0, 5 - r.rating);
      articulo.innerHTML =
        '<p class="opinion__estrellas" aria-label="' + r.rating + ' de 5 estrellas">' + estrellas + "</p>" +
        '<blockquote class="opinion__texto"></blockquote>' +
        '<p class="opinion__autor"><span class="opinion__inicial"></span><span><strong></strong><small></small></span></p>';
      articulo.querySelector(".opinion__texto").textContent = r.text;
      articulo.querySelector(".opinion__inicial").textContent = (r.author_name || "?").charAt(0).toUpperCase();
      articulo.querySelector("strong").textContent = r.author_name || "Anónimo";
      articulo.querySelector("small").textContent = r.relative_time_description || "";
      opinionesGrid.appendChild(articulo);
    });

    opinionesAviso.hidden = !esDemo;
  }

  fetch("assets/opiniones.json")
    .then(function (res) {
      if (!res.ok) throw new Error("sin archivo");
      return res.json();
    })
    .then(function (datos) { pintarOpiniones(datos, false); })
    .catch(function () {
      fetch("php/reviews.php")
        .then(function (res) {
          if (!res.ok || res.status === 204) throw new Error("sin API");
          return res.json();
        })
        .then(function (datos) { pintarOpiniones(datos, false); })
        .catch(function () { pintarOpiniones({ reviews: EJEMPLOS }, true); });
    });

  /* Flechas del carrusel */
  var paso = 362; // ancho de tarjeta + separación
  document.getElementById("opPrev").addEventListener("click", function () {
    opinionesGrid.scrollBy({ left: -paso, behavior: "smooth" });
  });
  document.getElementById("opNext").addEventListener("click", function () {
    opinionesGrid.scrollBy({ left: paso, behavior: "smooth" });
  });

  /* ---------- Formulario de contacto ---------- */
  var form = document.getElementById("formContacto");
  var estado = document.getElementById("formEstado");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    estado.className = "formulario__estado";
    estado.textContent = "Enviando…";

    var boton = form.querySelector(".formulario__enviar");
    boton.disabled = true;

    fetch(form.action, { method: "POST", body: new FormData(form) })
      .then(function (res) { return res.json(); })
      .then(function (r) {
        if (r.ok) {
          estado.classList.add("ok");
          estado.textContent = "Mensaje enviado. Le contactaremos a la brevedad, gracias.";
          form.reset();
        } else {
          throw new Error(r.error || "error");
        }
      })
      .catch(function () {
        estado.classList.add("error");
        estado.textContent = "No se pudo enviar el mensaje. Por favor llámenos al +56 2 2554 0370.";
      })
      .finally(function () { boton.disabled = false; });
  });

  /* ---------- Año del pie ---------- */
  document.getElementById("anio").textContent = new Date().getFullYear();
})();
