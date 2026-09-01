// HN Muebles - Script Principal (Firebase + Cloudinary)
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

const CLOUDINARY_CLOUD_NAME = "clvoagwx";
const CLOUDINARY_UPLOAD_PRESET = "hn_muebles_portafolio";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
const EMAIL_ADMIN = "hn24muebles@gmail.com";

let proyectos = [], ingresos = [], esAdmin = false, portafolio = [];

const formatearMonto = v => (Number(v) || 0).toFixed(2).replace(/\.00$/, '');
const generarCodigoAleatorio = () => 'HN' + Array.from({length: 5}, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random()*36)]).join('');
const llenarCodigoAutomatico = () => { const i = document.getElementById("nuevo-codigo"); if(i) i.value = generarCodigoAleatorio(); };
const copiarCodigoAlPortapapeles = c => navigator.clipboard.writeText(c).then(() => {
  const b = document.querySelector(`[data-copy-code="${c}"]`);
  if(b) { const t = b.innerText; b.innerText = "Copiado ✓"; setTimeout(() => b.innerText = t, 1200); }
});
const irInicio = () => window.scrollTo({top: 0, behavior: "smooth"});
const escaparHTML = t => { const d = document.createElement("div"); d.textContent = t || ""; return d.innerHTML; };

auth.onAuthStateChanged(async user => {
  if (!user || user.email?.trim().toLowerCase() !== EMAIL_ADMIN.trim().toLowerCase()) {
    esAdmin = false;
    ocultarPanelAdministrador();
    return;
  }
  esAdmin = true;
  mostrarPanelAdministrador();
  try {
    await Promise.all([cargarProyectosDesdeNube(), cargarIngresosDesdeNube(), cargarPortafolioAdmin()]);
    renderProyectosAdmin();
    renderGestionIngresos();
  } catch(e) { console.error(e); }
});

async function cerrarSesionAdmin() {
  try {
    await auth.signOut();
    esAdmin = false;
    ocultarPanelAdministrador();
    document.getElementById("modal-ingresos")?.classList.add("hidden");
    document.getElementById("modal-portafolio")?.classList.add("hidden");
    irInicio();
  } catch(e) { console.error(e); }
}

function mostrarPanelAdministrador() {
  document.getElementById("admin-login")?.classList.add("hidden");
  document.getElementById("admin-panel")?.classList.remove("hidden");
}

function ocultarPanelAdministrador() {
  document.getElementById("admin-panel")?.classList.add("hidden");
  document.getElementById("admin-login")?.classList.remove("hidden");
}

