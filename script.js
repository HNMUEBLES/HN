// ============================================================
// HN MUEBLES - SCRIPT PRINCIPAL
// Firebase Authentication + Firestore
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

const EMAIL_ADMIN = "hn24muebles@gmail.com";

let proyectos = [];
let esAdmin = false;


// ============================================================
// UTILIDADES
// ============================================================

function formatearMonto(valor) {
  const num = Number(valor);

  if (isNaN(num)) return "0";

  return Number.isInteger(num)
    ? num.toString()
    : num.toString();
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

  const inputCod =
    document.getElementById("nuevo-codigo");

  if (inputCod) {
    inputCod.value =
      generarCodigoAleatorio();
  }
}


function copiarCodigoAlPortapapeles(codigo) {

  navigator.clipboard.writeText(codigo)
    .catch(error => {
      console.error("Error al copiar código:", error);
    });
}


function irInicio() {

  if (typeof mostrarSeccion === "function") {
    mostrarSeccion("inicio");
  }
}


// ============================================================
// AUTENTICACIÓN
// ============================================================

auth.onAuthStateChanged(async (user) => {

  if (user) {

    console.log(
      "Usuario autenticado:",
      user.email
    );

    if (
      user.email.toLowerCase() ===
      EMAIL_ADMIN.toLowerCase()
    ) {

      esAdmin = true;

      mostrarPanelAdministrador();

      await cargarProyectosDesdeNube();

      renderProyectosAdmin();

    } else {

      console.warn(
        "Usuario no autorizado:",
        user.email
      );

      await auth.signOut();

      esAdmin = false;

      ocultarPanelAdministrador();

    }

  } else {

    console.log(
      "No hay sesión activa."
    );

    esAdmin = false;

    ocultarPanelAdministrador();
  }
});


// ============================================================
// MOSTRAR / OCULTAR ADMIN
// ============================================================

function mostrarPanelAdministrador() {

  const divLogin =
    document.getElementById("admin-login");

  const divPanel =
    document.getElementById("admin-panel");

  const btnReportes =
    document.getElementById("btn-reportes");

  if (divLogin) {
    divLogin.classList.add("hidden");
  }

  if (divPanel) {
    divPanel.classList.remove("hidden");
  }

  if (btnReportes) {
    btnReportes.classList.remove("hidden");
  }
}


function ocultarPanelAdministrador() {

  const divLogin =
    document.getElementById("admin-login");

  const divPanel =
    document.getElementById("admin-panel");

  const btnReportes =
    document.getElementById("btn-reportes");

  if (divPanel) {
    divPanel.classList.add("hidden");
  }

  if (divLogin) {
    divLogin.classList.remove("hidden");
  }

  if (btnReportes) {
    btnReportes.classList.add("hidden");
  }
}


