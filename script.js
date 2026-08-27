const proyectosIniciales = [{ codigo: 'HN-001', cliente: 'Carlos Mendoza', mueble: 'Juego de Comedor en Melamina', estado: 'Fabricación', progreso: 60, detalles: 'Corte de piezas terminado. En proceso de armado y enchapado de tapacantos.' }];
let proyectos = JSON.parse(localStorage.getItem('hn_proyectos')) || proyectosIniciales;
function guardarEnLocalStorage() { localStorage.setItem('hn_proyectos', JSON.stringify(proyectos)); }
let esAdmin = false;
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
    document.getElementById('res-detalles').innerText = encontrado.detalles;
  } else {
    resultBox.classList.add('hidden');
    errorMsg.classList.remove('hidden');
  }
});
document.getElementById('form-login').addEventListener('submit', function(e) {
  e.preventDefault();
  if (document.getElementById('input-pass').value === 'hn2026') {
    esAdmin = true;
    document.getElementById('admin-login').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    document.getElementById('input-pass').value = '';
    renderProyectosAdmin();
  } else { alert('Contraseña incorrecta'); }
});
function cerrarSesionAdmin() {
  esAdmin = false;
  document.getElementById('admin-panel').classList.add('hidden');
  document.getElementById('admin-login').classList.remove('hidden');
}
document.getElementById('form-nuevo-proyecto').addEventListener('submit', function(e) {
  e.preventDefault();
  proyectos.push({
    codigo: document.getElementById('nuevo-codigo').value.trim().toUpperCase(),
    cliente: document.getElementById('nuevo-cliente').value.trim(),
    mueble: document.getElementById('nuevo-mueble').value.trim(),
    estado: 'Diseño', progreso: 20, detalles: 'Proyecto registrado en sistema.'
  });
  guardarEnLocalStorage();
  document.getElementById('nuevo-codigo').value = '';
  document.getElementById('nuevo-cliente').value = '';
  document.getElementById('nuevo-mueble').value = '';
  renderProyectosAdmin();
});
function renderProyectosAdmin() {
  const container = document.getElementById('lista-proyectos-admin');
  document.getElementById('total-proyectos').innerText = proyectos.length;
  container.innerHTML = '';
  const etapas = ['Diseño', 'Corte de Placas', 'Fabricación', 'Lustre / Enchapado', 'Listo para Entrega'];
  proyectos.forEach((p, index) => {
    const card = document.createElement('div');
    card.className = 'admin-card';
    let botonesEtapas = etapas.map((est, idx) => `
      <button class="btn-stage ${p.estado === est ? 'active' : ''}" onclick="cambiarEstado(${index}, '${est}', ${(idx + 1) * 20})">${est}</button>
    `).join('');
    card.innerHTML = `
      <div>
        <span class="badge">${p.codigo}</span><strong style="margin-left: 0.5rem;">${p.mueble}</strong>
        <p class="subtitle" style="text-align: left; margin: 0.25rem 0;">Cliente: ${p.cliente}</p>
        <div class="stage-buttons">${botonesEtapas}</div>
      </div>
      <button class="btn-delete" onclick="eliminarProyecto(${index})" title="Eliminar proyecto"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(card);
  });
}
function cambiarEstado(index, nuevoEstado, nuevoProgreso) {
  proyectos[index].estado = nuevoEstado;
  proyectos[index].progreso = nuevoProgreso;
  proyectos[index].detalles = `En etapa de ${nuevoEstado}.`;
  guardarEnLocalStorage();
  renderProyectosAdmin();
}
function eliminarProyecto(index) {
  proyectos.splice(index, 1);
  guardarEnLocalStorage();
  renderProyectosAdmin();
}
if (!localStorage.getItem('hn_proyectos')) { guardarEnLocalStorage(); }
