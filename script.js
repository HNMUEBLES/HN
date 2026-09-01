// ============================================================
// HN MUEBLES - SCRIPT PRINCIPAL (ULTRA OPTIMIZADO: SIN DELAY)
// Firebase Authentication + Firestore
// Cloudinary para Portafolio
// ============================================================


// ============================================================
// 1. CONFIGURACIÓN FIREBASE Y CLOUDINARY
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCLrVUpGCTxFxuMR0ATlwj2t3osSP0dD7Y",
  authDomain: "hn-muebles.firebaseapp.com",
  projectId: "hn-muebles",
  storageBucket: "hn-muebles.firebasestorage.app",
  messagingSenderId: "175601256381",
  appId: "1:175601256381:web:db2031a56faa87a02bf4d4",
  measurementId: "G-8PJGERB67Q"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();


// ============================================================
// CLOUDINARY
// ============================================================

const CLOUDINARY_CLOUD_NAME = "clvoagwx";
const CLOUDINARY_UPLOAD_PRESET = "hn_muebles_portafolio";


// ============================================================
// VARIABLES GLOBALES
// ============================================================

const EMAIL_ADMIN = "hn24muebles@gmail.com";

let proyectos = [];
let ingresos = [];
let esAdmin = false;
let portafolio = [];

let visorTrabajoActual = null;
let visorIndiceActual = 0;


// ============================================================
// 2. UTILIDADES GENERALES
// ============================================================

function formatearMonto(valor) {
  const num = Number(valor) || 0;
  return Number.isInteger(num) ? num.toString() : num.toFixed(2);
}


function generarCodigoAleatorio() {
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let aleatorio = "";

  for (let i = 0; i < 5; i++) {
    aleatorio += caracteres.charAt(
      Math.floor(Math.random() * caracteres.length)
    );
  }

  return `HN${aleatorio}`;
}


function llenarCodigoAutomatico() {
  const input = document.getElementById("nuevo-codigo");
  if (input) {
    input.value = generarCodigoAleatorio();
  }
}


function irInicio() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto || "";
  return div.innerHTML;
}


// ============================================================
// 3. AUTENTICACIÓN
// ============================================================

auth.onAuthStateChanged(async (user) => {

  if (!user) {
    esAdmin = false;
    ocultarPanelAdministrador();
    return;
  }

  const emailUsuario = (user.email || "").trim().toLowerCase();
  const emailAdmin = EMAIL_ADMIN.trim().toLowerCase();

  if (emailUsuario !== emailAdmin) {
    esAdmin = false;
    ocultarPanelAdministrador();
    return;
  }

  esAdmin = true;
  mostrarPanelAdministrador();

  try {
    await Promise.all([
      cargarProyectosDesdeNube(),
      cargarIngresosDesdeNube(),
      cargarPortafolioAdmin()
    ]);
    renderProyectosAdmin();
    renderGestionIngresos();
  } catch (error) {
    console.error("Error cargando panel:", error);
  }

});


async function cerrarSesionAdmin() {
  try {
    await auth.signOut();
    esAdmin = false;
    ocultarPanelAdministrador();
    cerrarVisorPortafolio();
    irInicio();
  } catch (error) {
    console.error("Error cerrando sesión:", error);
  }
}


// ============================================================
// 4. CONTROL DE VISTAS ADMIN
// ============================================================

function mostrarPanelAdministrador() {
  const login = document.getElementById("admin-login");
  const panel = document.getElementById("admin-panel");

  if (login) login.classList.add("hidden");
  if (panel) panel.classList.remove("hidden");

  cambiarVistaAdmin('inicio');
}


function ocultarPanelAdministrador() {
  const login = document.getElementById("admin-login");
  const panel = document.getElementById("admin-panel");

  if (panel) panel.classList.add("hidden");
  if (login) login.classList.remove("hidden");
}


