// --- BASE DE DATOS INICIAL ---
const proyectosIniciales = [
  { 
    codigo: 'HN-001', 
    cliente: 'Carlos Mendoza', 
    mueble: 'Juego de Comedor en Melamina', 
    telefono: '62037033',
    estado: 'Diseño Aprobado', 
    progreso: 20, 
    detalles: 'Diseño confirmado por WhatsApp. Listo para corte.',
    presupuesto: 3500,
    adelanto: 1500
  }
];

let proyectos = JSON.parse(localStorage.getItem('hn_proyectos')) || proyectosIniciales;

function guardarEnLocalStorage() { 
  localStorage.setItem('hn_proyectos', JSON.stringify(proyectos)); 
}

let esAdmin = false;

// --- 1. NAVEGACIÓN ENTRE SECCIONES ---
function mostrarSeccion(seccionId) {
  const secInicio = document.getElementById('sec-inicio');
  const secRastreo = document.getElementById('sec-rastreo');
  const secAdmin = document.getElementById('sec-admin');

  if (secInicio) secInicio.classList.add('hidden');
  if (secRastreo) secRastreo.classList.add('hidden');
  if (secAdmin) secAdmin.classList.add('hidden');

  const btnInicio = document.getElementById('btn-inicio');
  const btnRastreo = document.getElementById('btn-rastreo');
  const btnAdmin = document.getElementById('btn-admin');

  if (btnInicio) btnInicio.classList.remove('active');
  if (btnRastreo) btnRastreo.classList.remove('active');
  if (btnAdmin) btnAdmin.classList.remove('active');

  const secDestino = document.getElementById(`sec-${seccionId}`);
  const btnDestino = document.getElementById(`btn-${seccionId}`);

  if (secDestino) secDestino.classList.remove('hidden');
  if (btnDestino) btnDestino.classList.add('active');
}

// --- 2. INICIALIZACIÓN Y EVENTOS ---
document.addEventListener('DOMContentLoaded', function() {
  const formBuscar = document.getElementById('form-buscar');
  if (formBuscar) {
    formBuscar.addEventListener('submit', function(e) {
      e.preventDefault();
      const codigoInput = document.getElementById('input-codigo');
      if (!codigoInput) return;
      
      const codigo = codigoInput.value.trim().toUpperCase();
      const encontrado = proyectos.find(p => p.codigo === codigo);
      const errorMsg = document.getElementById('mensaje-error');
      const resultBox = document.getElementById('resultado-proyecto');

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

  // LOGIN ADMIN
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', function(e) {
      e.preventDefault();
      const passInput = document.getElementById('input-pass');
      
      if (passInput && passInput.value === 'hn2026') {
        esAdmin = true;
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        passInput.value = '';
        renderProyectosAdmin();
      } else { 
        alert('Contraseña incorrecta'); 
      }
    });
  }

  // CÁLCULO EN VIVO DEL SALDO AL CREAR PROYECTO
  const inputPresupuestoNuevo = document.getElementById('nuevo-presupuesto');
  const inputAdelantoNuevo = document.getElementById('nuevo-adelanto');
  
  function calcularSaldoEnVivo() {
    const pres = parseFloat(inputPresupuestoNuevo ? inputPresupuestoNuevo.value : 0) || 0;
    const adel = parseFloat(inputAdelantoNuevo ? inputAdelantoNuevo.value : 0) || 0;
    const saldoFinal = pres - adel;
    const lblSaldo = document.getElementById('lbl-nuevo-saldo');
    if (lblSaldo) {
      lblSaldo.innerText = `Bs. ${saldoFinal.toFixed(2)}`;
      lblSaldo.style.color = saldoFinal > 0 ? '#f87171' : '#4ade80';
    }
  }

  if (inputPresupuestoNuevo) inputPresupuestoNuevo.addEventListener('input', calcularSaldoEnVivo);
  if (inputAdelantoNuevo) inputAdelantoNuevo.addEventListener('input', calcularSaldoEnVivo);

  // NUEVO PROYECTO (GUARDAR)
  const formNuevo = document.getElementById('form-nuevo-proyecto');
  if (formNuevo) {
    formNuevo.addEventListener('submit', function(e) {
      e.preventDefault();
      const codIn = document.getElementById('nuevo-codigo');
      const cliIn = document.getElementById('nuevo-cliente');
      const mueIn = document.getElementById('nuevo-mueble');
      const telIn = document.getElementById('nuevo-telefono');
      const presIn = document.getElementById('nuevo-presupuesto');
      const adelIn = document.getElementById('nuevo-adelanto');

      proyectos.push({
        codigo: codIn ? codIn.value.trim().toUpperCase() : '',
        cliente: cliIn ? cliIn.value.trim() : '',
        mueble: mueIn ? mueIn.value.trim() : '',
        telefono: telIn ? telIn.value.trim() : '',
        estado: 'Diseño Aprobado', 
        progreso: 20, 
        detalles: 'Diseño confirmado por WhatsApp. Listo para corte.',
        presupuesto: presIn ? parseFloat(presIn.value) || 0 : 0,
        adelanto: adelIn ? parseFloat(adelIn.value) || 0 : 0
      });

      guardarEnLocalStorage();
      
      if (codIn) codIn.value = '';
      if (cliIn) cliIn.value = '';
      if (mueIn) mueIn.value = '';
      if (telIn) telIn.value = '';
      if (presIn) presIn.value = '';
      if (adelIn) adelIn.value = '';
      calcularSaldoEnVivo();
      
      renderProyectosAdmin();
    });
  }
});

