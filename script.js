// ==========================================================
// HN MUEBLES - SCRIPT SEGURO
// Firebase Authentication + Firestore
// ==========================================================

const firebaseConfig = {
  apiKey: "AIzaSyCLrVUpCGxFxuMR0ATlwj2t3osSP0dD7Y",
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


// ==========================================================
// ADMINISTRADOR
// ==========================================================

const ADMIN_EMAIL = "hn24muebles@gmail.com";

let proyectos = [];
let esAdmin = false;


// ==========================================================
// UTILIDADES
// ==========================================================

function formatearMonto(valor) {
  const num = Number(valor);
  if (isNaN(num)) return "0";
  return Number.isInteger(num) ? num.toString() : num.toString();
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
  if (input) input.value = generarCodigoAleatorio();
}

function copiarCodigoAlPortapapeles(codigo) {
  navigator.clipboard.writeText(codigo)
    .then(() => {
      alert(`¡Código "${codigo}" copiado al portapapeles!`);
    })
    .catch(error => {
      console.error("Error al copiar código:", error);
    });
}

function irInicio() {
  mostrarSeccion("inicio");
}


// ==========================================================
// AUTENTICACIÓN FIREBASE
// ==========================================================

auth.onAuthStateChanged(async (user) => {

  if (!user) {
    esAdmin = false;
    ocultarPanelAdmin();
    return;
  }

  console.log("Usuario autenticado:", user.email);

  esAdmin =
    user.email &&
    user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (!esAdmin) {

    await auth.signOut();

    alert("Esta cuenta no tiene permisos de administrador.");

    return;
  }

  mostrarPanelAdmin();

  try {

    await cargarProyectosPrivados();

    await sincronizarProyectosPublicos();

    renderProyectosAdmin();

  } catch (error) {

    console.error(
      "Error cargando datos del administrador:",
      error
    );
  }
});


// ==========================================================
// LOGIN
// ==========================================================

async function iniciarSesionAdmin() {

  const emailInput =
    document.getElementById("input-email");

  const passInput =
    document.getElementById("input-pass");

  const email =
    emailInput
      ? emailInput.value.trim()
      : "";

  const password =
    passInput
      ? passInput.value
      : "";

  if (!email || !password) {
    alert("Ingresa tu correo y contraseña.");
    return;
  }

  try {

    const resultado =
      await auth.signInWithEmailAndPassword(
        email,
        password
      );

    const user = resultado.user;

    if (
      !user.email ||
      user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
    ) {

      await auth.signOut();

      alert(
        "Esta cuenta no tiene permisos de administrador."
      );

      return;
    }

    if (passInput) {
      passInput.value = "";
    }

  } catch (error) {

    console.error(
      "Error de autenticación:",
      error
    );

    if (
      error.code === "auth/wrong-password" ||
      error.code === "auth/invalid-credential"
    ) {

      alert("Correo o contraseña incorrectos.");

    } else if (
      error.code === "auth/user-not-found"
    ) {

      alert("No existe una cuenta con ese correo.");

    } else if (
      error.code === "auth/too-many-requests"
    ) {

      alert(
        "Demasiados intentos. Espera unos minutos e inténtalo nuevamente."
      );

    } else {

      alert("No se pudo iniciar sesión.");
    }
  }
}


// ==========================================================
// PANEL ADMIN
// ==========================================================

function mostrarPanelAdmin() {

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

  const btnReportes =
    document.getElementById("btn-reportes");

  if (btnReportes) {
    btnReportes.classList.remove("hidden");
  }
}


function ocultarPanelAdmin() {

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

  const btnReportes =
    document.getElementById("btn-reportes");

  if (btnReportes) {
    btnReportes.classList.add("hidden");
  }
}


// ==========================================================
// CERRAR SESIÓN
// ==========================================================

async function cerrarSesionAdmin() {

  try {

    await auth.signOut();

    esAdmin = false;

    ocultarPanelAdmin();

    irInicio();

  } catch (error) {

    console.error(
      "Error al cerrar sesión:",
      error
    );
  }
}


// ==========================================================
// CARGAR PROYECTOS PRIVADOS
// ==========================================================

async function cargarProyectosPrivados() {

  if (!esAdmin || !auth.currentUser) {

    console.warn(
      "No autorizado para cargar proyectos privados."
    );

    return;
  }

  try {

    const snapshot =
      await db.collection("proyectos").get();

    proyectos = [];

    snapshot.forEach(docSnap => {

      proyectos.push({
        id: docSnap.id,
        ...docSnap.data()
      });

    });

    console.log(
      "Proyectos privados cargados:",
      proyectos.length
    );

  } catch (error) {

    console.error(
      "Error cargando proyectos:",
      error
    );

    alert(
      "No se pudieron cargar los proyectos."
    );
  }
}


// ==========================================================
// DATOS PÚBLICOS
// IMPORTANTE:
// NO SE ENVÍAN TELÉFONO, PRESUPUESTO NI ADELANTO.
// ==========================================================

function obtenerDatosPublicos(proyecto) {

  return {

    codigo:
      proyecto.codigo || "",

    mueble:
      proyecto.mueble || "",

    estado:
      proyecto.estado || "",

    progreso:
      Number(proyecto.progreso) || 0,

    detalles:
      proyecto.detalles ||
      `El proyecto se encuentra en etapa de ${proyecto.estado || "producción"}.`,

    fechaEntrega:
      proyecto.fechaEntrega || "",

    actualizadoEn:
      firebase.firestore.FieldValue.serverTimestamp()
  };
}


// ==========================================================
// SINCRONIZAR DATOS PÚBLICOS
// ==========================================================

async function sincronizarProyectosPublicos() {

  if (!esAdmin || !auth.currentUser) {
    return;
  }

  try {

    const batch = db.batch();

    proyectos.forEach(proyecto => {

      if (!proyecto.codigo) {
        return;
      }

      const ref =
        db
          .collection("proyectos_publicos")
          .doc(proyecto.id);

      batch.set(
        ref,
        obtenerDatosPublicos(proyecto),
        { merge: true }
      );

    });

    await batch.commit();

    console.log(
      "Proyectos públicos sincronizados."
    );

  } catch (error) {

    console.error(
      "Error sincronizando proyectos públicos:",
      error
    );
  }
}


// ==========================================================
// BUSCAR PROYECTO PÚBLICO
// ==========================================================

async function buscarProyectoPublico(codigo) {

  try {

    const snapshot =
      await db
        .collection("proyectos_publicos")
        .where("codigo", "==", codigo)
        .limit(1)
        .get();

    if (snapshot.empty) {
      return null;
    }

    const doc =
      snapshot.docs[0];

    return {
      id: doc.id,
      ...doc.data()
    };

  } catch (error) {

    console.error(
      "Error buscando proyecto:",
      error
    );

    return null;
  }
}


// ==========================================================
// URL DIRECTA
// ==========================================================

function procesarEnlaceDirectoUrl() {

  const urlParams =
    new URLSearchParams(
      window.location.search
    );

  const codigoUrl =
    urlParams.get("codigo");

  if (!codigoUrl) {
    return;
  }

  setTimeout(() => {

    mostrarSeccion("rastreo");

    const inputCodigo =
      document.getElementById("input-codigo");

    if (inputCodigo) {
      inputCodigo.value =
        codigoUrl.toUpperCase();
    }

    const formBuscar =
      document.getElementById("form-buscar");

    if (formBuscar) {

      formBuscar.dispatchEvent(
        new Event("submit", {
          cancelable: true,
          bubbles: true
        })
      );
    }

  }, 400);
}


// ==========================================================
// NAVEGACIÓN
// ==========================================================

function mostrarSeccion(seccionId) {

  const secciones = [
    "sec-inicio",
    "sec-rastreo",
    "sec-admin",
    "sec-reportes"
  ];

  secciones.forEach(id => {

    const el =
      document.getElementById(id);

    if (el) {
      el.classList.add("hidden");
    }
  });


  const botones = [
    "btn-inicio",
    "btn-rastreo",
    "btn-admin",
    "btn-reportes"
  ];

  botones.forEach(id => {

    const el =
      document.getElementById(id);

    if (el) {
      el.classList.remove("active");
    }
  });


  const secDestino =
    document.getElementById(
      `sec-${seccionId}`
    );

  const btnDestino =
    document.getElementById(
      `btn-${seccionId}`
    );


  if (secDestino) {
    secDestino.classList.remove("hidden");
  }

  if (btnDestino) {
    btnDestino.classList.add("active");
  }
}


// ==========================================================
// EVENTOS
// ==========================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    // ------------------------------------------------------
    // RASTREO
    // ------------------------------------------------------

    const formBuscar =
      document.getElementById("form-buscar");

    if (formBuscar) {

      formBuscar.addEventListener(
        "submit",
        async function (e) {

          e.preventDefault();

          const codigoInput =
            document.getElementById("input-codigo");

          if (!codigoInput) {
            return;
          }

          const codigo =
            codigoInput.value
              .trim()
              .toUpperCase();

          const errorMsg =
            document.getElementById(
              "mensaje-error"
            );

          const resultBox =
            document.getElementById(
              "resultado-proyecto"
            );

          if (!codigo) {

            if (resultBox) {
              resultBox.classList.add("hidden");
            }

            if (errorMsg) {
              errorMsg.classList.remove("hidden");
            }

            return;
          }

          const encontrado =
            await buscarProyectoPublico(codigo);

          if (encontrado) {

            if (errorMsg) {
              errorMsg.classList.add("hidden");
            }

            if (resultBox) {
              resultBox.classList.remove("hidden");
            }

            const resCodigo =
              document.getElementById("res-codigo");

            const resMueble =
              document.getElementById("res-mueble");

            const resEstado =
              document.getElementById("res-estado");

            const resPorcentaje =
              document.getElementById("res-porcentaje");

            const resBarFill =
              document.getElementById("res-bar-fill");

            const resDetalles =
              document.getElementById("res-detalles");

            if (resCodigo) {
              resCodigo.innerText =
                encontrado.codigo;
            }

            if (resMueble) {
              resMueble.innerText =
                encontrado.mueble;
            }

            if (resEstado) {
              resEstado.innerText =
                encontrado.estado;
            }

            if (resPorcentaje) {
              resPorcentaje.innerText =
                `${encontrado.progreso}%`;
            }

            if (resBarFill) {
              resBarFill.style.width =
                `${encontrado.progreso}%`;
            }

            if (resDetalles) {
              resDetalles.innerText =
                encontrado.detalles ||
                `El proyecto se encuentra en etapa de ${encontrado.estado}.`;
            }

          } else {

            if (resultBox) {
              resultBox.classList.add("hidden");
            }

            if (errorMsg) {
              errorMsg.classList.remove("hidden");
            }
          }
        }
      );
    }


    // ------------------------------------------------------
    // LOGIN
    // ------------------------------------------------------

    const formLogin =
      document.getElementById("form-login");

    if (formLogin) {

      formLogin.addEventListener(
        "submit",
        function (e) {

          e.preventDefault();

          iniciarSesionAdmin();
        }
      );
    }


    // ------------------------------------------------------
    // CÁLCULO DE SALDO
    // ------------------------------------------------------

    const inputPresupuestoNuevo =
      document.getElementById(
        "nuevo-presupuesto"
      );

    const inputAdelantoNuevo =
      document.getElementById(
        "nuevo-adelanto"
      );


    function calcularSaldoEnVivo() {

      const pres =
        parseFloat(
          inputPresupuestoNuevo
            ? inputPresupuestoNuevo.value
            : 0
        ) || 0;

      const adel =
        parseFloat(
          inputAdelantoNuevo
            ? inputAdelantoNuevo.value
            : 0
        ) || 0;

      const saldoFinal =
        pres - adel;

      const lblSaldo =
        document.getElementById(
          "lbl-nuevo-saldo"
        );

      if (lblSaldo) {

        lblSaldo.innerText =
          `Bs. ${formatearMonto(
            saldoFinal
          )}`;

        lblSaldo.style.color =
          saldoFinal > 0
            ? "#f87171"
            : "#4ade80";
      }
    }


    if (inputPresupuestoNuevo) {

      inputPresupuestoNuevo.addEventListener(
        "input",
        calcularSaldoEnVivo
      );
    }

    if (inputAdelantoNuevo) {

      inputAdelantoNuevo.addEventListener(
        "input",
        calcularSaldoEnVivo
      );
    }


    // ------------------------------------------------------
    // NUEVO PROYECTO
    // ------------------------------------------------------

    const formNuevo =
      document.getElementById(
        "form-nuevo-proyecto"
      );

    if (formNuevo) {

      formNuevo.addEventListener(
        "submit",
        async function (e) {

          e.preventDefault();

          if (!esAdmin || !auth.currentUser) {

            alert(
              "No tienes permisos para realizar esta acción."
            );

            return;
          }

          const codIn =
            document.getElementById(
              "nuevo-codigo"
            );

          const cliIn =
            document.getElementById(
              "nuevo-cliente"
            );

          const mueIn =
            document.getElementById(
              "nuevo-mueble"
            );

          const telIn =
            document.getElementById(
              "nuevo-telefono"
            );

          const presIn =
            document.getElementById(
              "nuevo-presupuesto"
            );

          const adelIn =
            document.getElementById(
              "nuevo-adelanto"
            );

          const fechaIn =
            document.getElementById(
              "nuevo-fecha"
            );


          let codigoGenerado =
            codIn
              ? codIn.value.trim().toUpperCase()
              : "";


          if (!codigoGenerado) {
            codigoGenerado =
              generarCodigoAleatorio();
          }


          const nuevoProyectoObj = {

            codigo:
              codigoGenerado,

            cliente:
              cliIn
                ? cliIn.value.trim()
                : "",

            mueble:
              mueIn
                ? mueIn.value.trim()
                : "",

            telefono:
              telIn
                ? telIn.value.trim()
                : "",

            estado:
              "Diseño Aprobado",

            progreso:
              20,

            detalles:
              "Diseño confirmado por WhatsApp. Listo para corte.",

            presupuesto:
              presIn
                ? parseFloat(presIn.value) || 0
                : 0,

            adelanto:
              adelIn
                ? parseFloat(adelIn.value) || 0
                : 0,

            fechaEntrega:
              fechaIn
                ? fechaIn.value
                : "",

            creadoPor:
              auth.currentUser.email,

            creadoEn:
              firebase.firestore.FieldValue.serverTimestamp()
          };


          try {

            const docRef =
              await db
                .collection("proyectos")
                .add(
                  nuevoProyectoObj
                );


            await db
              .collection(
                "proyectos_publicos"
              )
              .doc(docRef.id)
              .set(
                obtenerDatosPublicos(
                  nuevoProyectoObj
                )
              );


            if (codIn) codIn.value = "";
            if (cliIn) cliIn.value = "";
            if (mueIn) mueIn.value = "";
            if (telIn) telIn.value = "";
            if (presIn) presIn.value = "";
            if (adelIn) adelIn.value = "";
            if (fechaIn) fechaIn.value = "";

            calcularSaldoEnVivo();

            await cargarProyectosPrivados();

            renderProyectosAdmin();

          } catch (error) {

            console.error(
              "Error al guardar:",
              error
            );

            alert(
              "No se pudo guardar el proyecto."
            );
          }
        }
      );
    }


    // ------------------------------------------------------
    // FILTRO MENSUAL
    // ------------------------------------------------------

    const selectMes =
      document.getElementById(
        "filtro-mes"
      );

    if (selectMes) {

      const fechaActual =
        new Date();

      const anio =
        fechaActual.getFullYear();

      const mes =
        String(
          fechaActual.getMonth() + 1
        ).padStart(2, "0");

      selectMes.value =
        `${anio}-${mes}`;

      selectMes.addEventListener(
        "change",
        () => {
          renderProyectosAdmin();
        }
      );
    }


    procesarEnlaceDirectoUrl();

  }
);