// ============================================================
// DOM
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    // ========================================================
    // LOGIN
    // ========================================================

    const formLogin =
      document.getElementById("form-login");

    if (formLogin) {

      formLogin.addEventListener(
        "submit",
        async function (e) {

          e.preventDefault();

          const emailInput =
            document.getElementById("input-email");

          const passInput =
            document.getElementById("input-pass");

          const errorMsg =
            document.getElementById(
              "login-error-msg"
            );

          const email =
            emailInput
              ? emailInput.value.trim()
              : "";

          const password =
            passInput
              ? passInput.value
              : "";

          if (!email || !password) {

            if (errorMsg) {

              errorMsg.textContent =
                "Ingresa tu correo y contraseña.";

              errorMsg.classList.remove("hidden");
            }

            return;
          }

          try {

            if (errorMsg) {
              errorMsg.classList.add("hidden");
            }

            const resultado =
              await auth.signInWithEmailAndPassword(
                email,
                password
              );

            const usuario =
              resultado.user;

            if (
              usuario.email.toLowerCase() !==
              EMAIL_ADMIN.toLowerCase()
            ) {

              await auth.signOut();

              throw new Error(
                "Esta cuenta no es administradora."
              );
            }

            if (passInput) {
              passInput.value = "";
            }

          } catch (error) {

            console.error(
              "Error de autenticación:",
              error
            );

            if (passInput) {
              passInput.value = "";
            }

            let mensaje =
              "No se pudo iniciar sesión.";

            if (
              error.code ===
              "auth/invalid-credential"
            ) {

              mensaje =
                "Correo o contraseña incorrectos.";
            }

            if (
              error.code ===
              "auth/invalid-email"
            ) {

              mensaje =
                "El correo electrónico no es válido.";
            }

            if (
              error.code ===
              "auth/too-many-requests"
            ) {

              mensaje =
                "Demasiados intentos. Espera unos minutos.";
            }

            if (
              error.message ===
              "Esta cuenta no es administradora."
            ) {

              mensaje =
                "Esta cuenta no tiene permisos de administrador.";
            }

            if (errorMsg) {

              errorMsg.textContent =
                mensaje;

              errorMsg.classList.remove(
                "hidden"
              );
            }
          }
        }
      );
    }


    // ========================================================
    // BÚSQUEDA PÚBLICA
    // ========================================================

    const formBuscar =
      document.getElementById("form-buscar");

    if (formBuscar) {

      formBuscar.addEventListener(
        "submit",
        async function (e) {

          e.preventDefault();

          const codigoInput =
            document.getElementById(
              "input-codigo"
            );

          if (!codigoInput) return;

          const codigo =
            codigoInput.value
              .trim()
              .toUpperCase();

          buscarProyectoPublico(codigo);
        }
      );
    }


    // ========================================================
    // CÁLCULO DE SALDO
    // ========================================================

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
          `Bs. ${formatearMonto(saldoFinal)}`;

        lblSaldo.style.color =
          saldoFinal > 0
            ? "#ef4444"
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


    // ========================================================
    // NUEVO PROYECTO
    // ========================================================

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

            console.warn(
              "Sesión de administrador no activa."
            );

            return;
          }

          const usuario =
            auth.currentUser.email.toLowerCase();

          if (
            usuario !==
            EMAIL_ADMIN.toLowerCase()
          ) {

            console.warn(
              "Usuario sin permisos."
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
              ? codIn.value
                  .trim()
                  .toUpperCase()
              : "";


          if (!codigoGenerado) {

            codigoGenerado =
              generarCodigoAleatorio();
          }


          const presupuesto =
            presIn
              ? parseFloat(
                  presIn.value
                ) || 0
              : 0;


          const adelanto =
            adelIn
              ? parseFloat(
                  adelIn.value
                ) || 0
              : 0;


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
              presupuesto,

            adelanto:
              adelanto,

            saldo:
              presupuesto - adelanto,

            fechaEntrega:
              fechaIn
                ? fechaIn.value
                : ""
          };


          try {

            // GUARDAR EN FIRESTORE
            await db
              .collection("proyectos")
              .add(
                nuevoProyectoObj
              );


            // LIMPIAR FORMULARIO
            if (codIn)
              codIn.value = "";

            if (cliIn)
              cliIn.value = "";

            if (mueIn)
              mueIn.value = "";

            if (telIn)
              telIn.value = "";

            if (presIn)
              presIn.value = "";

            if (adelIn)
              adelIn.value = "";

            if (fechaIn)
              fechaIn.value = "";


            // ACTUALIZAR AUTOMÁTICAMENTE
            await cargarProyectosDesdeNube();

            renderProyectosAdmin();


            // IMPORTANTE:
            // NO HAY ALERT()
            // NO HAY VENTANA EMERGENTE

          } catch (error) {

            console.error(
              "Error al guardar proyecto:",
              error
            );

            // Tampoco mostramos popup.
            // El error queda registrado
            // en la consola del navegador.
          }

        }
      );
    }


    // ========================================================
    // FILTRO MENSUAL
    // ========================================================

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
        function () {

          renderProyectosAdmin();
        }
      );
    }

  }
);


// ============================================================
// CERRAR SESIÓN
// ============================================================

async function cerrarSesionAdmin() {

  try {

    await auth.signOut();

    esAdmin = false;

    ocultarPanelAdministrador();

    irInicio();

  } catch (error) {

    console.error(
      "Error cerrando sesión:",
      error
    );
  }
}


// ============================================================
// CARGAR PROYECTOS
// ============================================================

async function cargarProyectosDesdeNube() {

  try {

    if (
      !auth.currentUser ||
      !esAdmin
    ) {

      console.warn(
        "Usuario no autenticado."
      );

      return;
    }


    const querySnapshot =
      await db
        .collection("proyectos")
        .get();


    proyectos = [];


    querySnapshot.forEach(
      (docSnap) => {

        proyectos.push({

          id:
            docSnap.id,

          ...docSnap.data()

        });

      }
    );


    if (esAdmin) {

      renderProyectosAdmin();
    }


    procesarEnlaceDirectoUrl();


  } catch (error) {

    console.error(
      "Error cargando proyectos:",
      error
    );
  }
}


