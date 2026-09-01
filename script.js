// ============================================================
// HN MUEBLES - SCRIPT PRINCIPAL
// Firebase Authentication + Firestore + Cloudinary
// Proyectos + Ingresos + Portafolio + Rastreo
// ============================================================


// ============================================================
// 1. CONFIGURACIÓN FIREBASE
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
// 2. CONFIGURACIÓN GENERAL
// ============================================================

const EMAIL_ADMIN = "hn24muebles@gmail.com";

const CLOUDINARY_CLOUD_NAME = "clvoagwx";
const CLOUDINARY_UPLOAD_PRESET = "hn_muebles_portafolio";

const CLOUDINARY_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;


// ============================================================
// 3. VARIABLES GLOBALES
// ============================================================

let proyectos = [];
let ingresos = [];
let portafolio = [];

let esAdmin = false;

let galeriaActual = 0;
let mediaActual = 0;


// ============================================================
// 4. UTILIDADES GENERALES
// ============================================================

function formatearMonto(valor) {
  const numero = Number(valor) || 0;

  return Number.isInteger(numero)
    ? numero.toString()
    : numero.toFixed(2);
}


function generarCodigoAleatorio() {
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let codigo = "";

  for (let i = 0; i < 5; i++) {
    codigo += caracteres.charAt(
      Math.floor(Math.random() * caracteres.length)
    );
  }

  return `HN${codigo}`;
}


function llenarCodigoAutomatico() {
  const input = document.getElementById("nuevo-codigo");

  if (input) {
    input.value = generarCodigoAleatorio();
  }
}


function escaparHTML(texto) {
  const div = document.createElement("div");

  div.textContent = texto || "";

  return div.innerHTML;
}


function irInicio() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function copiarCodigoAlPortapapeles(codigo) {
  navigator.clipboard
    .writeText(codigo)
    .then(() => {
      const boton = document.querySelector(
        `[data-copy-code="${codigo}"]`
      );

      if (!boton) return;

      const original = boton.innerText;

      boton.innerText = "Copiado ✓";

      setTimeout(() => {
        boton.innerText = original;
      }, 1200);
    })
    .catch(error => {
      console.error("Error copiando código:", error);
    });
}


// ============================================================
// 5. AUTENTICACIÓN
// ============================================================

auth.onAuthStateChanged(async user => {

  if (
    !user ||
    (user.email || "").trim().toLowerCase() !==
      EMAIL_ADMIN.toLowerCase()
  ) {

    esAdmin = false;

    ocultarPanelAdministrador();

    return;
  }


  esAdmin = true;

  mostrarPanelAdministrador();


  try {

    await Promise.all([
      cargarProyectosDesdeNube(),
      cargarIngresosDesdeNube(),
      cargarPortafolioAdmin()
    ]);


    renderProyectosAdmin();
    renderGestionIngresos();

  } catch (error) {

    console.error(
      "Error cargando panel administrador:",
      error
    );
  }

});


async function cerrarSesionAdmin() {

  try {

    await auth.signOut();

    esAdmin = false;

    ocultarPanelAdministrador();

    document
      .getElementById("modal-ingresos")
      ?.classList.add("hidden");

    document
      .getElementById("modal-portafolio")
      ?.classList.add("hidden");

    irInicio();

  } catch (error) {

    console.error(
      "Error cerrando sesión:",
      error
    );

  }

}


function mostrarPanelAdministrador() {

  document
    .getElementById("admin-login")
    ?.classList.add("hidden");

  document
    .getElementById("admin-panel")
    ?.classList.remove("hidden");
}


function ocultarPanelAdministrador() {

  document
    .getElementById("admin-panel")
    ?.classList.add("hidden");

  document
    .getElementById("admin-login")
    ?.classList.remove("hidden");
}


// ============================================================
// 6. FIRESTORE - CARGAR PROYECTOS
// ============================================================

