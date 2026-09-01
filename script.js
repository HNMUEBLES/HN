// ============================================================
// HN MUEBLES - SCRIPT PRINCIPAL
// Firebase Authentication + Firestore
// Cloudinary para Portafolio
// Proyectos + Ingresos + Portafolio
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


function copiarCodigoAlPortapapeles(codigo) {
  navigator.clipboard.writeText(codigo)
    .then(() => {

      const boton = document.querySelector(
        `[data-copy-code="${codigo}"]`
      );

      if (boton) {

        const textoOriginal = boton.innerText;

        boton.innerText = "Copiado ✓";

        setTimeout(() => {
          boton.innerText = textoOriginal;
        }, 1200);
      }

    })
    .catch(error => {
      console.error("Error copiando:", error);
    });
}


function irInicio() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function mostrarMensajeInterno(mensaje, error = false) {
  console.log(
    error ? "ERROR:" : "OK:",
    mensaje
  );
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

  console.log(
    "CAMBIO DE AUTENTICACIÓN:",
    user
  );

  if (!user) {

    esAdmin = false;

    ocultarPanelAdministrador();

    return;
  }


  const emailUsuario =
    (user.email || "").trim().toLowerCase();

  const emailAdmin =
    EMAIL_ADMIN.trim().toLowerCase();


  if (emailUsuario !== emailAdmin) {

    console.warn(
      "Cuenta no autorizada:",
      user.email
    );

    esAdmin = false;

    ocultarPanelAdministrador();

    return;
  }


  esAdmin = true;

  mostrarPanelAdministrador();


  try {

    await cargarProyectosDesdeNube();

    await cargarIngresosDesdeNube();

    await cargarPortafolioAdmin();

    renderProyectosAdmin();

    renderGestionIngresos();

  } catch (error) {

    console.error(
      "Error cargando panel:",
      error
    );
  }

});


async function cerrarSesionAdmin() {

  try {

    await auth.signOut();

    esAdmin = false;

    ocultarPanelAdministrador();


    const modalIngresos =
      document.getElementById("modal-ingresos");

    const modalPortfolio =
      document.getElementById("modal-portafolio");


    modalIngresos?.classList.add("hidden");

    modalPortfolio?.classList.add("hidden");


    cerrarVisorPortafolio();

    irInicio();

  } catch (error) {

    console.error(
      "Error cerrando sesión:",
      error
    );
  }

}


// ============================================================
// 4. CONTROL DE VISTAS ADMIN (PANTALLAS INDEPENDIENTES)
// ============================================================

function mostrarPanelAdministrador() {

  const login =
    document.getElementById("admin-login");

  const panel =
    document.getElementById("admin-panel");


  if (login) {
    login.classList.add("hidden");
  }


  if (panel) {
    panel.classList.remove("hidden");
  }

  // Vista predeterminada al ingresar
  cambiarVistaAdmin('inicio');
}


function ocultarPanelAdministrador() {

  const login =
    document.getElementById("admin-login");

  const panel =
    document.getElementById("admin-panel");


  if (panel) {
    panel.classList.add("hidden");
  }


  if (login) {
    login.classList.remove("hidden");
  }

}