// ============================================================
// BÚSQUEDA PÚBLICA
// ============================================================

async function buscarProyectoPublico(codigo) {

  const errorMsg =
    document.getElementById(
      "mensaje-error"
    );

  const resultBox =
    document.getElementById(
      "resultado-proyecto"
    );


  try {

    const snapshot =
      await db
        .collection(
          "proyectos_publicos"
        )
        .where(
          "codigo",
          "==",
          codigo
        )
        .limit(1)
        .get();


    if (snapshot.empty) {

      if (resultBox)
        resultBox.classList.add(
          "hidden"
        );

      if (errorMsg)
        errorMsg.classList.remove(
          "hidden"
        );

      return;
    }


    const doc =
      snapshot.docs[0];

    const encontrado =
      doc.data();


    if (errorMsg)
      errorMsg.classList.add(
        "hidden"
      );

    if (resultBox)
      resultBox.classList.remove(
        "hidden"
      );


    const codigoEl =
      document.getElementById(
        "res-codigo"
      );

    const muebleEl =
      document.getElementById(
        "res-mueble"
      );

    const clienteEl =
      document.getElementById(
        "res-cliente"
      );

    const estadoEl =
      document.getElementById(
        "res-estado"
      );

    const porcentajeEl =
      document.getElementById(
        "res-porcentaje"
      );

    const barEl =
      document.getElementById(
        "res-bar-fill"
      );

    const detallesEl =
      document.getElementById(
        "res-detalles"
      );


    if (codigoEl)
      codigoEl.innerText =
        encontrado.codigo || "";

    if (muebleEl)
      muebleEl.innerText =
        encontrado.mueble || "";

    if (clienteEl)
      clienteEl.innerText =
        `Cliente: ${encontrado.cliente || ""}`;

    if (estadoEl)
      estadoEl.innerText =
        encontrado.estado || "";

    if (porcentajeEl)
      porcentajeEl.innerText =
        `${encontrado.progreso || 0}%`;

    if (barEl)
      barEl.style.width =
        `${encontrado.progreso || 0}%`;

    if (detallesEl)
      detallesEl.innerText =
        encontrado.detalles ||
        `El proyecto se encuentra en etapa de ${encontrado.estado || ""}.`;


  } catch (error) {

    console.error(
      "Error buscando proyecto público:",
      error
    );

    if (resultBox)
      resultBox.classList.add(
        "hidden"
      );

    if (errorMsg) {

      errorMsg.innerText =
        "No se pudo consultar el proyecto.";

      errorMsg.classList.remove(
        "hidden"
      );
    }
  }
}


// ============================================================
// ENLACE DIRECTO
// ============================================================

function procesarEnlaceDirectoUrl() {

  const urlParams =
    new URLSearchParams(
      window.location.search
    );

  const codigoUrl =
    urlParams.get("codigo");


  if (!codigoUrl) return;


  setTimeout(() => {

    const inputCodigo =
      document.getElementById(
        "input-codigo"
      );

    const formBuscar =
      document.getElementById(
        "form-buscar"
      );


    if (inputCodigo) {

      inputCodigo.value =
        codigoUrl
          .trim()
          .toUpperCase();
    }


    if (formBuscar) {

      formBuscar.dispatchEvent(
        new Event(
          "submit",
          {
            cancelable: true,
            bubbles: true
          }
        )
      );
    }

  }, 400);
}


// ============================================================
// NAVEGACIÓN
// ============================================================

function mostrarSeccion(seccionId) {

  const secciones = [
    "sec-inicio",
    "sec-rastreo",
    "sec-admin",
    "sec-reportes"
  ];


  secciones.forEach(
    id => {

      const el =
        document.getElementById(id);

      if (el)
        el.classList.add(
          "hidden"
        );
    }
  );


  const botones = [
    "btn-inicio",
    "btn-rastreo",
    "btn-admin",
    "btn-reportes"
  ];


  botones.forEach(
    id => {

      const el =
        document.getElementById(id);

      if (el)
        el.classList.remove(
          "active"
        );
    }
  );


  const secDestino =
    document.getElementById(
      `sec-${seccionId}`
    );

  const btnDestino =
    document.getElementById(
      `btn-${seccionId}`
    );


  if (secDestino)
    secDestino.classList.remove(
      "hidden"
    );

  if (btnDestino)
    btnDestino.classList.add(
      "active"
    );
}


