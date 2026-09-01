// ============================================================
// HN MUEBLES - SCRIPT PRINCIPAL OPTIMIZADO
// Firebase Authentication + Firestore + Cloudinary
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
const EMAIL_ADMIN = "hn24muebles@gmail.com";

const CLOUDINARY_CLOUD_NAME = "clvoagwx";
const CLOUDINARY_UPLOAD_PRESET = "hn_muebles_portafolio";

let proyectos = [];
let ingresos = [];
let portafolio = [];
let esAdmin = false;
let galeriaActual = 0;
let mediaActual = 0;

// ============================================================
// UTILIDADES GENERALES
// ============================================================

const formatearMonto = (valor) => {
  const num = Number(valor) || 0;
  return Number.isInteger(num) ? num.toString() : num.toFixed(2);
};

const generarCodigoAleatorio = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let codigo = "";
  for (let i = 0; i < 5; i++) codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  return `HN${codigo}`;
};

const llenarCodigoAutomatico = () => {
  const input = document.getElementById("nuevo-codigo");
  if (input) input.value = generarCodigoAleatorio();
};

const escaparHTML = (texto) => {
  const div = document.createElement("div");
  div.textContent = texto || "";
  return div.innerHTML;
};

const irInicio = () => window.scrollTo({ top: 0, behavior: "smooth" });

const copiarCodigoAlPortapapeles = (codigo) => {
  navigator.clipboard.writeText(codigo).then(() => {
    const boton = document.querySelector(`[data-copy-code="${codigo}"]`);
    if (!boton) return;
    const original = boton.innerText;
    boton.innerText = "Copiado ✓";
    setTimeout(() => boton.innerText = original, 1200);
  }).catch(err => console.error("Error copiando código:", err));
};

const obtenerFechaActualTexto = () => new Date().toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" });
const obtenerHoraActualTexto = () => new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });

const obtenerNombreMes = (mesNum) => {
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return meses[mesNum] || "";
};

const obtenerMesFiltroActual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// ============================================================
// MODALES
// ============================================================

const abrirVentana = (id) => {
  const v = document.getElementById(id);
  if (!v) return;
  v.classList.remove("hidden");
  v.style.display = "flex";
  document.body.style.overflow = "hidden";
};

const cerrarVentana = (id) => {
  const v = document.getElementById(id);
  if (!v) return;
  v.classList.add("hidden");
  v.style.display = "none";
  restaurarScrollSiNoHayVentanas();
};

const restaurarScrollSiNoHayVentanas = () => {
  const abiertas = document.querySelectorAll("#modal-ingresos:not(.hidden), #modal-portafolio:not(.hidden)");
  if (!abiertas.length) document.body.style.overflow = "";
};

const cerrarTodasLasVentanas = () => {
  cerrarVentana("modal-ingresos");
  cerrarVentana("modal-portafolio");
  const mg = document.getElementById("portfolio-gallery-modal");
  if (mg) mg.style.display = "none";
  document.body.style.overflow = "";
};

const abrirVentanaIngresos = () => { abrirVentana("modal-ingresos"); renderGestionIngresos(); };
const cerrarVentanaIngresos = () => cerrarVentana("modal-ingresos");
const abrirVentanaPortafolio = () => { abrirVentana("modal-portafolio"); renderPortafolioAdmin(); };
const cerrarVentanaPortafolio = () => cerrarVentana("modal-portafolio");

// ============================================================
// AUTENTICACIÓN
// ============================================================

auth.onAuthStateChanged(async (user) => {
  if (!user || (user.email || "").trim().toLowerCase() !== EMAIL_ADMIN.toLowerCase()) {
    esAdmin = false;
    ocultarPanelAdministrador();
    cerrarTodasLasVentanas();
    return;
  }
  esAdmin = true;
  mostrarPanelAdministrador();
  try {
    await Promise.all([cargarProyectosDesdeNube(), cargarIngresosDesdeNube(), cargarPortafolioAdmin()]);
    renderProyectosAdmin();
    renderGestionIngresos();
  } catch (err) {
    console.error("Error cargando panel administrativo:", err);
  }
});

const cerrarSesionAdmin = async () => {
  try {
    await auth.signOut();
    esAdmin = false;
    ocultarPanelAdministrador();
    cerrarTodasLasVentanas();
    irInicio();
  } catch (err) {
    console.error("Error cerrando sesión:", err);
  }
};

const mostrarPanelAdministrador = () => {
  document.getElementById("admin-login")?.classList.add("hidden");
  document.getElementById("admin-panel")?.classList.remove("hidden");
};

const ocultarPanelAdministrador = () => {
  document.getElementById("admin-panel")?.classList.add("hidden");
  document.getElementById("admin-login")?.classList.remove("hidden");
};

// ============================================================
// CARGA DE DATOS (FIRESTORE)
// ============================================================

async function cargarProyectosDesdeNube() {
  if (!esAdmin) return;
  try {
    const snap = await db.collection("proyectos").get();
    proyectos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error cargando proyectos:", err);
  }
}

async function cargarIngresosDesdeNube() {
  if (!esAdmin) return;
  try {
    const snap = await db.collection("ingresos").get();
    ingresos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error cargando ingresos:", err);
  }
}

// ============================================================
// BÚSQUEDA PÚBLICA
// ============================================================

