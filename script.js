<div style="display:flex; gap:10px; flex-wrap:wrap;">
      <div style="flex:1; min-width:200px;">
        <label style="font-size:0.75rem; color:#a3a3a3;">Código</label>
        <input type="text" id="edit-codigo-${index}" value="${p.codigo || ""}" style="width:100%; padding:4px 8px; border-radius:4px; border:1px solid rgba(255,255,255,.2); background:rgba(0,0,0,.2); color:#fff;" />
      </div>
      <div style="flex:2; min-width:200px;">
        <label style="font-size:0.75rem; color:#a3a3a3;">Mueble / Descripción</label>
        <input type="text" id="edit-mueble-${index}" value="${p.mueble || ""}" style="width:100%; padding:4px 8px; border-radius:4px; border:1px solid rgba(255,255,255,.2); background:rgba(0,0,0,.2); color:#fff;" />
      </div>
    </div>

    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:5px;">
      <div style="flex:1; min-width:200px;">
        <label style="font-size:0.75rem; color:#a3a3a3;">Cliente</label>
        <input type="text" id="edit-cliente-${index}" value="${p.cliente || ""}" style="width:100%; padding:4px 8px; border-radius:4px; border:1px solid rgba(255,255,255,.2); background:rgba(0,0,0,.2); color:#fff;" />
      </div>
      <div style="flex:1; min-width:200px;">
        <label style="font-size:0.75rem; color:#a3a3a3;">Teléfono</label>
        <input type="text" id="edit-telefono-${index}" value="${p.telefono || ""}" style="width:100%; padding:4px 8px; border-radius:4px; border:1px solid rgba(255,255,255,.2); background:rgba(0,0,0,.2); color:#fff;" />
      </div>
    </div>

    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:5px;">
      <div style="flex:1; min-width:140px;">
        <label style="font-size:0.75rem; color:#a3a3a3;">Presupuesto (Bs.)</label>
        <input type="number" id="edit-presupuesto-${index}" value="${p.presupuesto || 0}" style="width:100%; padding:4px 8px; border-radius:4px; border:1px solid rgba(255,255,255,.2); background:rgba(0,0,0,.2); color:#fff;" />
      </div>
      <div style="flex:1; min-width:140px;">
        <label style="font-size:0.75rem; color:#a3a3a3;">Adelanto (Bs.)</label>
        <input type="number" id="edit-adelanto-${index}" value="${p.adelanto || 0}" style="width:100%; padding:4px 8px; border-radius:4px; border:1px solid rgba(255,255,255,.2); background:rgba(0,0,0,.2); color:#fff;" />
      </div>
      <div style="flex:1; min-width:140px;">
        <label style="font-size:0.75rem; color:#a3a3a3;">Fecha de Entrega</label>
        <input type="date" id="edit-fecha-${index}" value="${p.fechaEntrega || ""}" style="width:100%; padding:4px 8px; border-radius:4px; border:1px solid rgba(255,255,255,.2); background:rgba(0,0,0,.2); color:#fff;" />
      </div>
    </div>

    <div style="display:flex; gap:8px; margin-top:10px;">
      <button type="button" onclick="guardarEdicionInline(${index})" style="background:#16a34a; color:#fff; border:none; padding:.4rem .8rem; border-radius:6px; cursor:pointer; font-weight:bold; font-size:.85rem;">Guardar</button>
      <button type="button" onclick="renderProyectosAdmin()" style="background:rgba(255,255,255,.1); color:#fff; border:none; padding:.4rem .8rem; border-radius:6px; cursor:pointer; font-size:.85rem;">Cancelar</button>
    </div>

  </div>
  `;
}

// ============================================================
// 15. GUARDAR EDICIÓN INLINE
// ============================================================

async function guardarEdicionInline(index) {
  if (!esAdmin || !auth.currentUser) return;

  const p = proyectos[index];
  if (!p) return;

  const nuevoCodigo = document.getElementById(`edit-codigo-${index}`)?.value.trim().toUpperCase() || p.codigo;
  const nuevoMueble = document.getElementById(`edit-mueble-${index}`)?.value.trim() || "";
  const nuevoCliente = document.getElementById(`edit-cliente-${index}`)?.value.trim() || "";
  const nuevoTelefono = document.getElementById(`edit-telefono-${index}`)?.value.trim() || "";
  const nuevoPresupuesto = Number(document.getElementById(`edit-presupuesto-${index}`)?.value) || 0;
  const nuevoAdelanto = Number(document.getElementById(`edit-adelanto-${index}`)?.value) || 0;
  const nuevaFecha = document.getElementById(`edit-fecha-${index}`)?.value || "";

  try {
    const batch = db.batch();

    // 1. Actualizar proyecto principal
    const proyectoRef = db.collection("proyectos").doc(p.id);
    batch.update(proyectoRef, {
      codigo: nuevoCodigo,
      mueble: nuevoMueble,
      cliente: nuevoCliente,
      telefono: nuevoTelefono,
      presupuesto: nuevoPresupuesto,
      adelanto: nuevoAdelanto,
      fechaEntrega: nuevaFecha
    });

    // 2. Actualizar en proyectos públicos
    const publicQuery = await db.collection("proyectos_publicos").where("codigo", "==", p.codigo).get();
    publicQuery.forEach(doc => {
      batch.update(doc.ref, {
        codigo: nuevoCodigo,
        mueble: nuevoMueble,
        cliente: nuevoCliente,
        fechaEntrega: nuevaFecha
      });
    });

    // 3. Actualizar en ingresos
    const ingresoQuery = await db.collection("ingresos").where("proyectoId", "==", p.id).get();
    ingresoQuery.forEach(doc => {
      const dataIngreso = doc.data();
      const cobradoActual = Number(dataIngreso.cobrado) || 0;
      const pendienteCalculado = Math.max(nuevoPresupuesto - cobradoActual, 0);

      batch.update(doc.ref, {
        codigo: nuevoCodigo,
        cliente: nuevoCliente,
        mueble: nuevoMueble,
        presupuesto: nuevoPresupuesto,
        adelanto: nuevoAdelanto,
        pendiente: pendienteCalculado
      });
    });

    await batch.commit();

    await cargarProyectosDesdeNube();
    await cargarIngresosDesdeNube();

    renderProyectosAdmin();
    renderGestionIngresos();

  } catch (error) {
    console.error("Error al guardar edición:", error);
    alert("No se pudo actualizar el proyecto.");
  }
}

// ============================================================
// 16. NOTIFICAR WHATSAPP
// ============================================================

function notificarWhatsApp(index) {
  const p = proyectos[index];
  if (!p) return;

  const telefono = p.telefono ? p.telefono.replace(/\s+/g, '') : '';
  const mensaje = `Hola *${p.cliente || 'Estimado cliente'}*, te saludamos de *HN Muebles*. Queremos informarte que tu proyecto *${p.mueble || ''}* (Código: *${p.codigo || ''}*) se encuentra actualmente en la etapa: *${p.estado || ''}* (${p.progreso || 0}%). Puedes consultar el estado detallado en nuestra web. ¡Gracias por confiar en nosotros!`;

  const url = telefono 
    ? `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
    : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

  window.open(url, '_blank');
}