async function cargarProyectosDesdeNube() {
  if (!esAdmin) return;
  const snap = await db.collection("proyectos").get();
  proyectos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function cargarIngresosDesdeNube() {
  if (!esAdmin) return;
  const snap = await db.collection("ingresos").get();
  ingresos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function buscarProyectoPublico(codigo) {
  const err = document.getElementById("mensaje-error"), res = document.getElementById("resultado-proyecto");
  try {
    const snap = await db.collection("proyectos_publicos").where("codigo", "==", codigo).limit(1).get();
    if (snap.empty) { res?.classList.add("hidden"); err?.classList.remove("hidden"); return; }
    const d = snap.docs[0].data();
    err?.classList.add("hidden");
    res?.classList.remove("hidden");
    document.getElementById("res-codigo").innerText = d.codigo || "";
    document.getElementById("res-mueble").innerText = d.mueble || "";
    document.getElementById("res-cliente").innerText = `Cliente: ${d.cliente || ""}`;
    document.getElementById("res-estado").innerText = d.estado || "";
    document.getElementById("res-porcentaje").innerText = `${d.progreso || 0}%`;
  } catch(e) {
    res?.classList.add("hidden");
    if(err) { err.innerText = "No se pudo consultar el proyecto."; err.classList.remove("hidden"); }
  }
}

function renderProyectosAdmin() {
  if (!esAdmin) return;
  const container = document.getElementById("lista-proyectos-admin"), total = document.getElementById("total-proyectos");
  if (total) total.innerText = proyectos.length;
  if (!container) return;
  container.innerHTML = "";
  const etapas = ["Diseño Aprobado", "Corte", "Armado", "Instalación", "Finalizado"];

  proyectos.forEach((p, index) => {
    const pres = Number(p.presupuesto) || 0, adel = Number(p.adelanto) || 0, saldo = Math.max(pres - adel, 0);
    const fecha = p.fechaEntrega ? p.fechaEntrega.split("-").reverse().join("/") : "Sin definir";
    const card = document.createElement("div");
    card.className = "admin-card";
    card.style.cssText = "background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:1.2rem;margin-bottom:1rem;";
    
    const botones = etapas.map((est, idx) => `
      <button type="button" onclick="cambiarEstadoPorId('${p.id}', ${idx}, ${(idx + 1) * 20})" style="border:none;padding:.4rem .7rem;border-radius:6px;cursor:pointer;font-size:.8rem;margin:.2rem;${p.estado === est ? "background:#f59e0b;color:#000;font-weight:bold;" : "background:rgba(255,255,255,.1);color:#fff;"}">${est}</button>
    `).join("");

    card.innerHTML = `
      <div id="info-view-${index}">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div style="flex:1;min-width:260px;">
            <span style="background:#f59e0b;color:#000;padding:.2rem .6rem;border-radius:4px;font-weight:bold;font-size:.85rem;">${p.codigo || ""}</span>
            <strong style="margin-left:.4rem;">${p.mueble || ""}</strong>
            <p style="margin:.4rem 0;color:#a3a3a3;font-size:.85rem;">Cliente: ${p.cliente || ""} | Tel: ${p.telefono || "Sin registrar"}</p>
            <p style="color:#38bdf8;font-size:.85rem;">Entrega: <strong>${fecha}</strong></p>
            <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px;">
              <div class="financial-box" style="background:rgba(56,189,248,.07);border:1px solid rgba(56,189,248,.25);color:#38bdf8;"><span style="font-size:.75rem;opacity:.85;margin-bottom:5px;">Total</span><strong style="font-size:1.05rem;white-space:nowrap;">Bs. ${formatearMonto(pres)}</strong></div>
              <div class="financial-box" style="background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.25);color:#f59e0b;"><span style="font-size:.75rem;opacity:.85;margin-bottom:5px;">Adelanto</span><strong style="font-size:1.05rem;white-space:nowrap;">Bs. ${formatearMonto(adel)}</strong></div>
              <div class="financial-box" style="background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.25);color:#ef4444;"><span style="font-size:.75rem;opacity:.85;margin-bottom:5px;">Pendiente</span><strong style="font-size:1.05rem;white-space:nowrap;">Bs. ${formatearMonto(saldo)}</strong></div>
            </div>
            <div style="margin-top:.7rem;">${botones}</div>
            <button type="button" onclick="notificarWhatsApp(${index})" style="margin-top:.6rem;background:#16a34a;color:white;border:none;padding:.4rem .8rem;border-radius:6px;cursor:pointer;font-size:.85rem;font-weight:bold;">WhatsApp</button>
          </div>
          <div style="display:flex;gap:5px;align-items:flex-start;">
            <button type="button" onclick="activarEdicionInline(${index})" class="admin-action-btn" style="background:#3b82f6;color:#fff;" title="Editar">✏️</button>
            <button type="button" onclick="eliminarProyecto('${p.id}')" class="admin-action-btn" style="background:#ef4444;color:#fff;" title="Eliminar">🗑️</button>
          </div>
        </div>
      </div>`;
    container.appendChild(card);
  });
}

async function cambiarEstadoPorId(id, etapaIdx, progreso) {
  if (!esAdmin) return;
  const etapas = ["Diseño Aprobado", "Corte", "Armado", "Instalación", "Finalizado"];
  const descripciones = [
    "Diseño confirmado por WhatsApp. Listo para corte.",
    "Las placas se encuentran en proceso de corte y pegado de tapacantos.",
    "Las piezas se están ensamblando en taller.",
    "El mueble está en proceso de traslado e instalación en sitio.",
    "¡El proyecto ha sido completado e instalado con éxito!"
  ];
  const estado = etapas[etapaIdx], detalles = descripciones[etapaIdx];
  try {
    const batch = db.batch();
    batch.update(db.collection("proyectos").doc(id), { estado, progreso, detalles });
    const p = proyectos.find(x => x.id === id);
    const pubSnap = await db.collection("proyectos_publicos").where("codigo", "==", p?.codigo).limit(1).get();
    pubSnap.forEach(d => batch.update(d.ref, { estado, progreso, detalles }));
    await batch.commit();
    await cargarProyectosDesdeNube();
    renderProyectosAdmin();
  } catch(e) { console.error(e); }
}

async function eliminarProyecto(id) {
  if (!esAdmin || !confirm("¿Seguro que quieres eliminar este proyecto?")) return;
  try {
    const p = proyectos.find(x => x.id === id);
    const batch = db.batch();
    batch.delete(db.collection("proyectos").doc(id));
    if (p) {
      (await db.collection("proyectos_publicos").where("codigo", "==", p.codigo).limit(1).get()).forEach(d => batch.delete(d.ref));
      (await db.collection("ingresos").where("proyectoId", "==", id).limit(1).get()).forEach(d => batch.delete(d.ref));
    }
    await batch.commit();
    await Promise.all([cargarProyectosDesdeNube(), cargarIngresosDesdeNube()]);
    renderProyectosAdmin();
    renderGestionIngresos();
  } catch(e) { console.error(e); }
}

function activarEdicionInline(index) {
  const p = proyectos[index], info = document.getElementById(`info-view-${index}`);
  if (!info || !p) return;
  info.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:7px;">
      <input id="edit-codigo-${index}" value="${p.codigo || ""}" placeholder="Código">
      <input id="edit-cliente-${index}" value="${p.cliente || ""}" placeholder="Cliente">
      <input id="edit-mueble-${index}" value="${p.mueble || ""}" placeholder="Mueble">
      <input id="edit-telefono-${index}" value="${p.telefono || ""}" placeholder="WhatsApp">
      <input type="number" id="edit-presupuesto-${index}" value="${p.presupuesto || 0}" placeholder="Presupuesto" min="0" step="0.01">
      <input type="number" id="edit-adelanto-${index}" value="${p.adelanto || 0}" placeholder="Adelanto" min="0" step="0.01">
      <input type="date" id="edit-fecha-${index}" value="${p.fechaEntrega || ""}">
      <div>
        <button type="button" onclick="guardarEdicionInline('${p.id}',${index})" style="background:#16a34a;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">Guardar</button>
        <button type="button" onclick="renderProyectosAdmin()" style="background:#404040;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">Cancelar</button>
      </div>
    </div>`;
}

async function guardarEdicionInline(id, index) {
  if (!esAdmin) return;
  const pAnt = proyectos.find(x => x.id === id), codAnt = pAnt?.codigo || "";
  const codigo = document.getElementById(`edit-codigo-${index}`).value.trim().toUpperCase();
  const cliente = document.getElementById(`edit-cliente-${index}`).value.trim();
  const mueble = document.getElementById(`edit-mueble-${index}`).value.trim();
  const telefono = document.getElementById(`edit-telefono-${index}`).value.trim();
  const presupuesto = Number(document.getElementById(`edit-presupuesto-${index}`).value) || 0;
  const adelanto = Number(document.getElementById(`edit-adelanto-${index}`).value) || 0;
  const fechaEntrega = document.getElementById(`edit-fecha-${index}`).value;

  try {
    await db.collection("proyectos").doc(id).update({ codigo, cliente, mueble, telefono, presupuesto, adelanto, fechaEntrega });
    const ingSnap = await db.collection("ingresos").where("proyectoId", "==", id).limit(1).get();
    if (!ingSnap.empty) {
      const ingDoc = ingSnap.docs[0], ing = ingDoc.data();
      const cobrado = adelanto + (Number(ing.pagosFinales) || 0);
      await ingDoc.ref.update({ codigo, cliente, mueble, presupuesto, adelanto, cobrado, pendiente: Math.max(presupuesto - cobrado, 0) });
    }
    (await db.collection("proyectos_publicos").where("codigo", "==", codAnt).limit(1).get()).forEach(async d => {
      await d.ref.update({ codigo, cliente, mueble, fechaEntrega });
    });
    await Promise.all([cargarProyectosDesdeNube(), cargarIngresosDesdeNube()]);
    renderProyectosAdmin();
    renderGestionIngresos();
    alert("Actualizado correctamente.");
  } catch(e) {
    console.error(e);
    alert("No se pudo actualizar.");
  }
}

function renderGestionIngresos() {
  if (!esAdmin) return;
  const container = document.getElementById("lista-ingresos");
  if (!container) return;
  const filtro = document.getElementById("ingresos-mes")?.value || "";
  let lista = [...ingresos];

  if (filtro) {
    lista = lista.filter(i => {
      const f = i.fechaCreacion?.toDate ? i.fechaCreacion.toDate() : null;
      if (!f) return true;
      return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}` === filtro;
    });
  }

  let totCob = 0, totPend = 0;
  lista.forEach(i => { totCob += Number(i.cobrado) || 0; totPend += Number(i.pendiente) || 0; });

  document.getElementById("ing-resumen-proyectos").innerText = lista.length;
  document.getElementById("ing-resumen-cobrado").innerText = `Bs. ${formatearMonto(totCob)}`;
  document.getElementById("ing-resumen-pendiente").innerText = `Bs. ${formatearMonto(totPend)}`;
  container.innerHTML = "";

  if (!lista.length) {
    container.innerHTML = '<div style="text-align:center;color:#777;padding:25px;">No hay registros para este mes.</div>';
    return;
  }

  lista.forEach(i => {
    const pres = Number(i.presupuesto) || 0, adel = Number(i.adelanto) || 0, cob = Number(i.cobrado) || 0, pend = Math.max(pres - cob, 0);
    const card = document.createElement("div");
    card.style.cssText = "background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.09);border-radius:9px;padding:10px;margin-bottom:7px;";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px;">
        <div><strong>${i.cliente || ""}</strong><div style="color:#a3a3a3;font-size:.75rem;">${i.codigo || ""} · ${i.mueble || ""}</div></div>
        <div style="color:#38bdf8;font-weight:bold;font-size:.85rem;">Total: Bs. ${formatearMonto(pres)}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:8px;">
        <div class="summary-box amber">Adelanto<strong>Bs. ${formatearMonto(adel)}</strong></div>
        <div class="summary-box green">Cobrado<strong>Bs. ${formatearMonto(cob)}</strong></div>
        <div class="summary-box red">Pendiente<strong>Bs. ${formatearMonto(pend)}</strong></div>
      </div>
      ${pend > 0 ? `
        <div style="display:flex;gap:5px;margin-top:8px;">
          <input type="number" min="0" step="0.01" id="pago-${i.id}" placeholder="Monto pagado">
          <button type="button" onclick="registrarPago('${i.id}')" style="background:#16a34a;color:#fff;border:none;border-radius:6px;padding:7px 10px;cursor:pointer;font-weight:bold;">Registrar</button>
        </div>` : '<div style="margin-top:8px;color:#4ade80;font-size:.78rem;text-align:center;"><i class="fa-solid fa-circle-check"></i> Pagado completamente</div>'}`;
    container.appendChild(card);
  });
}

async function registrarPago(id) {
  if (!esAdmin) return;
  const monto = Number(document.getElementById(`pago-${id}`)?.value) || 0;
  if (monto <= 0) return;
  const i = ingresos.find(x => x.id === id);
  if (!i) return;
  const pres = Number(i.presupuesto) || 0, cob = Number(i.cobrado) || 0, pend = Math.max(pres - cob, 0);
  const pago = Math.min(monto, pend);
  if (pago <= 0) return;
  
  try {
    await db.collection("ingresos").doc(id).update({
      pagosFinales: (Number(i.pagosFinales) || 0) + pago,
      cobrado: cob + pago,
      pendiente: Math.max(pres - (cob + pago), 0),
      fechaUltimoPago: firebase.firestore.FieldValue.serverTimestamp()
    });
    await cargarIngresosDesdeNube();
    renderGestionIngresos();
  } catch(e) { console.error(e); }
}

async function obtenerLogoPDF() {
  try {
    const res = await fetch("logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise(res => { const r = new FileReader(); r.onloadend = () => res(r.result); r.readAsDataURL(blob); });
  } catch(e) { return null; }
}

async function exportarIngresosPDF() {
  if (!esAdmin) return;
  const filtro = document.getElementById("ingresos-mes")?.value || "";
  if (!filtro || !window.jspdf?.jsPDF) return;

  const lista = ingresos.filter(i => {
    const f = i.fechaCreacion?.toDate ? i.fechaCreacion.toDate() : null;
    if (!f) return true;
    return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}` === filtro;
  });

  const doc = new window.jspdf.jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const [anio, mes] = filtro.split("-");
  const nombresMes = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const nombreMes = nombresMes[Number(mes) - 1] || mes;
  const logo = await obtenerLogoPDF();

  let totP = 0, totA = 0, totC = 0, totPe = 0;
  const filas = lista.map(i => {
    const p = Number(i.presupuesto) || 0, a = Number(i.adelanto) || 0, c = Number(i.cobrado) || 0, pe = Math.max(p - c, 0);
    totP += p; totA += a; totC += c; totPe += pe;
    return [i.codigo || "", i.cliente || "", i.mueble || "", `Bs. ${formatearMonto(p)}`, `Bs. ${formatearMonto(a)}`, `Bs. ${formatearMonto(c)}`, `Bs. ${formatearMonto(pe)}`];
  });

  if (logo) { try { doc.addImage(logo, "PNG", 14, 10, 25, 18); } catch(e){} }
  const posTxt = logo ? 45 : 14;

  doc.setTextColor(18, 18, 18); doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.text("HN MUEBLES", posTxt, 17);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(105, 105, 105); doc.text("DISEÑO Y FABRICACIÓN DE MUEBLES A MEDIDA", posTxt, 23);
  doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(156, 113, 81); doc.text("REPORTE DE INGRESOS", 14, 38);
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(18, 18, 18); doc.text(`${nombreMes} ${anio}`, 14, 45);

  const now = new Date();
  doc.setFontSize(8); doc.setTextColor(105, 105, 105);
  doc.text(`Generado el ${now.toLocaleDateString("es-BO")} a las ${now.toLocaleTimeString("es-BO", {hour: "2-digit", minute: "2-digit"})}`, 283, 45, {align: "right"});
  doc.setDrawColor(156, 113, 81); doc.setLineWidth(0.8); doc.line(14, 49, 283, 49);

  const resumenY = 55, ancho = 63, alto = 20;
  const resumen = [
    {t: "PROYECTOS", v: `${lista.length}`, c: [37, 99, 235]},
    {t: "CONTRATADO", v: `Bs. ${formatearMonto(totP)}`, c: [156, 113, 81]},
    {t: "COBRADO", v: `Bs. ${formatearMonto(totC)}`, c: [22, 163, 74]},
    {t: "PENDIENTE", v: `Bs. ${formatearMonto(totPe)}`, c: [220, 38, 38]}
  ];

  resumen.forEach((item, idx) => {
    const x = 14 + idx * (ancho + 5);
    doc.setFillColor(248, 248, 248); doc.setDrawColor(225, 225, 225); doc.roundedRect(x, resumenY, ancho, alto, 3, 3, "FD");
    doc.setFillColor(...item.c); doc.roundedRect(x, resumenY, 2.5, alto, 1, 1, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(105, 105, 105); doc.text(item.t, x + 7, resumenY + 7);
    doc.setFontSize(11); doc.setTextColor(18, 18, 18); doc.text(item.v, x + 7, resumenY + 15);
  });

  if (typeof doc.autoTable === "function") {
    doc.autoTable({
      startY: resumenY + alto + 8,
      margin: {left: 14, right: 14},
      head: [["CÓDIGO", "CLIENTE", "PROYECTO", "TOTAL", "ADELANTO", "COBRADO", "PENDIENTE"]],
      body: filas,
      theme: "grid",
      headStyles: {fillColor: [18,18,18], textColor: [255,255,255], fontStyle: "bold", fontSize: 8, halign: "center", cellPadding: 4},
      bodyStyles: {fontSize: 8, textColor: [45,45,45], cellPadding: 3.5},
      alternateRowStyles: {fillColor: [248,248,248]},
      columnStyles: {0: {cellWidth: 25, halign: "center"}, 1: {cellWidth: 45}, 2: {cellWidth: 65}, 3: {cellWidth: 36, halign: "right"}, 4: {cellWidth: 36, halign: "right"}, 5: {cellWidth: 36, halign: "right"}, 6: {cellWidth: 36, halign: "right"}},
      didParseCell: d => {
        if (d.section === "body") {
          if (d.column.index === 0) { d.cell.styles.fontStyle = "bold"; d.cell.styles.textColor = [156, 113, 81]; }
          if (d.column.index === 6) { d.cell.styles.textColor = [220, 38, 38]; d.cell.styles.fontStyle = "bold"; }
          if (d.column.index === 5) { d.cell.styles.textColor = [22, 163, 74]; }
        }
      },
      didDrawPage: d => {
        const pw = doc.internal.pageSize.getWidth(), ph = doc.internal.pageSize.getHeight();
        doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.4); doc.line(14, ph - 14, pw - 14, ph - 14);
        doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(105, 105, 105);
        doc.text("HN MUEBLES · Reporte interno de ingresos", 14, ph - 8);
        doc.text(`Página ${d.pageNumber}`, pw - 14, ph - 8, {align: "right"});
      }
    });
  }
  doc.save(`HN-MUEBLES-Reporte-Ingresos-${anio}-${mes}.pdf`);
}