async function buscarProyectoPublico(codigo) {
  const errorMsg = document.getElementById("mensaje-error");
  const resultBox = document.getElementById("resultado-proyecto");
  try {
    const snap = await db.collection("proyectos_publicos").where("codigo", "==", codigo).limit(1).get();
    if (snap.empty) {
      resultBox?.classList.add("hidden");
      if (errorMsg) {
        errorMsg.innerText = "No se encontró ningún proyecto con ese código.";
        errorMsg.classList.remove("hidden");
      }
      return;
    }
    const data = snap.docs[0].data();
    errorMsg?.classList.add("hidden");
    resultBox?.classList.remove("hidden");

    document.getElementById("res-codigo").innerText = data.codigo || "";
    document.getElementById("res-mueble").innerText = data.mueble || "";
    document.getElementById("res-cliente").innerText = `Cliente: ${data.cliente || ""}`;
    document.getElementById("res-estado").innerText = data.estado || "";
    document.getElementById("res-porcentaje").innerText = `${data.progreso || 0}%`;
    document.getElementById("res-detalles").innerText = data.detalles || "";
    const barra = document.getElementById("barra-progreso");
    if (barra) barra.style.width = `${data.progreso || 0}%`;
  } catch (err) {
    console.error("Error búsqueda pública:", err);
    resultBox?.classList.add("hidden");
    if (errorMsg) {
      errorMsg.innerText = "No se pudo consultar el proyecto.";
      errorMsg.classList.remove("hidden");
    }
  }
}

// ============================================================
// RENDER PROYECTOS ADMIN
// ============================================================

