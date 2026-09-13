/* Comportamiento de modales, navegación administrativa y atajo Escape. */
/*
=============================================================
CONTROL MODAL COTIZAR
=============================================================
*/
function abrirModalCotizar() {
  const modal = document.getElementById("modal-cotizador");
  if (!modal) return;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function cerrarModalCotizar() {
  const modal = document.getElementById("modal-cotizador");
  if (!modal) return;
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

/*
=============================================================
CONTROL DINÁMICO SEGÚN LA CATEGORÍA (COCINA VS OTROS)
=============================================================
*/
function actualizarCamposDinamicos() {
  const categoria = document.getElementById('cot-categoria').value;
  const contenedorMedidas = document.getElementById('contenedor-medidas-detalladas');
  const msgCocinaFoto = document.getElementById('msg-cocina-foto');
  const checkboxVisita = document.getElementById('cot-solicita-visita');

  if (categoria === 'Cocina') {
    contenedorMedidas.style.display = 'none';
    msgCocinaFoto.classList.remove('hidden');
    msgCocinaFoto.style.display = 'block';

    document.getElementById('cot-alto').value = '';
    document.getElementById('cot-largo').value = '';
    document.getElementById('cot-profundidad').value = '';
  } else {
    msgCocinaFoto.classList.add('hidden');
    msgCocinaFoto.style.display = 'none';

    if (!checkboxVisita.checked) {
      contenedorMedidas.style.display = 'block';
    }
  }
}

/*
=============================================================
CONTROL MANUAL DE VISITA TÉCNICA Y MEDIDAS
=============================================================
*/
function toggleVisitaMedidas() {
  const checkbox = document.getElementById('cot-solicita-visita');
  const contenedorMedidas = document.getElementById('contenedor-medidas-detalladas');
  const categoria = document.getElementById('cot-categoria').value;
  
  if (checkbox.checked) {
    contenedorMedidas.style.display = 'none';
    document.getElementById('cot-alto').value = '';
    document.getElementById('cot-largo').value = '';
    document.getElementById('cot-profundidad').value = '';
  } else {
    if (categoria !== 'Cocina') {
      contenedorMedidas.style.display = 'block';
    }
  }
}

/*
=============================================================
GEOLOCALIZACIÓN GPS
=============================================================
*/
function obtenerUbicacionGPS() {
  const inputUbicacion = document.getElementById('cot-ubicacion');
  
  if (!navigator.geolocation) {
    alert('Tu navegador no soporta geolocalización.');
    return;
  }

  inputUbicacion.value = 'Obteniendo ubicación GPS...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
      inputUbicacion.value = mapsLink;
    },
    (error) => {
      alert('No se pudo obtener la ubicación. Por favor escribe tu zona manualmente.');
      inputUbicacion.value = '';
    }
  );
}

function cerrarPopupConfirmacion() {
  document.getElementById('popup-confirmacion').classList.add('hidden');
}

/*
=============================================================
NAVEGACIÓN
=============================================================
*/

function irASeccion(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function irInicio() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/*
=============================================================
ADMIN
=============================================================
*/

function abrirModalAdmin() {
  const modal = document.getElementById("modal-admin");
  if (!modal) return;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function cerrarModalAdmin() {
  const modal = document.getElementById("modal-admin");
  if (!modal) return;
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

/*
=============================================================
NAVEGACIÓN INTERNA ADMIN (PESTAÑAS)
=============================================================
*/

function cambiarVistaAdmin(vista, botonSeleccionado) {
  if (typeof esAdmin !== "undefined" && !esAdmin) {
    return;
  }

  const botones = document.querySelectorAll('#admin-menu button');
  botones.forEach(btn => btn.classList.remove('active'));

  if (botonSeleccionado) {
    botonSeleccionado.classList.add('active');
  }

  document.getElementById('vista-proyectos').classList.add('hidden');
  document.getElementById('vista-ingresos').classList.add('hidden');
  document.getElementById('vista-portafolio').classList.add('hidden');

  document.getElementById('vista-' + vista).classList.remove('hidden');

  if (vista === 'ingresos' && typeof renderGestionIngresos === "function") {
    renderGestionIngresos();
  }

  if (vista === 'portafolio' && typeof cargarPortafolioAdmin === "function") {
    cargarPortafolioAdmin();
  }
}

/*
=============================================================
ESC PARA CERRAR PANELES
=============================================================
*/

document.addEventListener(
  "keydown",
  function(event) {
    if (event.key !== "Escape") return;

    const admin = document.getElementById("modal-admin");
    if (admin && !admin.classList.contains("hidden")) {
      cerrarModalAdmin();
    }

    const cotizador = document.getElementById("modal-cotizador");
    if (cotizador && !cotizador.classList.contains("hidden")) {
      cerrarModalCotizar();
    }
  }
);