function notificarWhatsApp(index) {
  if (!esAdmin) return;
  const p = proyectos[index];
  if (!p || !p.telefono) return;
  let num = p.telefono.toString().replace(/\D/g, "");
  if (!num.startsWith("591") && num.length === 8) num = "591" + num;
  const link = window.location.origin + window.location.pathname + `?codigo=${encodeURIComponent(p.codigo)}`;
  const fecha = p.fechaEntrega ? p.fechaEntrega.split("-").reverse().join("/") : "Por coordinar";
  const msg = `Hola *${p.cliente}* 👋, desde *HN Muebles* te informamos el estado de tu proyecto *"${p.mueble}"*:

🛠️ *Estado:* ${p.estado}

📊 *Progreso:* ${p.progreso}%

📅 *Fecha estimada de entrega:* ${fecha}

🔍 *Consulta el estado de tu proyecto:*
${link}`;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
}

async function cargarPortafolioPublico() {
  const container = document.getElementById("portfolio-grid");
  if (!container) return;
  try {
    const snap = await db.collection("portafolio").orderBy("creadoEn", "desc").get();
    portafolio = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderPortafolioPublico();
  } catch(e) {
    container.innerHTML = '<div class="portfolio-empty"><i class="fa-solid fa-images"></i><p>Portafolio próximamente.</p></div>';
  }
}