// ==========================================================
// RENDERIZADO ADMIN
// ==========================================================

function renderProyectosAdmin() {

  if (!esAdmin) {
    return;
  }

  const container =
    document.getElementById(
      "lista-proyectos-admin"
    );

  const totalEl =
    document.getElementById(
      "total-proyectos"
    );

  if (totalEl) {
    totalEl.innerText =
      proyectos.length;
  }

  const selectMes =
    document.getElementById(
      "filtro-mes"
    );

  const mesSeleccionado =
    selectMes
      ? selectMes.value
      : "";


  let proyectosFiltradosMes =
    proyectos.filter(p => {

      if (
        !p.fechaEntrega ||
        p.fechaEntrega.trim() === ""
      ) {
        return true;
      }

      if (mesSeleccionado) {

        return p.fechaEntrega.startsWith(
          mesSeleccionado
        );
      }

      return true;
    });


  let totalPresupuestoMes = 0;
  let totalAdelantoMes = 0;
  let totalSaldoMes = 0;


  proyectosFiltradosMes.forEach(p => {

    const pres =
      Number(p.presupuesto) || 0;

    const adel =
      Number(p.adelanto) || 0;

    totalPresupuestoMes += pres;
    totalAdelantoMes += adel;
    totalSaldoMes += pres - adel;
  });


  const reporteCant =
    document.getElementById(
      "reporte-cant-mes"
    );

  const reportePres =
    document.getElementById(
      "reporte-presupuesto-mes"
    );

  const reporteAdel =
    document.getElementById(
      "reporte-adelanto-mes"
    );

  const reporteSaldo =
    document.getElementById(
      "reporte-saldo-mes"
    );


  if (reporteCant) {
    reporteCant.innerText =
      proyectosFiltradosMes.length;
  }

  if (reportePres) {
    reportePres.innerText =
      `Bs. ${formatearMonto(
        totalPresupuestoMes
      )}`;
  }

  if (reporteAdel) {
    reporteAdel.innerText =
      `Bs. ${formatearMonto(
        totalAdelantoMes
      )}`;
  }

  if (reporteSaldo) {
    reporteSaldo.innerText =
      `Bs. ${formatearMonto(
        totalSaldoMes
      )}`;
  }


  if (!container) {
    return;
  }

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
      presupuesto - adelanto;


    const fechaFormateada =
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

    card.style.cssText =
      "background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:1.2rem;margin-bottom:1rem;";


    let botonesEtapas =
      etapas.map(
        (est, idx) => {

          const activeStyle =
            p.estado === est
              ? "background:#f59e0b;color:#000;font-weight:bold;"
              : "background:rgba(255,255,255,0.1);color:#fff;";

          const porcentaje =
            (idx + 1) * 20;


          return `
            <button
              type="button"
              style="
                border:none;
                padding:0.4rem 0.7rem;
                border-radius:6px;
                cursor:pointer;
                font-size:0.8rem;
                margin:0.2rem;
                ${activeStyle}
              "
              onclick="cambiarEstadoPorId('${p.id}',${idx},${porcentaje})"
            >
              ${est}
            </button>
          `;
        }
      ).join("");


    card.innerHTML = `

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:1rem;
          flex-wrap:wrap;
        "
      >

        <div
          id="info-view-${index}"
          style="flex:1;min-width:280px;"
        >

          <div
            style="
              display:flex;
              align-items:center;
              gap:0.5rem;
              flex-wrap:wrap;
            "
          >

            <div
              style="
                display:flex;
                align-items:center;
                gap:0.4rem;
              "
            >

              <span
                style="
                  background:#f59e0b;
                  color:#000;
                  padding:0.2rem 0.6rem;
                  border-radius:4px;
                  font-weight:bold;
                  font-size:0.85rem;
                "
              >
                ${p.codigo}
              </span>

              <button
                type="button"
                onclick="copiarCodigoAlPortapapeles('${p.codigo}')"
              >
                Copiar
              </button>

            </div>

            <strong>
              ${p.mueble}
            </strong>

          </div>


          <p>
            Cliente: ${p.cliente}
            |
            Tel: ${p.telefono || "Sin registrar"}
          </p>


          <p>
            Entrega estimada:
            <strong>
              ${fechaFormateada}
            </strong>
          </p>


          <div>

            <div>
              Total:
              <strong>
                Bs. ${formatearMonto(presupuesto)}
              </strong>
            </div>

            <div>
              Adelanto:
              <strong>
                Bs. ${formatearMonto(adelanto)}
              </strong>
            </div>

            <div>
              Saldo:
              <strong>
                Bs. ${formatearMonto(saldo)}
              </strong>
            </div>

          </div>


          <div>
            ${botonesEtapas}
          </div>


          <div style="margin-top:0.8rem;">

            <button
              type="button"
              onclick="notificarWhatsApp(${index})"
            >
              Notificar por WhatsApp
            </button>

          </div>

        </div>


        <div
          id="edit-view-${index}"
          style="display:none;"
        >

          <h4>
            Editar Proyecto
          </h4>


          <input
            type="text"
            id="input-edit-codigo-${index}"
            value="${p.codigo}"
            placeholder="Código"
          >

          <input
            type="text"
            id="input-edit-cliente-${index}"
            value="${p.cliente}"
            placeholder="Cliente"
          >

          <input
            type="text"
            id="input-edit-mueble-${index}"
            value="${p.mueble}"
            placeholder="Mueble"
          >

          <input
            type="text"
            id="input-edit-telefono-${index}"
            value="${p.telefono || ""}"
            placeholder="Teléfono"
          >

          <input
            type="number"
            id="input-edit-presupuesto-${index}"
            value="${formatearMonto(presupuesto)}"
            placeholder="Presupuesto"
          >

          <input
            type="number"
            id="input-edit-adelanto-${index}"
            value="${formatearMonto(adelanto)}"
            placeholder="Adelanto"
          >

          <input
            type="date"
            id="input-edit-fecha-${index}"
            value="${p.fechaEntrega || ""}"
          >


          <button
            type="button"
            onclick="guardarEdicionInline('${p.id}',${index})"
          >
            Guardar
          </button>

          <button
            type="button"
            onclick="cancelarEdicionInline(${index})"
          >
            Cancelar
          </button>

        </div>


        <div>

          <button
            type="button"
            id="btn-edit-toggle-${index}"
            onclick="activarEdicionInline(${index})"
          >
            Editar
          </button>

          <button
            type="button"
            onclick="eliminarProyecto('${p.id}')"
          >
            Eliminar
          </button>

        </div>

      </div>
    `;


    container.appendChild(card);
  });
}


