// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCLrVUpGCTxFxuMR0ATlwj2t3osSP0dD7Y",
  authDomain: "hn-muebles.firebaseapp.com",
  projectId: "hn-muebles",
  storageBucket: "hn-muebles.firebasestorage.app",
  messagingSenderId: "175601256381",
  appId: "1:175601256381:web:db2031a56faa87a02bf4d4",
  measurementId: "G-8PJGERB67Q"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let proyectos = [];
let esAdmin = false;

// ==========================================
// 1. FUNCIONES UTILITARIAS
// ==========================================

function formatearMonto(valor) {
  const num = Number(valor);
  if (isNaN(num)) return "0";
  return Number.isInteger(num) ? num.toString() : num.toString();
}

function generarCodigoAleatorio() {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let aleatorio = '';
  for (let i = 0; i < 5; i++) {
    aleatorio += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return `HN${aleatorio}`;
}

function llenarCodigoAutomatico() {
  const inputCod = document.getElementById('nuevo-codigo');
  if (inputCod) {
    inputCod.value = generarCodigoAleatorio();
  }
}

function copiarCodigoAlPortapapeles(codigo) {
  navigator.clipboard.writeText(codigo).then(() => {
    alert(`¡Código "${codigo}" copiado al portapapeles!`);
  }).catch(err => {
    console.error("Error al copiar código: ", err);
  });
}

// ==========================================
// 2. CARGA DE DATOS DESDE FIRESTORE
// ==========================================

async function cargarProyectosDesdeNube() {
  try {
    const querySnapshot = await db.collection("proyectos").get();
    proyectos = [];
    querySnapshot.forEach((docSnap) => {
      proyectos.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    if (esAdmin) {
      renderProyectosAdmin();
    }
    
    procesarEnlaceDirectoUrl();
  } catch (error) {
    console.error("Error al cargar proyectos de la nube: ", error);
  }
}

cargarProyectosDesdeNube();

function procesarEnlaceDirectoUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const codigoUrl = urlParams.get('codigo');
  
  if (codigoUrl) {
    setTimeout(() => {
      if (typeof mostrarSeccion === 'function') {
        mostrarSeccion('rastreo');
      } else {
        const secInicio = document.getElementById('sec-inicio');
        const secRastreo = document.getElementById('sec-rastreo');
        if (secInicio) secInicio.classList.add('hidden');
        if (secRastreo) secRastreo.classList.remove('hidden');
      }

      const inputCodigo = document.getElementById('input-codigo');
      const formBuscar = document.getElementById('form-buscar');
      
      if (inputCodigo) inputCodigo.value = codigoUrl;
      if (formBuscar) formBuscar.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 400);
  }
}

// ==========================================
// 3. NAVEGACIÓN
// ==========================================

function mostrarSeccion(seccionId) {
  const secciones = ['sec-inicio', 'sec-rastreo', 'sec-admin', 'sec-reportes'];
  secciones.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  const botones = ['btn-inicio', 'btn-rastreo', 'btn-admin', 'btn-reportes'];
  botones.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  const secDestino = document.getElementById(`sec-${seccionId}`);
  const btnDestino = document.getElementById(`btn-${seccionId}`);

  if (secDestino) secDestino.classList.remove('hidden');
  if (btnDestino) btnDestino.classList.add('active');
}

// ==========================================
// 4. EVENTOS DEL DOM Y LOGIN DIRECTO
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
  
  // BÚSQUEDA DE PROYECTO (CLIENTE)
  const formBuscar = document.getElementById('form-buscar');
  if (formBuscar) {
    formBuscar.addEventListener('submit', function(e) {
      e.preventDefault(); 
      const codigoInput = document.getElementById('input-codigo');
      if (!codigoInput) return;
      
      const codigo = codigoInput.value.trim().toUpperCase();
      const errorMsg = document.getElementById('mensaje-error');
      const resultBox = document.getElementById('resultado-proyecto');
      const encontrado = proyectos.find(p => p.codigo === codigo);

      if (encontrado) {
        if (errorMsg) errorMsg.classList.add('hidden');
        if (resultBox) resultBox.classList.remove('hidden');
        
        document.getElementById('res-codigo').innerText = encontrado.codigo;
        document.getElementById('res-mueble').innerText = encontrado.mueble;
        document.getElementById('res-cliente').innerText = `Cliente: ${encontrado.cliente}`;
        document.getElementById('res-estado').innerText = encontrado.estado;
        document.getElementById('res-porcentaje').innerText = `${encontrado.progreso}%`;
        document.getElementById('res-bar-fill').style.width = `${encontrado.progreso}%`;
        document.getElementById('res-detalles').innerText = encontrado.detalles || `El proyecto se encuentra en etapa de ${encontrado.estado}.`;
      } else {
        if (resultBox) resultBox.classList.add('hidden');
        if (errorMsg) errorMsg.classList.remove('hidden');
      }
    });
  }

  // LOGIN ADMIN CON TU CONTRASEÑA CLÁSICA
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', function(e) {
      e.preventDefault();
      const passInput = document.getElementById('input-pass');
      const passwordEscrita = passInput ? passInput.value.trim() : '';

      if (passwordEscrita === '2803HDabril') {
        esAdmin = true;
        
        const divLogin = document.getElementById('admin-login');
        const divPanel = document.getElementById('admin-panel');
        if (divLogin) divLogin.classList.add('hidden');
        if (divPanel) divPanel.classList.remove('hidden');
        
        if (passInput) passInput.value = '';
        cargarProyectosDesdeNube();
        renderProyectosAdmin();
      } else {
        alert('Contraseña incorrecta');
        if (passInput) passInput.value = '';
      }
    });
  }

  // CÁLCULO EN VIVO
  const inputPresupuestoNuevo = document.getElementById('nuevo-presupuesto');
  const inputAdelantoNuevo = document.getElementById('nuevo-adelanto');
  
  function calcularSaldoEnVivo() {
    const pres = parseFloat(inputPresupuestoNuevo ? inputPresupuestoNuevo.value : 0) || 0;
    const adel = parseFloat(inputAdelantoNuevo ? inputAdelantoNuevo.value : 0) || 0;
    const saldoFinal = pres - adel;
    const lblSaldo = document.getElementById('lbl-nuevo-saldo');
    if (lblSaldo) {
      lblSaldo.innerText = `Bs. ${formatearMonto(saldoFinal)}`;
      lblSaldo.style.color = saldoFinal > 0 ? '#f87171' : '#4ade80';
    }
  }

  if (inputPresupuestoNuevo) inputPresupuestoNuevo.addEventListener('input', calcularSaldoEnVivo);
  if (inputAdelantoNuevo) inputAdelantoNuevo.addEventListener('input', calcularSaldoEnVivo);

  // NUEVO PROYECTO
  const formNuevo = document.getElementById('form-nuevo-proyecto');
  if (formNuevo) {
    formNuevo.addEventListener('submit', async function(e) {
      e.preventDefault();
      const codIn = document.getElementById('nuevo-codigo');
      const cliIn = document.getElementById('nuevo-cliente');
      const mueIn = document.getElementById('nuevo-mueble');
      const telIn = document.getElementById('nuevo-telefono');
      const presIn = document.getElementById('nuevo-presupuesto');
      const adelIn = document.getElementById('nuevo-adelanto');
      const fechaIn = document.getElementById('nuevo-fecha');

      let codigoGenerado = codIn ? codIn.value.trim().toUpperCase() : '';
      if (!codigoGenerado) codigoGenerado = generarCodigoAleatorio();

      const nuevoProyectoObj = {
        codigo: codigoGenerado,
        cliente: cliIn ? cliIn.value.trim() : '',
        mueble: mueIn ? mueIn.value.trim() : '',
        telefono: telIn ? telIn.value.trim() : '',
        estado: 'Diseño Aprobado', 
        progreso: 20, 
        detalles: 'Diseño confirmado por WhatsApp. Listo para corte.',
        presupuesto: presIn ? parseFloat(presIn.value) || 0 : 0,
        adelanto: adelIn ? parseFloat(adelIn.value) || 0 : 0,
        fechaEntrega: fechaIn ? fechaIn.value : ''
      };

      try {
        await db.collection("proyectos").add(nuevoProyectoObj);
        
        if (codIn) codIn.value = '';
        if (cliIn) cliIn.value = '';
        if (mueIn) mueIn.value = '';
        if (telIn) telIn.value = '';
        if (presIn) presIn.value = '';
        if (adelIn) adelIn.value = '';
        if (fechaIn) fechaIn.value = '';
        calcularSaldoEnVivo();
        
        await cargarProyectosDesdeNube();
        renderProyectosAdmin();
      } catch (error) {
        console.error("Error al guardar en Firebase:", error);
        alert("Error al guardar el proyecto.");
      }
    });
  }

  // FILTRO MENSUAL
  const selectMes = document.getElementById('filtro-mes');
  if (selectMes) {
    const fechaActual = new Date();
    const anio = fechaActual.getFullYear();
    const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
    selectMes.value = `${anio}-${mes}`;
    selectMes.addEventListener('change', () => { renderProyectosAdmin(); });
  }
});