// Función clave para navegar entre pantallas completas de forma independiente
function cambiarVistaAdmin(vistaId) {
  if (!esAdmin) return;

  // Lista de todas las pantallas independientes del admin
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

  // Opcional: Actualizar clases activas en la barra lateral si existen
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
// 5. FIRESTORE
// ============================================================

async function cargarProyectosDesdeNube() {

  if (!auth.currentUser || !esAdmin) return;


  try {

    const snapshot =
      await db.collection("proyectos").get();


    proyectos = [];


    snapshot.forEach(doc => {

      proyectos.push({
        id: doc.id,
        ...doc.data()
      });

    });

  } catch (error) {

    console.error(
      "Error cargando proyectos:",
      error
    );
  }

}


async function cargarIngresosDesdeNube() {

  if (!auth.currentUser || !esAdmin) return;


  try {

    const snapshot =
      await db.collection("ingresos").get();


    ingresos = [];


    snapshot.forEach(doc => {

      ingresos.push({
        id: doc.id,
        ...doc.data()
      });

    });

  } catch (error) {

    console.error(
      "Error cargando ingresos:",
      error
    );
  }

}


// ============================================================
// 6. BÚSQUEDA PÚBLICA
// ============================================================

async function buscarProyectoPublico(codigo) {

  const errorMsg =
    document.getElementById("mensaje-error");

  const resultBox =
    document.getElementById("resultado-proyecto");


  try {

    const snapshot =
      await db.collection("proyectos_publicos")
        .where("codigo", "==", codigo)
        .limit(1)
        .get();


    if (snapshot.empty) {

      resultBox?.classList.add("hidden");

      errorMsg?.classList.remove("hidden");

      return;
    }


    const data =
      snapshot.docs[0].data();


    errorMsg?.classList.add("hidden");

    resultBox?.classList.remove("hidden");


    document.getElementById("res-codigo").innerText =
      data.codigo || "";


    document.getElementById("res-mueble").innerText =
      data.mueble || "";


    document.getElementById("res-cliente").innerText =
      `Cliente: ${data.cliente || ""}`;


    document.getElementById("res-estado").innerText =
      data.estado || "";


    document.getElementById("res-porcentaje").innerText =
      `${data.progreso || 0}%`;


  } catch (error) {

    console.error(
      "Error búsqueda pública:",
      error
    );


    resultBox?.classList.add("hidden");


    if (errorMsg) {

      errorMsg.innerText =
        "No se pudo consultar el proyecto.";

      errorMsg.classList.remove("hidden");

    }

  }

}


// ============================================================
// 7. GESTIÓN DE PROYECTOS
// ============================================================

function renderProyectosAdmin() {

  if (!esAdmin) return;


  const container =
    document.getElementById("lista-proyectos-admin");

  const total =
    document.getElementById("total-proyectos");


  if (total) {
    total.innerText = proyectos.length;
  }


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

    const presupuesto =
      Number(p.presupuesto) || 0;

    const adelanto =
      Number(p.adelanto) || 0;

    const saldo =
      Math.max(
        presupuesto - adelanto,
        0
      );


    const fecha =
      p.fechaEntrega
        ? p.fechaEntrega
            .split("-")
            .reverse()
            .join("/")
        : "Sin definir";


    const card =
      document.createElement("div");


    card.className =
      "admin-card";


    card.style.cssText = `
      background:rgba(255,255,255,.05);
      border:1px solid rgba(255,255,255,.1);
      border-radius:12px;
      padding:1.2rem;
      margin-bottom:1rem;
    `;


    const botones =
      etapas.map((estado, idx) => {

        const activo =
          p.estado === estado;


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
              ${
                activo
                  ? "background:#f59e0b;color:#000;font-weight:bold;"
                  : "background:rgba(255,255,255,.1);color:#fff;"
              }
            "
          >
            ${estado}
          </button>
        `;

      }).join("");


    card.innerHTML = `

      <div id="info-view-${index}">

        <div style="
          display:flex;
          justify-content:space-between;
          gap:10px;
          flex-wrap:wrap;
        ">

          <div style="
            flex:1;
            min-width:260px;
          ">

            <span style="
              background:#f59e0b;
              color:#000;
              padding:.2rem .6rem;
              border-radius:4px;
              font-weight:bold;
              font-size:.85rem;
            ">
              ${escaparHTML(p.codigo || "")}
            </span>


            <strong style="
              margin-left:.4rem;
            ">
              ${escaparHTML(p.mueble || "")}
            </strong>


            <p style="
              margin:.4rem 0;
              color:#a3a3a3;
              font-size:.85rem;
            ">
              Cliente:
              ${escaparHTML(p.cliente || "")}
              |
              Tel:
              ${escaparHTML(p.telefono || "Sin registrar")}
            </p>


            <p style="
              color:#38bdf8;
              font-size:.85rem;
            ">
              Entrega:
              <strong>${fecha}</strong>
            </p>


            <div style="
              display:grid;
              grid-template-columns:
              repeat(3,minmax(0,1fr));
              gap:10px;
              margin-top:12px;
            ">


              <div
                class="financial-box"
                style="
                  background:rgba(56,189,248,.07);
                  border:1px solid rgba(56,189,248,.25);
                  color:#38bdf8;
                "
              >

                <span style="
                  font-size:.75rem;
                  opacity:.85;
                  margin-bottom:5px;
                ">
                  Monto total
                </span>

                <strong style="
                  font-size:1.05rem;
                  white-space:nowrap;
                ">
                  Bs.
                  ${formatearMonto(presupuesto)}
                </strong>

              </div>


              <div
                class="financial-box"
                style="
                  background:rgba(245,158,11,.07);
                  border:1px solid rgba(245,158,11,.25);
                  color:#f59e0b;
                "
              >

                <span style="
                  font-size:.75rem;
                  opacity:.85;
                  margin-bottom:5px;
                ">
                  Adelanto
                </span>

                <strong style="
                  font-size:1.05rem;
                  white-space:nowrap;
                ">
                  Bs.
                  ${formatearMonto(adelanto)}
                </strong>

              </div>


              <div
                class="financial-box"
                style="
                  background:rgba(239,68,68,.07);
                  border:1px solid rgba(239,68,68,.25);
                  color:#ef4444;
                "
              >

                <span style="
                  font-size:.75rem;
                  opacity:.85;
                  margin-bottom:5px;
                ">
                  Pendiente
                </span>

                <strong style="
                  font-size:1.05rem;
                  white-space:nowrap;
                ">
                  Bs.
                  ${formatearMonto(saldo)}
                </strong>

              </div>

            </div>


            <div style="margin-top:.7rem;">
              ${botones}
            </div>


            <button
              type="button"
              onclick="notificarWhatsApp(${index})"
              style="
                margin-top:.6rem;
                background:#16a34a;
                color:white;
                border:none;
                padding:.4rem .8rem;
                border-radius:6px;
                cursor:pointer;
                font-size:.85rem;
                font-weight:bold;
              "
            >
              WhatsApp
            </button>

          </div>


          <div style="
            display:flex;
            gap:5px;
            align-items:flex-start;
          ">

            <button
              type="button"
              onclick="activarEdicionInline(${index})"
              class="admin-action-btn"
              style="
                background:#3b82f6;
                color:#fff;
              "
              title="Editar proyecto"
            >
              ✏️
            </button>


            <button
              type="button"
              onclick="eliminarProyecto('${p.id}')"
              class="admin-action-btn"
              style="
                background:#ef4444;
                color:#fff;
              "
              title="Eliminar proyecto"
            >
              🗑️
            </button>

          </div>

        </div>

      </div>
    `;


    container.appendChild(card);

  });

}


async function cambiarEstadoPorId(
  id,
  etapaIdx,
  progreso
) {

  if (!esAdmin || !auth.currentUser) return;


  const etapas = [
    "Diseño Aprobado",
    "Corte",
    "Armado",
    "Instalación",
    "Finalizado"
  ];


  const descripciones = [

    "El diseño ha sido aprobado por WhatsApp. El proyecto ingresa a producción.",

    "Las placas se encuentran en proceso de corte y pegado de tapacantos.",

    "Las piezas se están ensamblando en taller.",

    "El mueble está en proceso de traslado e instalación en sitio.",

    "¡El proyecto ha sido completado e instalado con éxito!"

  ];


  const estado =
    etapas[etapaIdx];


  const detalles =
    descripciones[etapaIdx];


  try {

    const batch =
      db.batch();


    const proyectoRef =
      db.collection("proyectos").doc(id);


    batch.update(
      proyectoRef,
      {
        estado,
        progreso,
        detalles
      }
    );


    const proyecto =
      proyectos.find(
        p => p.id === id
      );


    const publicoQuery =
      await db.collection("proyectos_publicos")
        .where(
          "codigo",
          "==",
          proyecto?.codigo
        )
        .limit(1)
        .get();


    publicoQuery.forEach(doc => {

      batch.update(
        doc.ref,
        {
          estado,
          progreso,
          detalles
        }
      );

    });


    await batch.commit();


    await cargarProyectosDesdeNube();


    renderProyectosAdmin();


  } catch (error) {

    console.error(
      "Error estado:",
      error
    );

  }

}


async function eliminarProyecto(id) {

  if (!esAdmin || !auth.currentUser) return;


  if (
    !confirm(
      "¿Seguro que quieres eliminar este proyecto?"
    )
  ) {
    return;
  }


  try {

    const proyecto =
      proyectos.find(
        p => p.id === id
      );


    const batch =
      db.batch();


    batch.delete(
      db.collection("proyectos").doc(id)
    );


    if (proyecto) {

      const publicSnap =
        await db.collection("proyectos_publicos")
          .where(
            "codigo",
            "==",
            proyecto.codigo
          )
          .limit(1)
          .get();


      publicSnap.forEach(doc => {

        batch.delete(doc.ref);

      });


      const ingresoSnap =
        await db.collection("ingresos")
          .where(
            "proyectoId",
            "==",
            id
          )
          .limit(1)
          .get();


      ingresoSnap.forEach(doc => {

        batch.delete(doc.ref);

      });

    }


    await batch.commit();


    await cargarProyectosDesdeNube();

    await cargarIngresosDesdeNube();


    renderProyectosAdmin();

    renderGestionIngresos();


  } catch (error) {

    console.error(
      "Error eliminando:",
      error
    );

  }

}


function activarEdicionInline(index) {

  const p =
    proyectos[index];


  const info =
    document.getElementById(
      `info-view-${index}`
    );


  if (!info || !p) return;


  info.innerHTML = `

    <div style="
      display:flex;
      flex-direction:column;
      gap:7px;
    ">

      <input
        id="edit-codigo-${index}"
        value="${escaparHTML(p.codigo || "")}"
        placeholder="Código"
      >

      <input
        id="edit-cliente-${index}"
        value="${escaparHTML(p.cliente || "")}"
        placeholder="Cliente"
      >

      <input
        id="edit-mueble-${index}"
        value="${escaparHTML(p.mueble || "")}"
        placeholder="Mueble"
      >

      <input
        id="edit-telefono-${index}"
        value="${escaparHTML(p.telefono || "")}"
        placeholder="WhatsApp"
      >

      <input
        type="number"
        id="edit-presupuesto-${index}"
        value="${p.presupuesto || 0}"
        placeholder="Presupuesto"
        min="0"
        step="0.01"
      >

      <input
        type="number"
        id="edit-adelanto-${index}"
        value="${p.adelanto || 0}"
        placeholder="Adelanto"
        min="0"
        step="0.01"
      >

      <input
        type="date"
        id="edit-fecha-${index}"
        value="${p.fechaEntrega || ""}"
      >

      <div>

        <button
          type="button"
          onclick="guardarEdicionInline('${p.id}',${index})"
          style="
            background:#16a34a;
            color:#fff;
            border:none;
            padding:8px 12px;
            border-radius:6px;
            cursor:pointer;
          "
        >
          Guardar
        </button>


        <button
          type="button"
          onclick="renderProyectosAdmin()"
          style="
            background:#404040;
            color:#fff;
            border:none;
            padding:8px 12px;
            border-radius:6px;
            cursor:pointer;
          "
        >
          Cancelar
        </button>

      </div>

    </div>

  `;

}


async function guardarEdicionInline(
  id,
  index
) {

  if (!esAdmin || !auth.currentUser) return;


  const proyectoAnterior =
    proyectos.find(
      p => p.id === id
    );


  const codigoAnterior =
    proyectoAnterior?.codigo || "";


  const codigo =
    document.getElementById(
      `edit-codigo-${index}`
    ).value
      .trim()
      .toUpperCase();


  const cliente =
    document.getElementById(
      `edit-cliente-${index}`
    ).value.trim();


  const mueble =
    document.getElementById(
      `edit-mueble-${index}`
    ).value.trim();


  const telefono =
    document.getElementById(
      `edit-telefono-${index}`
    ).value.trim();


  const presupuesto =
    Number(
      document.getElementById(
        `edit-presupuesto-${index}`
      ).value
    ) || 0;


  const adelanto =
    Number(
      document.getElementById(
        `edit-adelanto-${index}`
      ).value
    ) || 0;


  const fecha =
    document.getElementById(
      `edit-fecha-${index}`
    ).value;


  try {

    await db
      .collection("proyectos")
      .doc(id)
      .update({
        codigo,
        cliente,
        mueble,
        telefono,
        presupuesto,
        adelanto,
        fechaEntrega: fecha
      });


    const ingresoSnap =
      await db.collection("ingresos")
        .where(
          "proyectoId",
          "==",
          id
        )
        .limit(1)
        .get();


    if (!ingresoSnap.empty) {

      const ingresoDoc =
        ingresoSnap.docs[0];


      const ingreso =
        ingresoDoc.data();


      const pagosFinales =
        Number(
          ingreso.pagosFinales
        ) || 0;


      const cobrado =
        adelanto + pagosFinales;


      const pendiente =
        Math.max(
          presupuesto - cobrado,
          0
        );


      await ingresoDoc.ref.update({

        codigo,
        cliente,
        mueble,
        presupuesto,
        adelanto,
        cobrado,
        pendiente

      });

    }


    const publicoSnap =
      await db.collection("proyectos_publicos")
        .where(
          "codigo",
          "==",
          codigoAnterior
        )
        .limit(1)
        .get();


    for (
      const doc
      of publicoSnap.docs
    ) {

      await doc.ref.update({

        codigo,
        cliente,
        mueble,
        fechaEntrega: fecha

      });

    }


    await cargarProyectosDesdeNube();

    await cargarIngresosDesdeNube();


    renderProyectosAdmin();

    renderGestionIngresos();


    alert(
      "Proyecto actualizado correctamente."
    );


  } catch (error) {

    console.error(
      "Error editando:",
      error
    );


    alert(
      "No se pudo actualizar el proyecto."
    );

  }

}


// ============================================================
// 8. INGRESOS
// ============================================================

function renderGestionIngresos() {

  if (!esAdmin) return;


  const container =
    document.getElementById(
      "lista-ingresos"
    );


  if (!container) return;


  const filtro =
    document.getElementById(
      "ingresos-mes"
    )?.value || "";


  let lista =
    [...ingresos];


  if (filtro) {

    lista =
      lista.filter(
        ingreso => {

          let fecha = null;


          if (
            ingreso.fechaCreacion &&
            ingreso.fechaCreacion.toDate
          ) {

            fecha =
              ingreso.fechaCreacion.toDate();

          }


          if (!fecha) return true;


          const mes =
            `${fecha.getFullYear()}-${String(
              fecha.getMonth() + 1
            ).padStart(2, "0")}`;


          return mes === filtro;

        }
      );

  }


  let totalCobrado = 0;

  let totalPendiente = 0;


  lista.forEach(
    ingreso => {

      totalCobrado +=
        Number(ingreso.cobrado) || 0;


      totalPendiente +=
        Number(ingreso.pendiente) || 0;

    }
  );


  const resumenProyectos =
    document.getElementById(
      "ing-resumen-proyectos"
    );


  const resumenCobrado =
    document.getElementById(
      "ing-resumen-cobrado"
    );


  const resumenPendiente =
    document.getElementById(
      "ing-resumen-pendiente"
    );


  if (resumenProyectos) {
    resumenProyectos.innerText =
      lista.length;
  }


  if (resumenCobrado) {
    resumenCobrado.innerText =
      `Bs. ${formatearMonto(totalCobrado)}`;
  }


  if (resumenPendiente) {
    resumenPendiente.innerText =
      `Bs. ${formatearMonto(totalPendiente)}`;
  }


  container.innerHTML = "";


  if (!lista.length) {

    container.innerHTML = `

      <div style="
        text-align:center;
        color:#777;
        padding:25px;
      ">

        No hay registros para este mes.

      </div>

    `;

    return;
  }


  lista.forEach(
    ingreso => {

      const card =
        document.createElement("div");


      card.style.cssText = `
        background:rgba(255,255,255,.035);
        border:1px solid rgba(255,255,255,.09);
        border-radius:9px;
        padding:10px;
        margin-bottom:7px;
      `;


      const presupuesto =
        Number(ingreso.presupuesto) || 0;


      const adelanto =
        Number(ingreso.adelanto) || 0;


      const cobrado =
        Number(ingreso.cobrado) || 0;


      const pendiente =
        Math.max(
          presupuesto - cobrado,
          0
        );


      card.innerHTML = `

        <div style="
          display:flex;
          justify-content:space-between;
          gap:8px;
        ">

          <div>

            <strong>
              ${escaparHTML(
                ingreso.cliente || ""
              )}
            </strong>

            <div style="
              color:#a3a3a3;
              font-size:.75rem;
            ">

              ${escaparHTML(
                ingreso.codigo || ""
              )}

              ·

              ${escaparHTML(
                ingreso.mueble || ""
              )}

            </div>

          </div>


          <div style="
            color:#38bdf8;
            font-weight:bold;
            font-size:.85rem;
          ">

            Total:
            Bs.
            ${formatearMonto(
              presupuesto
            )}

          </div>

        </div>


        <div style="
          display:grid;
          grid-template-columns:
          repeat(3,1fr);
          gap:5px;
          margin-top:8px;
        ">


          <div class="summary-box amber">

            Adelanto

            <strong>
              Bs.
              ${formatearMonto(
                adelanto
              )}
            </strong>

          </div>


          <div class="summary-box green">

            Cobrado

            <strong>
              Bs.
              ${formatearMonto(
                cobrado
              )}
            </strong>

          </div>


          <div class="summary-box red">

            Pendiente

            <strong>
              Bs.
              ${formatearMonto(
                pendiente
              )}
            </strong>

          </div>

        </div>


        ${
          pendiente > 0

            ? `

              <div style="
                display:flex;
                gap:5px;
                margin-top:8px;
              ">

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  id="pago-${ingreso.id}"
                  placeholder="Monto pagado"
                >

                <button
                  type="button"
                  onclick="registrarPago('${ingreso.id}')"
                  style="
                    background:#16a34a;
                    color:#fff;
                    border:none;
                    border-radius:6px;
                    padding:7px 10px;
                    cursor:pointer;
                    font-weight:bold;
                  "
                >
                  Registrar pago
                </button>

              </div>

            `

            : `

              <div style="
                margin-top:8px;
                color:#4ade80;
                font-size:.78rem;
                text-align:center;
              ">

                <i class="fa-solid fa-circle-check"></i>

                Proyecto pagado completamente

              </div>

            `
        }

      `;


      container.appendChild(card);

    }
  );

}


async function registrarPago(
  ingresoId
) {

  if (!esAdmin || !auth.currentUser) return;


  const input =
    document.getElementById(
      `pago-${ingresoId}`
    );


  const monto =
    Number(input?.value) || 0;


  if (monto <= 0) return;


  const ingreso =
    ingresos.find(
      i => i.id === ingresoId
    );


  if (!ingreso) return;


  const presupuesto =
    Number(ingreso.presupuesto) || 0;


  const cobradoActual =
    Number(ingreso.cobrado) || 0;


  const pendienteActual =
    Math.max(
      presupuesto - cobradoActual,
      0
    );


  const pago =
    Math.min(
      monto,
      pendienteActual
    );


  if (pago <= 0) return;


  const pagosFinalesActuales =
    Number(
      ingreso.pagosFinales
    ) || 0;


  const nuevosPagosFinales =
    pagosFinalesActuales + pago;


  const nuevoCobrado =
    cobradoActual + pago;


  const nuevoPendiente =
    Math.max(
      presupuesto - nuevoCobrado,
      0
    );


  try {

    await db
      .collection("ingresos")
      .doc(ingresoId)
      .update({

        pagosFinales:
          nuevosPagosFinales,

        cobrado:
          nuevoCobrado,

        pendiente:
          nuevoPendiente,

        fechaUltimoPago:
          firebase.firestore.FieldValue.serverTimestamp()

      });


    await cargarIngresosDesdeNube();

    renderGestionIngresos();


  } catch (error) {

    console.error(
      "Error registrando pago:",
      error
    );

  }

}


// ============================================================
// 9. PDF (ESTILO EXCEL PROFESIONAL: MONTO, ADELANTO/MATERIALES, SALDO/GANANCIA)
// ============================================================

async function obtenerLogoPDF() {

  try {

    const response =
      await fetch("logo.png");


    if (!response.ok) {
      return null;
    }


    const blob =
      await response.blob();


    return await new Promise(
      resolve => {

        const reader =
          new FileReader();


        reader.onloadend =
          () => resolve(
            reader.result
          );


        reader.onerror =
          () => resolve(null);


        reader.readAsDataURL(blob);

      }
    );


  } catch (error) {

    console.warn(
      "No se pudo cargar logo.png para el PDF:",
      error
    );


    return null;

  }

}


async function exportarIngresosPDF() {

  if (!esAdmin) return;


  const filtro =
    document.getElementById(
      "ingresos-mes"
    )?.value || "";


  if (!filtro) return;


  if (
    !window.jspdf ||
    !window.jspdf.jsPDF
  ) {

    alert(
      "No se pudo generar el PDF porque jsPDF no está disponible."
    );

    return;
  }


  const lista =
    ingresos.filter(
      ingreso => {

        if (
          !ingreso.fechaCreacion ||
          !ingreso.fechaCreacion.toDate
        ) {
          return true;
        }


        const fecha =
          ingreso.fechaCreacion.toDate();


        const mes =
          `${fecha.getFullYear()}-${String(
            fecha.getMonth() + 1
          ).padStart(2, "0")}`;


        return mes === filtro;

      }
    );


  const jsPDF =
    window.jspdf.jsPDF;


  const doc =
    new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });


  const [anio, mes] =
    filtro.split("-");


  const nombresMes = [

    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre"

  ];


  const nombreMes =
    nombresMes[
      Number(mes) - 1
    ] || mes;


  const logo =
    await obtenerLogoPDF();


  const NEGRO =
    [18, 18, 18];


  const GRIS =
    [105, 105, 105];


  const DORADO =
    [156, 113, 81];


  const BLANCO =
    [255, 255, 255];


  const VERDE =
    [22, 163, 74];


  const AZUL =
    [37, 99, 235];


  let sumaMontosTotales = 0;
  let sumaAdelantosMateriales = 0;
  let sumaSaldosGanancia = 0;


  const filas =
    lista.map(
      ingreso => {

        const monto =
          Number(
            ingreso.presupuesto || ingreso.monto
          ) || 0;


        const adelantoMateriales =
          Number(
            ingreso.adelanto
          ) || 0;


        const saldoGanancia =
          Number(
            ingreso.saldo !== undefined ? ingreso.saldo : Math.max(monto - adelantoMateriales, 0)
          ) || 0;


        sumaMontosTotales +=
          monto;


        sumaAdelantosMateriales +=
          adelantoMateriales;


        sumaSaldosGanancia +=
          saldoGanancia;


        return [

          ingreso.codigo || "",

          ingreso.cliente || "",

          ingreso.mueble || ingreso.concepto || "",

          `Bs. ${formatearMonto(monto)}`,

          `Bs. ${formatearMonto(adelantoMateriales)}`,

          `Bs. ${formatearMonto(saldoGanancia)}`

        ];

      }
    );


  if (logo) {

    try {

      doc.addImage(
        logo,
        "PNG",
        14,
        10,
        25,
        18
      );

    } catch (error) {

      console.warn(
        "No se pudo insertar el logo:",
        error
      );

    }

  }


  const posicionTexto =
    logo
      ? 45
      : 14;


  doc.setTextColor(
    ...NEGRO
  );


  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.setFontSize(20);


  doc.text(
    "HN MUEBLES",
    posicionTexto,
    17
  );


  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.setFontSize(9);


  doc.setTextColor(
    ...GRIS
  );


  doc.text(
    "DISEÑO Y FABRICACIÓN DE MUEBLES A MEDIDA",
    posicionTexto,
    23
  );


  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.setFontSize(14);


  doc.setTextColor(
    ...DORADO
  );


  doc.text(
    "REPORTE FINANCIERO - GESTIÓN DE INGRESOS",
    14,
    38
  );


  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.setFontSize(11);


  doc.setTextColor(
    ...NEGRO
  );


  doc.text(
    `${nombreMes} ${anio}`,
    14,
    45
  );


  const fechaGeneracion =
    new Date();


  const fechaTexto =
    fechaGeneracion.toLocaleDateString(
      "es-BO",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }
    );


  const horaTexto =
    fechaGeneracion.toLocaleTimeString(
      "es-BO",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );


  doc.setFontSize(8);

  doc.setTextColor(
    ...GRIS
  );


  doc.text(
    `Generado el ${fechaTexto} a las ${horaTexto}`,
    283,
    45,
    { align: "right" }
  );


  doc.setDrawColor(
    ...DORADO
  );


  doc.setLineWidth(
    0.8
  );


  doc.line(
    14,
    49,
    283,
    49
  );


  const resumenY =
    55;


  const anchoCaja =
    85;


  const altoCaja =
    20;


  const separacion =
    10;


  const resumen = [

    {
      titulo: "TOTAL MONTO PROYECTOS",
      valor: `Bs. ${formatearMonto(sumaMontosTotales)}`,
      color: AZUL
    },

    {
      titulo: "TOTAL MATERIALES (ADELANTOS)",
      valor: `Bs. ${formatearMonto(sumaAdelantosMateriales)}`,
      color: DORADO
    },

    {
      titulo: "TOTAL GANANCIA NETA (SALDOS)",
      valor: `Bs. ${formatearMonto(sumaSaldosGanancia)}`,
      color: VERDE
    }

  ];


  resumen.forEach(
    (item, index) => {

      const x =
        14 +
        index *
        (anchoCaja + separacion);


      doc.setFillColor(
        248,
        248,
        248
      );


      doc.setDrawColor(
        225,
        225,
        225
      );


      doc.roundedRect(
        x,
        resumenY,
        anchoCaja,
        altoCaja,
        3,
        3,
        "FD"
      );


      doc.setFillColor(
        ...item.color
      );


      doc.roundedRect(
        x,
        resumenY,
        2.5,
        altoCaja,
        1,
        1,
        "F"
      );


      doc.setFont(
        "helvetica",
        "bold"
      );


      doc.setFontSize(7);


      doc.setTextColor(
        ...GRIS
      );


      doc.text(
        item.titulo,
        x + 7,
        resumenY + 7
      );


      doc.setFontSize(11);


      doc.setTextColor(
        ...NEGRO
      );


      doc.text(
        item.valor,
        x + 7,
        resumenY + 15
      );

    }
  );


  const tablaY =
    resumenY +
    altoCaja +
    8;


  if (
    typeof doc.autoTable ===
    "function"
  ) {

    doc.autoTable({

      startY: tablaY,

      margin: {
        left: 14,
        right: 14
      },

      head: [[
        "CÓDIGO",
        "CLIENTE",
        "PROYECTO",
        "MONTO TOTAL",
        "ADELANTO (MATERIALES)",
        "SALDO (GANANCIA NETA)"
      ]],

      body: filas,

      theme: "grid",

      headStyles: {
        fillColor: NEGRO,
        textColor: BLANCO,
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
        valign: "middle",
        cellPadding: 4
      },

      bodyStyles: {
        fontSize: 8,
        textColor: [45,45,45],
        cellPadding: 3.5,
        valign: "middle"
      },

      alternateRowStyles: {
        fillColor: [248,248,248]
      },

      columnStyles: {

        0: {
          cellWidth: 30,
          halign: "center"
        },

        1: {
          cellWidth: 60
        },

        2: {
          cellWidth: 83
        },

        3: {
          cellWidth: 35,
          halign: "right"
        },

        4: {
          cellWidth: 35,
          halign: "right"
        },

        5: {
          cellWidth: 42,
          halign: "right"
        }

      },

      didParseCell: function(data) {

        if (
          data.section === "body"
        ) {

          if (
            data.column.index === 0
          ) {

            data.cell.styles.fontStyle =
              "bold";

            data.cell.styles.textColor =
              DORADO;

          }


          if (
            data.column.index === 5
          ) {

            data.cell.styles.textColor =
              VERDE;

            data.cell.styles.fontStyle =
              "bold";

          }

        }

      },

      didDrawPage: function(data) {

        const pageWidth =
          doc.internal.pageSize.getWidth();


        const pageHeight =
          doc.internal.pageSize.getHeight();


        doc.setDrawColor(
          220,
          220,
          220
        );


        doc.setLineWidth(
          0.4
        );


        doc.line(
          14,
          pageHeight - 14,
          pageWidth - 14,
          pageHeight - 14
        );


        doc.setFont(
          "helvetica",
          "normal"
        );


        doc.setFontSize(7);


        doc.setTextColor(
          ...GRIS
        );


        doc.text(
          "HN MUEBLES · Reporte de Ingresos, Materiales y Ganancias",
          14,
          pageHeight - 8
        );


        doc.text(
          `Página ${data.pageNumber}`,
          pageWidth - 14,
          pageHeight - 8,
          {
            align: "right"
          }
        );

      }

    });

  }


  doc.save(
    `HN-MUEBLES-Gestion-Ingresos-${anio}-${mes}.pdf`
  );

}


// ============================================================
// 10. WHATSAPP
// ============================================================

function notificarWhatsApp(index) {

  if (!esAdmin) return;


  const p =
    proyectos[index];


  if (!p || !p.telefono) return;


  let numero =
    p.telefono
      .toString()
      .replace(/\D/g, "");


  if (
    !numero.startsWith("591") &&
    numero.length === 8
  ) {

    numero =
      "591" + numero;

  }


  const link =
    window.location.origin +
    window.location.pathname +
    `?codigo=${encodeURIComponent(
      p.codigo
    )}`;


  const fecha =
    p.fechaEntrega
      ? p.fechaEntrega
          .split("-")
          .reverse()
          .join("/")
      : "Por coordinar";


  const mensaje = `Hola *${p.cliente}* 👋, desde *HN Muebles* te informamos el estado de tu proyecto *"${p.mueble}"*:

🛠️ *Estado:* ${p.estado}

📊 *Progreso:* ${p.progreso}%

📅 *Fecha estimada de entrega:* ${fecha}

🔍 *Consulta el estado de tu proyecto:*
${link}`;


  window.open(
    `https://wa.me/${numero}?text=${encodeURIComponent(
      mensaje
    )}`,
    "_blank"
  );

}


// ============================================================
// 11. PORTAFOLIO
// CLOUDINARY + FIRESTORE
// ============================================================


// ------------------------------------------------------------
// CARGAR PORTAFOLIO PÚBLICO
// ------------------------------------------------------------

async function cargarPortafolioPublico() {

  const container =
    document.getElementById(
      "portfolio-grid"
    );


  if (!container) return;


  try {

    const snapshot =
      await db
        .collection("portafolio")
        .orderBy("creadoEn", "desc")
        .get();


    portafolio = [];


    snapshot.forEach(
      doc => {

        portafolio.push({

          id: doc.id,

          ...doc.data()

        });

      }
    );


    renderPortafolioPublico();


  } catch (error) {

    console.error(
      "Error cargando portafolio:",
      error
    );


    container.innerHTML = `

      <div class="portfolio-empty">

        <i class="fa-solid fa-images"></i>

        <p>
          Nuestro portafolio estará disponible próximamente.
        </p>

      </div>

    `;

  }

}


// ------------------------------------------------------------
// CREAR VISOR DEL PORTAFOLIO
// ------------------------------------------------------------

function crearVisorPortafolio() {

  if (
    document.getElementById(
      "hn-portfolio-viewer"
    )
  ) {
    return;
  }


  const visor =
    document.createElement("div");


  visor.id =
    "hn-portfolio-viewer";


  visor.innerHTML = `

    <div
      id="hn-portfolio-backdrop"
      onclick="cerrarVisorPortafolio()"
      style="
        position:absolute;
        inset:0;
        background:rgba(0,0,0,.88);
        backdrop-filter:blur(8px);
      "
    ></div>


    <button
      type="button"
      onclick="cerrarVisorPortafolio()"
      style="
        position:absolute;
        top:20px;
        right:25px;
        z-index:20;
        width:45px;
        height:45px;
        border:none;
        border-radius:50%;
        background:rgba(255,255,255,.12);
        color:#fff;
        font-size:24px;
        cursor:pointer;
      "
      aria-label="Cerrar"
    >
      ×
    </button>


    <button
      type="button"
      id="hn-portfolio-prev"
      onclick="visorPortafolioAnterior(event)"
      style="
        position:absolute;
        left:20px;
        top:50%;
        transform:translateY(-50%);
        z-index:20;
        width:50px;
        height:50px;
        border:none;
        border-radius:50%;
        background:rgba(255,255,255,.12);
        color:#fff;
        font-size:30px;
        cursor:pointer;
      "
    >
      ‹
    </button>


    <div
      id="hn-portfolio-content"
      style="
        position:relative;
        z-index:10;
        width:calc(100% - 150px);
        height:calc(100% - 120px);
        display:flex;
        flex-direction:column;
        justify-content:center;
        align-items:center;
      "
    ></div>


    <button
      type="button"
      id="hn-portfolio-next"
      onclick="visorPortafolioSiguiente(event)"
      style="
        position:absolute;
        right:20px;
        top:50%;
        transform:translateY(-50%);
        z-index:20;
        width:50px;
        height:50px;
        border:none;
        border-radius:50%;
        background:rgba(255,255,255,.12);
        color:#fff;
        font-size:30px;
        cursor:pointer;
      "
    >
      ›
    </button>


    <div
      id="hn-portfolio-counter"
      style="
        position:absolute;
        bottom:25px;
        left:50%;
        transform:translateX(-50%);
        z-index:20;
        color:#fff;
        background:rgba(0,0,0,.5);
        padding:7px 15px;
        border-radius:20px;
        font-size:13px;
      "
    ></div>

  `;


  visor.style.cssText = `

    position:fixed;

    inset:0;

    z-index:99999;

    display:none;

    align-items:center;

    justify-content:center;

    padding:30px;

  `;


  document.body.appendChild(
    visor
  );


  const style =
    document.createElement("style");


  style.id =
    "hn-portfolio-viewer-style";


  style.innerHTML = `

    #hn-portfolio-viewer img,
    #hn-portfolio-viewer video {

      max-width:100%;

      max-height:calc(100vh - 180px);

      width:auto;

      height:auto;

      object-fit:contain;

      border-radius:10px;

      box-shadow:
        0 25px 80px rgba(0,0,0,.6);

    }


    #hn-portfolio-viewer .visor-title {

      color:#fff;

      font-size:18px;

      font-weight:700;

      margin-bottom:15px;

      text-align:center;

    }


    @media(max-width:700px) {

      #hn-portfolio-viewer {

        padding:10px !important;

      }


      #hn-portfolio-content {

        width:calc(100% - 80px) !important;

      }


      #hn-portfolio-prev,
      #hn-portfolio-next {

        width:40px !important;

        height:40px !important;

        font-size:25px !important;

      }


      #hn-portfolio-prev {

        left:8px !important;

      }


      #hn-portfolio-next {

        right:8px !important;

      }

    }

  `;


  document.head.appendChild(
    style
  );

}


// ------------------------------------------------------------
// VARIABLES DEL VISOR
// ------------------------------------------------------------

let visorTrabajoActual = null;

let visorIndiceActual = 0;


// ------------------------------------------------------------
// ABRIR VISOR
// ------------------------------------------------------------

function abrirVisorPortafolio(
  trabajoId,
  indice = 0
) {

  const trabajo =
    portafolio.find(
      p => p.id === trabajoId
    );


  if (!trabajo) return;


  const media =
    Array.isArray(trabajo.media)
      ? trabajo.media
      : [];


  if (!media.length) return;


  crearVisorPortafolio();


  visorTrabajoActual =
    trabajo;


  visorIndiceActual =
    indice;


  const visor =
    document.getElementById(
      "hn-portfolio-viewer"
    );


  if (!visor) return;


  visor.style.display =
    "flex";


  document.body.style.overflow =
    "hidden";


  mostrarMediaVisor();


  document.addEventListener(
    "keydown",
    manejarTecladoVisor
  );

}


// ------------------------------------------------------------
// MOSTRAR MEDIA ACTUAL
// ------------------------------------------------------------

function mostrarMediaVisor() {

  if (!visorTrabajoActual) return;


  const media =
    visorTrabajoActual.media || [];


  if (!media.length) return;


  if (
    visorIndiceActual < 0
  ) {

    visorIndiceActual =
      media.length - 1;

  }


  if (
    visorIndiceActual >= media.length
  ) {

    visorIndiceActual = 0;

  }


  const actual =
    media[visorIndiceActual];


  const content =
    document.getElementById(
      "hn-portfolio-content"
    );


  const counter =
    document.getElementById(
      "hn-portfolio-counter"
    );


  const prev =
    document.getElementById(
      "hn-portfolio-prev"
    );


  const next =
    document.getElementById(
      "hn-portfolio-next"
    );


  if (!content) return;


  content.innerHTML = "";


  const titulo =
    document.createElement("div");


  titulo.className =
    "visor-title";


  titulo.textContent =
    visorTrabajoActual.titulo ||
    "HN Muebles";


  content.appendChild(
    titulo
  );


  if (
    actual.tipo === "video"
  ) {

    const video =
      document.createElement("video");


    video.src =
      actual.url;


    video.controls =
      true;


    video.autoplay =
      true;


    video.playsInline =
      true;


    video.style.maxWidth =
      "100%";


    video.style.maxHeight =
      "calc(100vh - 180px)";


    content.appendChild(
      video
    );


  } else {

    const img =
      document.createElement("img");


    img.src =
      actual.url;


    img.alt =
      visorTrabajoActual.titulo ||
      "Trabajo HN Muebles";


    img.loading =
      "eager";


    content.appendChild(
      img
    );

  }


  if (counter) {

    counter.innerText =
      `${visorIndiceActual + 1} / ${media.length}`;

  }


  if (prev) {

    prev.style.display =
      media.length > 1
        ? "block"
        : "none";

  }


  if (next) {

    next.style.display =
      media.length > 1
        ? "block"
        : "none";

  }

}


// ------------------------------------------------------------
// ANTERIOR
// ------------------------------------------------------------

function visorPortafolioAnterior(
  event
) {

  event?.stopPropagation();


  if (!visorTrabajoActual) return;


  const media =
    visorTrabajoActual.media || [];


  if (!media.length) return;


  visorIndiceActual--;


  if (
    visorIndiceActual < 0
  ) {

    visorIndiceActual =
      media.length - 1;

  }


  mostrarMediaVisor();

}


// ------------------------------------------------------------
// SIGUIENTE
// ------------------------------------------------------------

function visorPortafolioSiguiente(
  event
) {

  event?.stopPropagation();


  if (!visorTrabajoActual) return;


  const media =
    visorTrabajoActual.media || [];


  if (!media.length) return;


  visorIndiceActual++;


  if (
    visorIndiceActual >=
    media.length
  ) {

    visorIndiceActual = 0;

  }


  mostrarMediaVisor();

}


// ------------------------------------------------------------
// TECLADO
// ------------------------------------------------------------

function manejarTecladoVisor(
  event
) {

  const visor =
    document.getElementById(
      "hn-portfolio-viewer"
    );


  if (
    !visor ||
    visor.style.display === "none"
  ) {
    return;
  }


  if (
    event.key === "Escape"
  ) {

    cerrarVisorPortafolio();

  }


  if (
    event.key === "ArrowLeft"
  ) {

    visorPortafolioAnterior();

  }


  if (
    event.key === "ArrowRight"
  ) {

    visorPortafolioSiguiente();

  }

}


// ------------------------------------------------------------
// CERRAR VISOR
// ------------------------------------------------------------

function cerrarVisorPortafolio() {

  const visor =
    document.getElementById(
      "hn-portfolio-viewer"
    );


  if (visor) {

    visor.style.display =
      "none";

  }


  document.body.style.overflow =
    "";


  visorTrabajoActual =
    null;


  visorIndiceActual =
    0;


  document.removeEventListener(
    "keydown",
    manejarTecladoVisor
  );

}


// ============================================================
// RENDER PÚBLICO
// ============================================================

function renderPortafolioPublico() {

  const container =
    document.getElementById(
      "portfolio-grid"
    );


  if (!container) return;


  container.innerHTML = "";


  if (!portafolio.length) {

    container.innerHTML = `

      <div class="portfolio-empty">

        <i
          class="fa-solid fa-images"
          style="
            font-size:2rem;
            color:#9c7151;
            margin-bottom:10px;
          "
        ></i>

        <p>
          Próximamente mostraremos
          nuestros trabajos aquí.
        </p>

      </div>

    `;

    return;

  }


  portafolio.forEach(
    trabajo => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "portfolio-card";


      const media =
        Array.isArray(trabajo.media)
          ? trabajo.media
          : [];


      const primerMedia =
        media[0];


      let mediaHTML = "";


      if (primerMedia) {

        if (
          primerMedia.tipo ===
          "video"
        ) {

          mediaHTML = `

            <div
              class="portfolio-media"
              style="
                position:relative;
                cursor:pointer;
              "
              onclick="abrirVisorPortafolio('${trabajo.id}',0)"
            >

              <video
                src="${primerMedia.url}"
                muted
                playsinline
                preload="metadata"
                style="
                  width:100%;
                  height:100%;
                  object-fit:cover;
                  pointer-events:none;
                "
              ></video>


              <div
                class="portfolio-video-badge"
              >
                <i class="fa-solid fa-video"></i>
                Video
              </div>

            </div>

          `;

        } else {

          mediaHTML = `

            <div
              class="portfolio-media"
              style="
                position:relative;
                cursor:pointer;
                overflow:hidden;
              "
              onclick="abrirVisorPortafolio('${trabajo.id}',0)"
            >

              <img
                src="${primerMedia.url}"
                alt="${escaparHTML(
                  trabajo.titulo ||
                  "Trabajo HN Muebles"
                )}"
                loading="lazy"
                style="
                  width:100%;
                  height:100%;
                  object-fit:cover;
                  transition:transform .35s ease;
                "
              />


              ${
                media.length > 1
                  ? `

                    <div
                      class="portfolio-video-badge"
                    >

                      <i
                        class="fa-solid fa-images"
                      ></i>

                      ${media.length}
                      archivos

                    </div>

                  `
                  : ""
              }


              <div
                style="
                  position:absolute;
                  inset:0;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  background:rgba(0,0,0,0);
                  transition:.25s;
                "
                onmouseenter="
                  this.style.background='rgba(0,0,0,.18)'
                "
                onmouseleave="
                  this.style.background='rgba(0,0,0,0)'
                "
              >

                <span
                  style="
                    width:48px;
                    height:48px;
                    border-radius:50%;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    background:rgba(0,0,0,.55);
                    color:#fff;
                    opacity:.85;
                  "
                >
                  <i class="fa-solid fa-expand"></i>
                </span>

              </div>

            </div>

          `;

        }

      }


      card.innerHTML = `

        ${mediaHTML}


        <div class="portfolio-card-body">

          <div
            class="portfolio-card-title"
          >
            ${escaparHTML(
              trabajo.titulo ||
              "Proyecto HN Muebles"
            )}
          </div>


          <div
            class="portfolio-card-description"
          >
            ${escaparHTML(
              trabajo.descripcion ||
              ""
            )}
          </div>


          ${
            media.length > 1
              ? `

                <button
                  type="button"
                  onclick="abrirVisorPortafolio('${trabajo.id}',0)"
                  style="
                    margin-top:12px;
                    width:100%;
                    border:none;
                    border-radius:8px;
                    padding:9px 12px;
                    background:#9c7151;
                    color:#fff;
                    cursor:pointer;
                    font-weight:700;
                  "
                >
                  <i class="fa-solid fa-images"></i>
                  Ver todas las fotos
                </button>

              `
              : ""
          }

        </div>

      `;


      container.appendChild(
        card
      );

    }
  );

}


// ============================================================
// CARGAR PORTAFOLIO ADMIN
// ============================================================

async function cargarPortafolioAdmin() {

  if (
    !esAdmin ||
    !auth.currentUser
  ) {
    return;
  }


  try {

    const snapshot =
      await db
        .collection("portafolio")
        .orderBy("creadoEn", "desc")
        .get();


    portafolio = [];


    snapshot.forEach(
      doc => {

        portafolio.push({

          id: doc.id,

          ...doc.data()

        });

      }
    );


    renderPortafolioAdmin();


  } catch (error) {

    console.error(
      "Error cargando portafolio admin:",
      error
    );

  }

}


// ============================================================
// PREVIEW ARCHIVOS
// ============================================================

function mostrarPreviewArchivos() {

  const container =
    document.getElementById(
      "portfolio-files-preview"
    );


  const fotos =
    Array.from(
      document.getElementById(
        "portfolio-fotos"
      )?.files || []
    );


  const videos =
    Array.from(
      document.getElementById(
        "portfolio-videos"
      )?.files || []
    );


  if (!container) return;


  container.innerHTML = "";


  [
    ...fotos,
    ...videos
  ].forEach(
    archivo => {

      const div =
        document.createElement(
          "div"
        );


      div.className =
        "file-preview";


      const url =
        URL.createObjectURL(
          archivo
        );


      if (
        archivo.type.startsWith(
          "video/"
        )
      ) {

        div.innerHTML = `

          <video
            src="${url}"
            muted
          ></video>

          <span
            class="file-preview-type"
          >

            <i
              class="fa-solid fa-video"
            ></i>

            Video

          </span>

        `;

      } else {

        div.innerHTML = `

          <img
            src="${url}"
            alt=""
          >

          <span
            class="file-preview-type"
          >

            <i
              class="fa-solid fa-image"
            ></i>

            Foto

          </span>

        `;

      }


      container.appendChild(
        div
      );

    }
  );

}


// ============================================================
// SUBIR ARCHIVO A CLOUDINARY
// ============================================================

async function subirArchivoCloudinary(
  archivo,
  progresoCallback
) {

  return new Promise(
    (resolve, reject) => {

      const formData =
        new FormData();


      formData.append(
        "file",
        archivo
      );


      formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
      );


      const xhr =
        new XMLHttpRequest();


      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`
      );


      xhr.upload.addEventListener(
        "progress",
        event => {

          if (
            event.lengthComputable &&
            progresoCallback
          ) {

            const porcentaje =
              (
                event.loaded /
                event.total
              ) * 100;


            progresoCallback(
              porcentaje
            );

          }

        }
      );


      xhr.onload =
        () => {

          if (
            xhr.status >= 200 &&
            xhr.status < 300
          ) {

            try {

              const respuesta =
                JSON.parse(
                  xhr.responseText
                );


              resolve(
                respuesta
              );

            } catch (error) {

              reject(error);

            }

          } else {

            console.error(
              "Cloudinary:",
              xhr.responseText
            );


            reject(
              new Error(
                "Cloudinary rechazó el archivo."
              )
            );

          }

        };


      xhr.onerror =
        () => {

          reject(
            new Error(
              "Error de conexión con Cloudinary."
            )
          );

        };


      xhr.send(
        formData
      );

    }
  );

}


