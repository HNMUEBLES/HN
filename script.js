// --- BASE DE DATOS INICIAL ---
const proyectosIniciales = [
  { 
    codigo: 'HN-001', 
    cliente: 'Carlos Mendoza', 
    mueble: 'Juego de Comedor en Melamina', 
    telefono: '62037033',
    estado: 'Diseño Aprobado', 
    progreso: 20, 
    detalles: 'Diseño confirmado por WhatsApp. Listo para corte.' 
  }
];

// Cargar desde LocalStorage o usar la inicial
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

// --- 2. BÚSQUEDA DEL CLIENTE ---
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

  // --- 3. LOGIN ADMINISTRADOR ---
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

  // --- 4. REGISTRAR NUEVO PROYECTO ---
  const formNuevo = document.getElementById('form-nuevo-proyecto');
  if (formNuevo) {
    formNuevo.addEventListener('submit', function(e) {
      e.preventDefault();
      const codIn = document.getElementById('nuevo-codigo');
      const cliIn = document.getElementById('nuevo-cliente');
      const mueIn = document.getElementById('nuevo-mueble');
      const telIn = document.getElementById('nuevo-telefono');

      proyectos.push({
        codigo: codIn ? codIn.value.trim().toUpperCase() : '',
        cliente: cliIn ? cliIn.value.trim() : '',
        mueble: mueIn ? mueIn.value.trim() : '',
        telefono: telIn ? telIn.value.trim() : '',
        estado: 'Diseño Aprobado', 
        progreso: 20, 
        detalles: 'Diseño confirmado por WhatsApp. Listo para corte.'
      });

      guardarEnLocalStorage();
      
      if (codIn) codIn.value = '';
      if (cliIn) cliIn.value = '';
      if (mueIn) mueIn.value = '';
      if (telIn) telIn.value = '';
      
      renderProyectosAdmin();
    });
  }
});

function cerrarSesionAdmin() {
  esAdmin = false;
  document.getElementById('admin-panel').classList.add('hidden');
  document.getElementById('admin-login').classList.remove('hidden');
}

// --- 5. MOSTRAR TARJETAS EN PANEL ADMIN ---
function renderProyectosAdmin() {
  const container = document.getElementById('lista-proyectos-admin');
  const totalEl = document.getElementById('total-proyectos');
  
  if (totalEl) totalEl.innerText = proyectos.length;
  if (!container) return;
  
  container.innerHTML = '';
  
  // Etapas del proceso requeridas
  const etapas = ['Diseño Aprobado', 'Corte', 'Armado', 'Instalación', 'Finalizado'];

  proyectos.forEach((p, index) => {
    const card = document.createElement('div');
    card.className = 'admin-card';
    card.style.cssText = 'background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;';

    let botonesEtapas = etapas.map((est, idx) => {
      const activeStyle = p.estado === est ? 'background: #f59e0b; color: #000; font-weight: bold;' : 'background: rgba(255,255,255,0.1); color: #fff;';
      const porcentaje = (idx + 1) * 20;
      return `<button type="button" style="border:none; padding: 0.4rem 0.7rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; margin: 0.2rem; ${activeStyle}" onclick="cambiarEstadoPorIndice(${index}, ${idx}, ${porcentaje})">${est}</button>`;
    }).join('');

    card.innerHTML = `
      <div style="flex: 1; min-width: 250px;">
        <span class="badge" style="background: #f59e0b; color: #000; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold; font-size: 0.85rem;">${p.codigo}</span>
        <strong style="margin-left: 0.5rem; font-size: 1.05rem;">${p.mueble}</strong>
        <p style="margin: 0.4rem 0; color: #a3a3a3; font-size: 0.85rem;">
          <i class="fa-solid fa-user"></i> Cliente: ${p.cliente} | <i class="fa-solid fa-phone"></i> Tel: ${p.telefono || 'Sin registrar'}
        </p>
        <div style="margin-top: 0.5rem;">${botonesEtapas}</div>
        <div style="margin-top: 0.8rem;">
          <button type="button" onclick="notificarWhatsApp(${index})" style="background: #16a34a; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: bold; display: inline-flex; align-items: center; gap: 0.4rem;">
            <i class="fa-brands fa-whatsapp"></i> Notificar Avance por WhatsApp
          </button>
        </div>
      </div>
      <button type="button" onclick="eliminarProyecto(${index})" title="Eliminar proyecto" style="background: #ef4444; color: white; border: none; padding: 0.6rem 0.8rem; border-radius: 8px; cursor: pointer;">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;
    container.appendChild(card);
  });
}

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

// --- 6. NOTIFICACIONES POR WHATSAPP ---
function notificarWhatsApp(index) {
  const p = proyectos[index];
  if (!p.telefono || p.telefono.trim() === '') {
    alert("Este cliente no tiene un número de teléfono registrado.");
    return;
  }
  
  let num = p.telefono.toString().replace(/\D/g, '');
  if (!num.startsWith('591') && num.length === 8) {
    num = '591' + num;
  }
  
  const mensaje = `Hola *${p.cliente}* 👋, desde *HN Muebles* te informamos el avance de tu proyecto *"${p.mueble}"*:\n\n🛠️ *Estado:* ${p.estado}\n📊 *Progreso:* ${p.progreso}%\n\nPuedes ver el estado actualizado ingresando tu código *${p.codigo}* en nuestra web.`;
  
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`, '_blank');
}

if (!localStorage.getItem('hn_proyectos')) { 
  guardarEnLocalStorage(); 
}