function cerrarSesionAdmin() {
  esAdmin = false;
  const divPanel = document.getElementById('admin-panel');
  const divLogin = document.getElementById('admin-login');
  if (divPanel) divPanel.classList.add('hidden');
  if (divLogin) divLogin.classList.remove('hidden');

  document.getElementById('btn-rastreo').classList.remove('hidden');
  document.getElementById('btn-reportes').classList.add('hidden');
  irInicio();
}

// ==========================================
// 5. RENDERIZADO Y ACCIONES DE ADMIN
// ==========================================

function renderProyectosAdmin() {
  const container = document.getElementById('lista-proyectos-admin');
  const totalEl = document.getElementById('total-proyectos');
  if (totalEl) totalEl.innerText = proyectos.length;

  const selectMes = document.getElementById('filtro-mes');
  const mesSeleccionado = selectMes ? selectMes.value : ''; 

  let proyectosFiltradosMes = proyectos.filter(p => {
    if (!p.fechaEntrega || p.fechaEntrega.trim() === '') return true; 
    if (mesSeleccionado) return p.fechaEntrega.startsWith(mesSeleccionado);
    return true;
  });

  let totalPresupuestoMes = 0, totalAdelantoMes = 0, totalSaldoMes = 0;
  proyectosFiltradosMes.forEach(p => {
    const pres = Number(p.presupuesto) || 0;
    const adel = Number(p.adelanto) || 0;
    totalPresupuestoMes += pres;
    totalAdelantoMes += adel;
    totalSaldoMes += (pres - adel);
  });

  if (document.getElementById('reporte-cant-mes')) document.getElementById('reporte-cant-mes').innerText = proyectosFiltradosMes.length;
  if (document.getElementById('reporte-presupuesto-mes')) document.getElementById('reporte-presupuesto-mes').innerText = `Bs. ${formatearMonto(totalPresupuestoMes)}`;
  if (document.getElementById('reporte-adelanto-mes')) document.getElementById('reporte-adelanto-mes').innerText = `Bs. ${formatearMonto(totalAdelantoMes)}`;
  if (document.getElementById('reporte-saldo-mes')) document.getElementById('reporte-saldo-mes').innerText = `Bs. ${formatearMonto(totalSaldoMes)}`;

  if (!container) return;
  container.innerHTML = '';
  const etapas = ['Diseño Aprobado', 'Corte', 'Armado', 'Instalación', 'Finalizado'];

  proyectos.forEach((p, index) => {
    const presupuesto = Number(p.presupuesto) || 0;
    const adelanto = Number(p.adelanto) || 0;
    const saldo = presupuesto - adelanto;
    const fechaFormateada = p.fechaEntrega ? p.fechaEntrega.split('-').reverse().join('/') : 'Sin definir';

    const card = document.createElement('div');
    card.className = 'admin-card';
    card.style.cssText = 'background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.2rem; margin-bottom: 1rem;';

    let botonesEtapas = etapas.map((est, idx) => {
      const activeStyle = p.estado === est ? 'background: #f59e0b; color: #000; font-weight: bold;' : 'background: rgba(255,255,255,0.1); color: #fff;';
      const porcentaje = (idx + 1) * 20;
      return `<button type="button" style="border:none; padding: 0.4rem 0.7rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; margin: 0.2rem; ${activeStyle}" onclick="cambiarEstadoPorId('${p.id}', ${idx}, ${porcentaje})">${est}</button>`;
    }).join('');

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
        <div id="info-view-${index}" style="flex: 1; min-width: 280px;">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span style="background: #f59e0b; color: #000; padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: bold; font-size: 0.85rem;">${p.codigo}</span>
              <button type="button" onclick="copiarCodigoAlPortapapeles('${p.codigo}')" style="background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 0.2rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;"><i class="fa-regular fa-copy"></i> Copiar</button>
            </div>
            <strong style="font-size: 1.05rem;">${p.mueble}</strong>
          </div>
          <p style="margin: 0.4rem 0; color: #a3a3a3; font-size: 0.85rem;"><i class="fa-solid fa-user"></i> Cliente: ${p.cliente} | <i class="fa-solid fa-phone"></i> Tel: ${p.telefono || 'Sin registrar'}</p>
          <p style="margin: 0.2rem 0 0.5rem 0; color: #38bdf8; font-size: 0.85rem;"><i class="fa-regular fa-calendar"></i> Entrega estimada: <strong>${fechaFormateada}</strong></p>
          <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); padding: 0.6rem 0.8rem; border-radius: 8px; margin: 0.6rem 0; display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.85rem;">
            <div><span style="color: #a3a3a3;">Total:</span> <strong>Bs. ${formatearMonto(presupuesto)}</strong></div>
            <div><span style="color: #a3a3a3;">Adelanto:</span> <strong style="color: #38bdf8;">Bs. ${formatearMonto(adelanto)}</strong></div>
            <div><span style="color: #a3a3a3;">Saldo:</span> <strong style="color: ${saldo > 0 ? '#f87171' : '#4ade80'};">Bs. ${formatearMonto(saldo)}</strong></div>
          </div>
          <div style="margin-top: 0.5rem;">${botonesEtapas}</div>
          <div style="margin-top: 0.8rem;">
            <button type="button" onclick="notificarWhatsApp(${index})" style="background: #16a34a; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: bold; display: inline-flex; align-items: center; gap: 0.4rem;"><i class="fa-brands fa-whatsapp"></i> Notificar por WhatsApp con enlace</button>
          </div>
        </div>
        <div id="edit-view-${index}" style="flex: 1; min-width: 280px; display: none; background: rgba(0,0,0,0.4); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15);">
          <h4 style="margin-bottom: 0.6rem; color: #f59e0b; font-size: 0.95rem;">Editar Proyecto</h4>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <input type="text" id="input-edit-codigo-${index}" value="${p.codigo}" style="width:100%; padding:0.4rem; background:#0a0a0a; border:1px solid #404040; color:#fff; border-radius:6px; font-size:0.85rem;">
            <input type="text" id="input-edit-cliente-${index}" value="${p.cliente}" style="width:100%; padding:0.4rem; background:#0a0a0a; border:1px solid #404040; color:#fff; border-radius:6px; font-size:0.85rem;">
            <input type="text" id="input-edit-mueble-${index}" value="${p.mueble}" style="width:100%; padding:0.4rem; background:#0a0a0a; border:1px solid #404040; color:#fff; border-radius:6px; font-size:0.85rem;">
            <input type="text" id="input-edit-telefono-${index}" value="${p.telefono || ''}" style="width:100%; padding:0.4rem; background:#0a0a0a; border:1px solid #404040; color:#fff; border-radius:6px; font-size:0.85rem;">
            <div style="display: flex; gap: 0.5rem;">
              <input type="text" id="input-edit-presupuesto-${index}" value="${formatearMonto(presupuesto)}" style="width:100%; padding:0.4rem; background:#0a0a0a; border:1px solid #404040; color:#fff; border-radius:6px; font-size:0.85rem;">
              <input type="text" id="input-edit-adelanto-${index}" value="${formatearMonto(adelanto)}" style="width:100%; padding:0.4rem; background:#0a0a0a; border:1px solid #404040; color:#fff; border-radius:6px; font-size:0.85rem;">
            </div>
            <input type="date" id="input-edit-fecha-${index}" value="${p.fechaEntrega || ''}" style="width:100%; padding:0.4rem; background:#0a0a0a; border:1px solid #404040; color:#fff; border-radius:6px; font-size:0.85rem;">
            <div style="display: flex; gap: 0.5rem; margin-top: 0.4rem;">
              <button type="button" onclick="guardarEdicionInline('${p.id}', ${index})" style="background: #16a34a; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: bold;">Guardar</button>
              <button type="button" onclick="cancelarEdicionInline(${index})" style="background: #404040; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">Cancelar</button>
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button type="button" id="btn-edit-toggle-${index}" onclick="activarEdicionInline(${index})" style="background: #3b82f6; color: white; border: none; padding: 0.6rem 0.8rem; border-radius: 8px; cursor: pointer;"><i class="fa-solid fa-pen-to-square"></i></button>
          <button type="button" onclick="eliminarProyecto('${p.id}')" style="background: #ef4444; color: white; border: none; padding: 0.6rem 0.8rem; border-radius: 8px; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function activarEdicionInline(index) {
  document.getElementById(`info-view-${index}`).style.display = 'none';
  document.getElementById(`edit-view-${index}`).style.display = 'block';
  document.getElementById(`btn-edit-toggle-${index}`).style.display = 'none';
}

function cancelarEdicionInline(index) {
  document.getElementById(`info-view-${index}`).style.display = 'block';
  document.getElementById(`edit-view-${index}`).style.display = 'none';
  document.getElementById(`btn-edit-toggle-${index}`).style.display = 'block';
}

async function guardarEdicionInline(idFirebase, index) {
  const nuevoCodigo = document.getElementById(`input-edit-codigo-${index}`).value.trim().toUpperCase();
  const nuevoCliente = document.getElementById(`input-edit-cliente-${index}`).value.trim();
  const nuevoMueble = document.getElementById(`input-edit-mueble-${index}`).value.trim();
  const nuevoTelefono = document.getElementById(`input-edit-telefono-${index}`).value.trim();
  const nuevoPresupuesto = parseFloat(document.getElementById(`input-edit-presupuesto-${index}`).value) || 0;
  const nuevoAdelanto = parseFloat(document.getElementById(`input-edit-adelanto-${index}`).value) || 0;
  const nuevaFecha = document.getElementById(`input-edit-fecha-${index}`).value;

  try {
    await db.collection("proyectos").doc(idFirebase).update({
      codigo: nuevoCodigo, cliente: nuevoCliente, mueble: nuevoMueble,
      telefono: nuevoTelefono, presupuesto: nuevoPresupuesto, adelanto: nuevoAdelanto, fechaEntrega: nuevaFecha
    });
    await cargarProyectosDesdeNube();
    renderProyectosAdmin();
  } catch (error) {
    console.error("Error al actualizar:", error);
    alert("Error al actualizar el proyecto.");
  }
}

async function cambiarEstadoPorId(idFirebase, etapaIdx, nuevoProgreso) {
  const etapas = ['Diseño Aprobado', 'Corte', 'Armado', 'Instalación', 'Finalizado'];
  const descripciones = [
    'El diseño ha sido aprobado por WhatsApp. El proyecto ingresa a producción.',
    'Las placas se encuentran en proceso de corte y pegado de tapacantos.',
    'Las piezas se están ensamblando en taller.',
    'El mueble está en proceso de traslado e instalación en sitio.',
    '¡El proyecto ha sido completado e instalado con éxito!'
  ];
  try {
    await db.collection("proyectos").doc(idFirebase).update({
      estado: etapas[etapaIdx], progreso: nuevoProgreso, detalles: descripciones[etapaIdx]
    });
    await cargarProyectosDesdeNube();
    renderProyectosAdmin();
  } catch (error) {
    console.error("Error cambiando estado:", error);
    alert("Error al cambiar estado.");
  }
}

async function eliminarProyecto(idFirebase) {
  if (confirm('¿Deseas eliminar este proyecto de la nube?')) {
    try {
      await db.collection("proyectos").doc(idFirebase).delete();
      await cargarProyectosDesdeNube();
      renderProyectosAdmin();
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Error al eliminar proyecto.");
    }
  }
}

function notificarWhatsApp(index) {
  const p = proyectos[index];
  if (!p.telefono || p.telefono.trim() === '') {
    alert("Este cliente no tiene un número de teléfono registrado.");
    return;
  }
  let num = p.telefono.toString().replace(/\D/g, '');
  if (!num.startsWith('591') && num.length === 8) num = '591' + num;
  
  const presupuesto = Number(p.presupuesto) || 0;
  const adelanto = Number(p.adelanto) || 0;
  const saldo = presupuesto - adelanto;
  const fechaTexto = p.fechaEntrega ? p.fechaEntrega.split('-').reverse().join('/') : 'Por coordinar';
  
  const linkBase = window.location.origin + window.location.pathname;
  const linkDirecto = `${linkBase}?codigo=${p.codigo}`;
  const mensaje = `Hola *${p.cliente}* 👋, desde *HN Muebles* te informamos el estado de tu proyecto *"${p.mueble}"*:\n\n🛠️ *Estado:* ${p.estado}\n📊 *Progreso:* ${p.progreso}%\n📅 *Fecha Estimada de Entrega:* ${fechaTexto}\n\n💰 *Resumen Financiero:*\n• Presupuesto Total: Bs. ${formatearMonto(presupuesto)}\n• Adelanto: Bs. ${formatearMonto(adelanto)}\n• Saldo Pendiente: Bs. ${formatearMonto(saldo)}\n\n🔍 *Haz clic en el siguiente enlace para ver el estado de tu proyecto (Código: ${p.codigo}):*\n${linkDirecto}`;
  
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`, '_blank');
}