// ============================================================
// PUBLICAR TRABAJO
// ============================================================

async function publicarTrabajoPortafolio(
  e
) {

  e.preventDefault();


  if (
    !esAdmin ||
    !auth.currentUser
  ) {

    alert(
      "Debes iniciar sesión como administrador."
    );

    return;

  }


  const titulo =
    document.getElementById(
      "portfolio-titulo"
    )?.value.trim() || "";


  const descripcion =
    document.getElementById(
      "portfolio-descripcion"
    )?.value.trim() || "";


  const fotos =
    Array.from(
      document.getElementById(
        "portfolio-fotos"
      )?.files || []
    );


  const videos =
    Array.from(
      document.getElementById(
        "portfolio-videos"
      )?.files || []
    );


  const archivos =
    [
      ...fotos,
      ...videos
    ];


  if (!titulo) {

    alert(
      "Escribe el nombre del trabajo."
    );

    return;

  }


  if (!archivos.length) {

    alert(
      "Selecciona al menos una foto o un video."
    );

    return;

  }


  const MAX_IMAGEN =
    15 * 1024 * 1024;


  const MAX_VIDEO =
    100 * 1024 * 1024;


  for (
    const archivo
    of archivos
  ) {

    if (
      archivo.type.startsWith(
        "image/"
      ) &&
      archivo.size >
      MAX_IMAGEN
    ) {

      alert(
        `La imagen "${archivo.name}" supera los 15 MB.`
      );

      return;

    }


    if (
      archivo.type.startsWith(
        "video/"
      ) &&
      archivo.size >
      MAX_VIDEO
    ) {

      alert(
        `El video "${archivo.name}" supera los 100 MB.`
      );

      return;

    }

  }


  const boton =
    document.getElementById(
      "btn-publicar-portafolio"
    );


  const progressContainer =
    document.getElementById(
      "portfolio-upload-progress"
    );


  const progressBar =
    document.getElementById(
      "portfolio-progress-bar"
    );


  const progressText =
    document.getElementById(
      "portfolio-progress-text"
    );


  const progressPercent =
    document.getElementById(
      "portfolio-progress-percent"
    );


  try {

    if (boton) {

      boton.disabled =
        true;


      boton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo...';

    }


    progressContainer?.classList.remove(
      "hidden"
    );


    const media = [];


    for (
      let i = 0;
      i < archivos.length;
      i++
    ) {

      const archivo =
        archivos[i];


      if (progressText) {

        progressText.innerText =
          `Subiendo ${i + 1} de ${archivos.length}: ${archivo.name}`;

      }


      const resultado =
        await subirArchivoCloudinary(
          archivo,
          porcentajeArchivo => {

            const porcentajeTotal =
              (
                (
                  i +
                  porcentajeArchivo /
                  100
                ) /
                archivos.length
              ) * 100;


            if (progressBar) {

              progressBar.style.width =
                `${porcentajeTotal}%`;

            }


            if (progressPercent) {

              progressPercent.innerText =
                `${Math.round(
                  porcentajeTotal
                )}%`;

            }

          }
        );


      const tipo =
        archivo.type.startsWith(
          "video/"
        )
          ? "video"
          : "imagen";


      media.push({

        tipo,

        url:
          resultado.secure_url ||
          resultado.url,

        public_id:
          resultado.public_id ||
          "",

        nombre:
          archivo.name,

        formato:
          resultado.format ||
          "",

        resource_type:
          resultado.resource_type ||
          ""

      });

    }


    if (progressText) {

      progressText.innerText =
        "Guardando información...";

    }


    await db
      .collection("portafolio")
      .add({

        titulo,

        descripcion,

        media,

        creadoPor:
          auth.currentUser.email,

        creadoEn:
          firebase.firestore.FieldValue.serverTimestamp()

      });


    alert(
      "Trabajo publicado correctamente."
    );


    document
      .getElementById(
        "form-portafolio"
      )
      ?.reset();


    const preview =
      document.getElementById(
        "portfolio-files-preview"
      );


    if (preview) {
      preview.innerHTML = "";
    }


    progressContainer?.classList.add(
      "hidden"
    );


    if (progressBar) {

      progressBar.style.width =
        "0%";

    }


    if (progressPercent) {

      progressPercent.innerText =
        "0%";

    }


    await cargarPortafolioAdmin();

    await cargarPortafolioPublico();


  } catch (error) {

    console.error(
      "ERROR SUBIENDO PORTAFOLIO:",
      error
    );


    alert(
      "No se pudo publicar el trabajo. Revisa Cloudinary y vuelve a intentarlo."
    );


  } finally {

    if (boton) {

      boton.disabled =
        false;


      boton.innerHTML =
        '<i class="fa-solid fa-cloud-arrow-up"></i> Publicar Trabajo';

    }

  }

}


