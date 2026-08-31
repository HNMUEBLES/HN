// ==========================================
// FIREBASE
// ==========================================

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


// ==========================================
// FUNCIONES UTILITARIAS
// ==========================================

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
  const inputCod = document.getElementById("nuevo-codigo");

  if (inputCod) {
    inputCod.value = generarCodigoAleatorio();
  }
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


// ==========================================
// CARGAR PROYECTOS
// ==========================================

async function cargarProyectosDesdeNube() {

  try {

    const querySnapshot = await db
      .collection("proyectos")
      .get();

    proyectos = [];

    querySnapshot.forEach(docSnap => {

      proyectos.push({
        id: docSnap.id,
        ...docSnap.data()
      });

    });

    if (esAdmin) {
      renderProyectosAdmin();
    }

    procesarEnlaceDirectoUrl();

  } catch (error) {

    console.error("Error al cargar proyectos:", error);

    // Si no está autenticado, no mostramos datos administrativos
    if (!esAdmin) {
      proyectos = [];
    }
  }
}


// ==========================================
// ENLACE DIRECTO ?codigo=
// ==========================================

function procesarEnlaceDirectoUrl() {

  const urlParams = new URLSearchParams(
    window.location.search
  );

  const codigoUrl = urlParams.get("codigo");

  if (!codigoUrl) return;

  setTimeout(() => {

    const inputCodigo =
      document.getElementById("input-codigo");

    const formBuscar =
      document.getElementById("form-buscar");

    if (inputCodigo) {
      inputCodigo.value =
        codigoUrl.toUpperCase();
    }

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


// ==========================================
// NAVEGACIÓN
// ==========================================

function mostrarSeccion(seccionId) {

  const secciones = [
    "sec-inicio",
    "sec-rastreo",
    "sec-admin",
    "sec-reportes"
  ];

  secciones.forEach(id => {

    const el = document.getElementById(id);

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

    const el = document.getElementById(id);

    if (el) {
      el.classList.remove("active");
    }

  });

  const secDestino =
    document.getElementById(`sec-${seccionId}`);

  const btnDestino =
    document.getElementById(`btn-${seccionId}`);

  if (secDestino) {
    secDestino.classList.remove("hidden");
  }

  if (btnDestino) {
    btnDestino.classList.add("active");
  }
}


// ==========================================
// LOGIN FIREBASE AUTHENTICATION
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

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
          document.getElementById("login-error-msg");

        const email =
          emailInput
            ? emailInput.value.trim().toLowerCase()
            : "";

        const password =
          passInput
            ? passInput.value
            : "";

        if (errorMsg) {
          errorMsg.classList.add("hidden");
          errorMsg.innerText = "";
        }

        try {

          // Firebase verifica correo y contraseña
          const credential =
            await auth.signInWithEmailAndPassword(
              email,
              password
            );

          // Verificación adicional del administrador
          if (
            credential.user.email.toLowerCase() !==
            EMAIL_ADMIN
          ) {

            await auth.signOut();

            throw new Error(
              "Este usuario no tiene permisos de administrador."
            );
          }

          esAdmin = true;

          const divLogin =
            document.getElementById("admin-login");

          const divPanel =
            document.getElementById("admin-panel");

          if (divLogin) {
            divLogin.classList.add("hidden");
          }

          if (divPanel) {
            divPanel.classList.remove("hidden");
          }

          const btnReportes =
            document.getElementById("btn-reportes");

          if (btnReportes) {
            btnReportes.classList.remove("hidden");
          }

          if (passInput) {
            passInput.value = "";
          }

          await cargarProyectosDesdeNube();

          renderProyectosAdmin();

        } catch (error) {

          console.error("Error de autenticación:", error);

          if (errorMsg) {

            errorMsg.classList.remove("hidden");

            if (
              error.code ===
              "auth/invalid-credential"
            ) {

              errorMsg.innerText =
                "Correo o contraseña incorrectos.";

            } else if (
              error.code ===
              "auth/invalid-email"
            ) {

              errorMsg.innerText =
                "El correo electrónico no es válido.";

            } else {

              errorMsg.innerText =
                error.message ||
                "No se pudo iniciar sesión.";
            }

          }

          if (passInput) {
            passInput.value = "";
          }
        }

      }
    );
  }


  // ==========================================
  // BÚSQUEDA DE PROYECTO
  // ==========================================

  const formBuscar =
    document.getElementById("form-buscar");

  if (formBuscar) {

    formBuscar.addEventListener(
      "submit",
      async function (e) {

        e.preventDefault();

        const codigoInput =
          document.getElementById("input-codigo");

        if (!codigoInput) return;

        const codigo =
          codigoInput.value
            .trim()
            .toUpperCase();

        const errorMsg =
          document.getElementById("mensaje-error");

        const resultBox =
          document.getElementById(
            "resultado-proyecto"
          );

        try {

          /*
           * Buscamos directamente por código.
           * No descargamos toda la colección.
           */

          const snapshot =
            await db
              .collection("proyectos")
              .where("codigo", "==", codigo)
              .limit(1)
              .get();

          if (snapshot.empty) {

            if (resultBox) {
              resultBox.classList.add("hidden");
            }

            if (errorMsg) {
              errorMsg.classList.remove("hidden");
            }

            return;
          }

          const doc =
            snapshot.docs[0];

          const proyecto =
            doc.data();

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

          const resCliente =
            document.getElementById("res-cliente");

          const resEstado =
            document.getElementById("res-estado");

          const resPorcentaje =
            document.getElementById("res-porcentaje");

          const resBar =
            document.getElementById("res-bar-fill");

          const resDetalles =
            document.getElementById("res-detalles");

          if (resCodigo) {
            resCodigo.innerText =
              proyecto.codigo || "";
          }

          if (resMueble) {
            resMueble.innerText =
              proyecto.mueble || "";
          }

          if (resCliente) {
            resCliente.innerText =
              `Cliente: ${proyecto.cliente || ""}`;
          }

          if (resEstado) {
            resEstado.innerText =
              proyecto.estado || "";
          }

          if (resPorcentaje) {
            resPorcentaje.innerText =
              `${proyecto.progreso || 0}%`;
          }

          if (resBar) {
            resBar.style.width =
              `${proyecto.progreso || 0}%`;
          }

          if (resDetalles) {
            resDetalles.innerText =
              proyecto.detalles ||
              `El proyecto se encuentra en etapa de ${proyecto.estado || ""}.`;
          }

        } catch (error) {

          console.error(
            "Error buscando proyecto:",
            error
          );

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


  // ==========================================
  // CÁLCULO EN VIVO
  // ==========================================

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


  // ==========================================
  // NUEVO PROYECTO
  // ==========================================

  const formNuevo =
    document.getElementById(
      "form-nuevo-proyecto"
    );

  if (formNuevo) {

    formNuevo.addEventListener(
      "submit",
      async function (e) {

        e.preventDefault();

        if (!auth.currentUser) {
          alert(
            "Debes iniciar sesión como administrador."
          );
          return;
        }

        if (
          auth.currentUser.email.toLowerCase() !==
          EMAIL_ADMIN
        ) {
          alert(
            "No tienes permisos de administrador."
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

          codigo: codigoGenerado,

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

          progreso: 20,

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
              : ""
        };

        try {

          await db
            .collection("proyectos")
            .add(nuevoProyectoObj);

          if (codIn) codIn.value = "";
          if (cliIn) cliIn.value = "";
          if (mueIn) mueIn.value = "";
          if (telIn) telIn.value = "";
          if (presIn) presIn.value = "";
          if (adelIn) adelIn.value = "";
          if (fechaIn) fechaIn.value = "";

          calcularSaldoEnVivo();

          await cargarProyectosDesdeNube();

          renderProyectosAdmin();

          alert(
            "Proyecto guardado correctamente."
          );

        } catch (error) {

          console.error(
            "Error al guardar proyecto:",
            error
          );

          alert(
            "No se pudo guardar el proyecto."
          );
        }
      }
    );
  }


  // ==========================================
  // FILTRO MENSUAL
  // ==========================================

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

});


// ==========================================
// ESTADO DE AUTENTICACIÓN
// ==========================================

auth.onAuthStateChanged(async user => {

  if (user) {

    if (
      user.email &&
      user.email.toLowerCase() ===
      EMAIL_ADMIN
    ) {

      esAdmin = true;

      const divLogin =
        document.getElementById(
          "admin-login"
        );

      const divPanel =
        document.getElementById(
          "admin-panel"
        );

      if (divLogin) {
        divLogin.classList.add("hidden");
      }

      if (divPanel) {
        divPanel.classList.remove("hidden");
      }

      const btnReportes =
        document.getElementById(
          "btn-reportes"
        );

      if (btnReportes) {
        btnReportes.classList.remove(
          "hidden"
        );
      }

      await cargarProyectosDesdeNube();

      renderProyectosAdmin();

    } else {

      await auth.signOut();

      esAdmin = false;
    }

  } else {

    esAdmin = false;

    const divPanel =
      document.getElementById(
        "admin-panel"
      );

    const divLogin =
      document.getElementById(
        "admin-login"
      );

    if (divPanel) {
      divPanel.classList.add("hidden");
    }

    if (divLogin) {
      divLogin.classList.remove("hidden");
    }

    const btnReportes =
      document.getElementById(
        "btn-reportes"
      );

    if (btnReportes) {
      btnReportes.classList.add(
        "hidden"
      );
    }
  }

});


// ==========================================
// CERRAR SESIÓN
// ==========================================

async function cerrarSesionAdmin() {

  try {

    await auth.signOut();

    esAdmin = false;

    const divPanel =
      document.getElementById(
        "admin-panel"
      );

    const divLogin =
      document.getElementById(
        "admin-login"
      );

    if (divPanel) {
      divPanel.classList.add("hidden");
    }

    if (divLogin) {
      divLogin.classList.remove("hidden");
    }

    const btnReportes =
      document.getElementById(
        "btn-reportes"
      );

    if (btnReportes) {
      btnReportes.classList.add(
        "hidden"
      );
    }

    irInicio();

  } catch (error) {

    console.error(
      "Error cerrando sesión:",
      error
    );
  }
}


// ==========================================
// RENDERIZADO ADMIN
// ==========================================

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

  const proyectosFiltradosMes =
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
    totalSaldoMes +=
      pres - adel;
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
      `Bs. ${formatearMonto(totalPresupuestoMes)}`;
  }

  if (reporteAdel) {
    reporteAdel.innerText =
      `Bs. ${formatearMonto(totalAdelantoMes)}`;
  }

  if (reporteSaldo) {
    reporteSaldo.innerText =
      `Bs. ${formatearMonto(totalSaldoMes)}`;
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
      "background: rgba(255,255,255,0.05);" +
      "border: 1px solid rgba(255,255,255,0.1);" +
      "border-radius: 12px;" +
      "padding: 1.2rem;" +
      "margin-bottom: 1rem;";

    let botonesEtapas =
      etapas.map((est, idx) => {

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
            onclick="cambiarEstadoPorId('${p.id}', ${idx}, ${porcentaje})"
          >
            ${est}
          </button>
        `;

      }).join("");

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
                ${p.codigo}
              </span>

              <button
                type="button"
                onclick="copiarCodigoAlPortapapeles('${p.codigo}')"
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
                <i class="fa-regular fa-copy"></i>
                Copiar
              </button>

            </div>

            <strong style="font-size:1.05rem;">
              ${p.mueble}
            </strong>

          </div>

          <p style="
            margin:0.4rem 0;
            color:#a3a3a3;
            font-size:0.85rem;
          ">
            <i class="fa-solid fa-user"></i>
            Cliente: ${p.cliente}
            |
            <i class="fa-solid fa-phone"></i>
            Tel: ${p.telefono || "Sin registrar"}
          </p>

          <p style="
            margin:0.2rem 0 0.5rem 0;
            color:#38bdf8;
            font-size:0.85rem;
          ">
            <i class="fa-regular fa-calendar"></i>
            Entrega estimada:
            <strong>${fechaFormateada}</strong>
          </p>

          <div style="
            background:rgba(0,0,0,0.3);
            border:1px solid rgba(255,255,255,0.08);
            padding:0.6rem 0.8rem;
            border-radius:8px;
            margin:0.6rem 0;
            display:flex;
            gap:1rem;
            flex-wrap:wrap;
            font-size:0.85rem;
          ">

            <div>
              <span style="color:#a3a3a3;">
                Total:
              </span>
              <strong>
                Bs. ${formatearMonto(presupuesto)}
              </strong>
            </div>

            <div>
              <span style="color:#a3a3a3;">
                Adelanto:
              </span>
              <strong style="color:#38bdf8;">
                Bs. ${formatearMonto(adelanto)}
              </strong>
            </div>

            <div>
              <span style="color:#a3a3a3;">
                Saldo:
              </span>
              <strong style="
                color:${saldo > 0
                  ? "#f87171"
                  : "#4ade80"};
              ">
                Bs. ${formatearMonto(saldo)}
              </strong>
            </div>

          </div>

          <div style="margin-top:0.5rem;">
            ${botonesEtapas}
          </div>

          <div style="margin-top:0.8rem;">

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
              <i class="fa-brands fa-whatsapp"></i>
              Notificar por WhatsApp con enlace
            </button>

          </div>

        </div>


        <div
          id="edit-view-${index}"
          style="
            flex:1;
            min-width:280px;
            display:none;
            background:rgba(0,0,0,0.4);
            padding:1rem;
            border-radius:8px;
            border:1px solid rgba(255,255,255,0.15);
          "
        >

          <h4 style="
            margin-bottom:0.6rem;
            color:#f59e0b;
            font-size:0.95rem;
          ">
            Editar Proyecto
          </h4>

          <div style="
            display:flex;
            flex-direction:column;
            gap:0.5rem;
          ">

            <input
              type="text"
              id="input-edit-codigo-${index}"
              value="${p.codigo}"
              style="width:100%;"
            >

            <input
              type="text"
              id="input-edit-cliente-${index}"
              value="${p.cliente}"
              style="width:100%;"
            >

            <input
              type="text"
              id="input-edit-mueble-${index}"
              value="${p.mueble}"
              style="width:100%;"
            >

            <input
              type="text"
              id="input-edit-telefono-${index}"
              value="${p.telefono || ""}"
              style="width:100%;"
            >

            <div style="
              display:flex;
              gap:0.5rem;
            ">

              <input
                type="text"
                id="input-edit-presupuesto-${index}"
                value="${formatearMonto(presupuesto)}"
                style="width:100%;"
              >

              <input
                type="text"
                id="input-edit-adelanto-${index}"
                value="${formatearMonto(adelanto)}"
                style="width:100%;"
              >

            </div>

            <input
              type="date"
              id="input-edit-fecha-${index}"
              value="${p.fechaEntrega || ""}"
              style="width:100%;"
            >

            <div style="
              display:flex;
              gap:0.5rem;
              margin-top:0.4rem;
            ">

              <button
                type="button"
                onclick="guardarEdicionInline('${p.id}', ${index})"
                style="
                  background:#16a34a;
                  color:white;
                  border:none;
                  padding:0.4rem 0.8rem;
                  border-radius:6px;
                  cursor:pointer;
                "
              >
                Guardar
              </button>

              <button
                type="button"
                onclick="cancelarEdicionInline(${index})"
                style="
                  background:#404040;
                  color:white;
                  border:none;
                  padding:0.4rem 0.8rem;
                  border-radius:6px;
                  cursor:pointer;
                "
              >
                Cancelar
              </button>

            </div>

          </div>

        </div>


        <div style="
          display:flex;
          gap:0.5rem;
        ">

          <button
            type="button"
            id="btn-edit-toggle-${index}"
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
            <i class="fa-solid fa-pen-to-square"></i>
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
            <i class="fa-solid fa-trash"></i>
          </button>

        </div>

      </div>
    `;

    container.appendChild(card);
  });
}


// ==========================================
// EDICIÓN
// ==========================================

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


async function guardarEdicionInline(
  idFirebase,
  index
) {

  if (!auth.currentUser) {
    alert(
      "Tu sesión de administrador ha terminado."
    );
    return;
  }

  if (
    auth.currentUser.email.toLowerCase() !==
    EMAIL_ADMIN
  ) {
    alert(
      "No tienes permisos para realizar esta acción."
    );
    return;
  }

  const nuevoCodigo =
    document.getElementById(
      `input-edit-codigo-${index}`
    ).value.trim().toUpperCase();

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

    await cargarProyectosDesdeNube();

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


// ==========================================
// CAMBIAR ESTADO
// ==========================================

async function cambiarEstadoPorId(
  idFirebase,
  etapaIdx,
  nuevoProgreso
) {

  if (!auth.currentUser) {
    alert(
      "Debes iniciar sesión."
    );
    return;
  }

  if (
    auth.currentUser.email.toLowerCase() !==
    EMAIL_ADMIN
  ) {
    alert(
      "No tienes permisos."
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

        estado: nuevoEstado,
        progreso: nuevoProgreso,
        detalles: nuevaDesc

      });

    const proyectoLocal =
      proyectos.find(
        p => p.id === idFirebase
      );

    if (proyectoLocal) {

      proyectoLocal.estado =
        nuevoEstado;

      proyectoLocal.progreso =
        nuevoProgreso;

      proyectoLocal.detalles =
        nuevaDesc;
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


// ==========================================
// ELIMINAR PROYECTO
// ==========================================

async function eliminarProyecto(
  idFirebase
) {

  if (!auth.currentUser) {
    alert(
      "Debes iniciar sesión."
    );
    return;
  }

  if (
    auth.currentUser.email.toLowerCase() !==
    EMAIL_ADMIN
  ) {
    alert(
      "No tienes permisos."
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
      "Error al eliminar:",
      error
    );

    alert(
      "Error al eliminar proyecto."
    );
  }
}


// ==========================================
// WHATSAPP
// ==========================================

function notificarWhatsApp(index) {

  const p =
    proyectos[index];

  if (
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
    num = "591" + num;
  }

  const presupuesto =
    Number(p.presupuesto) || 0;

  const adelanto =
    Number(p.adelanto) || 0;

  const saldo =
    presupuesto - adelanto;

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
    `${linkBase}?codigo=${p.codigo}`;

  const mensaje =
`Hola *${p.cliente}* 👋, desde *HN Muebles* te informamos el estado de tu proyecto *"${p.mueble}"*:

🛠️ *Estado:* ${p.estado}
📊 *Progreso:* ${p.progreso}%
📅 *Fecha Estimada de Entrega:* ${fechaTexto}

💰 *Resumen Financiero:*
• Presupuesto Total: Bs. ${formatearMonto(presupuesto)}
• Adelanto: Bs. ${formatearMonto(adelanto)}
• Saldo Pendiente: Bs. ${formatearMonto(saldo)}

🔍 *Haz clic en el siguiente enlace para ver el estado de tu proyecto (Código: ${p.codigo}):*
${linkDirecto}`;

  window.open(
    `https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`,
    "_blank"
  );
}