// ==========================================================
// EDITAR
// ==========================================================

function activarEdicionInline(index) {

  const info =
    document.getElementById(
      `info-view-${index}`
    );

  const edit =
    document.getElementById(
      `edit-view-${index}`
    );

  const button =
    document.getElementById(
      `btn-edit-toggle-${index}`
    );

  if (info) info.style.display = "none";
  if (edit) edit.style.display = "block";
  if (button) button.style.display = "none";
}


function cancelarEdicionInline(index) {

  const info =
    document.getElementById(
      `info-view-${index}`
    );

  const edit =
    document.getElementById(
      `edit-view-${index}`
    );

  const button =
    document.getElementById(
      `btn-edit-toggle-${index}`
    );

  if (info) info.style.display = "block";
  if (edit) edit.style.display = "none";
  if (button) button.style.display = "block";
}


// ==========================================================
// GUARDAR EDICIÓN
// ==========================================================

async function guardarEdicionInline(
  idFirebase,
  index
) {

  if (!esAdmin || !auth.currentUser) {

    alert(
      "No tienes permisos para realizar esta acción."
    );

    return;
  }


  const nuevoCodigo =
    document.getElementById(
      `input-edit-codigo-${index}`
    ).value
      .trim()
      .toUpperCase();


  const nuevoCliente =
    document.getElementById(
      `input-edit-cliente-${index}`
    ).value.trim();


  const nuevoMueble =
    document.getElementById(
      `input-edit-mueble-${index}`
    ).value.trim();


  const nuevoTelefono =
    document.getElementById(
      `input-edit-telefono-${index}`
    ).value.trim();


  const nuevoPresupuesto =
    parseFloat(
      document.getElementById(
        `input-edit-presupuesto-${index}`
      ).value
    ) || 0;


  const nuevoAdelanto =
    parseFloat(
      document.getElementById(
        `input-edit-adelanto-${index}`
      ).value
    ) || 0;


  const nuevaFecha =
    document.getElementById(
      `input-edit-fecha-${index}`
    ).value;


  try {

    await db
      .collection("proyectos")
      .doc(idFirebase)
      .update({

        codigo: nuevoCodigo,
        cliente: nuevoCliente,
        mueble: nuevoMueble,
        telefono: nuevoTelefono,
        presupuesto: nuevoPresupuesto,
        adelanto: nuevoAdelanto,
        fechaEntrega: nuevaFecha
      });


    const proyecto =
      proyectos.find(
        p => p.id === idFirebase
      );


    if (proyecto) {

      proyecto.codigo = nuevoCodigo;
      proyecto.cliente = nuevoCliente;
      proyecto.mueble = nuevoMueble;
      proyecto.telefono = nuevoTelefono;
      proyecto.presupuesto = nuevoPresupuesto;
      proyecto.adelanto = nuevoAdelanto;
      proyecto.fechaEntrega = nuevaFecha;


      await db
        .collection(
          "proyectos_publicos"
        )
        .doc(idFirebase)
        .set(
          obtenerDatosPublicos(proyecto),
          { merge: true }
        );
    }


    await cargarProyectosPrivados();

    renderProyectosAdmin();


  } catch (error) {

    console.error(
      "Error al actualizar:",
      error
    );

    alert(
      "Error al actualizar el proyecto."
    );
  }
}