// ============================================================
// RENDER PORTAFOLIO ADMIN
// ============================================================

function renderPortafolioAdmin() {

  const container =
    document.getElementById(
      "lista-portafolio-admin"
    );


  const total =
    document.getElementById(
      "total-portafolio"
    );


  if (total) {

    total.innerText =
      portafolio.length;

  }


  if (!container) return;


  container.innerHTML = "";


  if (!portafolio.length) {

    container.innerHTML = `

      <div style="
        text-align:center;
        color:#777;
        padding:25px;
      ">

        Todavía no tienes
        trabajos publicados.

      </div>

    `;

    return;

  }


  portafolio.forEach(
    trabajo => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "portfolio-admin-card";


      const primerMedia =
        trabajo.media?.[0];


      const thumb =
        primerMedia?.url || "";


      card.innerHTML = `

        <div
          style="
            cursor:pointer;
            position:relative;
          "
          onclick="abrirVisorPortafolio('${trabajo.id}',0)"
        >

          ${
            primerMedia?.tipo ===
            "video"

              ? `

                <video
                  src="${thumb}"
                  class="portfolio-admin-thumb"
                  muted
                  preload="metadata"
                ></video>

              `

              : `

                <img
                  src="${thumb}"
                  class="portfolio-admin-thumb"
                  alt=""
                >

              `
          }

        </div>


        <div class="portfolio-admin-info">

          <strong>
            ${escaparHTML(
              trabajo.titulo || ""
            )}
          </strong>


          <p>
            ${escaparHTML(
              trabajo.descripcion || ""
            )}
          </p>


          <p>
            ${trabajo.media?.length || 0}
            archivo(s)
          </p>

        </div>


        <div class="portfolio-admin-actions">

          <button
            type="button"
            class="delete-portfolio-btn"
            onclick="eliminarTrabajoPortafolio('${trabajo.id}')"
          >

            <i
              class="fa-solid fa-trash"
            ></i>

            Eliminar

          </button>

        </div>

      `;


      container.appendChild(
        card
      );

    }
  );

}