function renderPortafolioPublico() {
  const container = document.getElementById("portfolio-grid");
  if (!container) return;
  container.innerHTML = "";
  if (!portafolio.length) {
    container.innerHTML = '<div class="portfolio-empty"><i class="fa-solid fa-images" style="font-size:2rem;color:#9c7151;margin-bottom:10px;"></i><p>Próximamente mostraremos nuestros trabajos aquí.</p></div>';
    return;
  }
  portafolio.forEach(t => {
    const card = document.createElement("article");
    card.className = "portfolio-card";
    const media = t.media || [], first = media[0];
    let mediaHTML = "";
    if (first) {
      if (first.tipo === "video") {
        mediaHTML = `<div class="portfolio-media"><video src="${first.url}" muted playsinline preload="metadata" controls></video><div class="portfolio-video-badge"><i class="fa-solid fa-video"></i> Video</div></div>`;
      } else {
        mediaHTML = `<div class="portfolio-media"><img src="${first.url}" alt="${t.titulo || ""}" loading="lazy"/>${media.length > 1 ? `<div class="portfolio-video-badge"><i class="fa-solid fa-images"></i> ${media.length} archivos</div>` : ""}</div>`;
      }
    }
    card.innerHTML = `${mediaHTML}<div class="portfolio-card-body"><div class="portfolio-card-title">${escaparHTML(t.titulo || "Proyecto HN Muebles")}</div><div class="portfolio-card-description">${escaparHTML(t.descripcion || "")}</div></div>`;
    container.appendChild(card);
  });
}