// ==========================================================
// CAMBIAR ESTADO
// ==========================================================

async function cambiarEstadoPorId(
  idFirebase,
  etapaIdx,
  nuevoProgreso
) {

  if (!esAdmin || !auth.currentUser) {

    alert("No tienes permisos.");

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

    "El diseño ha sido aprobado por WhatsApp. El proyecto ingresa a producción.",

    "Las placas se encuentran en proceso de corte y pegado de tapacantos.",

    "Las piezas se están ensamblando en taller.",

    "El mueble está en proceso de traslado e instalación en sitio.",

    "¡El proyecto ha sido completado e instalado con éxito!"

  ];


  const nuevoEstado =
    etapas[etapaIdx];

  const nuevaDesc =
    descripciones[etapaIdx];


  if (!nuevoEstado) {
    return;
  }


  try {

    await db
      .collection("proyectos")
      .doc(idFirebase)
      .update({

        estado: nuevoEstado,
        progreso: nuevoProgreso,
        detalles: nuevaDesc

      });


    const proyecto =
      proyectos.find(
        p => p.id === idFirebase
      );


    if (proyecto) {

      proyecto.estado =
        nuevoEstado;

      proyecto.progreso =
        nuevoProgreso;

      proyecto.detalles =
        nuevaDesc;


      await db
        .collection(
          "proyectos_publicos"
        )
        .doc(idFirebase)
        .set(
          obtenerDatosPublicos(proyecto),
          { merge: true }
        );
    }


    renderProyectosAdmin();


  } catch (error) {

    console.error(
      "Error cambiando estado:",
      error
    );

    alert(
      "No se pudo actualizar el estado."
    );
  }
}