// ============================================================
// ELIMINAR TRABAJO
// ============================================================

async function eliminarTrabajoPortafolio(
  id
) {

  if (
    !esAdmin ||
    !auth.currentUser
  ) {
    return;
  }


  const trabalho =
    portafolio.find(
      p => p.id === id
    );


  if (!trabalho) return;


  if (
    !confirm(
      "¿Seguro que quieres eliminar este trabajo del portafolio?"
    )
  ) {
    return;
  }


  try {

    await db
      .collection("portafolio")
      .doc(id)
      .delete();


    await cargarPortafolioAdmin();

    await cargarPortafolioPublico();


    cerrarVisorPortafolio();


    alert(
      "Trabajo eliminado correctamente."
    );


  } catch (error) {

    console.error(
      "Error eliminando portafolio:",
      error
    );


    alert(
      "No se pudo eliminar el trabajo."
    );

  }

}


// ============================================================
// 12. DOM READY
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {


    // --------------------------------------------------------
    // LOGIN
    // --------------------------------------------------------

    const formLogin =
      document.getElementById(
        "form-login"
      );


    if (formLogin) {

      formLogin.addEventListener(
        "submit",
        async function (e) {

          e.preventDefault();


          const emailInput =
            document.getElementById(
              "input-email"
            );


          const passwordInput =
            document.getElementById(
              "input-pass"
            );


          const errorMsg =
            document.getElementById(
              "login-error-msg"
            );


          const boton =
            formLogin.querySelector(
              'button[type="submit"]'
            );


          const email =
            emailInput?.value
              .trim()
              .toLowerCase();


          const password =
            passwordInput?.value ||
            "";


          if (errorMsg) {

            errorMsg.textContent =
              "";

            errorMsg.classList.add(
              "hidden"
            );

          }


          if (
            !email ||
            !password
          ) {

            if (errorMsg) {

              errorMsg.textContent =
                "Ingresa tu correo y contraseña.";

              errorMsg.classList.remove(
                "hidden"
              );

            }

            return;

          }


          try {

            if (boton) {

              boton.disabled =
                true;

              boton.dataset.textoOriginal =
                boton.innerText;

              boton.innerText =
                "Ingresando...";

            }


            await auth
              .signInWithEmailAndPassword(
                email,
                password
              );


            if (passwordInput) {

              passwordInput.value =
                "";

            }


          } catch (error) {

            console.error(
              "ERROR LOGIN:",
              error
            );


            let mensaje =
              "No se pudo iniciar sesión.";


            switch (
              error.code
            ) {

              case "auth/invalid-credential":

                mensaje =
                  "Correo o contraseña incorrectos.";

                break;


              case "auth/wrong-password":

                mensaje =
                  "La contraseña es incorrecta.";

                break;


              case "auth/user-not-found":

                mensaje =
                  "No existe una cuenta con ese correo.";

                break;


              case "auth/invalid-email":

                mensaje =
                  "El correo electrónico no es válido.";

                break;


              case "auth/user-disabled":

                mensaje =
                  "Esta cuenta está deshabilitada.";

                break;


              case "auth/too-many-requests":

                mensaje =
                  "Demasiados intentos. Espera unos minutos.";

                break;


              case "auth/network-request-failed":

                mensaje =
                  "No hay conexión con Firebase.";

                break;


              case "auth/operation-not-allowed":

                mensaje =
                  "El acceso con correo y contraseña no está habilitado.";

                break;


              default:

                mensaje =
                  `Error de acceso: ${
                    error.message ||
                    error.code ||
                    "desconocido"
                  }`;

            }


            if (errorMsg) {

              errorMsg.textContent =
                mensaje;

              errorMsg.classList.remove(
                "hidden"
              );

            }

          } finally {

            if (boton) {

              boton.disabled =
                false;


              boton.innerText =
                boton.dataset.textoOriginal ||
                "Ingresar";

            }

          }

        }
      );

    }


    // --------------------------------------------------------
    // BÚSQUEDA PÚBLICA
    // --------------------------------------------------------

    const formBuscar =
      document.getElementById(
        "form-buscar"
      );


    if (formBuscar) {

      formBuscar.addEventListener(
        "submit",
        async function (e) {

          e.preventDefault();


          const codigo =
            document.getElementById(
              "input-codigo"
            )?.value
              .trim()
              .toUpperCase();


          if (codigo) {

            await buscarProyectoPublico(
              codigo
            );

          }

        }
      );

    }


    // --------------------------------------------------------
    // SALDO NUEVO PROYECTO
    // --------------------------------------------------------

    const presupuestoInput =
      document.getElementById(
        "nuevo-presupuesto"
      );


    const adelantoInput =
      document.getElementById(
        "nuevo-adelanto"
      );


    function calcularSaldoNuevo() {

      const total =
        Number(
          presupuestoInput?.value
        ) || 0;


      const adelanto =
        Number(
          adelantoInput?.value
        ) || 0;


      const saldo =
        Math.max(
          total - adelanto,
          0
        );


      const totalPreview =
        document.getElementById(
          "nuevo-total-preview"
        );


      const adelantoPreview =
        document.getElementById(
          "nuevo-adelanto-preview"
        );


      const saldoPreview =
        document.getElementById(
          "nuevo-saldo-preview"
        );


      if (totalPreview) {

        totalPreview.innerText =
          `Bs. ${formatearMonto(total)}`;

      }


      if (adelantoPreview) {

        adelantoPreview.innerText =
          `Bs. ${formatearMonto(adelanto)}`;

      }


      if (saldoPreview) {

        saldoPreview.innerText =
          `Bs. ${formatearMonto(saldo)}`;

      }

    }


    presupuestoInput?.addEventListener(
      "input",
      calcularSaldoNuevo
    );


    adelantoInput?.addEventListener(
      "input",
      calcularSaldoNuevo
    );


    calcularSaldoNuevo();


    // --------------------------------------------------------
    // NUEVO PROYECTO
    // --------------------------------------------------------

    const formNuevo =
      document.getElementById(
        "form-nuevo-proyecto"
      );


    if (formNuevo) {

      formNuevo.addEventListener(
        "submit",
        async function (e) {

          e.preventDefault();


          if (
            !esAdmin ||
            !auth.currentUser
          ) {

            mostrarMensajeInterno(
              "Debes iniciar sesión como administrador.",
              true
            );

            return;

          }


          const codigo =
            document.getElementById(
              "nuevo-codigo"
            )?.value
              .trim()
              .toUpperCase() ||
            generarCodigoAleatorio();


          const cliente =
            document.getElementById(
              "nuevo-cliente"
            )?.value.trim() || "";


          const mueble =
            document.getElementById(
              "nuevo-mueble"
            )?.value.trim() || "";


          const telefono =
            document.getElementById(
              "nuevo-telefono"
            )?.value.trim() || "";


          const presupuesto =
            Number(
              document.getElementById(
                "nuevo-presupuesto"
              )?.value
            ) || 0;


          const adelanto =
            Number(
              document.getElementById(
                "nuevo-adelanto"
              )?.value
            ) || 0;


          const fechaEntrega =
            document.getElementById(
              "nuevo-fecha"
            )?.value || "";


          const pendiente =
            Math.max(
              presupuesto -
              adelanto,
              0
            );


          const proyectoRef =
            db.collection(
              "proyectos"
            ).doc();


          const ingresoRef =
            db.collection(
              "ingresos"
            ).doc();


          const publicoRef =
            db.collection(
              "proyectos_publicos"
            ).doc(
              proyectoRef.id
            );


          const proyecto = {

            codigo,

            cliente,

            mueble,

            telefono,

            estado:
              "Diseño Aprobado",

            progreso:
              20,

            detalles:
              "Diseño confirmado por WhatsApp. Listo para corte.",

            presupuesto,

            adelanto,

            fechaEntrega,

            creadoEn:
              firebase.firestore
                .FieldValue
                .serverTimestamp()

          };


          const ingreso = {

            proyectoId:
              proyectoRef.id,

            codigo,

            cliente,

            mueble,

            presupuesto,

            adelanto,

            pagosFinales:
              0,

            cobrado:
              adelanto,

            pendiente,

            fechaCreacion:
              firebase.firestore
                .FieldValue
                .serverTimestamp(),

            fechaUltimoPago:
              adelanto > 0
                ? firebase.firestore
                    .FieldValue
                    .serverTimestamp()
                : null

          };


          const proyectoPublico = {

            codigo,

            cliente,

            mueble,

            estado:
              "Diseño Aprobado",

            progreso:
              20,

            detalles:
              "Diseño confirmado por WhatsApp. Listo para corte.",

            fechaEntrega

          };


          try {

            const batch =
              db.batch();


            batch.set(
              proyectoRef,
              proyecto
            );


            batch.set(
              ingresoRef,
              ingreso
            );


            batch.set(
              publicoRef,
              proyectoPublico
            );


            await batch.commit();


            document.getElementById(
              "nuevo-codigo"
            ).value =
              generarCodigoAleatorio();


            document.getElementById(
              "nuevo-cliente"
            ).value =
              "";


            document.getElementById(
              "nuevo-mueble"
            ).value =
              "";


            document.getElementById(
              "nuevo-telefono"
            ).value =
              "";


            document.getElementById(
              "nuevo-presupuesto"
            ).value =
              "";


            document.getElementById(
              "nuevo-adelanto"
            ).value =
              "";


            document.getElementById(
              "nuevo-fecha"
            ).value =
              "";


            calcularSaldoNuevo();


            await cargarProyectosDesdeNube();

            await cargarIngresosDesdeNube();


            renderProyectosAdmin();

            renderGestionIngresos();


            alert(
              "Proyecto guardado correctamente."
            );


          } catch (error) {

            console.error(
              "Error creando proyecto:",
              error
            );


            alert(
              "No se pudo guardar el proyecto. Revisa las Rules de Firestore."
            );

          }

        }
      );

    }


    // --------------------------------------------------------
    // FILTRO INGRESOS
    // --------------------------------------------------------

    const filtroIngresos =
      document.getElementById(
        "ingresos-mes"
      );


    if (filtroIngresos) {

      const ahora =
        new Date();


      filtroIngresos.value =
        `${ahora.getFullYear()}-${String(
          ahora.getMonth() + 1
        ).padStart(2, "0")}`;


      filtroIngresos.addEventListener(
        "change",
        function () {

          renderGestionIngresos();

        }
      );

    }


    // --------------------------------------------------------
    // PORTAFOLIO
    // --------------------------------------------------------

    crearVisorPortafolio();

    cargarPortafolioPublico();


    const fotosInput =
      document.getElementById(
        "portfolio-fotos"
      );


    const videosInput =
      document.getElementById(
        "portfolio-videos"
      );


    fotosInput?.addEventListener(
      "change",
      mostrarPreviewArchivos
    );


    videosInput?.addEventListener(
      "change",
      mostrarPreviewArchivos
    );


    const formPortfolio =
      document.getElementById(
        "form-portafolio"
      );


    if (formPortfolio) {

      formPortfolio.addEventListener(
        "submit",
        publicarTrabajoPortafolio
      );

    }


  }
);
