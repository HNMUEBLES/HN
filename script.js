// ==========================================
// CONFIGURACIÓN DE FIREBASE
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


// ==========================================
// CONFIGURACIÓN DEL ADMINISTRADOR
// ==========================================

const ADMIN_EMAIL = "hn24muebles@gmail.com";

let proyectos = [];
let esAdmin = false;


// ==========================================
// FUNCIONES UTILITARIAS
// ==========================================

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
      console.error("Error al copiar:", error);
    });
}


function irInicio() {
  if (typeof mostrarSeccion === "function") {
    mostrarSeccion("inicio");
  }
}


// ==========================================
// VERIFICAR ADMINISTRADOR
// ==========================================

function verificarAdministrador(user) {

  if (!user) {
    esAdmin = false;
    return false;
  }

  const email = (user.email || "").toLowerCase().trim();

  if (email !== ADMIN_EMAIL.toLowerCase()) {
    esAdmin = false;

    console.warn("Usuario autenticado sin permisos:", email);

    auth.signOut();

    alert("Esta cuenta no tiene permisos de administrador.");

    return false;
  }

  esAdmin = true;

  return true;
}


// ==========================================
// ESTADO DE AUTENTICACIÓN
// ==========================================

auth.onAuthStateChanged(async function(user) {

  if (user && verificarAdministrador(user)) {

    esAdmin = true;

    mostrarPanelAdministrador();

    await cargarProyectosPrivados();

  } else {

    esAdmin = false;

    ocultarPanelAdministrador();
  }

});


// ==========================================
// MOSTRAR / OCULTAR PANEL ADMIN
// ==========================================

function mostrarPanelAdministrador() {

  const login = document.getElementById("admin-login");
  const panel = document.getElementById("admin-panel");

  if (login) {
    login.classList.add("hidden");
  }

  if (panel) {
    panel.classList.remove("hidden");
  }

  const btnReportes = document.getElementById("btn-reportes");

  if (btnReportes) {
    btnReportes.classList.remove("hidden");
  }
}


function ocultarPanelAdministrador() {

  const login = document.getElementById("admin-login");
  const panel = document.getElementById("admin-panel");

  if (panel) {
    panel.classList.add("hidden");
  }

  if (login) {
    login.classList.remove("hidden");
  }

  const btnReportes = document.getElementById("btn-reportes");

  if (btnReportes) {
    btnReportes.classList.add("hidden");
  }
}


// ==========================================
// CARGAR PROYECTOS PRIVADOS
// SOLO ADMIN
// ==========================================

async function cargarProyectosPrivados() {

  if (!esAdmin) {
    console.warn("Intento de cargar proyectos sin permisos.");
    return;
  }

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

    renderProyectosAdmin();

  } catch (error) {

    console.error(
      "Error al cargar proyectos privados:",
      error
    );

  }
}


// ==========================================
// CARGAR PROYECTOS PÚBLICOS
// ==========================================

async function buscarProyectoPublico(codigo) {

  try {

    const querySnapshot = await db
      .collection("proyectos_publicos")
      .where("codigo", "==", codigo)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];

    return {
      id: doc.id,
      ...doc.data()
    };

  } catch (error) {

    console.error(
      "Error buscando proyecto público:",
      error
    );

    return null;
  }
}


// ==========================================
// PROCESAR ENLACE DIRECTO
// ==========================================

function procesarEnlaceDirectoUrl() {

  const urlParams =
    new URLSearchParams(window.location.search);

  const codigoUrl =
    urlParams.get("codigo");

  if (!codigoUrl) return;

  setTimeout(() => {

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

  }, 500);
}


// ==========================================
// BÚSQUEDA PÚBLICA DEL PROYECTO
// ==========================================