function renderProyectosAdmin() {
  if (!esAdmin) return;
  const container = document.getElementById("lista-proyectos-admin");
  const total = document.getElementById("total-proyectos");
  if (total) total.innerText = proyectos.length;
  if (!container) return;

  container.innerHTML = "";
  const etapas = ["Diseño Aprobado", "Corte", "Armado", "Instalación", "Finalizado"];

  proyectos.forEach((p, index) => {
    const presupuesto = Number(p.presupuesto) || 0;
    const adelanto = Number(p.adelanto) || 0;
    const saldo = Math.max(presupuesto - adelanto, 0);
    const fecha = p.fechaEntrega ? p.fechaEntrega.split("-").reverse().join("/") : "Sin definir";

    const botones = etapas.map((estado, idx) => `
      <button type="button" onclick="cambiarEstadoPorId('${p.id}', ${idx}, ${(idx + 1) * 20})" style="border:none;padding:.4rem .7rem;border-radius:6px;cursor:pointer;font-size:.8rem;margin:.2rem;${p.estado === estado ? "background:#f59e0b;color:#000;font-weight:bold;" : "background:rgba(255,255,255,.1);color:#fff;"}">
        ${estado}
      </button>
    `).join("");

    const card = document.createElement("div");
    card.className = "admin-card";
    card.style.cssText = "background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:1.2rem;margin-bottom:1rem;";
    card.innerHTML = `
      <div id="info-view-${index}">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div style="flex:1;min-width:260px;">
            <span style="background:#f59e0b;color:#000;padding:.2rem .6rem;border-radius:4px;font-weight:bold;font-size:.85rem;">${escaparHTML(p.codigo || "")}</span>
            <strong style="margin-left:.4rem;">${escaparHTML(p.mueble || "")}</strong>
            <p style="margin:.4rem 0;color:#a3a3a3;font-size:.85rem;">Cliente: ${escaparHTML(p.cliente || "")} | Tel: ${escaparHTML(p.telefono || "Sin registrar")}</p>
            <p style="color:#38bdf8;font-size:.85rem;">Entrega: <strong>${fecha}</strong></p>
            <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px;">
              <div class="financial-box" style="background:rgba(56,189,248,.07);border:1px solid rgba(56,189,248,.25);color:#38bdf8;">
                <span style="font-size:.75rem;">Monto total</span>
                <strong style="font-size:1.05rem;white-space:nowrap;">Bs. ${formatearMonto(presupuesto)}</strong>
              </div>
              <div class="financial-box" style="background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.25);color:#f59e0b;">
                <span style="font-size:.75rem;">Adelanto</span>
                <strong style="font-size:1.05rem;white-space:nowrap;">Bs. ${formatearMonto(adelanto)}</strong>
              </div>
              <div class="financial-box" style="background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.25);color:#ef4444;">
                <span style="font-size:.75rem;">Pendiente</span>
                <strong style="font-size:1.05rem;white-space:nowrap;">Bs. ${formatearMonto(saldo)}</strong>
              </div>
            </div>
            <div style="margin-top:.7rem;">${botones}</div>
            <button type="button" onclick="notificarWhatsApp(${index})" style="margin-top:.6rem;background:#16a34a;color:white;border:none;padding:.4rem .8rem;border-radius:6px;cursor:pointer;font-size:.85rem;font-weight:bold;">WhatsApp</button>
          </div>
          <div style="display:flex;gap:5px;align-items:flex-start;">
            <button type="button" onclick="activarEdicionInline(${index})" class="admin-action-btn" style="background:#3b82f6;color:#fff;" title="Editar">✏️</button>
            <button type="button" onclick="eliminarProyecto('${p.id}')" class="admin-action-btn" style="background:#ef4444;color:#fff;" title="Eliminar">🗑️</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ============================================================
// ACCIONES DE PROYECTOS (ESTADO, ELIMINAR, EDITAR)
// ============================================================

async function cambiarEstadoPorId(id, etapaIdx, progreso) {
  if (!esAdmin || !auth.currentUser) return;
  const etapas = ["Diseño Aprobado", "Corte", "Armado", "Instalación", "Finalizado"];
  const descripciones = [
    "Diseño confirmado por WhatsApp. Listo para corte.",
    "Las placas se encuentran en proceso de corte y pegado de tapacantos.",
    "Las piezas se están ensamblando en taller.",
    "El mueble está en proceso de traslado e instalación en sitio.",
    "¡El proyecto ha sido completado e instalado con éxito!"
  ];
  const estado = etapas[etapaIdx];
  const detalles = descripciones[etapaIdx];
  try {
    const batch = db.batch();
    batch.update(db.collection("proyectos").doc(id), { estado, progreso, detalles });
    const proyecto = proyectos.find(p => p.id === id);
    const pubQuery = await db.collection("proyectos_publicos").where("codigo", "==", proyecto?.codigo).limit(1).get();
    pubQuery.forEach(doc => batch.update(doc.ref, { estado, progreso, detalles }));
    await batch.commit();
    await cargarProyectosDesdeNube();
    renderProyectosAdmin();
  } catch (err) {
    console.error("Error cambiando estado:", err);
  }
}

async function eliminarProyecto(id) {
  if (!esAdmin || !auth.currentUser || !confirm("¿Seguro que quieres eliminar este proyecto?")) return;
  try {
    const proyecto = proyectos.find(p => p.id === id);
    const batch = db.batch();
    batch.delete(db.collection("proyectos").doc(id));
    if (proyecto) {
      const pubSnap = await db.collection("proyectos_publicos").where("codigo", "==", proyecto.codigo).limit(1).get();
      pubSnap.forEach(doc => batch.delete(doc.ref));
      const ingSnap = await db.collection("ingresos").where("proyectoId", "==", id).limit(1).get();
      ingSnap.forEach(doc => batch.delete(doc.ref));
    }
    await batch.commit();
    await cargarProyectosDesdeNube();
    await cargarIngresosDesdeNube();
    renderProyectosAdmin();
    renderGestionIngresos();
  } catch (err) {
    console.error("Error eliminando proyecto:", err);
  }
}

function activarEdicionInline(index) {
  const p = proyectos[index];
  const info = document.getElementById(`info-view-${index}`);
  if (!info || !p) return;
  info.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:7px;">
      <input id="edit-codigo-${index}" value="${escaparHTML(p.codigo || "")}" placeholder="Código">
      <input id="edit-cliente-${index}" value="${escaparHTML(p.cliente || "")}" placeholder="Cliente">
      <input id="edit-mueble-${index}" value="${escaparHTML(p.mueble || "")}" placeholder="Mueble">
      <input id="edit-telefono-${index}" value="${escaparHTML(p.telefono || "")}" placeholder="WhatsApp">
      <input type="number" id="edit-presupuesto-${index}" value="${p.presupuesto || 0}" placeholder="Presupuesto" min="0" step="0.01">
      <input type="number" id="edit-adelanto-${index}" value="${p.adelanto || 0}" placeholder="Adelanto" min="0" step="0.01">
      <input type="date" id="edit-fecha-${index}" value="${p.fechaEntrega || ""}">
      <div>
        <button type="button" onclick="guardarEdicionInline('${p.id}', ${index})" style="background:#16a34a;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">Guardar</button>
        <button type="button" onclick="renderProyectosAdmin()" style="background:#404040;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">Cancelar</button>
      </div>
    </div>
  `;
}

async function guardarEdicionInline(id, index) {
  if (!esAdmin || !auth.currentUser) return;
  const anterior = proyectos.find(p => p.id === id);
  const codigoAnterior = anterior?.codigo || "";
  const codigo = document.getElementById(`edit-codigo-${index}`).value.trim().toUpperCase();
  const cliente = document.getElementById(`edit-cliente-${index}`).value.trim();
  const mueble = document.getElementById(`edit-mueble-${index}`).value.trim();
  const telefono = document.getElementById(`edit-telefono-${index}`).value.trim();
  const presupuesto = Number(document.getElementById(`edit-presupuesto-${index}`).value) || 0;
  const adelanto = Number(document.getElementById(`edit-adelanto-${index}`).value) || 0;
  const fecha = document.getElementById(`edit-fecha-${index}`).value;

  try {
    await db.collection("proyectos").doc(id).update({ codigo, cliente, mueble, telefono, presupuesto, adelanto, fechaEntrega: fecha });
    const ingSnap = await db.collection("ingresos").where("proyectoId", "==", id).limit(1).get();
    if (!ingSnap.empty) {
      const ingDoc = ingSnap.docs[0];
      const cobrado = adelanto + (Number(ingDoc.data().pagosFinales) || 0);
      const pendiente = Math.max(presupuesto - cobrado, 0);
      await ingDoc.ref.update({ codigo, cliente, mueble, presupuesto, adelanto, cobrado, pendiente });
    }
    const pubSnap = await db.collection("proyectos_publicos").where("codigo", "==", codigoAnterior).limit(1).get();
    for (const doc of pubSnap.docs) {
      await doc.ref.update({ codigo, cliente, mueble, fechaEntrega: fecha });
    }
    await cargarProyectosDesdeNube();
    await cargarIngresosDesdeNube();
    renderProyectosAdmin();
    renderGestionIngresos();
    alert("Proyecto actualizado correctamente.");
  } catch (err) {
    console.error("Error editando proyecto:", err);
    alert("No se pudo actualizar el proyecto.");
  }
}

// ============================================================
// INGRESOS Y PAGOS
// ============================================================

function renderGestionIngresos() {
  if (!esAdmin) return;
  const container = document.getElementById("lista-ingresos");
  if (!container) return;
  const filtro = document.getElementById("ingresos-mes")?.value || "";
  let lista = [...ingresos];

  if (filtro) {
    lista = lista.filter(i => {
      if (!i.fechaCreacion?.toDate) return true;
      const f = i.fechaCreacion.toDate();
      return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}` === filtro;
    });
  }

  let totalCobrado = 0, totalPendiente = 0;
  lista.forEach(i => {
    totalCobrado += Number(i.cobrado) || 0;
    totalPendiente += Number(i.pendiente) || 0;
  });

  const rProyectos = document.getElementById("ing-resumen-proyectos");
  const rCobrado = document.getElementById("ing-resumen-cobrado");
  const rPendiente = document.getElementById("ing-resumen-pendiente");

  if (rProyectos) rProyectos.innerText = lista.length;
  if (rCobrado) rCobrado.innerText = `Bs. ${formatearMonto(totalCobrado)}`;
  if (rPendiente) rPendiente.innerText = `Bs. ${formatearMonto(totalPendiente)}`;

  container.innerHTML = "";
  if (!lista.length) {
    container.innerHTML = `<div style="text-align:center;color:#777;padding:25px;">No hay registros para este mes.</div>`;
    return;
  }

  lista.forEach(ingreso => {
    const card = document.createElement("div");
    card.style.cssText = "background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.09);border-radius:9px;padding:10px;margin-bottom:7px;";
    const presupuesto = Number(ingreso.presupuesto) || 0;
    const adelanto = Number(ingreso.adelanto) || 0;
    const cobrado = Number(ingreso.cobrado) || 0;
    const pendiente = Math.max(presupuesto - cobrado, 0);

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px;">
        <div>
          <strong>${escaparHTML(ingreso.cliente || "")}</strong>
          <div style="color:#a3a3a3;font-size:.75rem;">${escaparHTML(ingreso.codigo || "")} · ${escaparHTML(ingreso.mueble || "")}</div>
        </div>
        <div style="color:#38bdf8;font-weight:bold;font-size:.85rem;">Total: Bs. ${formatearMonto(presupuesto)}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:8px;">
        <div class="summary-box amber">Adelanto<strong>Bs. ${formatearMonto(adelanto)}</strong></div>
        <div class="summary-box green">Cobrado<strong>Bs. ${formatearMonto(cobrado)}</strong></div>
        <div class="summary-box red">Pendiente<strong>Bs. ${formatearMonto(pendiente)}</strong></div>
      </div>
      ${pendiente > 0 ? `
        <div style="display:flex;gap:5px;margin-top:8px;">
          <input type="number" min="0" step="0.01" id="pago-${ingreso.id}" placeholder="Monto pagado">
          <button type="button" onclick="registrarPago('${ingreso.id}')" style="background:#16a34a;color:#fff;border:none;border-radius:6px;padding:7px 10px;cursor:pointer;font-weight:bold;">Registrar pago</button>
        </div>
      ` : `
        <div style="margin-top:8px;color:#4ade80;font-size:.78rem;text-align:center;"><i class="fa-solid fa-circle-check"></i> Proyecto pagado completamente</div>
      `}
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
  const pago = Math.min(monto, Math.max(presupuesto - cobradoActual, 0));
  if (pago <= 0) return;

  try {
    await db.collection("ingresos").doc(ingresoId).update({
      pagosFinales: (Number(ingreso.pagosFinales) || 0) + pago,
      cobrado: cobradoActual + pago,
      pendiente: Math.max(presupuesto - (cobradoActual + pago), 0),
      fechaUltimoPago: firebase.firestore.FieldValue.serverTimestamp()
    });
    await cargarIngresosDesdeNube();
    renderGestionIngresos();
  } catch (err) {
    console.error("Error registrando pago:", err);
  }
}

// ============================================================
// PDF DE INGRESOS
// ============================================================

async function obtenerLogoPDF() {
  try {
    const res = await fetch("logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("No se pudo cargar logo:", err);
    return null;
  }
}

async function exportarIngresosPDF() {
  if (!esAdmin) return;
  const filtro = document.getElementById("ingresos-mes")?.value || "";
  if (!filtro || !window.jspdf?.jsPDF) {
    alert("No se puede generar el PDF.");
    return;
  }

  const lista = ingresos.filter(i => {
    if (!i.fechaCreacion?.toDate) return true;
    const f = i.fechaCreacion.toDate();
    return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}` === filtro;
  });

  const doc = new window.jspdf.jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const [anio, mes] = filtro.split("-");
  const nombreMes = obtenerNombreMes(Number(mes) - 1);
  const logo = await obtenerLogoPDF();

  const negro = [24, 24, 24], gris = [100, 100, 100], grisClaro = [242, 242, 242], marron = [156, 113, 81], blanco = [255, 255, 255], verde = [22, 163, 74], rojo = [220, 38, 38];

  if (logo) doc.addImage(logo, "PNG", 14, 9, 25, 18);
  const posText = logo ? 45 : 14;

  doc.setTextColor(...negro);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.text("HN MUEBLES", posText, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...gris);
  doc.text("DISEÑO Y FABRICACIÓN DE MUEBLES A MEDIDA", posText, 23);

  doc.setDrawColor(...marron);
  doc.setLineWidth(1);
  doc.line(14, 31, 283, 31);

  doc.setTextColor(...negro);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("REPORTE DE INGRESOS", 14, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...gris);
  doc.text(`${nombreMes} ${anio}`, 14, 49);

  doc.setFontSize(8);
  doc.text(`Generado el ${obtenerFechaActualTexto()} a las ${obtenerHoraActualTexto()}`, 283, 42, { align: "right" });
  doc.text("Documento administrativo - HN Muebles", 283, 48, { align: "right" });

  let tPresupuesto = 0, tAdelantos = 0, tCobrado = 0, tPendiente = 0;
  const filas = lista.map(i => {
    const total = Number(i.presupuesto) || 0;
    const adelanto = Number(i.adelanto) || 0;
    const cobrado = Number(i.cobrado) || 0;
    const pendiente = Math.max(total - cobrado, 0);
    tPresupuesto += total; tAdelantos += adelanto; tCobrado += cobrado; tPendiente += pendiente;
    return [i.codigo || "", i.cliente || "", i.mueble || "", `Bs. ${formatearMonto(total)}`, `Bs. ${formatearMonto(adelanto)}`, `Bs. ${formatearMonto(cobrado)}`, `Bs. ${formatearMonto(pendiente)}`];
  });

  const tarjetas = [
    { titulo: "PROYECTOS", valor: lista.length.toString(), x: 14 },
    { titulo: "FACTURADO", valor: `Bs. ${formatearMonto(tPresupuesto)}`, x: 81 },
    { titulo: "COBRADO", valor: `Bs. ${formatearMonto(tCobrado)}`, x: 148 },
    { titulo: "PENDIENTE", valor: `Bs. ${formatearMonto(tPendiente)}`, x: 215 }
  ];

  tarjetas.forEach((t, idx) => {
    doc.setFillColor(...grisClaro);
    doc.roundedRect(t.x, 56, 60, 20, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...gris);
    doc.text(t.titulo, t.x + 5, 63);
    doc.setFontSize(idx === 0 ? 13 : 10);
    doc.setTextColor(...(idx === 3 ? rojo : idx === 2 ? verde : negro));
    doc.text(t.valor, t.x + 5, 71);
  });

  if (typeof doc.autoTable === "function") {
    doc.autoTable({
      startY: 84,
      margin: { left: 14, right: 14 },
      head: [["CÓDIGO", "CLIENTE", "PROYECTO", "TOTAL", "ADELANTO", "COBRADO", "PENDIENTE"]],
      body: filas,
      theme: "grid",
      styles: { font: "helvetica", fontSize: 8, cellPadding: 3, lineColor: [220, 220, 220], lineWidth: 0.25, textColor: [45, 45, 45] },
      headStyles: { fillColor: negro, textColor: blanco, fontStyle: "bold", fontSize: 8, halign: "center", valign: "middle", cellPadding: 3.5 },
      bodyStyles: { valign: "middle" },
      alternateRowStyles: { fillColor: [249, 249, 249] },
      columnStyles: {
        0: { cellWidth: 25, halign: "center" },
        1: { cellWidth: 45 },
        2: { cellWidth: 64 },
        3: { cellWidth: 36, halign: "right" },
        4: { cellWidth: 36, halign: "right" },
        5: { cellWidth: 36, halign: "right" },
        6: { cellWidth: 36, halign: "right" }
      },
      didParseCell: function(data) {
        if (data.section === "body" && data.column.index === 6) {
          const num = Number(String(data.cell.raw).replace("Bs.", "").replace(/\./g, "").replace(",", ".").trim()) || 0;
          data.cell.styles.textColor = num > 0 ? rojo : verde;
        }
      }
    });
  }

  let posFin = doc.lastAutoTable?.finalY || 160;
  posFin += 8;
  doc.setDrawColor(...marron);
  doc.setLineWidth(0.6);
  doc.line(14, posFin, 283, posFin);
  posFin += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...negro);
  doc.text("RESUMEN DEL PERÍODO", 14, posFin);
  posFin += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...gris);
  doc.text(`Total facturado: Bs. ${formatearMonto(tPresupuesto)}`, 14, posFin);
  doc.text(`Total de adelantos: Bs. ${formatearMonto(tAdelantos)}`, 82, posFin);
  doc.text(`Total cobrado: Bs. ${formatearMonto(tCobrado)}`, 158, posFin);
  doc.setTextColor(...rojo);
  doc.text(`Total pendiente: Bs. ${formatearMonto(tPendiente)}`, 222, posFin);

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(14, 195, 283, 195);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...gris);
  doc.text("HN MUEBLES · Diseño y fabricación de muebles a medida", 14, 201);
  doc.text(`Reporte correspondiente a ${nombreMes} ${anio}`, 283, 201, { align: "right" });

  doc.save(`HN-MUEBLES-Reporte-Ingresos-${anio}-${mes}.pdf`);
}