function cambiarVistaAdmin(vistaId) {
  if (!esAdmin) return;

  const vistas = [
    'admin-vista-inicio',
    'admin-vista-nuevo-proyecto',
    'admin-vista-ingresos',
    'admin-vista-portafolio'
  ];

  vistas.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === `admin-vista-${vistaId}` || id === vistaId) {
        el.style.display = 'block';
        el.classList.remove('hidden');
      } else {
        el.style.display = 'none';
        el.classList.add('hidden');
      }
    }
  });

  const botonesMenu = document.querySelectorAll('.admin-nav-btn');
  botonesMenu.forEach(btn => {
    if (btn.dataset.vista === vistaId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}


// ============================================================
// 5. FIRESTORE (SIN BLOQUEOS)
// ============================================================

async function cargarProyectosDesdeNube() {
  if (!auth.currentUser || !esAdmin) return;
  const snapshot = await db.collection("proyectos").get();
  proyectos = [];
  snapshot.forEach(doc => {
    proyectos.push({ id: doc.id, ...doc.data() });
  });
}


async function cargarIngresosDesdeNube() {
  if (!auth.currentUser || !esAdmin) return;
  const snapshot = await db.collection("ingresos").get();
  ingresos = [];
  snapshot.forEach(doc => {
    ingresos.push({ id: doc.id, ...doc.data() });
  });
}


// ============================================================
// 6. BÚSQUEDA PÚBLICA
// ============================================================

async function buscarProyectoPublico(codigo) {
  const errorMsg = document.getElementById("mensaje-error");
  const resultBox = document.getElementById("resultado-proyecto");

  try {
    const snapshot = await db.collection("proyectos_publicos")
      .where("codigo", "==", codigo)
      .limit(1)
      .get();

    if (snapshot.empty) {
      resultBox?.classList.add("hidden");
      errorMsg?.classList.remove("hidden");
      return;
    }

    const data = snapshot.docs[0].data();

    errorMsg?.classList.add("hidden");
    resultBox?.classList.remove("hidden");

    document.getElementById("res-codigo").innerText = data.codigo || "";
    document.getElementById("res-mueble").innerText = data.mueble || "";
    document.getElementById("res-cliente").innerText = `Cliente: ${data.cliente || ""}`;
    document.getElementById("res-estado").innerText = data.estado || "";
    document.getElementById("res-porcentaje").innerText = `${data.progreso || 0}%`;

  } catch (error) {
    console.error("Error búsqueda pública:", error);
    resultBox?.classList.add("hidden");
    if (errorMsg) {
      errorMsg.innerText = "No se pudo consultar el proyecto.";
      errorMsg.classList.remove("hidden");
    }
  }
}


// ============================================================
// 7. GESTIÓN DE PROYECTOS (CREAR, RENDERIZAR, EDITAR)
// ============================================================

async function guardarNuevoProyecto(event) {
  if (event) event.preventDefault();
  if (!esAdmin || !auth.currentUser) return;

  const codigo = document.getElementById("nuevo-codigo")?.value.trim().toUpperCase() || generarCodigoAleatorio();
  const cliente = document.getElementById("nuevo-cliente")?.value.trim() || "";
  const mueble = document.getElementById("nuevo-mueble")?.value.trim() || "";
  const telefono = document.getElementById("nuevo-telefono")?.value.trim() || "";
  const presupuesto = Number(document.getElementById("nuevo-presupuesto")?.value) || 0;
  const adelanto = Number(document.getElementById("nuevo-adelanto")?.value) || 0;
  const fechaEntrega = document.getElementById("nuevo-fecha")?.value || "";

  if (!cliente || !mueble) {
    alert("Por favor completa al menos el nombre del cliente y el mueble.");
    return;
  }

  const estado = "Diseño Aprobado";
  const progreso = 20;
  const detalles = "El diseño ha sido aprobado por WhatsApp. El proyecto ingresa a producción.";
  const saldo = Math.max(presupuesto - adelanto, 0);

  const nuevoProyectoData = {
    codigo,
    cliente,
    mueble,
    telefono,
    presupuesto,
    adelanto,
    fechaEntrega,
    estado,
    progreso,
    detalles,
    creadoEn: firebase.firestore.FieldValue.serverTimestamp()
  };

  // Actualización visual local instantánea (Cero Delay)
  const tempId = "temp_" + Date.now();
  proyectos.unshift({ id: tempId, ...nuevoProyectoData });
  renderProyectosAdmin();
  cambiarVistaAdmin('inicio');

  // Limpiar formulario
  document.getElementById("form-nuevo-proyecto")?.reset();
  llenarCodigoAutomatico();

  try {
    const docRef = await db.collection("proyectos").add(nuevoProyectoData);

    // Crear en proyectos públicos para el cliente
    await db.collection("proyectos_publicos").add({
      codigo,
      cliente,
      mueble,
      estado,
      progreso,
      detalles
    });

    // Registrar ingreso inicial
    const ingresoData = {
      proyectoId: docRef.id,
      codigo,
      cliente,
      mueble,
      presupuesto,
      adelanto,
      pagosFinales: 0,
      cobrado: adelanto,
      pendiente: saldo,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    };
    const ingresoRef = await db.collection("ingresos").add(ingresoData);

    // Reemplazar ID temporal con el real de Firebase
    const indexTemp = proyectos.findIndex(p => p.id === tempId);
    if (indexTemp !== -1) {
      proyectos[indexTemp].id = docRef.id;
    }
    ingresos.unshift({ id: ingresoRef.id, ...ingresoData });

    renderProyectosAdmin();
    renderGestionIngresos();
  } catch (error) {
    console.error("Error guardando nuevo proyecto:", error);
    alert("Hubo un error al guardar el proyecto en la nube.");
  }
}


function renderProyectosAdmin() {
  if (!esAdmin) return;

  const container = document.getElementById("lista-proyectos-admin");
  const total = document.getElementById("total-proyectos");

  if (total) total.innerText = proyectos.length;
  if (!container) return;

  container.innerHTML = "";

  const etapas = [
    "Diseño Aprobado",
    "Corte",
    "Armado",
    "Instalación",
    "Finalizado"
  ];

  proyectos.forEach((p, index) => {
    const presupuesto = Number(p.presupuesto) || 0;
    const adelanto = Number(p.adelanto) || 0;
    const saldo = Math.max(presupuesto - adelanto, 0);

    const fecha = p.fechaEntrega
      ? p.fechaEntrega.split("-").reverse().join("/")
      : "Sin definir";

    const card = document.createElement("div");
    card.className = "admin-card";
    card.style.cssText = `
      background:rgba(255,255,255,.05);
      border:1px solid rgba(255,255,255,.1);
      border-radius:12px;
      padding:1.2rem;
      margin-bottom:1rem;
    `;

    const botones = etapas.map((estado, idx) => {
      const activo = p.estado === estado;
      return `
        <button
          type="button"
          onclick="cambiarEstadoPorId('${p.id}', ${idx}, ${(idx + 1) * 20})"
          style="
            border:none;
            padding:.4rem .7rem;
            border-radius:6px;
            cursor:pointer;
            font-size:.8rem;
            margin:.2rem;
            ${activo ? "background:#f59e0b;color:#000;font-weight:bold;" : "background:rgba(255,255,255,.1);color:#fff;"}
          "
        >
          ${estado}
        </button>
      `;
    }).join("");

    card.innerHTML = `
      <div id="info-view-${index}">
        <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
          <div style="flex:1; min-width:260px;">
            <span style="background:#f59e0b; color:#000; padding:.2rem .6rem; border-radius:4px; font-weight:bold; font-size:.85rem;">
              ${escaparHTML(p.codigo || "")}
            </span>
            <strong style="margin-left:.4rem;">
              ${escaparHTML(p.mueble || "")}
            </strong>
            <p style="margin:.4rem 0; color:#a3a3a3; font-size:.85rem;">
              Cliente: ${escaparHTML(p.cliente || "")} | Tel: ${escaparHTML(p.telefono || "Sin registrar")}
            </p>
            <p style="color:#38bdf8; font-size:.85rem;">
              Entrega: <strong>${fecha}</strong>
            </p>

            <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-top:12px;">
              <div class="financial-box" style="background:rgba(56,189,248,.07); border:1px solid rgba(56,189,248,.25); color:#38bdf8;">
                <span style="font-size:.75rem; opacity:.85; margin-bottom:5px;">Monto total</span>
                <strong style="font-size:1.05rem; white-space:nowrap;">Bs. ${formatearMonto(presupuesto)}</strong>
              </div>
              <div class="financial-box" style="background:rgba(245,158,11,.07); border:1px solid rgba(245,158,11,.25); color:#f59e0b;">
                <span style="font-size:.75rem; opacity:.85; margin-bottom:5px;">Adelanto</span>
                <strong style="font-size:1.05rem; white-space:nowrap;">Bs. ${formatearMonto(adelanto)}</strong>
              </div>
              <div class="financial-box" style="background:rgba(239,68,68,.07); border:1px solid rgba(239,68,68,.25); color:#ef4444;">
                <span style="font-size:.75rem; opacity:.85; margin-bottom:5px;">Pendiente</span>
                <strong style="font-size:1.05rem; white-space:nowrap;">Bs. ${formatearMonto(saldo)}</strong>
              </div>
            </div>

            <div style="margin-top:.7rem;">${botones}</div>

            <button
              type="button"
              onclick="notificarWhatsApp(${index})"
              style="margin-top:.6rem; background:#16a34a; color:white; border:none; padding:.4rem .8rem; border-radius:6px; cursor:pointer; font-size:.85rem; font-weight:bold;"
            >
              WhatsApp
            </button>
          </div>

          <div style="display:flex; gap:5px; align-items:flex-start;">
            <button type="button" onclick="activarEdicionInline(${index})" class="admin-action-btn" style="background:#3b82f6; color:#fff;" title="Editar proyecto">✏️</button>
            <button type="button" onclick="eliminarProyecto('${p.id}')" class="admin-action-btn" style="background:#ef4444; color:#fff;" title="Eliminar proyecto">🗑️</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}


async function cambiarEstadoPorId(id, etapaIdx, progreso) {
  if (!esAdmin || !auth.currentUser) return;

  const etapas = ["Diseño Aprobado", "Corte", "Armado", "Instalación", "Finalizado"];
  const descripciones = [
    "El diseño ha sido aprobado por WhatsApp. El proyecto ingresa a producción.",
    "Las placas se encuentran en proceso de corte y pegado de tapacantos.",
    "Las piezas se están ensamblando en taller.",
    "El mueble está en proceso de traslado e instalación en sitio.",
    "¡El proyecto ha sido completado e instalado con éxito!"
  ];

  const estado = etapas[etapaIdx];
  const detalles = descripciones[etapaIdx];

  const projIndex = proyectos.findIndex(p => p.id === id);
  if (projIndex !== -1) {
    proyectos[projIndex].estado = estado;
    proyectos[projIndex].progreso = progreso;
    proyectos[projIndex].detalles = detalles;
    renderProyectosAdmin();
  }

  try {
    const batch = db.batch();
    const proyectoRef = db.collection("proyectos").doc(id);
    batch.update(proyectoRef, { estado, progreso, detalles });

    const proyecto = proyectos.find(p => p.id === id);
    const publicoQuery = await db.collection("proyectos_publicos")
      .where("codigo", "==", proyecto?.codigo)
      .limit(1)
      .get();

    publicoQuery.forEach(doc => {
      batch.update(doc.ref, { estado, progreso, detalles });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error estado:", error);
  }
}


async function eliminarProyecto(id) {
  if (!esAdmin || !auth.currentUser) return;

  const proyectoEliminado = proyectos.find(p => p.id === id);

  proyectos = proyectos.filter(p => p.id !== id);
  ingresos = ingresos.filter(i => i.proyectoId !== id);
  renderProyectosAdmin();
  renderGestionIngresos();

  try {
    const batch = db.batch();
    batch.delete(db.collection("proyectos").doc(id));

    if (proyectoEliminado) {
      const publicSnap = await db.collection("proyectos_publicos")
        .where("codigo", "==", proyectoEliminado.codigo)
        .limit(1)
        .get();
      publicSnap.forEach(doc => batch.delete(doc.ref));

      const ingresoSnap = await db.collection("ingresos")
        .where("proyectoId", "==", id)
        .limit(1)
        .get();
      ingresoSnap.forEach(doc => batch.delete(doc.ref));
    }

    await batch.commit();
  } catch (error) {
    console.error("Error eliminando:", error);
  }
}


function activarEdicionInline(index) {
  const p = proyectos[index];
  const info = document.getElementById(`info-view-${index}`);
  if (!info || !p) return;

  info.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:7px;">
      <input id="edit-codigo-${index}" value="${escaparHTML(p.codigo || "")}" placeholder="Código">
      <input id="edit-cliente-${index}" value="${escaparHTML(p.cliente || "")}" placeholder="Cliente">
      <input id="edit-mueble-${index}" value="${escaparHTML(p.mueble || "")}" placeholder="Mueble">
      <input id="edit-telefono-${index}" value="${escaparHTML(p.telefono || "")}" placeholder="WhatsApp">
      <input type="number" id="edit-presupuesto-${index}" value="${p.presupuesto || 0}" placeholder="Presupuesto" min="0" step="0.01">
      <input type="number" id="edit-adelanto-${index}" value="${p.adelanto || 0}" placeholder="Adelanto" min="0" step="0.01">
      <input type="date" id="edit-fecha-${index}" value="${p.fechaEntrega || ""}">
      <div>
        <button type="button" onclick="guardarEdicionInline('${p.id}',${index})" style="background:#16a34a; color:#fff; border:none; padding:8px 12px; border-radius:6px; cursor:pointer;">Guardar</button>
        <button type="button" onclick="renderProyectosAdmin()" style="background:#404040; color:#fff; border:none; padding:8px 12px; border-radius:6px; cursor:pointer;">Cancelar</button>
      </div>
    </div>
  `;
}


async function guardarEdicionInline(id, index) {
  if (!esAdmin || !auth.currentUser) return;

  const proyectoAnterior = proyectos.find(p => p.id === id);
  const codigoAnterior = proyectoAnterior?.codigo || "";

  const codigo = document.getElementById(`edit-codigo-${index}`).value.trim().toUpperCase();
  const cliente = document.getElementById(`edit-cliente-${index}`).value.trim();
  const mueble = document.getElementById(`edit-mueble-${index}`).value.trim();
  const telefono = document.getElementById(`edit-telefono-${index}`).value.trim();
  const presupuesto = Number(document.getElementById(`edit-presupuesto-${index}`).value) || 0;
  const adelanto = Number(document.getElementById(`edit-adelanto-${index}`).value) || 0;
  const fechaEntrega = document.getElementById(`edit-fecha-${index}`).value;

  const projIndex = proyectos.findIndex(p => p.id === id);
  if (projIndex !== -1) {
    proyectos[projIndex] = { ...proyectos[projIndex], codigo, cliente, mueble, telefono, presupuesto, adelanto, fechaEntrega };
    renderProyectosAdmin();
  }

  try {
    await db.collection("proyectos").doc(id).update({
      codigo, cliente, mueble, telefono, presupuesto, adelanto, fechaEntrega
    });

    const ingresoSnap = await db.collection("ingresos").where("proyectoId", "==", id).limit(1).get();
    if (!ingresoSnap.empty) {
      const ingresoDoc = ingresoSnap.docs[0];
      const ingreso = ingresoDoc.data();
      const pagosFinales = Number(ingreso.pagosFinales) || 0;
      const cobrado = adelanto + pagosFinales;
      const pendiente = Math.max(presupuesto - cobrado, 0);

      await ingresoDoc.ref.update({ codigo, cliente, mueble, presupuesto, adelanto, cobrado, pendiente });
      await cargarIngresosDesdeNube();
      renderGestionIngresos();
    }

    const publicoSnap = await db.collection("proyectos_publicos").where("codigo", "==", codigoAnterior).limit(1).get();
    for (const doc of publicoSnap.docs) {
      await doc.ref.update({ codigo, cliente, mueble, fechaEntrega });
    }
  } catch (error) {
    console.error("Error editando:", error);
  }
}


// ============================================================
// 8. INGRESOS
// ============================================================

function renderGestionIngresos() {
  if (!esAdmin) return;

  const container = document.getElementById("lista-ingresos");
  if (!container) return;

  const filtro = document.getElementById("ingresos-mes")?.value || "";
  let lista = [...ingresos];

  if (filtro) {
    lista = lista.filter(ingreso => {
      let fecha = null;
      if (ingreso.fechaCreacion && ingreso.fechaCreacion.toDate) {
        fecha = ingreso.fechaCreacion.toDate();
      }
      if (!fecha) return true;
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
      return mes === filtro;
    });
  }

  let totalCobrado = 0;
  let totalPendiente = 0;

  lista.forEach(ingreso => {
    totalCobrado += Number(ingreso.cobrado) || 0;
    totalPendiente += Number(ingreso.pendiente) || 0;
  });

  const resumenProyectos = document.getElementById("ing-resumen-proyectos");
  const resumenCobrado = document.getElementById("ing-resumen-cobrado");
  const resumenPendiente = document.getElementById("ing-resumen-pendiente");

  if (resumenProyectos) resumenProyectos.innerText = lista.length;
  if (resumenCobrado) resumenCobrado.innerText = `Bs. ${formatearMonto(totalCobrado)}`;
  if (resumenPendiente) resumenPendiente.innerText = `Bs. ${formatearMonto(totalPendiente)}`;

  container.innerHTML = "";

  if (!lista.length) {
    container.innerHTML = `<div style="text-align:center; color:#777; padding:25px;">No hay registros para este mes.</div>`;
    return;
  }

  lista.forEach(ingreso => {
    const card = document.createElement("div");
    card.style.cssText = `
      background:rgba(255,255,255,.035);
      border:1px solid rgba(255,255,255,.09);
      border-radius:9px;
      padding:10px;
      margin-bottom:7px;
    `;

    const presupuesto = Number(ingreso.presupuesto) || 0;
    const adelanto = Number(ingreso.adelanto) || 0;
    const cobrado = Number(ingreso.cobrado) || 0;
    const pendiente = Math.max(presupuesto - cobrado, 0);

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; gap:8px;">
        <div>
          <strong>${escaparHTML(ingreso.cliente || "")}</strong>
          <div style="color:#a3a3a3; font-size:.75rem;">
            ${escaparHTML(ingreso.codigo || "")} · ${escaparHTML(ingreso.mueble || "")}
          </div>
        </div>
        <div style="color:#38bdf8; font-weight:bold; font-size:.85rem;">
          Total: Bs. ${formatearMonto(presupuesto)}
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:5px; margin-top:8px;">
        <div class="summary-box amber">Adelanto<strong>Bs. ${formatearMonto(adelanto)}</strong></div>
        <div class="summary-box green">Cobrado<strong>Bs. ${formatearMonto(cobrado)}</strong></div>
        <div class="summary-box red">Pendiente<strong>Bs. ${formatearMonto(pendiente)}</strong></div>
      </div>

      ${
        pendiente > 0
          ? `
            <div style="display:flex; gap:5px; margin-top:8px;">
              <input type="number" min="0" step="0.01" id="pago-${ingreso.id}" placeholder="Monto pagado">
              <button type="button" onclick="registrarPago('${ingreso.id}')" style="background:#16a34a; color:#fff; border:none; border-radius:6px; padding:7px 10px; cursor:pointer; font-weight:bold;">Registrar pago</button>
            </div>
          `
          : `
            <div style="margin-top:8px; color:#4ade80; font-size:.78rem; text-align:center;">
              <i class="fa-solid fa-circle-check"></i> Proyecto pagado completamente
            </div>
          `
      }
    `;
    container.appendChild(card);
  });
}


async function registrarPago(ingresoId) {
  if (!esAdmin || !auth.currentUser) return;

  const input = document.getElementById(`pago-${ingresoId}`);
  const monto = Number(input?.value) || 0;
  if (monto <= 0) return;

  const ingreso = ingresos.find(i => i.id === ingresoId);
  if (!ingreso) return;

  const presupuesto = Number(ingreso.presupuesto) || 0;
  const cobradoActual = Number(ingreso.cobrado) || 0;
  const pendienteActual = Math.max(presupuesto - cobradoActual, 0);

  const pago = Math.min(monto, pendienteActual);
  if (pago <= 0) return;

  const pagosFinalesActuales = Number(ingreso.pagosFinales) || 0;
  const nuevosPagosFinales = pagosFinalesActuales + pago;
  const nuevoCobrado = cobradoActual + pago;
  const nuevoPendiente = Math.max(presupuesto - nuevoCobrado, 0);

  const idx = ingresos.findIndex(i => i.id === ingresoId);
  if (idx !== -1) {
    ingresos[idx].pagosFinales = nuevosPagosFinales;
    ingresos[idx].cobrado = nuevoCobrado;
    ingresos[idx].pendiente = nuevoPendiente;
    renderGestionIngresos();
  }

  try {
    await db.collection("ingresos").doc(ingresoId).update({
      pagosFinales: nuevosPagosFinales,
      cobrado: nuevoCobrado,
      pendiente: nuevoPendiente,
      fechaUltimoPago: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Error registrando pago:", error);
  }
}


// ============================================================
// 9. PDF
// ============================================================

async function obtenerLogoPDF() {
  try {
    const response = await fetch("logo.png");
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return null;
  }
}


async function exportarIngresosPDF() {
  if (!esAdmin) return;

  const filtro = document.getElementById("ingresos-mes")?.value || "";
  if (!filtro) return;

  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("jsPDF no disponible.");
    return;
  }

  const lista = ingresos.filter(ingreso => {
    if (!ingreso.fechaCreacion || !ingreso.fechaCreacion.toDate) return true;
    const fecha = ingreso.fechaCreacion.toDate();
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    return mes === filtro;
  });

  const jsPDF = window.jspdf.jsPDF;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const [anio, mes] = filtro.split("-");
  const nombresMes = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const nombreMes = nombresMes[Number(mes) - 1] || mes;

  const logo = await obtenerLogoPDF();

  const NEGRO = [18, 18, 18];
  const GRIS = [105, 105, 105];
  const DORADO = [156, 113, 81];
  const BLANCO = [255, 255, 255];
  const VERDE = [22, 163, 74];
  const AZUL = [37, 99, 235];

  let sumaMontosTotales = 0;
  let sumaAdelantosMateriales = 0;
  let sumaSaldosGanancia = 0;

  const filas = lista.map(ingreso => {
    const monto = Number(ingreso.presupuesto || ingreso.monto) || 0;
    const adelantoMateriales = Number(ingreso.adelanto) || 0;
    const saldoGanancia = Number(ingreso.saldo !== undefined ? ingreso.saldo : Math.max(monto - adelantoMateriales, 0)) || 0;

    sumaMontosTotales += monto;
    sumaAdelantosMateriales += adelantoMateriales;
    sumaSaldosGanancia += saldoGanancia;

    return [
      ingreso.codigo || "",
      ingreso.cliente || "",
      ingreso.mueble || ingreso.concepto || "",
      `Bs. ${formatearMonto(monto)}`,
      `Bs. ${formatearMonto(adelantoMateriales)}`,
      `Bs. ${formatearMonto(saldoGanancia)}`
    ];
  });

  if (logo) {
    try { doc.addImage(logo, "PNG", 14, 10, 25, 18); } catch (e) {}
  }

  const posicionTexto = logo ? 45 : 14;

  doc.setTextColor(...NEGRO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("HN MUEBLES", posicionTexto, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRIS);
  doc.text("DISEÑO Y FABRICACIÓN DE MUEBLES A MEDIDA", posicionTexto, 23);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...DORADO);
  doc.text("REPORTE FINANCIERO - GESTIÓN DE INGRESOS", 14, 38);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...NEGRO);
  doc.text(`${nombreMes} ${anio}`, 14, 45);

  doc.setDrawColor(...DORADO);
  doc.setLineWidth(0.8);
  doc.line(14, 49, 283, 49);

  const resumenY = 55;
  const anchoCaja = 85;
  const altoCaja = 20;
  const separacion = 10;

  const resumen = [
    { titulo: "TOTAL MONTO PROYECTOS", valor: `Bs. ${formatearMonto(sumaMontosTotales)}`, color: AZUL },
    { titulo: "TOTAL MATERIALES (ADELANTOS)", valor: `Bs. ${formatearMonto(sumaAdelantosMateriales)}`, color: DORADO },
    { titulo: "TOTAL GANANCIA NETA (SALDOS)", valor: `Bs. ${formatearMonto(sumaSaldosGanancia)}`, color: VERDE }
  ];

  resumen.forEach((item, index) => {
    const x = 14 + index * (anchoCaja + separacion);
    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(225, 225, 225);
    doc.roundedRect(x, resumenY, anchoCaja, altoCaja, 3, 3, "FD");
    doc.setFillColor(...item.color);
    doc.roundedRect(x, resumenY, 2.5, altoCaja, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...GRIS);
    doc.text(item.titulo, x + 7, resumenY + 7);

    doc.setFontSize(11);
    doc.setTextColor(...NEGRO);
    doc.text(item.valor, x + 7, resumenY + 15);
  });

  const tablaY = resumenY + altoCaja + 8;

  if (typeof doc.autoTable === "function") {
    doc.autoTable({
      startY: tablaY,
      margin: { left: 14, right: 14 },
      head: [["CÓDIGO", "CLIENTE", "PROYECTO", "MONTO TOTAL", "ADELANTO (MATERIALES)", "SALDO (GANANCIA NETA)"]],
      body: filas,
      theme: "grid",
      headStyles: { fillColor: NEGRO, textColor: BLANCO, fontStyle: "bold", fontSize: 8, halign: "center", valign: "middle", cellPadding: 4 },
      bodyStyles: { fontSize: 8, textColor: [45,45,45], cellPadding: 3.5, valign: "middle" },
      alternateRowStyles: { fillColor: [248,248,248] },
      columnStyles: {
        0: { cellWidth: 30, halign: "center" },
        1: { cellWidth: 60 },
        2: { cellWidth: 83 },
        3: { cellWidth: 35, halign: "right" },
        4: { cellWidth: 35, halign: "right" },
        5: { cellWidth: 42, halign: "right" }
      }
    });
  }

  doc.save(`HN-MUEBLES-Gestion-Ingresos-${anio}-${mes}.pdf`);
}


// ============================================================
// 10. WHATSAPP
// ============================================================

function notificarWhatsApp(index) {
  if (!esAdmin) return;

  const p = proyectos[index];
  if (!p || !p.telefono) return;

  let numero = p.telefono.toString().replace(/\D/g, "");
  if (!numero.startsWith("591") && numero.length === 8) {
    numero = "591" + numero;
  }

  const link = window.location.origin + window.location.pathname + `?codigo=${encodeURIComponent(p.codigo)}`;
  const fecha = p.fechaEntrega ? p.fechaEntrega.split("-").reverse().join("/") : "Por coordinar";

  const mensaje = `Hola *${p.cliente}* 👋, desde *HN Muebles* te informamos el estado de tu proyecto *"${p.mueble}"*:

🛠️ *Estado:* ${p.estado}
📊 *Progreso:* ${p.progreso}%
📅 *Fecha estimada de entrega:* ${fecha}

🔍 *Consulta el estado de tu proyecto:*
${link}`;

  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, "_blank");
}


// ============================================================
// 11. PORTAFOLIO Y VISOR
// ============================================================

async function cargarPortafolioPublico() {
  const container = document.getElementById("portfolio-grid");
  if (!container) return;

  try {
    const snapshot = await db.collection("portafolio").orderBy("creadoEn", "desc").get();
    portafolio = [];
    snapshot.forEach(doc => portafolio.push({ id: doc.id, ...doc.data() }));
    renderPortafolioPublico();
  } catch (error) {
    console.error("Error cargando portafolio:", error);
  }
}

async function cargarPortafolioAdmin() {
  try {
    const snapshot = await db.collection("portafolio").orderBy("creadoEn", "desc").get();
    portafolio = [];
    snapshot.forEach(doc => portafolio.push({ id: doc.id, ...doc.data() }));
    if (typeof renderPortafolioAdmin === "function") {
      renderPortafolioAdmin();
    }
  } catch (error) {
    console.error("Error cargando portafolio admin:", error);
  }
}


function crearVisorPortafolio() {
  if (document.getElementById("hn-portfolio-viewer")) return;

  const visor = document.createElement("div");
  visor.id = "hn-portfolio-viewer";
  visor.innerHTML = `
    <div id="hn-portfolio-backdrop" onclick="cerrarVisorPortafolio()" style="position:absolute; inset:0; background:rgba(0,0,0,.88); backdrop-filter:blur(8px);"></div>
    <button type="button" onclick="cerrarVisorPortafolio()" style="position:absolute; top:20px; right:25px; z-index:20; width:45px; height:45px; border:none; border-radius:50%; background:rgba(255,255,255,.12); color:#fff; font-size:24px; cursor:pointer;">×</button>
    <button type="button" id="hn-portfolio-prev" onclick="visorPortafolioAnterior(event)" style="position:absolute; left:20px; top:50%; transform:translateY(-50%); z-index:20; width:50px; height:50px; border:none; border-radius:50%; background:rgba(255,255,255,.12); color:#fff; font-size:30px; cursor:pointer;">‹</button>
    <div id="hn-portfolio-content" style="position:relative; z-index:10; width:calc(100% - 150px); height:calc(100% - 120px); display:flex; flex-direction:column; justify-content:center; align-items:center;"></div>
    <button type="button" id="hn-portfolio-next" onclick="visorPortafolioSiguiente(event)" style="position:absolute; right:20px; top:50%; transform:translateY(-50%); z-index:20; width:50px; height:50px; border:none; border-radius:50%; background:rgba(255,255,255,.12); color:#fff; font-size:30px; cursor:pointer;">›</button>
    <div id="hn-portfolio-counter" style="position:absolute; bottom:25px; left:50%; transform:translateX(-50%); z-index:20; color:#fff; background:rgba(0,0,0,.5); padding:7px 15px; border-radius:20px; font-size:13px;"></div>
  `;
  visor.style.cssText = "position:fixed; inset:0; z-index:99999; display:none; align-items:center; justify-content:center; padding:30px;";
  document.body.appendChild(visor);
}


function abrirVisorPortafolio(trabajoId, indice = 0) {
  const trabajo = portafolio.find(p => p.id === trabajoId);
  if (!trabajo || !trabajo.imagenes || !trabajo.imagenes.length) return;

  visorTrabajoActual = trabajo;
  visorIndiceActual = indice;

  crearVisorPortafolio();
  const visor = document.getElementById("hn-portfolio-viewer");
  if (visor) {
    visor.style.display = "flex";
  }
  renderContenidoVisorPortafolio();
}


function cerrarVisorPortafolio() {
  const visor = document.getElementById("hn-portfolio-viewer");
  if (visor) {
    visor.style.display = "none";
  }
  visorTrabajoActual = null;
  visorIndiceActual = 0;
}


function visorPortafolioAnterior(event) {
  if (event) event.stopPropagation();
  if (!visorTrabajoActual || !visorTrabajoActual.imagenes) return;
  visorIndiceActual = (visorIndiceActual - 1 + visorTrabajoActual.imagenes.length) % visorTrabajoActual.imagenes.length;
  renderContenidoVisorPortafolio();
}


function visorPortafolioSiguiente(event) {
  if (event) event.stopPropagation();
  if (!visorTrabajoActual || !visorTrabajoActual.imagenes) return;
  visorIndiceActual = (visorIndiceActual + 1) % visorTrabajoActual.imagenes.length;
  renderContenidoVisorPortafolio();
}


function renderContenidoVisorPortafolio() {
  const container = document.getElementById("hn-portfolio-content");
  const counter = document.getElementById("hn-portfolio-counter");
  if (!container || !visorTrabajoActual) return;

  const imagenUrl = visorTrabajoActual.imagenes[visorIndiceActual];
  container.innerHTML = `
    <img src="${escaparHTML(imagenUrl)}" alt="Trabajo Portafolio" style="max-width:100%; max-height:75vh; object-fit:contain; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.5);" />
    <h3 style="color:#fff; margin-top:15px; font-size:1.2rem;">${escaparHTML(visorTrabajoActual.titulo || "")}</h3>
    <p style="color:#a3a3a3; font-size:0.9rem; text-align:center; max-width:600px;">${escaparHTML(visorTrabajoActual.descripcion || "")}</p>
  `;

  if (counter && visorTrabajoActual.imagenes.length > 1) {
    counter.innerText = `${visorIndiceActual + 1} / ${visorTrabajoActual.imagenes.length}`;
    counter.style.display = "block";
  } else if (counter) {
    counter.style.display = "none";
  }
}