function cerrarSesionAdmin() {
  esAdmin = false;
  document.getElementById('admin-panel').classList.add('hidden');
  document.getElementById('admin-login').classList.remove('hidden');
}

// --- 3. MOSTRAR TARJETAS EN PANEL ADMIN ---
function renderProyectosAdmin() {
  const container = document.getElementById('lista-proyectos-admin');
  const totalEl = document.getElementById('total-proyectos');
  
  if (totalEl) totalEl.innerText = proyectos.length;
  if (!container) return;
  
  container.innerHTML = '';
  const etapas = ['Diseño Aprobado', 'Corte', 'Armado', 'Instalación', 'Finalizado'];

  proyectos.forEach((p, index) => {
    const presupuesto = Number(p.presupuesto) || 0;
    const adelanto = Number(p.adelanto) || 0;
    const saldo = presupuesto - adelanto;

    const card = document.createElement('div');
    card.className = 'admin-card';
    card.style.cssText = 'background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.2rem; margin-bottom: 1rem;';

    let botonesEtapas = etapas.map((est, idx) => {
      const activeStyle = p.estado === est ? 'background: #f59e0b; color: #000; font-weight: bold;' : 'background: rgba(255,255,255,0.1); color: #fff;';
      const porcentaje = (idx + 1) * 20;
      return `<button type="button" style="border:none; padding: 0.4rem 0.7rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; margin: 0.2rem; ${activeStyle}" onclick="cambiarEstadoPorIndice(${index}, ${idx}, ${porcentaje})">${est}</button>`;
    }).join('');

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
        
        <!-- VISTA NORMAL / INFO -->
        <div id="info-view-${index}" style="flex: 1; min-width: 280px;">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <span style="background: #f59e0b; color: #000; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold; font-size: 0.85rem;">${p.codigo}</span>
            <strong style="font-size: 1.05rem;">${p.mueble}</strong>
          </div>
          <p style="margin: 0.4rem 0; color: #a3a3a3; font-size: 0.85rem;">
            <i class="fa-solid fa-user"></i> Cliente: ${p.cliente} | <i class="fa-solid fa-phone"></i> Tel: ${p.telefono || 'Sin registrar'}
          </p>

          <!-- SECCIÓN DE FINANZAS -->
          <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); padding: 0.6rem 0.8rem; border-radius: 8px; margin: 0.6rem 0; display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.85rem;">
            <div><span style="color: #a3a3a3;">Total:</span> <strong>Bs. ${presupuesto.toFixed(2)}</strong></div>
            <div><span style="color: #a3a3a3;">Adelanto:</span> <strong style="color: #38bdf8;">Bs. ${adelanto.toFixed(2)}</strong></div>
            <div><span style="color: #a3a3a3;">Saldo:</span> <strong style="color: ${saldo > 0 ? '#f87171' : '#4ade80'};">Bs. ${saldo.toFixed(2)}</strong></div>
          </div>

          <div style="margin-top: 0.5rem;">${botonesEtapas}</div>
          <div style="margin-top: 0.8rem;">
            <button type="button" onclick="notificarWhatsApp(${index})" style="background: #16a34a; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: bold; display: inline-flex; align-items: center; gap: 0.4rem;">
              <i class="fa-brands fa-whatsapp"></i> Notificar Avance y Saldo por WhatsApp
            </button>
          </div>
        </div>

        <!-- VISTA DE EDICIÓN INLINE (OCULTA POR DEFECTO) -->
        <div id="edit-view-${index}" style="flex: 1; min-width: 280px; display: none; background: rgba(0,0,0,0.4); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15);">
          <h4 style="margin-bottom: 0.6rem; color: #f59e0b; font-size: 0.95rem;">Editar Proyecto y Finanzas</h4>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <div>
              <label style="font-size: 0.75rem; color: #a3a3a3;">Código:</label>
              <input type="text" id="input-edit-codigo-${index}" value="${p.codigo}" style="width:100%; padding:0.4rem; background:#0a0a0a; border:1px solid #404040; color:#fff; border-radius:6px; font-size:0.85rem;">
            </div>
            <div>
              <label style="font-size: 0.75rem; color: #a3a3a3;">Cliente:</label>
              <input type="text" id="input-edit-cliente-${index}" value="${p.cliente}" style="width:100%; padding:0.4rem; background:#0a0a0a; border:1px solid #404040; color:#fff; border-radius:6px; font-size:0.85rem;">
            </div>
            <div>
              <label style="font-size: 0.75rem; color: #a3a3a3;">Mueble:</label>
              <input type="text" id="input-edit-mueble-${index}" value="${p.mueble}" style="width:100%; padding:0.4rem; background:#0a0a0a; border:1px solid #404040; color:#fff; border-radius:6px; font-size:0.85rem;">
            </div>
            <div>
              <label style="font-size: 0.75rem; color: #a3a3a3;">Teléfono:</label>
              <input type="text" id="input-edit-telefono-${index}" value="${p.telefono || ''}" style="width:100%; padding:0.4rem; background:#0a0a0a; border:1px solid #404040; color:#fff; border-radius:6px; font-size:0.85rem;">
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <div style="flex: 1;">
                <label style="font-size: 0.75rem; color: #a3a3a3;">Presupuesto Total:</label>
                <input type="number" id="input-edit-presupuesto-${index}" value="${presupuesto}" style="width:100%; padding:0.4rem; background:#0a0a0a; border:1px solid #404040; color:#fff; border-radius:6px; font-size:0.85rem;">
              </div>
              <div style="flex: 1;">
                <label style="font-size: 0.75rem; color: #a3a3a3;">Adelanto:</label>
                <input type="number" id="input-edit-adelanto-${index}" value="${adelanto}" style="width:100%; padding:0.4rem; background:#0a0a0a; border:1px solid #404040; color:#fff; border-radius:6px; font-size:0.85rem;">
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.4rem;">
              <button type="button" onclick="guardarEdicionInline(${index})" style="background: #16a34a; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: bold;">Guardar</button>
              <button type="button" onclick="cancelarEdicionInline(${index})" style="background: #404040; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">Cancelar</button>
            </div>
          </div>
        </div>

        <!-- BOTONES DE ACCIÓN PRINCIPAL (EDITAR / ELIMINAR) -->
        <div style="display: flex; gap: 0.5rem;">
          <button type="button" id="btn-edit-toggle-${index}" onclick="activarEdicionInline(${index})" title="Editar datos y finanzas" style="background: #3b82f6; color: white; border: none; padding: 0.6rem 0.8rem; border-radius: 8px; cursor: pointer;">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button type="button" onclick="eliminarProyecto(${index})" title="Eliminar proyecto" style="background: #ef4444; color: white; border: none; padding: 0.6rem 0.8rem; border-radius: 8px; cursor: pointer;">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>

      </div>
    `;
    container.appendChild(card);
  });
}

// --- 4. FUNCIONES DE EDICIÓN DIRECTA EN LA TARJETA ---
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

function guardarEdicionInline(index) {
  const nuevoCodigo = document.getElementById(`input-edit-codigo-${index}`).value.trim().toUpperCase();
  const nuevoCliente = document.getElementById(`input-edit-cliente-${index}`).value.trim();
  const nuevoMueble = document.getElementById(`input-edit-mueble-${index}`).value.trim();
  const nuevoTelefono = document.getElementById(`input-edit-telefono-${index}`).value.trim();
  const nuevoPresupuesto = parseFloat(document.getElementById(`input-edit-presupuesto-${index}`).value) || 0;
  const nuevoAdelanto = parseFloat(document.getElementById(`input-edit-adelanto-${index}`).value) || 0;

  if (!nuevoCodigo || !nuevoCliente || !nuevoMueble) {
    alert("Los campos Código, Cliente y Mueble son obligatorios.");
    return;
  }

  proyectos[index].codigo = nuevoCodigo;
  proyectos[index].cliente = nuevoCliente;
  proyectos[index].mueble = nuevoMueble;
  proyectos[index].telefono = nuevoTelefono;
  proyectos[index].presupuesto = nuevoPresupuesto;
  proyectos[index].adelanto = nuevoAdelanto;

  guardarEnLocalStorage();
  renderProyectosAdmin();
}

// --- 5. OTRAS ACCIONES ---
function cambiarEstadoPorIndice(proyectoIdx, etapaIdx, nuevoProgreso) {
  const etapas = ['Diseño Aprobado', 'Corte', 'Armado', 'Instalación', 'Finalizado'];
  const descripciones = [
    'El diseño ha sido aprobado por WhatsApp. El proyecto ingresa a producción.',
    'Las placas se encuentran en proceso de corte y pegado de tapacantos.',
    'Las piezas se están ensamblando en taller.',
    'El mueble está en proceso de traslado e instalación en sitio.',
    '¡El proyecto ha sido completado e instalado con éxito!'
  ];
  
  proyectos[proyectoIdx].estado = etapas[etapaIdx];
  proyectos[proyectoIdx].progreso = nuevoProgreso;
  proyectos[proyectoIdx].detalles = descripciones[etapaIdx];
  
  guardarEnLocalStorage();
  renderProyectosAdmin();
}

function eliminarProyecto(index) {
  if (confirm('¿Deseas eliminar este proyecto?')) {
    proyectos.splice(index, 1);
    guardarEnLocalStorage();
    renderProyectosAdmin();
  }
}

function notificarWhatsApp(index) {
  const p = proyectos[index];
  if (!p.telefono || p.telefono.trim() === '') {
    alert("Este cliente no tiene un número de teléfono registrado. Presiona el botón azul del lápiz para agregarlo.");
    return;
  }
  
  let num = p.telefono.toString().replace(/\D/g, '');
  if (!num.startsWith('591') && num.length === 8) {
    num = '591' + num;
  }
  
  const presupuesto = Number(p.presupuesto) || 0;
  const adelanto = Number(p.adelanto) || 0;
  const saldo = presupuesto - adelanto;

  const mensaje = `Hola *${p.cliente}* 👋, desde *HN Muebles* te informamos el estado de tu proyecto *"${p.mueble}"*:\n\n🛠️ *Estado:* ${p.estado}\n📊 *Progreso:* ${p.progreso}%\n\n💰 *Resumen Financiero:*\n• Presupuesto Total: Bs. ${presupuesto.toFixed(2)}\n• Adelanto: Bs. ${adelanto.toFixed(2)}\n• Saldo Pendiente: Bs. ${saldo.toFixed(2)}\n\nPuedes consultar el detalle ingresando tu código *${p.codigo}* en nuestra web.`;
  
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`, '_blank');
}

if (!localStorage.getItem('hn_proyectos')) { 
  guardarEnLocalStorage(); 
}