// ============================================================
// WHATSAPP
// ============================================================

function notificarWhatsApp(index) {
  if (!esAdmin) return;
  const p = proyectos[index];
  if (!p || !p.telefono) return;
  let num = p.telefono.toString().replace(/\D/g, "");
  if (!num.startsWith("591") && num.length === 8) num = "591" + num;

  const link = window.location.origin + window.location.pathname + `?codigo=${encodeURIComponent(p.codigo)}`;
  const fecha = p.fechaEntrega ? p.fechaEntrega.split("-").reverse().join("/") : "Por coordinar";
  const msg = `Hola *${p.cliente}* 👋, desde *HN Muebles* te informamos el estado de tu proyecto *"${p.mueble}"*:\n\n🛠️ *Estado:* ${p.estado}\n📊 *Progreso:* ${p.progreso}%\n📅 *Entrega:* ${fecha}\n\n🔍 *Consulta tu proyecto:*:\n${link}`;

  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
}

// ============================================================
// CLOUDINARY SUBIDAS
// ============================================================

async function subirArchivoCloudinary(archivo, progresoCallback) {
  const formData = new FormData();
  formData.append("file", archivo);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const recurso = archivo.type.startsWith("video/") ? "video" : "image";
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${recurso}/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.addEventListener("progress", e => {
      if (e.lengthComputable) progresoCallback?.((e.loaded / e.total) * 100);
    });
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ tipo: archivo.type.startsWith("video/") ? "video" : "imagen", url: data.secure_url, publicId: data.public_id, nombre: archivo.name });
        } catch (err) { reject(err); }
      } else { reject(new Error(`Cloudinary respondió ${xhr.status}`)); }
    };
    xhr.onerror = () => reject(new Error("Error de conexión con Cloudinary."));
    xhr.send(formData);
  });
}

