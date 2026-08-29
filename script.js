// Proyectos iniciales con teléfono registrado
const proyectosIniciales = [{ 
  codigo: 'HN-001', 
  cliente: 'Carlos Mendoza', 
  mueble: 'Juego de Comedor en Melamina', 
  telefono: '70012345',
  estado: 'Fabricación', 
  progreso: 60, 
  detalles: 'En proceso de fabricación.' 
}];

// Carga datos guardados o iniciales
let proyectos = JSON.parse(localStorage.getItem('hn_proyectos')) || proyectosIniciales;

function guardarEnLocalStorage() { 
  localStorage.setItem('hn_proyectos', JSON.stringify(proyectos)); 
}

let esAdmin = false;

// Navegación entre pestañas
function mostrarSeccion(seccionId) {
  document.getElementById('sec-inicio').classList.add('hidden');
  document.getElementById('sec-rastreo').classList.add('hidden');
  document.getElementById('sec-admin').classList.add('hidden');

  document.getElementById('btn-inicio').classList.remove('active');
  document.getElementById('btn-rastreo').classList.remove('active');
  document.getElementById('btn-admin').classList.remove('active');

  document.getElementById(`sec-${seccionId}`).classList.remove('hidden');
  document.getElementById(`btn-${seccionId}`).classList.add('active');
}

// Búsqueda pública del cliente
document.getElementById('form-buscar').addEventListener('submit', function(e) {
  e.preventDefault();
  const codigo = document.getElementById('input-codigo').value.trim().toUpperCase();
  const encontrado = proyectos.find(p => p.codigo === codigo);
  const errorMsg = document.getElementById('mensaje-error');
  const resultBox = document.getElementById('resultado-proyecto');

  if (encontrado) {
    errorMsg.classList.add('hidden');
    resultBox.classList.remove('hidden');
    document.getElementById('res-codigo').innerText = encontrado.codigo;
    document.getElementById('res-mueble').innerText = encontrado.mueble;
    document.getElementById('res-cliente').innerText = `Cliente: ${encontrado.cliente}`;
    document.getElementById('res-estado').innerText = encontrado.estado;
    document.getElementById('res-porcentaje').innerText = `${encontrado.progreso}%`;
    document.getElementById('res-bar-fill').style.width = `${encontrado.progreso}%`;
    document.getElementById('res-detalles').innerText = encontrado.detalles || `Proyecto en etapa de ${encontrado.estado}`;
  } else {
    resultBox.classList.add('hidden');
    errorMsg.classList.remove('hidden');
  }
});

// Login Admin
document.getElementById('form-login').addEventListener('submit', function(e) {
  e.preventDefault();
  if (document.getElementById('input-pass').value === 'hn2026') {
    esAdmin = true;
    document.getElementById('admin-login').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    document.getElementById('input-pass').value = '';
    renderProyectosAdmin();
  } else { 
    alert('Contraseña incorrecta'); 
  }
});

function cerrarSesionAdmin() {
  esAdmin = false;
  document.getElementById('admin-panel').classList.add('hidden');
  document.getElementById('admin-login').classList.remove('hidden');
}

// Guardar nuevo proyecto desde Admin
document.getElementById('form-nuevo-proyecto').addEventListener('submit', function(e) {
  e.preventDefault();
  const codigo = document.getElementById('nuevo-codigo').value.trim().toUpperCase();
  const cliente = document.getElementById('nuevo-cliente').value.trim();
  const mueble = document.getElementById('nuevo-mueble').value.trim();
  const telefono = document.getElementById('nuevo-telefono') ? document.getElementById('nuevo-telefono').value.trim() : '';

  proyectos.push({
    codigo: codigo,
    cliente: cliente,
    mueble: mueble,
    telefono: telefono,
    estado: 'Diseño', 
    progreso: 20, 
    detalles: 'Proyecto registrado en sistema.'
  });

  guardarEnLocalStorage();
  document.getElementById('nuevo-codigo').value = '';
  document.getElementById('nuevo-cliente').value = '';
  document.getElementById('nuevo-mueble').value = '';
  if (document.getElementById('nuevo-telefono')) document.getElementById('nuevo-telefono').value = '';
  renderProyectosAdmin();
});