async function cargarPortafolioAdmin() {
  if (!esAdmin) return;
  try {
    const snap = await db.collection("portafolio").orderBy("creadoEn", "desc").get();
    portafolio = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderPortafolioAdmin();
  } catch(e) { console.error(e); }
}

function mostrarPreviewArchivos() {
  const container = document.getElementById("portfolio-files-preview");
  const fotos = Array.from(document.getElementById("portfolio-fotos")?.files || []);
  const videos = Array.from(document.getElementById("portfolio-videos")?.files || []);
  if (!container) return;
  container.innerHTML = "";
  [...fotos, ...videos].forEach(file => {
    const div = document.createElement("div");
    div.className = "file-preview";
    const url = URL.createObjectURL(file);
    if (file.type.startsWith("video/")) {
      div.innerHTML = `<video src="${url}" muted></video><span class="file-preview-type"><i class="fa-solid fa-video"></i> Video</span>`;
    } else {
      div.innerHTML = `<img src="${url}" alt=""><span class="file-preview-type"><i class="fa-solid fa-image"></i> Foto</span>`;
    }
    container.appendChild(div);
  });
}

function subirArchivoCloudinary(file, idx, total, bar, txt, pct) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", CLOUDINARY_UPLOAD_URL, true);
    xhr.upload.addEventListener("progress", e => {
      if (!e.lengthComputable) return;
      const pFile = (e.loaded / e.total) * 100;
      const pTot = ((idx + pFile / 100) / total) * 100;
      if (bar) bar.style.width = `${pTot}%`;
      if (pct) pct.innerText = `${Math.round(pTot)}%`;
    });
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); } catch(e) { reject(new Error("Respuesta inválida de Cloudinary")); }
      } else {
        let msg = "Error al subir archivo.";
        try { const err = JSON.parse(xhr.responseText); if(err.error?.message) msg = err.error.message; } catch(e){}
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error("Error de red."));
    if (txt) txt.innerText = `Subiendo ${idx + 1} de ${total}: ${file.name}`;
    xhr.send(fd);
  });
}