// ============================================================
// PORTAFOLIO PÚBLICO Y ADMIN
// ============================================================

async function cargarPortafolioPublico() {
  const container = document.getElementById("portfolio-grid");
  if (!container) return;
  try {
    const snap = await db.collection("portafolio").orderBy("creadoEn", "desc").get();
    portafolio = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderPortafolioPublico();
  } catch (err) {
    console.error("Error cargando portafolio público:", err);
    container.innerHTML = `<div class="portfolio-empty"><i class="fa-solid fa-images"></i><p>Portafolio disponible próximamente.</p></div>`;
  }
}

async function cargarPortafolioAdmin() {
  if (!esAdmin || !auth.currentUser) return;
  try {
    const snap = await db.collection("portafolio").orderBy("creadoEn", "desc").get();
    portafolio = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderPortafolioAdmin();
  } catch (err) {
    console.error("Error portafolio admin:", err);
  }
}

function renderPortafolioPublico() {
  const container = document.getElementById("portfolio-grid");
  if (!container) return;
  container.innerHTML = "";

  if (!portafolio.length) {
    container.innerHTML = `<div class="portfolio-empty"><i class="fa-solid fa-images" style="font-size:2rem;color:#9c7151;margin-bottom:10px;"></i><p>Próximamente mostraremos trabajos aquí.</p></div>`;
    return;
  }

  portafolio.forEach((trabajo, index) => {
    const media = Array.isArray(trabajo.media) ? trabajo.media : [];
    const primera = media[0];
    if (!primera) return;

    const card = document.createElement("article");
    card.className = "portfolio-card";
    card.innerHTML = `
      <div class="portfolio-media" onclick="abrirGaleriaPortafolio(${index})" style="cursor:pointer;">
        ${primera.tipo === "video" ? `<video src="${primera.url}" muted playsinline preload="metadata"></video><div class="portfolio-video-badge"><i class="fa-solid fa-video"></i> Video</div>` : `<img src="${primera.url}" alt="" loading="lazy"/>`}
        ${media.length > 1 ? `<div class="portfolio-video-badge" style="right:10px;left:auto;"><i class="fa-solid fa-images"></i> ${media.length}</div>` : ""}
      </div>
      <div class="portfolio-card-body">
        <div class="portfolio-card-title">${escaparHTML(trabajo.titulo || "Proyecto")}</div>
        <div class="portfolio-card-description">${escaparHTML(trabajo.descripcion || "")}</div>
        <button type="button" onclick="abrirGaleriaPortafolio(${index})" style="margin-top:12px;width:100%;border:none;padding:10px;border-radius:7px;cursor:pointer;background:#9c7151;color:#fff;font-weight:bold;"><i class="fa-solid fa-expand"></i> Ver trabajo</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function crearModalGaleria() {
  if (document.getElementById("portfolio-gallery-modal")) return;
  const modal = document.createElement("div");
  modal.id = "portfolio-gallery-modal";
  modal.innerHTML = `
    <div id="portfolio-gallery-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;">
      <button type="button" onclick="cerrarGaleriaPortafolio()" style="position:fixed;top:20px;right:25px;z-index:100001;width:45px;height:45px;border:none;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;font-size:22px;cursor:pointer;">✕</button>
      <button type="button" onclick="mediaGaleriaAnterior()" style="position:fixed;left:20px;top:50%;transform:translateY(-50%);z-index:100001;width:50px;height:50px;border:none;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;font-size:25px;cursor:pointer;">‹</button>
      <div id="portfolio-gallery-content" style="max-width:95vw;max-height:90vh;display:flex;align-items:center;justify-content:center;position:relative;"></div>
      <button type="button" onclick="mediaGaleriaSiguiente()" style="position:fixed;right:20px;top:50%;transform:translateY(-50%);z-index:100001;width:50px;height:50px;border:none;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;font-size:25px;cursor:pointer;">›</button>
      <div id="portfolio-gallery-counter" style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);color:#fff;background:rgba(0,0,0,.6);padding:7px 14px;border-radius:20px;font-size:13px;"></div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById("portfolio-gallery-overlay")?.addEventListener("click", e => {
    if (e.target.id === "portfolio-gallery-overlay") cerrarGaleriaPortafolio();
  });
}