// Renderizar tarjetas en el Panel Admin
function renderProyectosAdmin() {
  const container = document.getElementById('lista-proyectos-admin');
  document.getElementById('total-proyectos').innerText = proyectos.length;
  container.innerHTML = '';
  
  const etapas = ['Diseño', 'Corte de Placas', 'Fabricación', 'Lustre / Enchapado', 'Listo para Entrega'];

  proyectos.forEach((p, index) => {
    const card = document.createElement('div');
    card.className = 'admin-card';

    let botonesEtapas = etapas.map((est, idx) => {
      const activeClass = p.estado === est ? 'active' : '';
      const porcentaje = (idx + 1) * 20;
      return `<button type="button" class="btn-stage ${activeClass}" onclick="cambiarEstadoPorIndice(${index}, ${idx}, ${porcentaje})">${est}</button>`;
    }).join('');

    card.innerHTML = `
      <div style="flex: 1; min-width: 250px;">
        <span class="badge">${p.codigo}</span><strong style="margin-left: 0.5rem; font-size: 1.1rem;">${p.mueble}</strong>
        <p style="text-align: left; margin: 0.4rem 0; color: #a3a3a3; font-size: 0.85rem;">
          <i class="fa-solid fa-user"></i> ${p.cliente} | <i class="fa-solid fa-phone"></i> ${p.telefono || 'Sin teléfono'}
        </p>
        <div class="stage-buttons" style="margin-top: 0.5rem;">${botonesEtapas}</div>
        
        <div style="margin-top: 0.8rem;">
          <button type="button" class="btn-wa-notif" onclick="notificarWhatsApp(${index})" style="background:#16a34a; color:#ffffff; border:none; padding:0.5rem 1rem; border-radius:8px; cursor:pointer; font-size:0.85rem; font-weight:bold; display:inline-flex; align-items:center; gap:0.5rem;">
            <i class="fa-brands fa-whatsapp" style="font-size: 1rem;"></i> Enviar Avance por WhatsApp
          </button>
        </div>
      </div>
      <button type="button" class="btn-delete" onclick="eliminarProyecto(${index})" title="Eliminar proyecto">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;
    container.appendChild(card);
  });
}

// Función para cambiar de etapa correctamente
function cambiarEstadoPorIndice(proyectoIdx, etapaIdx, nuevoProgreso) {
  const etapas = ['Diseño', 'Corte de Placas', 'Fabricación', 'Lustre / Enchapado', 'Listo para Entrega'];
  const nuevoEstado = etapas[etapaIdx];
  
  proyectos[proyectoIdx].estado = nuevoEstado;
  proyectos[proyectoIdx].progreso = nuevoProgreso;
  proyectos[proyectoIdx].detalles = `El proyecto ha avanzado a la etapa de: ${nuevoEstado}.`;
  
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

// Enviar notificación por WhatsApp al cliente
function notificarWhatsApp(index) {
  const p = proyectos[index];
  if (!p.telefono || p.telefono.trim() === '') {
    alert("Este cliente no tiene un número de teléfono ingresado.");
    return;
  }
  
  let num = p.telefono.toString().replace(/\D/g, '');
  if (!num.startsWith('591') && num.length === 8) {
    num = '591' + num;
  }
  
  const mensaje = `Hola *${p.cliente}* 👋, desde *HN Muebles* te enviamos el estado de tu proyecto *"${p.mueble}"*:\n\n🛠️ *Estado actual:* ${p.estado}\n📊 *Avance:* ${p.progreso}%\n\nPuedes consultar el detalle en la web con tu código: *${p.codigo}*`;
  
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`, '_blank');
}

if (!localStorage.getItem('hn_proyectos')) { 
  guardarEnLocalStorage(); 
}
