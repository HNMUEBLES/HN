// FUNCIÓN ULTRA-RÁPIDA (ACTUALIZACIÓN INSTANTÁNEA EN PANTALLA)
async function cambiarEstadoPorId(idFirebase, etapaIdx, nuevoProgreso) {
  const etapas = ['Diseño Aprobado', 'Corte', 'Armado', 'Instalación', 'Finalizado'];
  const descripciones = [
    'El diseño ha sido aprobado por WhatsApp. El proyecto ingresa a producción.',
    'Las placas se encuentran en proceso de corte y pegado de tapacantos.',
    'Las piezas se están ensamblando en taller.',
    'El mueble está en proceso de traslado e instalación en sitio.',
    '¡El proyecto ha sido completado e instalado con éxito!'
  ];

  const nuevoEstado = etapas[etapaIdx];
  const nuevaDesc = descripciones[etapaIdx];

  // 1. Actualizamos el arreglo local
  const proyectoLocal = proyectos.find(p => p.id === idFirebase);
  if (proyectoLocal) {
    proyectoLocal.estado = nuevoEstado;
    proyectoLocal.progreso = nuevoProgreso;
    proyectoLocal.detalles = nuevaDesc;
  }

  // 2. CAMBIO VISUAL INMEDIATO EN TIEMPO REAL (SIN RENDERIZAR TODO EL PANEL)
  // Buscamos la tarjeta del proyecto en el DOM actual y actualizamos los estilos de los botones al instante
  const cardIndex = proyectos.findIndex(p => p.id === idFirebase);
  if (cardIndex !== -1) {
    const infoView = document.getElementById(`info-view-${cardIndex}`);
    if (infoView) {
      const botones = infoView.querySelectorAll('button[onclick*="cambiarEstadoPorId"]');
      botones.forEach((btn, idx) => {
        if (idx === etapaIdx) {
          btn.style.background = '#f59e0b';
          btn.style.color = '#000';
          btn.style.fontWeight = 'bold';
        } else {
          btn.style.background = 'rgba(255,255,255,0.1)';
          btn.style.color = '#fff';
          btn.style.fontWeight = 'normal';
        }
      });
    }
  }

  // 3. Enviamos la orden a Firebase en segundo plano silenciosamente
  db.collection("proyectos").doc(idFirebase).update({
    estado: nuevoEstado,
    progreso: nuevoProgreso,
    detalles: nuevaDesc
  }).catch(error => {
    console.error("Error al sincronizar con la nube en segundo plano:", error);
  });
}