// ============================================================
// RENDER ADMIN
// ============================================================

function renderProyectosAdmin() {

  if (!esAdmin) return;


  const container =
    document.getElementById(
      "lista-proyectos-admin"
    );

  const totalEl =
    document.getElementById(
      "total-proyectos"
    );


  if (totalEl)
    totalEl.innerText =
      proyectos.length;


  if (!container) return;


  const selectMes =
    document.getElementById(
      "filtro-mes"
    );

  const mesSeleccionado =
    selectMes
      ? selectMes.value
      : "";


  let proyectosFiltradosMes =
    proyectos.filter(
      p => {

        if (
          !p.fechaEntrega ||
          p.fechaEntrega.trim() === ""
        ) {
          return true;
        }

        if (mesSeleccionado) {

          return p.fechaEntrega
            .startsWith(
              mesSeleccionado
            );
        }

        return true;
      }
    );


  let totalPresupuestoMes = 0;
  let totalAdelantoMes = 0;
  let totalSaldoMes = 0;


  proyectosFiltradosMes.forEach(
    p => {

      const pres =
        Number(
          p.presupuesto
        ) || 0;

      const adel =
        Number(
          p.adelanto
        ) || 0;

      const saldo =
        pres - adel;

      totalPresupuestoMes +=
        pres;

      totalAdelantoMes +=
        adel;

      totalSaldoMes +=
        saldo;
    }
  );


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


  if (reporteCant)
    reporteCant.innerText =
      proyectosFiltradosMes.length;

  if (reportePres)
    reportePres.innerText =
      `Bs. ${formatearMonto(
        totalPresupuestoMes
      )}`;

  if (reporteAdel)
    reporteAdel.innerText =
      `Bs. ${formatearMonto(
        totalAdelantoMes
      )}`;

  if (reporteSaldo)
    reporteSaldo.innerText =
      `Bs. ${formatearMonto(
        totalSaldoMes
      )}`;


  container.innerHTML = "";


  const etapas = [
    "Diseño Aprobado",
    "Corte",
    "Armado",
    "Instalación",
    "Finalizado"
  ];


  proyectos.forEach(
    (p, index) => {

      const presupuesto =
        Number(
          p.presupuesto
        ) || 0;

      const adelanto =
        Number(
          p.adelanto
        ) || 0;

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
        document.createElement(
          "div"
        );


      card.className =
        "admin-card";


      card.style.cssText =
        "background:rgba(255,255,255,0.05);" +
        "border:1px solid rgba(255,255,255,0.1);" +
        "border-radius:12px;" +
        "padding:1.2rem;" +
        "margin-bottom:1rem;";


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

        <div style="
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:1rem;
          flex-wrap:wrap;
        ">

          <div
            id="info-view-${index}"
            style="flex:1;min-width:280px;"
          >

            <div style="
              display:flex;
              align-items:center;
              gap:0.5rem;
              flex-wrap:wrap;
            ">

              <div style="
                display:flex;
                align-items:center;
                gap:0.4rem;
              ">

                <span style="
                  background:#f59e0b;
                  color:#000;
                  padding:0.2rem 0.6rem;
                  border-radius:4px;
                  font-weight:bold;
                  font-size:0.85rem;
                ">
                  ${p.codigo || ""}
                </span>

                <button
                  type="button"
                  onclick="copiarCodigoAlPortapapeles('${p.codigo || ""}')"
                  style="
                    background:rgba(255,255,255,0.1);
                    color:#fff;
                    border:1px solid rgba(255,255,255,0.2);
                    padding:0.2rem 0.5rem;
                    border-radius:4px;
                    cursor:pointer;
                    font-size:0.75rem;
                  "
                >
                  Copiar
                </button>

              </div>

              <strong>
                ${p.mueble || ""}
              </strong>

            </div>


            <p style="
              margin:0.4rem 0;
              color:#a3a3a3;
              font-size:0.85rem;
            ">
              Cliente: ${p.cliente || ""}
              |
              Tel: ${p.telefono || "Sin registrar"}
            </p>


            <p style="
              margin:0.2rem 0 0.7rem 0;
              color:#38bdf8;
              font-size:0.85rem;
            ">
              Entrega estimada:
              <strong>
                ${fechaFormateada}
              </strong>
            </p>


            <!-- =================================================
                 CUADROS DE DINERO
                 ================================================= -->

            <div style="
              display:grid;
              grid-template-columns:repeat(3, minmax(0, 1fr));
              gap:8px;
              margin:0.8rem 0;
            ">

              <!-- TOTAL -->
              <div style="
                background:rgba(56,189,248,0.08);
                border:1px solid rgba(56,189,248,0.30);
                border-radius:10px;
                padding:0.75rem;
                text-align:center;
              ">

                <div style="
                  color:#38bdf8;
                  font-size:0.72rem;
                  font-weight:bold;
                  text-transform:uppercase;
                  letter-spacing:0.5px;
                  margin-bottom:4px;
                ">
                  Total
                </div>

                <div style="
                  color:#fff;
                  font-size:1rem;
                  font-weight:bold;
                ">
                  Bs. ${formatearMonto(
                    presupuesto
                  )}
                </div>

              </div>


              <!-- ADELANTO -->
              <div style="
                background:rgba(245,158,11,0.08);
                border:1px solid rgba(245,158,11,0.30);
                border-radius:10px;
                padding:0.75rem;
                text-align:center;
              ">

                <div style="
                  color:#f59e0b;
                  font-size:0.72rem;
                  font-weight:bold;
                  text-transform:uppercase;
                  letter-spacing:0.5px;
                  margin-bottom:4px;
                ">
                  Adelanto
                </div>

                <div style="
                  color:#fff;
                  font-size:1rem;
                  font-weight:bold;
                ">
                  Bs. ${formatearMonto(
                    adelanto
                  )}
                </div>

              </div>


              <!-- PENDIENTE -->
              <div style="
                background:rgba(239,68,68,0.08);
                border:1px solid rgba(239,68,68,0.30);
                border-radius:10px;
                padding:0.75rem;
                text-align:center;
              ">

                <div style="
                  color:#ef4444;
                  font-size:0.72rem;
                  font-weight:bold;
                  text-transform:uppercase;
                  letter-spacing:0.5px;
                  margin-bottom:4px;
                ">
                  Pendiente
                </div>

                <div style="
                  color:#fff;
                  font-size:1rem;
                  font-weight:bold;
                ">
                  Bs. ${formatearMonto(
                    saldo
                  )}
                </div>

              </div>

            </div>


            <!-- ETAPAS -->

            <div style="
              margin-top:0.5rem;
            ">
              ${botonesEtapas}
            </div>


            <!-- WHATSAPP -->

            <div style="
              margin-top:0.8rem;
            ">

              <button
                type="button"
                onclick="notificarWhatsApp(${index})"
                style="
                  background:#16a34a;
                  color:white;
                  border:none;
                  padding:0.4rem 0.8rem;
                  border-radius:6px;
                  cursor:pointer;
                  font-size:0.85rem;
                  font-weight:bold;
                "
              >
                WhatsApp
              </button>

            </div>

          </div>


          <!-- BOTONES -->

          <div style="
            display:flex;
            gap:0.5rem;
          ">

            <button
              type="button"
              onclick="activarEdicionInline(${index})"
              style="
                background:#3b82f6;
                color:white;
                border:none;
                padding:0.6rem 0.8rem;
                border-radius:8px;
                cursor:pointer;
              "
            >
              ✏️
            </button>


            <button
              type="button"
              onclick="eliminarProyecto('${p.id}')"
              style="
                background:#ef4444;
                color:white;
                border:none;
                padding:0.6rem 0.8rem;
                border-radius:8px;
                cursor:pointer;
              "
            >
              🗑️
            </button>

          </div>

        </div>
      `;


      container.appendChild(card);

    }
  );
}


// ============================================================
// CAMBIAR ESTADO
// ============================================================

async function cambiarEstadoPorId(
  idFirebase,
  etapaIdx,
  nuevoProgreso
) {

  if (
    !esAdmin ||
    !auth.currentUser
  ) {

    console.warn(
      "Sesión de administrador no válida."
    );

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


  try {

    await db
      .collection("proyectos")
      .doc(idFirebase)
      .update({

        estado:
          nuevoEstado,

        progreso:
          nuevoProgreso,

        detalles:
          nuevaDesc

      });


    await cargarProyectosDesdeNube();

    renderProyectosAdmin();


  } catch (error) {

    console.error(
      "Error actualizando estado:",
      error
    );
  }
}


// ============================================================
// ELIMINAR PROYECTO
// ============================================================

async function eliminarProyecto(
  idFirebase
) {

  if (
    !esAdmin ||
    !auth.currentUser
  ) {

    console.warn(
      "Sesión de administrador no válida."
    );

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


    await cargarProyectosDesdeNube();

    renderProyectosAdmin();


  } catch (error) {

    console.error(
      "Error eliminando:",
      error
    );
  }
}


// ============================================================
// EDITAR PROYECTO
// ============================================================

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
      gap:8px;
    ">

      <input
        id="edit-codigo-${index}"
        value="${p.codigo || ""}"
        placeholder="Código"
      >

      <input
        id="edit-cliente-${index}"
        value="${p.cliente || ""}"
        placeholder="Cliente"
      >

      <input
        id="edit-mueble-${index}"
        value="${p.mueble || ""}"
        placeholder="Mueble"
      >

      <input
        id="edit-telefono-${index}"
        value="${p.telefono || ""}"
        placeholder="WhatsApp"
      >

      <input
        id="edit-presupuesto-${index}"
        value="${p.presupuesto || 0}"
        placeholder="Presupuesto"
      >

      <input
        id="edit-adelanto-${index}"
        value="${p.adelanto || 0}"
        placeholder="Adelanto"
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
  idFirebase,
  index
) {

  if (
    !esAdmin ||
    !auth.currentUser
  ) {

    console.warn(
      "Sesión de administrador no válida."
    );

    return;
  }


  const nuevoCodigo =
    document.getElementById(
      `edit-codigo-${index}`
    ).value
      .trim()
      .toUpperCase();


  const nuevoCliente =
    document.getElementById(
      `edit-cliente-${index}`
    ).value.trim();


  const nuevoMueble =
    document.getElementById(
      `edit-mueble-${index}`
    ).value.trim();


  const nuevoTelefono =
    document.getElementById(
      `edit-telefono-${index}`
    ).value.trim();


  const nuevoPresupuesto =
    parseFloat(
      document.getElementById(
        `edit-presupuesto-${index}`
      ).value
    ) || 0;


  const nuevoAdelanto =
    parseFloat(
      document.getElementById(
        `edit-adelanto-${index}`
      ).value
    ) || 0;


  const nuevaFecha =
    document.getElementById(
      `edit-fecha-${index}`
    ).value;


  try {

    await db
      .collection("proyectos")
      .doc(idFirebase)
      .update({

        codigo:
          nuevoCodigo,

        cliente:
          nuevoCliente,

        mueble:
          nuevoMueble,

        telefono:
          nuevoTelefono,

        presupuesto:
          nuevoPresupuesto,

        adelanto:
          nuevoAdelanto,

        saldo:
          nuevoPresupuesto -
          nuevoAdelanto,

        fechaEntrega:
          nuevaFecha

      });


    await cargarProyectosDesdeNube();

    renderProyectosAdmin();


  } catch (error) {

    console.error(
      "Error actualizando:",
      error
    );
  }
}


// ============================================================
// WHATSAPP
// ============================================================

function notificarWhatsApp(index) {

  if (!esAdmin) {

    return;
  }


  const p =
    proyectos[index];


  if (
    !p.telefono ||
    p.telefono.trim() === ""
  ) {

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


  const linkBase =
    window.location.origin +
    window.location.pathname;


  const linkDirecto =
    `${linkBase}?codigo=${p.codigo}`;


  const mensaje =
    `Hola *${p.cliente}* 👋, desde *HN Muebles* te informamos el estado de tu proyecto *"${p.mueble}"*:

🛠️ *Estado:* ${p.estado}

📊 *Progreso:* ${p.progreso}%

📅 *Fecha Estimada de Entrega:* ${
      p.fechaEntrega
        ? p.fechaEntrega
            .split("-")
            .reverse()
            .join("/")
        : "Por coordinar"
    }

🔍 *Consulta el estado de tu proyecto:*
${linkDirecto}`;


  window.open(
    `https://wa.me/${num}?text=${encodeURIComponent(
      mensaje
    )}`,
    "_blank"
  );
}