function abrirGaleriaPortafolio(index) {
  if (!portafolio[index]?.media?.length) return;
  crearModalGaleria();
  galeriaActual = index;
  mediaActual = 0;
  actualizarGaleria();
  const modal = document.getElementById("portfolio-gallery-modal");
  if (modal) modal.style.display = "block";
  document.body.style.overflow = "hidden";
}

function actualizarGaleria() {
  const trabajo = portafolio[galeriaActual];
  if (!trabajo?.media?.length) return;
  if (mediaActual < 0) mediaActual = trabajo.media.length - 1;
  if (mediaActual >= trabajo.media.length) mediaActual = 0;
  const archivo = trabajo.media[mediaActual];
  const content = document.getElementById("portfolio-gallery-content");
  const counter = document.getElementById("portfolio-gallery-counter");
  if (!content) return;

  content.innerHTML = archivo.tipo === "video" 
    ? `<video src="${archivo.url}" controls autoplay playsinline style="max-width:90vw;max-height:82vh;border-radius:8px;"></video>`
    : `<img src="${archivo.url}" alt="" style="max-width:90vw;max-height:82vh;object-fit:contain;border-radius:8px;"/>`;
  if (counter) counter.innerText = `${mediaActual + 1} / ${trabajo.media.length}`;
}

const mediaGaleriaAnterior = () => { mediaActual--; actualizarGaleria(); };
const mediaGaleriaSiguiente = () => { mediaActual++; actualizarGaleria(); };

function cerrarGaleriaPortafolio() {
  const modal = document.getElementById("portfolio-gallery-modal");
  if (modal) modal.style.display = "none";
  restaurarScrollSiNoHayVentanas();
}

document.addEventListener("keydown", e => {
  const modal = document.getElementById("portfolio-gallery-modal");
  if (!modal || modal.style.display === "none") return;
  if (e.key === "Escape") cerrarGaleriaPortafolio();
  if (e.key === "ArrowLeft") mediaGaleriaAnterior();
  if (e.key === "ArrowRight") mediaGaleriaSiguiente();
});