async function cargarProyectosDesdeNube() {

  if (!esAdmin) return;

  try {

    const snapshot = await db
      .collection("proyectos")
      .get();

    proyectos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (error) {

    console.error(
      "Error cargando proyectos:",
      error
    );

  }

}


// ============================================================
// 7. FIRESTORE - CARGAR INGRESOS
// ============================================================

async function cargarIngresosDesdeNube() {

  if (!esAdmin) return;

  try {

    const snapshot = await db
      .collection("ingresos")
      .get();

    ingresos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (error) {

    console.error(
      "Error cargando ingresos:",
      error
    );

  }

}


// ============================================================
// 8. BÚSQUEDA PÚBLICA DE PROYECTOS
// ============================================================

async function buscarProyectoPublico(codigo) {

  const errorMsg =
    document.getElementById("mensaje-error");

  const resultBox =
    document.getElementById("resultado-proyecto");


  try {

    const snapshot = await db
      .collection("proyectos_publicos")
      .where("codigo", "==", codigo)
      .limit(1)
      .get();


    if (snapshot.empty) {

      resultBox?.classList.add("hidden");

      if (errorMsg) {

        errorMsg.innerText =
          "No se encontró ningún proyecto con ese código.";

        errorMsg.classList.remove("hidden");

      }

      return;
    }


    const data =
      snapshot.docs[0].data();


    errorMsg?.classList.add("hidden");

    resultBox?.classList.remove("hidden");


    const elCodigo =
      document.getElementById("res-codigo");

    const elMueble =
      document.getElementById("res-mueble");

    const elCliente =
      document.getElementById("res-cliente");

    const elEstado =
      document.getElementById("res-estado");

    const elPorcentaje =
      document.getElementById("res-porcentaje");

    const elDetalles =
      document.getElementById("res-detalles");

    const barraProgreso =
      document.getElementById("barra-progreso");


    if (elCodigo) {
      elCodigo.innerText =
        data.codigo || "";
    }


    if (elMueble) {
      elMueble.innerText =
        data.mueble || "";
    }


    if (elCliente) {
      elCliente.innerText =
        `Cliente: ${data.cliente || ""}`;
    }


    if (elEstado) {
      elEstado.innerText =
        data.estado || "";
    }


    if (elPorcentaje) {
      elPorcentaje.innerText =
        `${data.progreso || 0}%`;
    }


    if (elDetalles) {
      elDetalles.innerText =
        data.detalles || "";
    }


    if (barraProgreso) {
      barraProgreso.style.width =
        `${data.progreso || 0}%`;
    }


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
// 9. PROYECTOS - PANEL ADMINISTRADOR
// ============================================================

function renderProyectosAdmin() {

  if (!esAdmin) return;


  const container =
    document.getElementById(
      "lista-proyectos-admin"
    );

  const total =
    document.getElementById(
      "total-proyectos"
    );


  if (total) {
    total.innerText =
      proyectos.length;
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


  proyectos.forEach((proyecto, index) => {

    const presupuesto =
      Number(proyecto.presupuesto) || 0;

    const adelanto =
      Number(proyecto.adelanto) || 0;

    const saldo =
      Math.max(
        presupuesto - adelanto,
        0
      );


    const fecha =
      proyecto.fechaEntrega
        ? proyecto.fechaEntrega
            .split("-")
            .reverse()
            .join("/")
        : "Sin definir";


    const botonesEstados =
      etapas
        .map((estado, idx) => {

          const activo =
            proyecto.estado === estado;


          return `
            <button
              type="button"
              onclick="cambiarEstadoPorId(
                '${proyecto.id}',
                ${idx},
                ${(idx + 1) * 20}
              )"
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

        })
        .join("");


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


    card.innerHTML = `

      <div id="info-view-${index}">

        <div
          style="
            display:flex;
            justify-content:space-between;
            gap:10px;
            flex-wrap:wrap;
          "
        >

          <div
            style="
              flex:1;
              min-width:260px;
            "
          >

            <span
              style="
                background:#f59e0b;
                color:#000;
                padding:.2rem .6rem;
                border-radius:4px;
                font-weight:bold;
                font-size:.85rem;
              "
            >
              ${escaparHTML(
                proyecto.codigo || ""
              )}
            </span>


            <strong
              style="
                margin-left:.4rem;
              "
            >
              ${escaparHTML(
                proyecto.mueble || ""
              )}
            </strong>


            <p
              style="
                margin:.4rem 0;
                color:#a3a3a3;
                font-size:.85rem;
              "
            >
              Cliente:
              ${escaparHTML(
                proyecto.cliente || ""
              )}
              |
              Tel:
              ${escaparHTML(
                proyecto.telefono ||
                "Sin registrar"
              )}
            </p>


            <p
              style="
                color:#38bdf8;
                font-size:.85rem;
              "
            >
              Entrega:
              <strong>
                ${fecha}
              </strong>
            </p>


            <div
              style="
                display:grid;
                grid-template-columns:
                  repeat(3,minmax(0,1fr));
                gap:10px;
                margin-top:12px;
              "
            >

              <div
                class="financial-box"
                style="
                  background:
                    rgba(56,189,248,.07);
                  border:
                    1px solid
                    rgba(56,189,248,.25);
                  color:#38bdf8;
                "
              >
                <span
                  style="
                    font-size:.75rem;
                  "
                >
                  Monto total
                </span>

                <strong
                  style="
                    font-size:1.05rem;
                    white-space:nowrap;
                  "
                >
                  Bs.
                  ${formatearMonto(
                    presupuesto
                  )}
                </strong>
              </div>


              <div
                class="financial-box"
                style="
                  background:
                    rgba(245,158,11,.07);
                  border:
                    1px solid
                    rgba(245,158,11,.25);
                  color:#f59e0b;
                "
              >
                <span
                  style="
                    font-size:.75rem;
                  "
                >
                  Adelanto
                </span>

                <strong
                  style="
                    font-size:1.05rem;
                    white-space:nowrap;
                  "
                >
                  Bs.
                  ${formatearMonto(
                    adelanto
                  )}
                </strong>
              </div>


              <div
                class="financial-box"
                style="
                  background:
                    rgba(239,68,68,.07);
                  border:
                    1px solid
                    rgba(239,68,68,.25);
                  color:#ef4444;
                "
              >
                <span
                  style="
                    font-size:.75rem;
                  "
                >
                  Pendiente
                </span>

                <strong
                  style="
                    font-size:1.05rem;
                    white-space:nowrap;
                  "
                >
                  Bs.
                  ${formatearMonto(
                    saldo
                  )}
                </strong>
              </div>

            </div>


            <div
              style="
                margin-top:.7rem;
              "
            >
              ${botonesEstados}
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


          <div
            style="
              display:flex;
              gap:5px;
              align-items:flex-start;
            "
          >

            <button
              type="button"
              onclick="activarEdicionInline(${index})"
              class="admin-action-btn"
              style="
                background:#3b82f6;
                color:#fff;
              "
              title="Editar"
            >
              ✏️
            </button>


            <button
              type="button"
              onclick="eliminarProyecto(
                '${proyecto.id}'
              )"
              class="admin-action-btn"
              style="
                background:#ef4444;
                color:#fff;
              "
              title="Eliminar"
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


// ============================================================
// 10. CAMBIAR ESTADO DEL PROYECTO
// ============================================================

async function cambiarEstadoPorId(
  id,
  etapaIdx,
  progreso
) {

  if (
    !esAdmin ||
    !auth.currentUser
  ) {
    return;
  }


  const etapas = [
    "Diseño Aprobado",
    "Corte",
    "Armado",
    "Instalación",
    "Finalizado"
  ];


  const descripciones = [

    "Diseño confirmado por WhatsApp. Listo para corte.",

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


    batch.update(
      db.collection("proyectos").doc(id),
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
      await db
        .collection("proyectos_publicos")
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
      "Error cambiando estado:",
      error
    );

  }

}


// ============================================================
// 11. ELIMINAR PROYECTO
// ============================================================

async function eliminarProyecto(id) {

  if (
    !esAdmin ||
    !auth.currentUser ||
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

      const publicoSnap =
        await db
          .collection("proyectos_publicos")
          .where(
            "codigo",
            "==",
            proyecto.codigo
          )
          .limit(1)
          .get();


      publicoSnap.forEach(doc => {

        batch.delete(doc.ref);

      });


      const ingresoSnap =
        await db
          .collection("ingresos")
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
      "Error eliminando proyecto:",
      error
    );

  }

}


// ============================================================
// 12. EDITAR PROYECTO
// ============================================================

function activarEdicionInline(index) {

  const proyecto =
    proyectos[index];

  const info =
    document.getElementById(
      `info-view-${index}`
    );


  if (!info || !proyecto) {
    return;
  }


  info.innerHTML = `

    <div
      style="
        display:flex;
        flex-direction:column;
        gap:7px;
      "
    >

      <input
        id="edit-codigo-${index}"
        value="${escaparHTML(
          proyecto.codigo || ""
        )}"
        placeholder="Código"
      >


      <input
        id="edit-cliente-${index}"
        value="${escaparHTML(
          proyecto.cliente || ""
        )}"
        placeholder="Cliente"
      >


      <input
        id="edit-mueble-${index}"
        value="${escaparHTML(
          proyecto.mueble || ""
        )}"
        placeholder="Mueble"
      >


      <input
        id="edit-telefono-${index}"
        value="${escaparHTML(
          proyecto.telefono || ""
        )}"
        placeholder="WhatsApp"
      >


      <input
        type="number"
        id="edit-presupuesto-${index}"
        value="${proyecto.presupuesto || 0}"
        placeholder="Presupuesto"
        min="0"
        step="0.01"
      >


      <input
        type="number"
        id="edit-adelanto-${index}"
        value="${proyecto.adelanto || 0}"
        placeholder="Adelanto"
        min="0"
        step="0.01"
      >


      <input
        type="date"
        id="edit-fecha-${index}"
        value="${proyecto.fechaEntrega || ""}"
      >


      <div>

        <button
          type="button"
          onclick="
            guardarEdicionInline(
              '${proyecto.id}',
              ${index}
            )
          "
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

  if (
    !esAdmin ||
    !auth.currentUser
  ) {
    return;
  }


  const anterior =
    proyectos.find(
      p => p.id === id
    );


  const codigoAnterior =
    anterior?.codigo || "";


  const codigo =
    document
      .getElementById(
        `edit-codigo-${index}`
      )
      .value
      .trim()
      .toUpperCase();


  const cliente =
    document
      .getElementById(
        `edit-cliente-${index}`
      )
      .value
      .trim();


  const mueble =
    document
      .getElementById(
        `edit-mueble-${index}`
      )
      .value
      .trim();


  const telefono =
    document
      .getElementById(
        `edit-telefono-${index}`
      )
      .value
      .trim();


  const presupuesto =
    Number(
      document
        .getElementById(
          `edit-presupuesto-${index}`
        )
        .value
    ) || 0;


  const adelanto =
    Number(
      document
        .getElementById(
          `edit-adelanto-${index}`
        )
        .value
    ) || 0;


  const fecha =
    document
      .getElementById(
        `edit-fecha-${index}`
      )
      .value;


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
      await db
        .collection("ingresos")
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

      const cobrado =
        adelanto +
        (
          Number(
            ingresoDoc.data()
              .pagosFinales
          ) || 0
        );


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
      await db
        .collection("proyectos_publicos")
        .where(
          "codigo",
          "==",
          codigoAnterior
        )
        .limit(1)
        .get();


    for (
      const doc of publicoSnap.docs
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
      "Error editando proyecto:",
      error
    );


    alert(
      "No se pudo actualizar el proyecto."
    );

  }

}


// ============================================================
// 13. INGRESOS - RENDERIZADO
// ============================================================

function renderGestionIngresos() {

  if (!esAdmin) return;


  const container =
    document.getElementById(
      "lista-ingresos"
    );


  if (!container) return;


  const filtro =
    document
      .getElementById(
        "ingresos-mes"
      )
      ?.value || "";


  let lista =
    [...ingresos];


  if (filtro) {

    lista =
      lista.filter(ingreso => {

        if (
          !ingreso.fechaCreacion?.toDate
        ) {
          return true;
        }


        const fecha =
          ingreso.fechaCreacion.toDate();


        const mes =
          `${fecha.getFullYear()}-${
            String(
              fecha.getMonth() + 1
            ).padStart(2, "0")
          }`;


        return mes === filtro;

      });

  }


  let totalCobrado = 0;
  let totalPendiente = 0;


  lista.forEach(ingreso => {

    totalCobrado +=
      Number(ingreso.cobrado) || 0;

    totalPendiente +=
      Number(ingreso.pendiente) || 0;

  });


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
      `Bs. ${formatearMonto(
        totalCobrado
      )}`;
  }


  if (resumenPendiente) {
    resumenPendiente.innerText =
      `Bs. ${formatearMonto(
        totalPendiente
      )}`;
  }


  container.innerHTML = "";


  if (!lista.length) {

    container.innerHTML = `
      <div
        style="
          text-align:center;
          color:#777;
          padding:25px;
        "
      >
        No hay registros para este mes.
      </div>
    `;

    return;
  }


  lista.forEach(ingreso => {

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
      Number(
        ingreso.presupuesto
      ) || 0;


    const adelanto =
      Number(
        ingreso.adelanto
      ) || 0;


    const cobrado =
      Number(
        ingreso.cobrado
      ) || 0;


    const pendiente =
      Math.max(
        presupuesto - cobrado,
        0
      );


    card.innerHTML = `

      <div
        style="
          display:flex;
          justify-content:space-between;
          gap:8px;
        "
      >

        <div>

          <strong>
            ${escaparHTML(
              ingreso.cliente || ""
            )}
          </strong>

          <div
            style="
              color:#a3a3a3;
              font-size:.75rem;
            "
          >
            ${escaparHTML(
              ingreso.codigo || ""
            )}
            ·
            ${escaparHTML(
              ingreso.mueble || ""
            )}
          </div>

        </div>


        <div
          style="
            color:#38bdf8;
            font-weight:bold;
            font-size:.85rem;
          "
        >
          Total:
          Bs.
          ${formatearMonto(
            presupuesto
          )}
        </div>

      </div>


      <div
        style="
          display:grid;
          grid-template-columns:
            repeat(3,1fr);
          gap:5px;
          margin-top:8px;
        "
      >

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

            <div
              style="
                display:flex;
                gap:5px;
                margin-top:8px;
              "
            >

              <input
                type="number"
                min="0"
                step="0.01"
                id="pago-${ingreso.id}"
                placeholder="Monto pagado"
              >

              <button
                type="button"
                onclick="
                  registrarPago(
                    '${ingreso.id}'
                  )
                "
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

            <div
              style="
                margin-top:8px;
                color:#4ade80;
                font-size:.78rem;
                text-align:center;
              "
            >
              <i
                class="fa-solid fa-circle-check"
              ></i>

              Proyecto pagado completamente
            </div>

          `
      }

    `;


    container.appendChild(card);

  });

}


// ============================================================
// 14. REGISTRAR PAGO
// ============================================================

async function registrarPago(
  ingresoId
) {

  if (
    !esAdmin ||
    !auth.currentUser
  ) {
    return;
  }


  const monto =
    Number(
      document
        .getElementById(
          `pago-${ingresoId}`
        )
        ?.value
    ) || 0;


  if (monto <= 0) {
    return;
  }


  const ingreso =
    ingresos.find(
      i => i.id === ingresoId
    );


  if (!ingreso) {
    return;
  }


  const presupuesto =
    Number(
      ingreso.presupuesto
    ) || 0;


  const cobradoActual =
    Number(
      ingreso.cobrado
    ) || 0;


  const pago =
    Math.min(
      monto,
      Math.max(
        presupuesto - cobradoActual,
        0
      )
    );


  if (pago <= 0) {
    return;
  }


  try {

    await db
      .collection("ingresos")
      .doc(ingresoId)
      .update({

        pagosFinales:
          (
            Number(
              ingreso.pagosFinales
            ) || 0
          ) + pago,

        cobrado:
          cobradoActual + pago,

        pendiente:
          Math.max(
            presupuesto -
              (
                cobradoActual +
                pago
              ),
            0
          ),

        fechaUltimoPago:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

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
// 15. PDF - OBTENER LOGO
// ============================================================

async function obtenerLogoPDF() {

  try {

    const res =
      await fetch("logo.png");


    if (!res.ok) {
      return null;
    }


    const blob =
      await res.blob();


    return await new Promise(
      resolve => {

        const reader =
          new FileReader();


        reader.onloadend = () => {

          resolve(
            reader.result
          );

        };


        reader.onerror = () => {

          resolve(null);

        };


        reader.readAsDataURL(blob);

      }
    );


  } catch (error) {

    return null;

  }

}


// ============================================================
// 16. EXPORTAR INGRESOS A PDF
// ============================================================

async function exportarIngresosPDF() {

  if (!esAdmin) {
    return;
  }


  const filtro =
    document
      .getElementById(
        "ingresos-mes"
      )
      ?.value || "";


  if (
    !filtro ||
    !window.jspdf?.jsPDF
  ) {

    alert(
      "jsPDF no disponible o sin filtro."
    );

    return;

  }


  const lista =
    ingresos.filter(ingreso => {

      if (
        !ingreso.fechaCreacion?.toDate
      ) {
        return true;
      }


      const fecha =
        ingreso.fechaCreacion.toDate();


      return (
        `${fecha.getFullYear()}-${
          String(
            fecha.getMonth() + 1
          ).padStart(2, "0")
        }`
        === filtro
      );

    });


  const doc =
    new window.jspdf.jsPDF({

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


  const logo =
    await obtenerLogoPDF();


  let totalPresupuesto = 0;
  let totalAdelanto = 0;
  let totalCobrado = 0;
  let totalPendiente = 0;


  const filas =
    lista.map(ingreso => {

      const total =
        Number(
          ingreso.presupuesto
        ) || 0;


      const adelanto =
        Number(
          ingreso.adelanto
        ) || 0;


      const cobrado =
        Number(
          ingreso.cobrado
        ) || 0;


      const pendiente =
        Math.max(
          total - cobrado,
          0
        );


      totalPresupuesto += total;
      totalAdelanto += adelanto;
      totalCobrado += cobrado;
      totalPendiente += pendiente;


      return [

        ingreso.codigo || "",

        ingreso.cliente || "",

        ingreso.mueble || "",

        `Bs. ${formatearMonto(
          total
        )}`,

        `Bs. ${formatearMonto(
          adelanto
        )}`,

        `Bs. ${formatearMonto(
          cobrado
        )}`,

        `Bs. ${formatearMonto(
          pendiente
        )}`

      ];

    });


  // ----------------------------------------------------------
  // ENCABEZADO
  // ----------------------------------------------------------

  if (logo) {

    doc.addImage(
      logo,
      "PNG",
      14,
      10,
      25,
      18
    );

  }


  const posicionTexto =
    logo ? 45 : 14;


  doc.setTextColor(
    18,
    18,
    18
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
    105,
    105,
    105
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
    156,
    113,
    81
  );


  doc.text(
    "REPORTE DE INGRESOS",
    14,
    38
  );


  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.setFontSize(11);


  doc.setTextColor(
    18,
    18,
    18
  );


  doc.text(
    `${nombresMes[
      Number(mes) - 1
    ] || mes} ${anio}`,
    14,
    45
  );


  const generado =
    new Date();


  doc.setFontSize(8);


  doc.setTextColor(
    105,
    105,
    105
  );


  doc.text(

    `Generado el ${
      generado.toLocaleDateString(
        "es-BO"
      )
    } a las ${
      generado.toLocaleTimeString(
        "es-BO",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      )
    }`,

    283,

    45,

    {
      align: "right"
    }

  );


  doc.setDrawColor(
    156,
    113,
    81
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


  // ----------------------------------------------------------
  // TABLA
  // ----------------------------------------------------------

  if (
    typeof doc.autoTable ===
    "function"
  ) {

    doc.autoTable({

      startY: 55,

      margin: {
        left: 14,
        right: 14
      },

      head: [[

        "CÓDIGO",
        "CLIENTE",
        "PROYECTO",
        "TOTAL",
        "ADELANTO",
        "COBRADO",
        "PENDIENTE"

      ]],

      body: filas,

      theme: "grid",

      headStyles: {

        fillColor: [
          18,
          18,
          18
        ],

        textColor: [
          255,
          255,
          255
        ],

        fontStyle: "bold",

        fontSize: 8,

        halign: "center"

      },

      bodyStyles: {

        fontSize: 8,

        textColor: [
          45,
          45,
          45
        ],

        cellPadding: 3.5

      },

      alternateRowStyles: {

        fillColor: [
          248,
          248,
          248
        ]

      },

      columnStyles: {

        0: {
          cellWidth: 25,
          halign: "center"
        },

        1: {
          cellWidth: 45
        },

        2: {
          cellWidth: 65
        },

        3: {
          cellWidth: 36,
          halign: "right"
        },

        4: {
          cellWidth: 36,
          halign: "right"
        },

        5: {
          cellWidth: 36,
          halign: "right"
        },

        6: {
          cellWidth: 36,
          halign: "right"
        }

      }

    });


    // --------------------------------------------------------
    // RESUMEN FINAL DEL PDF
    // --------------------------------------------------------

    const finalY =
      (doc.lastAutoTable?.finalY || 55) + 10;


    doc.setFont(
      "helvetica",
      "bold"
    );


    doc.setFontSize(9);


    doc.setTextColor(
      18,
      18,
      18
    );


    doc.text(
      `TOTAL PROYECTOS: ${lista.length}`,
      14,
      finalY
    );


    doc.text(
      `TOTAL PRESUPUESTADO: Bs. ${formatearMonto(
        totalPresupuesto
      )}`,
      80,
      finalY
    );


    doc.text(
      `TOTAL COBRADO: Bs. ${formatearMonto(
        totalCobrado
      )}`,
      170,
      finalY
    );


    doc.text(
      `TOTAL PENDIENTE: Bs. ${formatearMonto(
        totalPendiente
      )}`,
      230,
      finalY
    );

  }


  doc.save(
    `HN-MUEBLES-Reporte-Ingresos-${anio}-${mes}.pdf`
  );

}


// ============================================================
// 17. WHATSAPP
// ============================================================

function notificarWhatsApp(index) {

  if (!esAdmin) {
    return;
  }


  const proyecto =
    proyectos[index];


  if (
    !proyecto ||
    !proyecto.telefono
  ) {
    return;
  }


  let numero =
    proyecto.telefono
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
      proyecto.codigo
    )}`;


  const fecha =
    proyecto.fechaEntrega
      ? proyecto.fechaEntrega
          .split("-")
          .reverse()
          .join("/")
      : "Por coordinar";


  const mensaje = `Hola *${proyecto.cliente}* 👋, desde *HN Muebles* te informamos el estado de tu proyecto *"${proyecto.mueble}"*:

🛠️ *Estado:* ${proyecto.estado}
📊 *Progreso:* ${proyecto.progreso}%
📅 *Entrega:* ${fecha}

🔍 *Consulta tu proyecto:*
${link}`;


  window.open(
    `https://wa.me/${numero}?text=${encodeURIComponent(
      mensaje
    )}`,
    "_blank"
  );

}


// ============================================================
// 18. CLOUDINARY - SUBIR ARCHIVOS
// ============================================================

async function subirArchivoCloudinary(
  archivo,
  progresoCallback
) {

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


  const esVideo =
    archivo.type.startsWith(
      "video/"
    );


  const recurso =
    esVideo
      ? "video"
      : "image";


  const url =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${recurso}/upload`;


  return new Promise(
    (resolve, reject) => {

      const xhr =
        new XMLHttpRequest();


      xhr.open(
        "POST",
        url
      );


      xhr.upload.addEventListener(
        "progress",
        evento => {

          if (
            evento.lengthComputable
          ) {

            progresoCallback?.(
              (
                evento.loaded /
                evento.total
              ) * 100
            );

          }

        }
      );


      xhr.onload = () => {

        if (
          xhr.status >= 200 &&
          xhr.status < 300
        ) {

          try {

            const data =
              JSON.parse(
                xhr.responseText
              );


            resolve({

              tipo:
                esVideo
                  ? "video"
                  : "imagen",

              url:
                data.secure_url,

              publicId:
                data.public_id,

              nombre:
                archivo.name

            });


          } catch (error) {

            reject(error);

          }


        } else {

          reject(
            new Error(
              `Cloudinary respondió ${xhr.status}`
            )
          );

        }

      };


      xhr.onerror = () => {

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
// 19. PORTAFOLIO - CARGAR PÚBLICO
// ============================================================

async function cargarPortafolioPublico() {

  const container =
    document.getElementById(
      "portfolio-grid"
    );


  if (!container) {
    return;
  }


  try {

    const snapshot =
      await db
        .collection("portafolio")
        .orderBy(
          "creadoEn",
          "desc"
        )
        .get();


    portafolio =
      snapshot.docs.map(
        doc => ({
          id: doc.id,
          ...doc.data()
        })
      );


    renderPortafolioPublico();


  } catch (error) {

    console.error(
      "Error cargando portafolio público:",
      error
    );


    container.innerHTML = `

      <div class="portfolio-empty">

        <i class="fa-solid fa-images"></i>

        <p>
          Portafolio disponible próximamente.
        </p>

      </div>

    `;

  }

}


// ============================================================
// 20. PORTAFOLIO - CARGAR ADMIN
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
        .orderBy(
          "creadoEn",
          "desc"
        )
        .get();


    portafolio =
      snapshot.docs.map(
        doc => ({
          id: doc.id,
          ...doc.data()
        })
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
// 21. PORTAFOLIO - RENDERIZADO PÚBLICO
// ============================================================

function renderPortafolioPublico() {

  const container =
    document.getElementById(
      "portfolio-grid"
    );


  if (!container) {
    return;
  }


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
          Próximamente mostraremos trabajos aquí.
        </p>

      </div>

    `;

    return;
  }


  portafolio.forEach(
    (trabajo, index) => {

      const media =
        Array.isArray(
          trabajo.media
        )
          ? trabajo.media
          : [];


      const primeraMedia =
        media[0];


      if (!primeraMedia) {
        return;
      }


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "portfolio-card";


      card.innerHTML = `

        <div
          class="portfolio-media"
          onclick="
            abrirGaleriaPortafolio(
              ${index}
            )
          "
          style="
            cursor:pointer;
          "
        >

          ${
            primeraMedia.tipo ===
            "video"

              ? `

                <video
                  src="${primeraMedia.url}"
                  muted
                  playsinline
                  preload="metadata"
                ></video>

                <div
                  class="portfolio-video-badge"
                >
                  <i
                    class="fa-solid fa-video"
                  ></i>
                  Video
                </div>

              `

              : `

                <img
                  src="${primeraMedia.url}"
                  alt=""
                  loading="lazy"
                />

              `
          }


          ${
            media.length > 1

              ? `

                <div
                  class="portfolio-video-badge"
                  style="
                    right:10px;
                    left:auto;
                  "
                >

                  <i
                    class="fa-solid fa-images"
                  ></i>

                  ${media.length}

                </div>

              `

              : ""
          }

        </div>


        <div
          class="portfolio-card-body"
        >

          <div
            class="portfolio-card-title"
          >
            ${escaparHTML(
              trabajo.titulo ||
              "Proyecto"
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


          <button
            type="button"
            onclick="
              abrirGaleriaPortafolio(
                ${index}
              )
            "
            style="
              margin-top:12px;
              width:100%;
              border:none;
              padding:10px;
              border-radius:7px;
              cursor:pointer;
              background:#9c7151;
              color:#fff;
              font-weight:bold;
            "
          >

            <i
              class="fa-solid fa-expand"
            ></i>

            Ver trabajo

          </button>

        </div>

      `;


      container.appendChild(card);

    }
  );

}


// ============================================================
// 22. GALERÍA - CREAR MODAL
// ============================================================

function crearModalGaleria() {

  if (
    document.getElementById(
      "portfolio-gallery-modal"
    )
  ) {
    return;
  }


  const modal =
    document.createElement(
      "div"
    );


  modal.id =
    "portfolio-gallery-modal";


  modal.innerHTML = `

    <div
      id="portfolio-gallery-overlay"
      style="
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.92);
        z-index:99999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
      "
    >

      <button
        type="button"
        onclick="
          cerrarGaleriaPortafolio()
        "
        style="
          position:fixed;
          top:20px;
          right:25px;
          z-index:100001;
          width:45px;
          height:45px;
          border:none;
          border-radius:50%;
          background:
            rgba(255,255,255,.12);
          color:#fff;
          font-size:22px;
          cursor:pointer;
        "
      >
        ✕
      </button>


      <button
        type="button"
        onclick="
          mediaGaleriaAnterior()
        "
        style="
          position:fixed;
          left:20px;
          top:50%;
          transform:
            translateY(-50%);
          z-index:100001;
          width:50px;
          height:50px;
          border:none;
          border-radius:50%;
          background:
            rgba(255,255,255,.12);
          color:#fff;
          font-size:25px;
          cursor:pointer;
        "
      >
        ‹
      </button>


      <div
        id="portfolio-gallery-content"
        style="
          max-width:95vw;
          max-height:90vh;
          display:flex;
          align-items:center;
          justify-content:center;
          position:relative;
        "
      ></div>


      <button
        type="button"
        onclick="
          mediaGaleriaSiguiente()
        "
        style="
          position:fixed;
          right:20px;
          top:50%;
          transform:
            translateY(-50%);
          z-index:100001;
          width:50px;
          height:50px;
          border:none;
          border-radius:50%;
          background:
            rgba(255,255,255,.12);
          color:#fff;
          font-size:25px;
          cursor:pointer;
        "
      >
        ›
      </button>


      <div
        id="portfolio-gallery-counter"
        style="
          position:fixed;
          bottom:20px;
          left:50%;
          transform:
            translateX(-50%);
          color:#fff;
          background:
            rgba(0,0,0,.6);
          padding:7px 14px;
          border-radius:20px;
          font-size:13px;
        "
      ></div>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  document
    .getElementById(
      "portfolio-gallery-overlay"
    )
    .addEventListener(
      "click",
      evento => {

        if (
          evento.target.id ===
          "portfolio-gallery-overlay"
        ) {

          cerrarGaleriaPortafolio();

        }

      }
    );

}


// ============================================================
// 23. GALERÍA - ABRIR
// ============================================================

function abrirGaleriaPortafolio(
  index
) {

  if (
    !portafolio[index]?.media
      ?.length
  ) {
    return;
  }


  crearModalGaleria();


  galeriaActual =
    index;


  mediaActual =
    0;


  actualizarGaleria();


  document
    .getElementById(
      "portfolio-gallery-modal"
    )
    .style.display =
    "block";


  document.body.style.overflow =
    "hidden";

}


// ============================================================
// 24. GALERÍA - ACTUALIZAR
// ============================================================

function actualizarGaleria() {

  const trabajo =
    portafolio[
      galeriaActual
    ];


  if (
    !trabajo?.media?.length
  ) {
    return;
  }


  if (
    mediaActual < 0
  ) {

    mediaActual =
      trabajo.media.length - 1;

  }


  if (
    mediaActual >=
    trabajo.media.length
  ) {

    mediaActual =
      0;

  }


  const archivo =
    trabajo.media[
      mediaActual
    ];


  const content =
    document.getElementById(
      "portfolio-gallery-content"
    );


  const counter =
    document.getElementById(
      "portfolio-gallery-counter"
    );


  if (!content) {
    return;
  }


  content.innerHTML =

    archivo.tipo ===
    "video"

      ? `

        <video
          src="${archivo.url}"
          controls
          autoplay
          playsinline
          style="
            max-width:90vw;
            max-height:82vh;
            border-radius:8px;
          "
        ></video>

      `

      : `

        <img
          src="${archivo.url}"
          alt=""
          style="
            max-width:90vw;
            max-height:82vh;
            object-fit:contain;
            border-radius:8px;
          "
        />

      `;


  if (counter) {

    counter.innerText =
      `${mediaActual + 1} / ${trabajo.media.length}`;

  }

}


// ============================================================
// 25. GALERÍA - NAVEGACIÓN
// ============================================================

function mediaGaleriaAnterior() {

  mediaActual--;

  actualizarGaleria();

}


function mediaGaleriaSiguiente() {

  mediaActual++;

  actualizarGaleria();

}


function cerrarGaleriaPortafolio() {

  const modal =
    document.getElementById(
      "portfolio-gallery-modal"
    );


  if (modal) {

    modal.style.display =
      "none";

  }


  document.body.style.overflow =
    "";

}


// ============================================================
// 26. TECLADO GALERÍA
// ============================================================

document.addEventListener(
  "keydown",
  evento => {

    const modal =
      document.getElementById(
        "portfolio-gallery-modal"
      );


    if (
      !modal ||
      modal.style.display ===
        "none"
    ) {
      return;
    }


    if (
      evento.key ===
      "Escape"
    ) {

      cerrarGaleriaPortafolio();

    }


    if (
      evento.key ===
      "ArrowLeft"
    ) {

      mediaGaleriaAnterior();

    }


    if (
      evento.key ===
      "ArrowRight"
    ) {

      mediaGaleriaSiguiente();

    }

  }
);


// ============================================================
// 27. PORTAFOLIO - PREVISUALIZAR ARCHIVOS
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


  if (!container) {
    return;
  }


  container.innerHTML =
    "";


  [
    ...fotos,
    ...videos
  ].forEach(archivo => {

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


    div.innerHTML =

      archivo.type.startsWith(
        "video/"
      )

        ? `

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

        `

        : `

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


    container.appendChild(
      div
    );

  });

}


// ============================================================
// 28. PORTAFOLIO - PUBLICAR TRABAJO
// ============================================================

async function publicarTrabajoPortafolio(
  evento
) {

  evento.preventDefault();


  if (
    !esAdmin ||
    !auth.currentUser
  ) {

    alert(
      "Inicia sesión como administrador."
    );

    return;

  }


  const titulo =
    document
      .getElementById(
        "portfolio-titulo"
      )
      ?.value
      .trim();


  const descripcion =
    document
      .getElementById(
        "portfolio-descripcion"
      )
      ?.value
      .trim() || "";


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


  const archivos = [
    ...fotos,
    ...videos
  ];


  if (
    !titulo ||
    !archivos.length
  ) {

    alert(
      "Escribe un título y selecciona al menos una foto o video."
    );

    return;

  }


  const boton =
    document.getElementById(
      "btn-publicar-portafolio"
    );


  const progresoContainer =
    document.getElementById(
      "portfolio-upload-progress"
    );


  const barraProgreso =
    document.getElementById(
      "portfolio-progress-bar"
    );


  const textoProgreso =
    document.getElementById(
      "portfolio-progress-text"
    );


  try {

    if (boton) {

      boton.disabled =
        true;

      boton.innerHTML =
        `
          <i
            class="fa-solid fa-spinner fa-spin"
          ></i>
          Subiendo...
        `;

    }


    progresoContainer
      ?.classList
      .remove("hidden");


    const media = [];


    for (
      let i = 0;
      i < archivos.length;
      i++
    ) {

      const archivo =
        archivos[i];


      if (textoProgreso) {

        textoProgreso.innerText =
          `Subiendo ${
            i + 1
          } de ${
            archivos.length
          }: ${
            archivo.name
          }`;

      }


      const resultado =
        await subirArchivoCloudinary(
          archivo,
          porcentaje => {

            if (barraProgreso) {

              barraProgreso.style.width =
                `${
                  (
                    i +
                    porcentaje / 100
                  ) /
                  archivos.length *
                  100
                }%`;

            }

          }
        );


      media.push(
        resultado
      );

    }


    if (textoProgreso) {

      textoProgreso.innerText =
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
          firebase.firestore
            .FieldValue
            .serverTimestamp()

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

      preview.innerHTML =
        "";

    }


    progresoContainer
      ?.classList
      .add("hidden");


    await cargarPortafolioAdmin();

    await cargarPortafolioPublico();


  } catch (error) {

    console.error(
      "ERROR PORTAFOLIO:",
      error
    );


    alert(
      "No se pudo publicar el trabajo."
    );


  } finally {

    if (boton) {

      boton.disabled =
        false;


      boton.innerHTML =
        `
          <i
            class="fa-solid fa-cloud-arrow-up"
          ></i>
          Publicar Trabajo
        `;

    }

  }

}


// ============================================================
// 29. PORTAFOLIO - RENDERIZAR ADMIN
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


  if (!container) {
    return;
  }


  container.innerHTML =
    "";


  if (!portafolio.length) {

    container.innerHTML = `

      <div
        style="
          text-align:center;
          color:#777;
          padding:25px;
        "
      >
        Todavía no tienes trabajos publicados.
      </div>

    `;

    return;
  }


  portafolio.forEach(
    (trabajo, index) => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "portfolio-admin-card";


      const primeraMedia =
        trabajo.media?.[0];


      card.innerHTML = `

        ${
          primeraMedia?.tipo ===
          "video"

            ? `

              <video
                src="${primeraMedia.url}"
                class="portfolio-admin-thumb"
                muted
                preload="metadata"
              ></video>

            `

            : `

              <img
                src="${
                  primeraMedia?.url || ""
                }"
                class="portfolio-admin-thumb"
                alt=""
              >

            `
        }


        <div
          class="portfolio-admin-info"
        >

          <strong>
            ${escaparHTML(
              trabajo.titulo || ""
            )}
          </strong>


          <p>
            ${escaparHTML(
              trabajo.descripcion ||
              ""
            )}
          </p>


          <p>
            ${trabajo.media?.length || 0}
            archivo(s)
          </p>

        </div>


        <div
          class="portfolio-admin-actions"
        >

          <button
            type="button"
            onclick="
              abrirGaleriaPortafolio(
                ${index}
              )
            "
            style="
              background:#3b82f6;
              color:#fff;
              border:none;
              padding:7px 10px;
              border-radius:6px;
              cursor:pointer;
            "
          >

            <i
              class="fa-solid fa-eye"
            ></i>

            Ver

          </button>


          <button
            type="button"
            class="delete-portfolio-btn"
            onclick="
              eliminarTrabajoPortafolio(
                '${trabajo.id}'
              )
            "
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
// 30. PORTAFOLIO - ELIMINAR TRABAJO
// ============================================================

async function eliminarTrabajoPortafolio(
  id
) {

  if (
    !esAdmin ||
    !auth.currentUser ||
    !confirm(
      "¿Seguro que quieres eliminar este trabajo?"
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


    alert(
      "Trabajo eliminado correctamente."
    );


  } catch (error) {

    console.error(
      "Error eliminando trabajo:",
      error
    );

  }

}


// ============================================================
// 31. DOM READY
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {


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
        async evento => {

          evento.preventDefault();


          const email =
            document
              .getElementById(
                "input-email"
              )
              ?.value
              .trim()
              .toLowerCase();


          const password =
            document
              .getElementById(
                "input-pass"
              )
              ?.value || "";


          const errorMsg =
            document.getElementById(
              "login-error-msg"
            );


          errorMsg
            ?.classList
            .add("hidden");


          if (
            !email ||
            !password
          ) {

            if (errorMsg) {

              errorMsg.textContent =
                "Ingresa tu correo y contraseña.";

              errorMsg
                .classList
                .remove("hidden");

            }

            return;

          }


          try {

            await auth
              .signInWithEmailAndPassword(
                email,
                password
              );


            const passwordInput =
              document.getElementById(
                "input-pass"
              );


            if (passwordInput) {

              passwordInput.value =
                "";

            }


          } catch (error) {

            if (errorMsg) {

              errorMsg.textContent =
                "Correo o contraseña incorrectos.";

              errorMsg
                .classList
                .remove("hidden");

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
        async evento => {

          evento.preventDefault();


          const codigo =
            document
              .getElementById(
                "input-codigo"
              )
              ?.value
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
    // BÚSQUEDA AUTOMÁTICA DESDE URL
    // --------------------------------------------------------

    const parametrosURL =
      new URLSearchParams(
        window.location.search
      );


    const codigoURL =
      parametrosURL.get(
        "codigo"
      );


    if (codigoURL) {

      const inputCodigo =
        document.getElementById(
          "input-codigo"
        );


      if (inputCodigo) {

        inputCodigo.value =
          codigoURL;

      }


      buscarProyectoPublico(
        codigoURL
          .trim()
          .toUpperCase()
      );

    }


    // --------------------------------------------------------
    // NUEVO PROYECTO - CÁLCULO FINANCIERO
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
          `Bs. ${formatearMonto(
            total
          )}`;

      }


      if (adelantoPreview) {

        adelantoPreview.innerText =
          `Bs. ${formatearMonto(
            adelanto
          )}`;

      }


      if (saldoPreview) {

        saldoPreview.innerText =
          `Bs. ${formatearMonto(
            saldo
          )}`;

      }

    }


    presupuestoInput
      ?.addEventListener(
        "input",
        calcularSaldoNuevo
      );


    adelantoInput
      ?.addEventListener(
        "input",
        calcularSaldoNuevo
      );


    calcularSaldoNuevo();


    // --------------------------------------------------------
    // CREAR NUEVO PROYECTO
    // --------------------------------------------------------

    const formNuevo =
      document.getElementById(
        "form-nuevo-proyecto"
      );


    if (formNuevo) {

      formNuevo.addEventListener(
        "submit",
        async evento => {

          evento.preventDefault();


          if (
            !esAdmin ||
            !auth.currentUser
          ) {
            return;
          }


          const codigo =
            document
              .getElementById(
                "nuevo-codigo"
              )
              ?.value
              .trim()
              .toUpperCase()
              ||
              generarCodigoAleatorio();


          const cliente =
            document
              .getElementById(
                "nuevo-cliente"
              )
              ?.value
              .trim()
              || "";


          const mueble =
            document
              .getElementById(
                "nuevo-mueble"
              )
              ?.value
              .trim()
              || "";


          const telefono =
            document
              .getElementById(
                "nuevo-telefono"
              )
              ?.value
              .trim()
              || "";


          const presupuesto =
            Number(
              document
                .getElementById(
                  "nuevo-presupuesto"
                )
                ?.value
            ) || 0;


          const adelanto =
            Number(
              document
                .getElementById(
                  "nuevo-adelanto"
                )
                ?.value
            ) || 0;


          const fechaEntrega =
            document
              .getElementById(
                "nuevo-fecha"
              )
              ?.value || "";


          const pendiente =
            Math.max(
              presupuesto -
                adelanto,
              0
            );


          const proyectoRef =
            db
              .collection(
                "proyectos"
              )
              .doc();


          const ingresoRef =
            db
              .collection(
                "ingresos"
              )
              .doc();


          const publicoRef =
            db
              .collection(
                "proyectos_publicos"
              )
              .doc(
                proyectoRef.id
              );


          try {

            const batch =
              db.batch();


            // PROYECTO PRIVADO
            batch.set(
              proyectoRef,
              {

                codigo,

                cliente,

                mueble,

                telefono,

                estado:
                  "Diseño Aprobado",

                progreso: 20,

                detalles:
                  "Diseño confirmado por WhatsApp. Listo para corte.",

                presupuesto,

                adelanto,

                fechaEntrega,

                creadoEn:
                  firebase.firestore
                    .FieldValue
                    .serverTimestamp()

              }
            );


            // INGRESO
            batch.set(
              ingresoRef,
              {

                proyectoId:
                  proyectoRef.id,

                codigo,

                cliente,

                mueble,

                presupuesto,

                adelanto,

                pagosFinales: 0,

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

              }
            );


            // PROYECTO PÚBLICO
            batch.set(
              publicoRef,
              {

                codigo,

                cliente,

                mueble,

                estado:
                  "Diseño Aprobado",

                progreso: 20,

                detalles:
                  "Diseño confirmado por WhatsApp. Listo para corte.",

                fechaEntrega

              }
            );


            await batch.commit();


            formNuevo.reset();


            llenarCodigoAutomatico();


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
              "No se pudo guardar el proyecto."
            );

          }

        }
      );

    }


    // --------------------------------------------------------
    // FILTRO DE INGRESOS POR MES
    // --------------------------------------------------------

    const filtroIngresos =
      document.getElementById(
        "ingresos-mes"
      );


    if (filtroIngresos) {

      const ahora =
        new Date();


      filtroIngresos.value =
        `${ahora.getFullYear()}-${
          String(
            ahora.getMonth() + 1
          ).padStart(2, "0")
        }`;


      filtroIngresos.addEventListener(
        "change",
        renderGestionIngresos
      );

    }


    // --------------------------------------------------------
    // PORTAFOLIO
    // --------------------------------------------------------

    cargarPortafolioPublico();


    document
      .getElementById(
        "portfolio-fotos"
      )
      ?.addEventListener(
        "change",
        mostrarPreviewArchivos
      );


    document
      .getElementById(
        "portfolio-videos"
      )
      ?.addEventListener(
        "change",
        mostrarPreviewArchivos
      );


    document
      .getElementById(
        "form-portafolio"
      )
      ?.addEventListener(
        "submit",
        publicarTrabajoPortafolio
      );


    // --------------------------------------------------------
    // CÓDIGO AUTOMÁTICO INICIAL
    // --------------------------------------------------------

    const codigoNuevo =
      document.getElementById(
        "nuevo-codigo"
      );


    if (
      codigoNuevo &&
      !codigoNuevo.value
    ) {

      llenarCodigoAutomatico();

    }

  }
);