// ==========================================================
// ELIMINAR
// ==========================================================

async function eliminarProyecto(
  idFirebase
) {

  if (!esAdmin || !auth.currentUser) {

    alert("No tienes permisos.");

    return;
  }


  if (
    !confirm(
      "¿Deseas eliminar este proyecto de la nube?"
    )
  ) {

    return;
  }


  try {

    await db
      .collection("proyectos")
      .doc(idFirebase)
      .delete();


    await db
      .collection(
        "proyectos_publicos"
      )
      .doc(idFirebase)
      .delete();


    await cargarProyectosPrivados();

    renderProyectosAdmin();


  } catch (error) {

    console.error(
      "Error al eliminar:",
      error
    );

    alert(
      "Error al eliminar proyecto."
    );
  }
}


// ==========================================================
// WHATSAPP
// ==========================================================

function notificarWhatsApp(index) {

  if (!esAdmin) {

    alert("No tienes permisos.");

    return;
  }


  const p =
    proyectos[index];


  if (
    !p ||
    !p.telefono ||
    p.telefono.trim() === ""
  ) {

    alert(
      "Este cliente no tiene un número de teléfono registrado."
    );

    return;
  }


  let num =
    p.telefono
      .toString()
      .replace(/\D/g, "");


  if (
    !num.startsWith("591") &&
    num.length === 8
  ) {

    num =
      "591" + num;
  }


  const fechaTexto =
    p.fechaEntrega
      ? p.fechaEntrega
          .split("-")
          .reverse()
          .join("/")
      : "Por coordinar";


  const linkBase =
    window.location.origin +
    window.location.pathname;


  const linkDirecto =
    `${linkBase}?codigo=${encodeURIComponent(
      p.codigo
    )}`;


  const mensaje =
`Hola *${p.cliente}* 👋, desde *HN Muebles* te informamos el estado de tu proyecto *"${p.mueble}"*:

🛠️ *Estado:* ${p.estado}
📊 *Progreso:* ${p.progreso}%
📅 *Fecha Estimada de Entrega:* ${fechaTexto}

🔍 *Haz clic en el siguiente enlace para ver el estado de tu proyecto:*
${linkDirecto}`;


  window.open(
    `https://wa.me/${num}?text=${encodeURIComponent(
      mensaje
    )}`,
    "_blank"
  );
}