document.addEventListener("DOMContentLoaded", function() {

  const formBuscar =
    document.getElementById("form-buscar");

  if (formBuscar) {

    formBuscar.addEventListener(
      "submit",
      async function(e) {

        e.preventDefault();

        const codigoInput =
          document.getElementById("input-codigo");

        if (!codigoInput) return;

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

        if (!codigo) return;

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

          if (resCodigo)
            resCodigo.innerText =
              encontrado.codigo || "";

          if (resMueble)
            resMueble.innerText =
              encontrado.mueble || "";

          if (resCliente)
            resCliente.innerText =
              encontrado.cliente
                ? `Cliente: ${encontrado.cliente}`
                : "";

          if (resEstado)
            resEstado.innerText =
              encontrado.estado || "";

          if (resPorcentaje)
            resPorcentaje.innerText =
              `${encontrado.progreso || 0}%`;

          if (resBar)
            resBar.style.width =
              `${encontrado.progreso || 0}%`;

          if (resDetalles)
            resDetalles.innerText =
              encontrado.detalles ||
              `El proyecto se encuentra en etapa de ${encontrado.estado}.`;

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


  // ==========================================
  // LOGIN FIREBASE AUTH
  // ==========================================

  const formLogin =
    document.getElementById("form-login");

  if (formLogin) {

    formLogin.addEventListener(
      "submit",
      async function(e) {

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
          mostrarErrorLogin(
            "Completa el correo y la contraseña."
          );
          return;
        }

        try {

          const credential =
            await auth.signInWithEmailAndPassword(
              email,
              password
            );

          const user =
            credential.user;

          if (!verificarAdministrador(user)) {
            return;
          }

          if (passInput) {
            passInput.value = "";
          }

          ocultarErrorLogin();

          mostrarPanelAdministrador();

          await cargarProyectosPrivados();

        } catch (error) {

          console.error(
            "Error de autenticación:",
            error
          );

          mostrarErrorLogin(
            "Correo o contraseña incorrectos."
          );

          if (passInput) {
            passInput.value = "";
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

    }

  }


  if (inputPresupuestoNuevo)
    inputPresupuestoNuevo.addEventListener(
      "input",
      calcularSaldoEnVivo
    );

  if (inputAdelantoNuevo)
    inputAdelantoNuevo.addEventListener(
      "input",
      calcularSaldoEnVivo
    );


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
      async function(e) {

        e.preventDefault();

        if (!esAdmin || !auth.currentUser) {

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

          // Guardamos datos privados
          const docRef =
            await db
              .collection("proyectos")
              .add(nuevoProyectoObj);


          // Creamos únicamente los datos públicos
          await db
            .collection("proyectos_publicos")
            .doc(docRef.id)
            .set({

              codigo:
                nuevoProyectoObj.codigo,

              // Solo mostramos el nombre del mueble
              mueble:
                nuevoProyectoObj.mueble,

              // Se puede mostrar el nombre del cliente
              // porque es parte del seguimiento
              cliente:
                nuevoProyectoObj.cliente,

              estado:
                nuevoProyectoObj.estado,

              progreso:
                nuevoProyectoObj.progreso,

              detalles:
                nuevoProyectoObj.detalles,

              fechaEntrega:
                nuevoProyectoObj.fechaEntrega

            });


          limpiarFormularioNuevoProyecto();

          await cargarProyectosPrivados();

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
      () => renderProyectosAdmin()
    );

  }


  // Procesar enlace directo
  procesarEnlaceDirectoUrl();

});


// ==========================================
// MENSAJES DE LOGIN
// ==========================================

function mostrarErrorLogin(mensaje) {

  const errorMsg =
    document.getElementById(
      "login-error-msg"
    );

  if (errorMsg) {

    errorMsg.innerText =
      mensaje;

    errorMsg.classList.remove(
      "hidden"
    );

  }
}


function ocultarErrorLogin() {

  const errorMsg =
    document.getElementById(
      "login-error-msg"
    );

  if (errorMsg) {

    errorMsg.innerText = "";

    errorMsg.classList.add(
      "hidden"
    );

  }
}


// ==========================================
// LIMPIAR FORMULARIO
// ==========================================

function limpiarFormularioNuevoProyecto() {

  const ids = [
    "nuevo-codigo",
    "nuevo-cliente",
    "nuevo-mueble",
    "nuevo-telefono",
    "nuevo-presupuesto",
    "nuevo-adelanto",
    "nuevo-fecha"
  ];

  ids.forEach(id => {

    const el =
      document.getElementById(id);

    if (el) {
      el.value = "";
    }

  });

}


// ==========================================
// CERRAR SESIÓN
// ==========================================

async function cerrarSesionAdmin() {

  try {

    await auth.signOut();

    esAdmin = false;

    proyectos = [];

    ocultarPanelAdministrador();

    cerrarModalAdmin();

    irInicio();

  } catch (error) {

    console.error(
      "Error al cerrar sesión:",
      error
    );

  }

}


// ==========================================
// RENDER ADMIN
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


    let botonesEtapas =
      etapas.map((est, idx) => {

        const active =
          p.estado === est;

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
              background:${active ? "#f59e0b" : "rgba(255,255,255,0.1)"};
              color:${active ? "#000" : "#fff"};
              font-weight:${active ? "bold" : "normal"};
            "
            onclick="cambiarEstadoPorId('${p.id}', ${idx}, ${(idx + 1) * 20})"
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

            <strong>
              ${p.mueble}
            </strong>

          </div>


          <p style="
            margin:0.4rem 0;
            color:#a3a3a3;
            font-size:0.85rem;
          ">
            Cliente: ${p.cliente}
            |
            Tel: ${p.telefono || "Sin registrar"}
          </p>


          <p style="
            margin:0.2rem 0 0.5rem;
            color:#38bdf8;
            font-size:0.85rem;
          ">
            Entrega estimada:
            <strong>
              ${fechaFormateada}
            </strong>
          </p>


          <div style="
            background:rgba(0,0,0,0.3);
            padding:0.6rem 0.8rem;
            border-radius:8px;
            margin:0.6rem 0;
            display:flex;
            gap:1rem;
            flex-wrap:wrap;
            font-size:0.85rem;
          ">

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
              style="
                background:#16a34a;
                color:white;
                border:none;
                padding:0.4rem 0.8rem;
                border-radius:6px;
                cursor:pointer;
              "
            >
              WhatsApp
            </button>

          </div>

        </div>


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

  });

}


// ==========================================
// CAMBIAR ESTADO
// ==========================================

async function cambiarEstadoPorId(
  idFirebase,
  etapaIdx,
  nuevoProgreso
) {

  if (!esAdmin) {
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


  try {

    // Actualizar privado
    await db
      .collection("proyectos")
      .doc(idFirebase)
      .update({

        estado: nuevoEstado,

        progreso: nuevoProgreso,

        detalles: nuevaDesc

      });


    // Actualizar público
    await db
      .collection("proyectos_publicos")
      .doc(idFirebase)
      .update({

        estado: nuevoEstado,

        progreso: nuevoProgreso,

        detalles: nuevaDesc

      });


    await cargarProyectosPrivados();

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

async function eliminarProyecto(idFirebase) {

  if (!esAdmin) {
    alert("No tienes permisos.");
    return;
  }

  if (
    !confirm(
      "¿Deseas eliminar este proyecto?"
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
      .collection("proyectos_publicos")
      .doc(idFirebase)
      .delete();


    await cargarProyectosPrivados();


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

  if (!esAdmin) {
    alert("No tienes permisos.");
    return;
  }

  const p =
    proyectos[index];

  if (
    !p ||
    !p.telefono ||
    !p.telefono.trim()
  ) {

    alert(
      "Este cliente no tiene un número registrado."
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

🔍 *Consulta el estado de tu proyecto:*
${linkDirecto}`;


  window.open(
    `https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`,
    "_blank"
  );

}


// ==========================================
// EDICIÓN
// ==========================================

async function activarEdicionInline(index) {

  const p =
    proyectos[index];

  if (!p) return;

  const nuevoCliente =
    prompt(
      "Cliente:",
      p.cliente || ""
    );

  if (nuevoCliente === null) return;


  const nuevoMueble =
    prompt(
      "Mueble:",
      p.mueble || ""
    );

  if (nuevoMueble === null) return;


  const nuevoTelefono =
    prompt(
      "WhatsApp:",
      p.telefono || ""
    );

  if (nuevoTelefono === null) return;


  try {

    await db
      .collection("proyectos")
      .doc(p.id)
      .update({

        cliente:
          nuevoCliente.trim(),

        mueble:
          nuevoMueble.trim(),

        telefono:
          nuevoTelefono.trim()

      });


    await db
      .collection("proyectos_publicos")
      .doc(p.id)
      .update({

        cliente:
          nuevoCliente.trim(),

        mueble:
          nuevoMueble.trim()

      });


    await cargarProyectosPrivados();

  } catch (error) {

    console.error(
      "Error editando:",
      error
    );

    alert(
      "No se pudo editar el proyecto."
    );

  }

}


// ==========================================
// FUNCIONES DE COMPATIBILIDAD
// ==========================================

function cancelarEdicionInline() {
  renderProyectosAdmin();
}