function mostrarPreviewArchivos() {
  const container = document.getElementById("portfolio-files-preview");
  const fotos = Array.from(document.getElementById("portfolio-fotos")?.files || []);
  const videos = Array.from(document.getElementById("portfolio-videos")?.files || []);
  if (!container) return;
  container.innerHTML = "";

  [...fotos, ...videos].forEach(archivo => {
    const div = document.createElement("div");
    div.className = "file-preview";
    const url = URL.createObjectURL(archivo);
    div.innerHTML = archivo.type.startsWith("video/")
      ? `<video src="${url}" muted></video><span class="file-preview-type"><i class="fa-solid fa-video"></i> Video</span>`
      : `<img src="${url}" alt=""><span class="file-preview-type"><i class="fa-solid fa-image"></i> Foto</span>`;
    container.appendChild(div);
  });
}

async function publicarTrabajoPortafolio(e) {
  e.preventDefault();
  if (!esAdmin || !auth.currentUser) { alert("Inicia sesión como administrador."); return; }

  const titulo = document.getElementById("portfolio-titulo")?.value.trim();
  const descripcion = document.getElementById("portfolio-descripcion")?.value.trim() || "";
  const archivos = [...Array.from(document.getElementById("portfolio-fotos")?.files || []), ...Array.from(document.getElementById("portfolio-videos")?.files || [])];

  if (!titulo || !archivos.length) { alert("Escribe un título y selecciona al menos una foto o video."); return; }

  const boton = document.getElementById("btn-publicar-portafolio");
  const progContainer = document.getElementById("portfolio-upload-progress");
  const progBar = document.getElementById("portfolio-progress-bar");
  const progText = document.getElementById("portfolio-progress-text");

  try {
    if (boton) { boton.disabled = true; boton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo...'; }
    progContainer?.classList.remove("hidden");

    const media = [];
    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i];
      if (progText) progText.innerText = `Subiendo ${i + 1} de ${archivos.length}: ${archivo.name}`;
      const resultado = await subirArchivoCloudinary(archivo, progreso => {
        if (progBar) progBar.style.width = `${((i + progreso / 100) / archivos.length) * 100}%`;
      });
      media.push(resultado);
    }

    if (progText) progText.innerText = "Guardando información...";
    await db.collection("portafolio").add({
      titulo, descripcion, media,
      creadoPor: auth.currentUser.email,
      creadoEn: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Trabajo publicado correctamente.");
    document.getElementById("form-portafolio")?.reset();
    const preview = document.getElementById("portfolio-files-preview");
    if (preview) preview.innerHTML = "";
    progContainer?.classList.add("hidden");

    await cargarPortafolioAdmin();
    await cargarPortafolioPublico();
  } catch (err) {
    console.error("ERROR PORTAFOLIO:", err);
    alert("No se pudo publicar el trabajo.");
  } finally {
    if (boton) { boton.disabled = false; boton.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Publicar Trabajo'; }
  }
}

function renderPortafolioAdmin() {
  const container = document.getElementById("lista-portafolio-admin");
  const total = document.getElementById("total-portafolio");
  if (total) total.innerText = portafolio.length;
  if (!container) return;

  container.innerHTML = "";
  if (!portafolio.length) {
    container.innerHTML = `<div style="text-align:center;color:#777;padding:25px;">Todavía no tienes trabajos publicados.</div>`;
    return;
  }

  portafolio.forEach((trabajo, index) => {
    const card = document.createElement("div");
    card.className = "portfolio-admin-card";
    const primera = trabajo.media?.[0];

    card.innerHTML = `
      ${primera?.tipo === "video" ? `<video src="${primera.url}" class="portfolio-admin-thumb" muted preload="metadata"></video>` : `<img src="${primera?.url || ""}" class="portfolio-admin-thumb" alt="">`}
      <div class="portfolio-admin-info">
        <strong>${escaparHTML(trabajo.titulo || "")}</strong>
        <p>${escaparHTML(trabajo.descripcion || "")}</p>
        <p>${trabajo.media?.length || 0} archivo(s)</p>
      </div>
      <div class="portfolio-admin-actions">
        <button type="button" onclick="abrirGaleriaPortafolio(${index})" style="background:#3b82f6;color:#fff;border:none;padding:7px 10px;border-radius:6px;cursor:pointer;"><i class="fa-solid fa-eye"></i> Ver</button>
        <button type="button" class="delete-portfolio-btn" onclick="eliminarTrabajoPortafolio('${trabajo.id}')"><i class="fa-solid fa-trash"></i> Eliminar</button>
      </div>
    `;
    container.appendChild(card);
  });
}

async function eliminarTrabajoPortafolio(id) {
  if (!esAdmin || !auth.currentUser || !confirm("¿Seguro que quieres eliminar este trabajo?")) return;
  try {
    await db.collection("portafolio").doc(id).delete();
    await cargarPortafolioAdmin();
    await cargarPortafolioPublico();
    alert("Trabajo eliminado correctamente.");
  } catch (err) {
    console.error("Error eliminando trabajo:", err);
  }
}

// ============================================================
// DOM READY & EVENT LISTENERS
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Login
  const formLogin = document.getElementById("form-login");
  if (formLogin) {
    formLogin.addEventListener("submit", async e => {
      e.preventDefault();
      const email = document.getElementById("input-email")?.value.trim().toLowerCase();
      const password = document.getElementById("input-pass")?.value || "";
      const errorMsg = document.getElementById("login-error-msg");
      errorMsg?.classList.add("hidden");

      if (!email || !password) {
        if (errorMsg) { errorMsg.textContent = "Ingresa tu correo y contraseña."; errorMsg.classList.remove("hidden"); }
        return;
      }
      try {
        await auth.signInWithEmailAndPassword(email, password);
        const passInput = document.getElementById("input-pass");
        if (passInput) passInput.value = "";
      } catch (err) {
        if (errorMsg) { errorMsg.textContent = "Correo o contraseña incorrectos."; errorMsg.classList.remove("hidden"); }
      }
    });
  }

  // Búsqueda pública
  const formBuscar = document.getElementById("form-buscar");
  if (formBuscar) {
    formBuscar.addEventListener("submit", async e => {
      e.preventDefault();
      const codigo = document.getElementById("input-codigo")?.value.trim().toUpperCase();
      if (codigo) await buscarProyectoPublico(codigo);
    });
  }

  // Búsqueda por URL
  const urlParams = new URLSearchParams(window.location.search);
  const codigoUrl = urlParams.get("codigo");
  if (codigoUrl) {
    const inputCodigo = document.getElementById("input-codigo");
    if (inputCodigo) inputCodigo.value = codigoUrl;
    buscarProyectoPublico(codigoUrl.trim().toUpperCase());
  }

  // Cálculo de nuevo proyecto
  const presInput = document.getElementById("nuevo-presupuesto");
  const adelInput = document.getElementById("nuevo-adelanto");

  const calcularSaldoNuevo = () => {
    const total = Number(presInput?.value) || 0;
    const adelanto = Number(adelInput?.value) || 0;
    const saldo = Math.max(total - adelanto, 0);

    const tPrev = document.getElementById("nuevo-total-preview");
    const aPrev = document.getElementById("nuevo-adelanto-preview");
    const sPrev = document.getElementById("nuevo-saldo-preview");

    if (tPrev) tPrev.innerText = `Bs. ${formatearMonto(total)}`;
    if (aPrev) aPrev.innerText = `Bs. ${formatearMonto(adelanto)}`;
    if (sPrev) sPrev.innerText = `Bs. ${formatearMonto(saldo)}`;
  };

  presInput?.addEventListener("input", calcularSaldoNuevo);
  adelInput?.addEventListener("input", calcularSaldoNuevo);
  calcularSaldoNuevo();

  // Crear nuevo proyecto
  const formNuevo = document.getElementById("form-nuevo-proyecto");
  if (formNuevo) {
    formNuevo.addEventListener("submit", async e => {
      e.preventDefault();
      if (!esAdmin || !auth.currentUser) return;

      const codigo = document.getElementById("nuevo-codigo")?.value.trim().toUpperCase() || generarCodigoAleatorio();
      const cliente = document.getElementById("nuevo-cliente")?.value.trim() || "";
      const mueble = document.getElementById("nuevo-mueble")?.value.trim() || "";
      const telefono = document.getElementById("nuevo-telefono")?.value.trim() || "";
      const presupuesto = Number(document.getElementById("nuevo-presupuesto")?.value) || 0;
      const adelanto = Number(document.getElementById("nuevo-adelanto")?.value) || 0;
      const fechaEntrega = document.getElementById("nuevo-fecha")?.value || "";
      const pendiente = Math.max(presupuesto - adelanto, 0);

      const pRef = db.collection("proyectos").doc();
      const iRef = db.collection("ingresos").doc();
      const pubRef = db.collection("proyectos_publicos").doc(pRef.id);

      try {
        const batch = db.batch();
        batch.set(pRef, { codigo, cliente, mueble, telefono, estado: "Diseño Aprobado", progreso: 20, detalles: "Diseño confirmado por WhatsApp. Listo para corte.", presupuesto, adelanto, fechaEntrega, creadoEn: firebase.firestore.FieldValue.serverTimestamp() });
        batch.set(iRef, { proyectoId: pRef.id, codigo, cliente, mueble, presupuesto, adelanto, pagosFinales: 0, cobrado: adelanto, pendiente, fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(), fechaUltimoPago: adelanto > 0 ? firebase.firestore.FieldValue.serverTimestamp() : null });
        batch.set(pubRef, { codigo, cliente, mueble, estado: "Diseño Aprobado", progreso: 20, detalles: "Diseño confirmado por WhatsApp. Listo para corte.", fechaEntrega });

        await batch.commit();
        formNuevo.reset();
        llenarCodigoAutomatico();
        calcularSaldoNuevo();
        await cargarProyectosDesdeNube();
        await cargarIngresosDesdeNube();
        renderProyectosAdmin();
        renderGestionIngresos();
        alert("Proyecto guardado correctamente.");
      } catch (err) {
        console.error("Error creando proyecto:", err);
        alert("No se pudo guardar el proyecto.");
      }
    });
  }

  // Filtro de ingresos
  const filtroIngresos = document.getElementById("ingresos-mes");
  if (filtroIngresos) {
    filtroIngresos.value = obtenerMesFiltroActual();
    filtroIngresos.addEventListener("change", renderGestionIngresos);
  }

  // Portafolio Listeners
  cargarPortafolioPublico();
  document.getElementById("portfolio-fotos")?.addEventListener("change", mostrarPreviewArchivos);
  document.getElementById("portfolio-videos")?.addEventListener("change", mostrarPreviewArchivos);
  document.getElementById("form-portafolio")?.addEventListener("submit", publicarTrabajoPortafolio);

  // Cerrar modales por click en fondo o tecla Escape
  const modalIngresos = document.getElementById("modal-ingresos");
  const modalPortafolio = document.getElementById("modal-portafolio");

  modalIngresos?.addEventListener("click", e => { if (e.target === modalIngresos) cerrarVentanaIngresos(); });
  modalPortafolio?.addEventListener("click", e => { if (e.target === modalPortafolio) cerrarVentanaPortafolio(); });

  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (modalIngresos && !modalIngresos.classList.contains("hidden")) { cerrarVentanaIngresos(); return; }
    if (modalPortafolio && !modalPortafolio.classList.contains("hidden")) { cerrarVentanaPortafolio(); return; }
  });

  const nuevoCodigo = document.getElementById("nuevo-codigo");
  if (nuevoCodigo && !nuevoCodigo.value) llenarCodigoAutomatico();
});