async function publicarTrabajoPortafolio(e) {
  e.preventDefault();
  if (!esAdmin) { alert("Inicia sesión."); return; }
  const titulo = document.getElementById("portfolio-titulo")?.value.trim() || "";
  const descripcion = document.getElementById("portfolio-descripcion")?.value.trim() || "";
  const fotos = Array.from(document.getElementById("portfolio-fotos")?.files || []);
  const videos = Array.from(document.getElementById("portfolio-videos")?.files || []);
  const archivos = [...fotos, ...videos];

  if (!titulo || !archivos.length) { alert("Completa el título y selecciona al menos un archivo."); return; }
  
  for (const f of archivos) {
    if (f.type.startsWith("image/") && f.size > 15*1024*1024) { alert(`La imagen "${f.name}" supera los 15 MB.`); return; }
    if (f.type.startsWith("video/") && f.size > 100*1024*1024) { alert(`El video "${f.name}" supera los 100 MB.`); return; }
  }

  const btn = document.getElementById("btn-publicar-portafolio");
  const progC = document.getElementById("portfolio-upload-progress");
  const bar = document.getElementById("portfolio-progress-bar");
  const txt = document.getElementById("portfolio-progress-text");
  const pct = document.getElementById("portfolio-progress-percent");

  try {
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo...'; }
    progC?.classList.remove("hidden");
    if (bar) bar.style.width = "0%";
    if (pct) pct.innerText = "0%";

    const media = [];
    for (let i = 0; i < archivos.length; i++) {
      const f = archivos[i];
      const res = await subirArchivoCloudinary(f, i, archivos.length, bar, txt, pct);
      if (!res?.secure_url) throw new Error(`URL no válida para ${f.name}`);
      media.push({
        tipo: f.type.startsWith("video/") ? "video" : "imagen",
        url: res.secure_url,
        public_id: res.public_id || "",
        nombre: f.name
      });
    }

    if (txt) txt.innerText = "Guardando...";
    await db.collection("portafolio").add({
      titulo, descripcion, media,
      creadoPor: auth.currentUser.email,
      creadoEn: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Publicado correctamente.");
    document.getElementById("form-portafolio")?.reset();
    const prev = document.getElementById("portfolio-files-preview");
    if(prev) prev.innerHTML = "";
    progC?.classList.add("hidden");
    await Promise.all([cargarPortafolioAdmin(), cargarPortafolioPublico()]);
  } catch(e) {
    console.error(e);
    alert(`No se pudo publicar: ${e.message}`);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Publicar Trabajo'; }
  }
}

function renderPortafolioAdmin() {
  const container = document.getElementById("lista-portafolio-admin");
  const total = document.getElementById("total-portafolio");
  if (total) total.innerText = portafolio.length;
  if (!container) return;
  container.innerHTML = "";
  if (!portafolio.length) { container.innerHTML = '<div style="text-align:center;color:#777;padding:25px;">No hay trabajos publicados.</div>'; return; }

  portafolio.forEach(t => {
    const card = document.createElement("div");
    card.className = "portfolio-admin-card";
    const thumb = t.media?.[0]?.url || "";
    card.innerHTML = `
      ${t.media?.[0]?.tipo === "video" ? `<video src="${thumb}" class="portfolio-admin-thumb" muted preload="metadata"></video>` : `<img src="${thumb}" class="portfolio-admin-thumb" alt="">`}
      <div class="portfolio-admin-info"><strong>${escaparHTML(t.titulo || "")}</strong><p>${escaparHTML(t.descripcion || "")}</p><p>${t.media?.length || 0} archivo(s)</p></div>
      <div class="portfolio-admin-actions"><button type="button" class="delete-portfolio-btn" onclick="eliminarTrabajoPortafolio('${t.id}')"><i class="fa-solid fa-trash"></i> Eliminar</button></div>`;
    container.appendChild(card);
  });
}

async function eliminarTrabajoPortafolio(id) {
  if (!esAdmin || !confirm("¿Seguro que quieres eliminar este trabajo?")) return;
  try {
    await db.collection("portafolio").doc(id).delete();
    await Promise.all([cargarPortafolioAdmin(), cargarPortafolioPublico()]);
    alert("Eliminado correctamente.");
  } catch(e) { console.error(e); alert("No se pudo eliminar."); }
}

document.addEventListener("DOMContentLoaded", () => {
  const formLogin = document.getElementById("form-login");
  if (formLogin) {
    formLogin.addEventListener("submit", async e => {
      e.preventDefault();
      const email = document.getElementById("input-email")?.value.trim().toLowerCase();
      const pass = document.getElementById("input-pass")?.value || "";
      const err = document.getElementById("login-error-msg");
      const btn = formLogin.querySelector('button[type="submit"]');
      if (err) { err.textContent = ""; err.classList.add("hidden"); }
      if (!email || !pass) { if (err) { err.textContent = "Ingresa correo y contraseña."; err.classList.remove("hidden"); } return; }
      try {
        if (btn) { btn.disabled = true; btn.dataset.orig = btn.innerText; btn.innerText = "Ingresando..."; }
        await auth.signInWithEmailAndPassword(email, pass);
        const pInput = document.getElementById("input-pass"); if(pInput) pInput.value = "";
      } catch(e) {
        let msg = "No se pudo iniciar sesión.";
        if (e.code === "auth/invalid-credential" || e.code === "auth/wrong-password") msg = "Credenciales incorrectas.";
        else if (e.code === "auth/user-not-found") msg = "Cuenta no encontrada.";
        else if (e.code === "auth/too-many-requests") msg = "Demasiados intentos. Espera unos minutos.";
        if (err) { err.textContent = msg; err.classList.remove("hidden"); }
      } finally {
        if (btn) { btn.disabled = false; btn.innerText = btn.dataset.orig || "Ingresar"; }
      }
    });
  }

  const formBuscar = document.getElementById("form-buscar");
  if (formBuscar) {
    formBuscar.addEventListener("submit", async e => {
      e.preventDefault();
      const cod = document.getElementById("input-codigo")?.value.trim().toUpperCase();
      if (cod) await buscarProyectoPublico(cod);
    });
  }

  const presIn = document.getElementById("nuevo-presupuesto"), adelIn = document.getElementById("nuevo-adelanto");
  function calcNuevo() {
    const t = Number(presIn?.value) || 0, a = Number(adelIn?.value) || 0, s = Math.max(t - a, 0);
    const tp = document.getElementById("nuevo-total-preview"), ap = document.getElementById("nuevo-adelanto-preview"), sp = document.getElementById("nuevo-saldo-preview");
    if(tp) tp.innerText = `Bs. ${formatearMonto(t)}`;
    if(ap) ap.innerText = `Bs. ${formatearMonto(a)}`;
    if(sp) sp.innerText = `Bs. ${formatearMonto(s)}`;
  }
  presIn?.addEventListener("input", calcNuevo);
  adelIn?.addEventListener("input", calcNuevo);
  calcNuevo();

  const formNuevo = document.getElementById("form-nuevo-proyecto");
  if (formNuevo) {
    formNuevo.addEventListener("submit", async e => {
      e.preventDefault();
      if (!esAdmin) return;
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

      const pData = { codigo, cliente, mueble, telefono, estado: "Diseño Aprobado", progreso: 20, detalles: "Diseño confirmado por WhatsApp. Listo para corte.", presupuesto, adelanto, fechaEntrega, creadoEn: firebase.firestore.FieldValue.serverTimestamp() };
      const iData = { proyectoId: pRef.id, codigo, cliente, mueble, presupuesto, adelanto, pagosFinales: 0, cobrado: adelanto, pendiente, fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(), fechaUltimoPago: adelanto > 0 ? firebase.firestore.FieldValue.serverTimestamp() : null };
      const pubData = { codigo, cliente, mueble, estado: "Diseño Aprobado", progreso: 20, detalles: "Diseño confirmado por WhatsApp. Listo para corte.", fechaEntrega };

      try {
        const batch = db.batch();
        batch.set(pRef, pData);
        batch.set(iRef, iData);
        batch.set(pubRef, pubData);
        await batch.commit();

        formNuevo.reset();
        llenarCodigoAutomatico();
        calcNuevo();
        await Promise.all([cargarProyectosDesdeNube(), cargarIngresosDesdeNube()]);
        renderProyectosAdmin();
        renderGestionIngresos();
        alert("Proyecto guardado correctamente.");
      } catch(err) {
        console.error(err);
        alert("No se pudo guardar el proyecto.");
      }
    });
  }

  const filtroIng = document.getElementById("ingresos-mes");
  if (filtroIng) {
    const ahora = new Date();
    filtroIng.value = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
    filtroIng.addEventListener("change", renderGestionIngresos);
  }

  cargarPortafolioPublico();
  document.getElementById("portfolio-fotos")?.addEventListener("change", mostrarPreviewArchivos);
  document.getElementById("portfolio-videos")?.addEventListener("change", mostrarPreviewArchivos);
  document.getElementById("form-portafolio")?.addEventListener("submit", publicarTrabajoPortafolio);
});
