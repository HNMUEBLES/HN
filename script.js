// ============================================================
// HN MUEBLES - SCRIPT PRINCIPAL
// Firebase Authentication + Firestore
// PROYECTOS + GESTIÓN DE INGRESOS
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

const EMAIL_ADMIN = "hn24muebles@gmail.com";


let proyectos = [];

let ingresos = [];

let esAdmin = false;


// ============================================================
// 2. UTILIDADES
// ============================================================

function formatearMonto(valor) {

  const num = Number(valor);

  if (isNaN(num)) return "0";

  return Number.isInteger(num)
    ? num.toString()
    : num.toString();

}


function generarCodigoAleatorio() {

  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let aleatorio = "";

  for (let i = 0; i < 5; i++) {

    aleatorio +=
      caracteres.charAt(
        Math.floor(
          Math.random() *
          caracteres.length
        )
      );

  }

  return `HN${aleatorio}`;

}


function llenarCodigoAutomatico() {

  const inputCod =
    document.getElementById(
      "nuevo-codigo"
    );

  if (inputCod) {

    inputCod.value =
      generarCodigoAleatorio();

  }

}


function copiarCodigoAlPortapapeles(codigo) {

  navigator.clipboard
    .writeText(codigo)

    .then(() => {

      alert(
        `¡Código "${codigo}" copiado al portapapeles!`
      );

    })

    .catch(error => {

      console.error(
        "Error al copiar código:",
        error
      );

    });

}


function irInicio() {

  mostrarSeccion("inicio");

}


// ============================================================
// 3. AUTENTICACIÓN
// ============================================================

auth.onAuthStateChanged(async (user) => {

  if (user) {

    console.log(
      "Usuario autenticado:",
      user.email
    );


    if (
      user.email &&
      user.email.toLowerCase() ===
      EMAIL_ADMIN.toLowerCase()
    ) {

      esAdmin = true;

      mostrarPanelAdministrador();

      await cargarProyectosDesdeNube();

      await cargarIngresosDesdeNube();

      renderProyectosAdmin();

      renderIngresos();

    } else {

      console.warn(
        "Usuario no autorizado:",
        user.email
      );

      await auth.signOut();

      esAdmin = false;

      ocultarPanelAdministrador();

      alert(
        "Esta cuenta no tiene permisos de administrador."
      );

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
// 4. MOSTRAR / OCULTAR ADMIN
// ============================================================

function mostrarPanelAdministrador() {

  const divLogin =
    document.getElementById(
      "admin-login"
    );

  const divPanel =
    document.getElementById(
      "admin-panel"
    );


  if (divLogin) {

    divLogin.classList.add(
      "hidden"
    );

  }


  if (divPanel) {

    divPanel.classList.remove(
      "hidden"
    );

  }


  mostrarAdminSeccion("proyectos");

}


function ocultarPanelAdministrador() {

  const divLogin =
    document.getElementById(
      "admin-login"
    );

  const divPanel =
    document.getElementById(
      "admin-panel"
    );


  if (divPanel) {

    divPanel.classList.add(
      "hidden"
    );

  }


  if (divLogin) {

    divLogin.classList.remove(
      "hidden"
    );

  }

}


// ============================================================
// 5. LOGIN
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {


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

          const passInput =
            document.getElementById(
              "input-pass"
            );

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

              errorMsg.classList.remove(
                "hidden"
              );

            }

            return;

          }


          try {

            if (errorMsg) {

              errorMsg.classList.add(
                "hidden"
              );

            }


            const resultado =
              await auth
                .signInWithEmailAndPassword(
                  email,
                  password
                );


            const usuario =
              resultado.user;


            if (
              !usuario.email ||
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


            console.log(
              "Administrador autenticado correctamente."
            );


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

            } else {

              alert(mensaje);

            }

          }

        }
      );

    }


    // ========================================================
    // BÚSQUEDA PÚBLICA
    // ========================================================

    const formBuscar =
      document.getElementById(
        "form-buscar"
      );


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


          buscarProyectoPublico(
            codigo
          );

        }
      );

    }


    // ========================================================
    // CÁLCULO SALDO EN VIVO
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
        Math.max(
          0,
          pres - adel
        );


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
            ? "#f59e0b"
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

            alert(
              "Tu sesión de administrador no está activa."
            );

            return;

          }


          const usuario =
            auth.currentUser.email
              ? auth.currentUser.email.toLowerCase()
              : "";


          if (
            usuario !==
            EMAIL_ADMIN.toLowerCase()
          ) {

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


          const saldo =
            Math.max(
              0,
              presupuesto - adelanto
            );


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
              saldo,

            ingresoRegistrado:
              false,

            ingresoFecha:
              "",

            fechaEntrega:
              fechaIn
                ? fechaIn.value
                : "",

            fechaCreacion:
              new Date().toISOString()

          };


          try {

            await db
              .collection(
                "proyectos"
              )
              .add(
                nuevoProyectoObj
              );


            alert(
              "Proyecto guardado correctamente."
            );


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


            calcularSaldoEnVivo();


            await cargarProyectosDesdeNube();

            await cargarIngresosDesdeNube();


            renderProyectosAdmin();

            renderIngresos();


          } catch (error) {

            console.error(
              "Error al guardar:",
              error
            );


            alert(
              "No se pudo guardar el proyecto. Verifica tu sesión de administrador."
            );

          }

        }
      );

    }


    // ========================================================
    // FILTRO PROYECTOS
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
        ).padStart(
          2,
          "0"
        );


      selectMes.value =
        `${anio}-${mes}`;


      selectMes.addEventListener(
        "change",
        function () {

          renderProyectosAdmin();

        }
      );

    }


    // ========================================================
    // FILTRO INGRESOS
    // ========================================================

    const filtroIngresos =
      document.getElementById(
        "filtro-mes-ingresos"
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

          renderIngresos();

        }
      );

    }

  }
);


// ============================================================
// 6. CERRAR SESIÓN
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
// 7. CARGAR PROYECTOS
// ============================================================

async function cargarProyectosDesdeNube() {

  try {

    if (
      !auth.currentUser ||
      !esAdmin
    ) {

      console.warn(
        "No se cargan proyectos privados: usuario no autenticado."
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
// 8. CARGAR INGRESOS
// ============================================================

async function cargarIngresosDesdeNube() {

  try {

    if (
      !auth.currentUser ||
      !esAdmin
    ) {

      ingresos = [];

      return;

    }


    const snapshot =
      await db
        .collection("ingresos")
        .get();


    ingresos = [];


    snapshot.forEach(
      docSnap => {

        ingresos.push({

          id:
            docSnap.id,

          ...docSnap.data()

        });

      }
    );


    renderIngresos();


  } catch (error) {

    console.error(
      "Error cargando ingresos:",
      error
    );

  }

}


// ============================================================
// 9. BÚSQUEDA PÚBLICA
// ============================================================

async function buscarProyectoPublico(
  codigo
) {

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


    if (codigoEl)
      codigoEl.innerText =
        encontrado.codigo || "";


    if (muebleEl)
      muebleEl.innerText =
        encontrado.mueble || "";


    if (clienteEl)
      clienteEl.innerText =
        `Cliente: ${
          encontrado.cliente || ""
        }`;


    if (estadoEl)
      estadoEl.innerText =
        encontrado.estado || "";


    if (porcentajeEl)
      porcentajeEl.innerText =
        `${encontrado.progreso || 0}%`;


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
// 10. ENLACE DIRECTO
// ============================================================

function procesarEnlaceDirectoUrl() {

  const urlParams =
    new URLSearchParams(
      window.location.search
    );


  const codigoUrl =
    urlParams.get(
      "codigo"
    );


  if (!codigoUrl)
    return;


  setTimeout(
    () => {

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
              cancelable:true,
              bubbles:true
            }
          )
        );

      }

    },
    400
  );

}


// ============================================================
// 11. NAVEGACIÓN
// ============================================================

function mostrarSeccion(
  seccionId
) {

  const secciones = [
    "sec-inicio",
    "sec-rastreo",
    "sec-admin",
    "sec-reportes"
  ];


  secciones.forEach(
    id => {

      const el =
        document.getElementById(
          id
        );


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
        document.getElementById(
          id
        );


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
// 12. RENDER PROYECTOS ADMIN
// ============================================================

function renderProyectosAdmin() {

  if (!esAdmin)
    return;


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


  if (!container)
    return;


  container.innerHTML = "";


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
        Math.max(
          0,
          presupuesto - adelanto
        );


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


      const etapas = [
        "Diseño Aprobado",
        "Corte",
        "Armado",
        "Instalación",
        "Finalizado"
      ];


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
                onclick="
                  cambiarEstadoPorId(
                    '${p.id}',
                    ${idx},
                    ${porcentaje}
                  )
                "
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
            style="
              flex:1;
              min-width:280px;
            "
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
                  ${p.codigo || ""}
                </span>


                <button
                  type="button"
                  onclick="
                    copiarCodigoAlPortapapeles(
                      '${p.codigo || ""}'
                    )
                  "
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


            <p
              style="
                margin:0.4rem 0;
                color:#a3a3a3;
                font-size:0.85rem;
              "
            >
              Cliente:
              ${p.cliente || ""}
              |
              Tel:
              ${p.telefono || "Sin registrar"}
            </p>


            <p
              style="
                margin:0.2rem 0 0.5rem 0;
                color:#38bdf8;
                font-size:0.85rem;
              "
            >
              Entrega estimada:
              <strong>
                ${fechaFormateada}
              </strong>
            </p>


            <div
              style="
                background:rgba(0,0,0,0.3);
                border:1px solid rgba(255,255,255,0.08);
                padding:0.6rem 0.8rem;
                border-radius:8px;
                margin:0.6rem 0;
                display:flex;
                gap:1rem;
                flex-wrap:wrap;
                font-size:0.85rem;
              "
            >

              <div>
                Total:
                <strong>
                  Bs.
                  ${formatearMonto(
                    presupuesto
                  )}
                </strong>
              </div>


              <div>
                Adelanto:
                <strong>
                  Bs.
                  ${formatearMonto(
                    adelanto
                  )}
                </strong>
              </div>


              <div>
                Saldo:
                <strong
                  style="
                    color:#f59e0b;
                  "
                >
                  Bs.
                  ${formatearMonto(
                    saldo
                  )}
                </strong>
              </div>

            </div>


            ${
              saldo > 0 &&
              !p.ingresoRegistrado
                ? `
                  <div
                    style="
                      margin-bottom:0.6rem;
                      color:#f59e0b;
                      font-size:0.8rem;
                    "
                  >
                    <i class="fa-solid fa-clock"></i>
                    Saldo pendiente de cobro
                  </div>
                `
                : ""
            }


            ${
              p.ingresoRegistrado
                ? `
                  <div
                    style="
                      margin-bottom:0.6rem;
                      color:#10b981;
                      font-size:0.8rem;
                    "
                  >
                    <i class="fa-solid fa-circle-check"></i>
                    Saldo registrado como ingreso
                  </div>
                `
                : ""
            }


            <div
              style="
                margin-top:0.5rem;
              "
            >
              ${botonesEtapas}
            </div>


            <div
              style="
                margin-top:0.8rem;
              "
            >

              <button
                type="button"
                onclick="
                  notificarWhatsApp(${index})
                "
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


          <div
            style="
              display:flex;
              gap:0.5rem;
            "
          >

            <button
              type="button"
              onclick="
                activarEdicionInline(${index})
              "
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
              onclick="
                eliminarProyecto('${p.id}')
              "
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


      container.appendChild(
        card
      );

    }
  );

}


// ============================================================
// 13. RENDER INGRESOS
// ============================================================

function renderIngresos() {

  if (!esAdmin)
    return;


  const filtro =
    document.getElementById(
      "filtro-mes-ingresos"
    );


  const mesSeleccionado =
    filtro
      ? filtro.value
      : "";


  // ----------------------------------------------------------
  // RESUMEN DE ADELANTOS
  // ----------------------------------------------------------

  let totalAdelantos = 0;


  proyectos.forEach(
    p => {

      const adelanto =
        Number(
          p.adelanto
        ) || 0;


      if (!mesSeleccionado) {

        totalAdelantos +=
          adelanto;

      } else {

        const fecha =
          p.fechaCreacion || "";


        if (
          fecha.startsWith(
            mesSeleccionado
          )
        ) {

          totalAdelantos +=
            adelanto;

        }

      }

    }
  );


  // ----------------------------------------------------------
  // INGRESOS COBRADOS
  // ----------------------------------------------------------

  let ingresosFiltrados =
    ingresos;


  if (mesSeleccionado) {

    ingresosFiltrados =
      ingresos.filter(
        ingreso => {

          return (
            ingreso.fecha ||
            ""
          ).startsWith(
            mesSeleccionado
          );

        }
      );

  }


  let totalSaldos =
    0;


  ingresosFiltrados.forEach(
    ingreso => {

      totalSaldos +=
        Number(
          ingreso.monto
        ) || 0;

    }
  );


  const totalIngresos =
    totalAdelantos +
    totalSaldos;


  const adelantosEl =
    document.getElementById(
      "ingresos-resumen-adelantos"
    );


  const saldosEl =
    document.getElementById(
      "ingresos-resumen-saldos"
    );


  const totalEl =
    document.getElementById(
      "ingresos-resumen-total"
    );


  if (adelantosEl)
    adelantosEl.innerText =
      `Bs. ${formatearMonto(
        totalAdelantos
      )}`;


  if (saldosEl)
    saldosEl.innerText =
      `Bs. ${formatearMonto(
        totalSaldos
      )}`;


  if (totalEl)
    totalEl.innerText =
      `Bs. ${formatearMonto(
        totalIngresos
      )}`;


  // ----------------------------------------------------------
  // SALDOS PENDIENTES
  // ----------------------------------------------------------

  const pendientesContainer =
    document.getElementById(
      "lista-saldos-pendientes"
    );


  if (pendientesContainer) {

    pendientesContainer.innerHTML = "";


    const pendientes =
      proyectos.filter(
        p => {

          const presupuesto =
            Number(
              p.presupuesto
            ) || 0;


          const adelanto =
            Number(
              p.adelanto
            ) || 0;


          const saldo =
            Math.max(
              0,
              presupuesto - adelanto
            );


          return (
            saldo > 0 &&
            !p.ingresoRegistrado
          );

        }
      );


    if (pendientes.length === 0) {

      pendientesContainer.innerHTML = `

        <div
          style="
            padding:12px;
            background:rgba(16,185,129,0.08);
            border:1px solid rgba(16,185,129,0.2);
            border-radius:8px;
            color:#10b981;
            font-size:0.85rem;
          "
        >
          <i class="fa-solid fa-circle-check"></i>
          No hay saldos pendientes de cobro.
        </div>

      `;

    }


    pendientes.forEach(
      p => {

        const presupuesto =
          Number(
            p.presupuesto
          ) || 0;


        const adelanto =
          Number(
            p.adelanto
          ) || 0;


        const saldo =
          Math.max(
            0,
            presupuesto - adelanto
          );


        const div =
          document.createElement(
            "div"
          );


        div.style.cssText =
          `
            background:rgba(255,255,255,0.04);
            border:1px solid rgba(245,158,11,0.2);
            border-radius:10px;
            padding:10px;
            margin-bottom:8px;
          `;


        div.innerHTML = `

          <div
            style="
              display:flex;
              justify-content:space-between;
              gap:8px;
              align-items:center;
            "
          >

            <div>

              <strong>
                ${p.codigo || ""}
              </strong>

              <div
                style="
                  font-size:0.8rem;
                  color:#a3a3a3;
                  margin-top:3px;
                "
              >
                ${p.cliente || ""}
                —
                ${p.mueble || ""}
              </div>

              <div
                style="
                  margin-top:5px;
                  font-size:0.85rem;
                "
              >
                Saldo:
                <strong
                  style="
                    color:#f59e0b;
                  "
                >
                  Bs.
                  ${formatearMonto(
                    saldo
                  )}
                </strong>
              </div>

            </div>


            <button
              type="button"
              onclick="
                registrarIngreso(
                  '${p.id}'
                )
              "
              style="
                background:#10b981;
                color:#fff;
                border:none;
                padding:7px 9px;
                border-radius:7px;
                cursor:pointer;
                font-size:0.75rem;
                font-weight:bold;
              "
            >
              Registrar ingreso
            </button>

          </div>

        `;


        pendientesContainer.appendChild(
          div
        );

      }
    );

  }


  // ----------------------------------------------------------
  // HISTORIAL
  // ----------------------------------------------------------

  const historialContainer =
    document.getElementById(
      "lista-historial-ingresos"
    );


  if (historialContainer) {

    historialContainer.innerHTML = "";


    if (
      ingresosFiltrados.length === 0
    ) {

      historialContainer.innerHTML = `

        <div
          style="
            padding:12px;
            background:rgba(255,255,255,0.04);
            border-radius:8px;
            color:#a3a3a3;
            font-size:0.85rem;
          "
        >
          No hay ingresos registrados
          para este período.
        </div>

      `;

      return;

    }


    ingresosFiltrados
      .sort(
        (a, b) => {

          return (
            b.fecha || ""
          ).localeCompare(
            a.fecha || ""
          );

        }
      )
      .forEach(
        ingreso => {


          const div =
            document.createElement(
              "div"
            );


          div.style.cssText =
            `
              background:rgba(16,185,129,0.06);
              border:1px solid rgba(16,185,129,0.18);
              border-radius:10px;
              padding:10px;
              margin-bottom:8px;
            `;


          let fechaMostrar =
            ingreso.fecha || "";


          if (
            fechaMostrar.length >= 10
          ) {

            fechaMostrar =
              fechaMostrar
                .split("-")
                .reverse()
                .join("/");

          }


          div.innerHTML = `

            <div
              style="
                display:flex;
                justify-content:space-between;
                gap:10px;
                align-items:center;
              "
            >

              <div>

                <strong>
                  ${ingreso.codigo || ""}
                </strong>

                <div
                  style="
                    color:#a3a3a3;
                    font-size:0.8rem;
                    margin-top:3px;
                  "
                >
                  ${ingreso.cliente || ""}
                  —
                  ${ingreso.mueble || ""}
                </div>

                <div
                  style="
                    color:#737373;
                    font-size:0.7rem;
                    margin-top:3px;
                  "
                >
                  Cobrado:
                  ${fechaMostrar}
                </div>

              </div>


              <strong
                style="
                  color:#10b981;
                  font-size:1rem;
                "
              >
                Bs.
                ${formatearMonto(
                  ingreso.monto
                )}
              </strong>

            </div>

          `;


          historialContainer.appendChild(
            div
          );

        }
      );

  }

}


// ============================================================
// 14. REGISTRAR INGRESO
// ============================================================

async function registrarIngreso(
  idProyecto
) {

  if (
    !esAdmin ||
    !auth.currentUser
  ) {

    alert(
      "Sesión de administrador no válida."
    );

    return;

  }


  const proyecto =
    proyectos.find(
      p =>
        p.id ===
        idProyecto
    );


  if (!proyecto) {

    alert(
      "No se encontró el proyecto."
    );

    return;

  }


  if (proyecto.ingresoRegistrado) {

    alert(
      "El ingreso de este proyecto ya fue registrado."
    );

    return;

  }


  const presupuesto =
    Number(
      proyecto.presupuesto
    ) || 0;


  const adelanto =
    Number(
      proyecto.adelanto
    ) || 0;


  const saldo =
    Math.max(
      0,
      presupuesto - adelanto
    );


  if (saldo <= 0) {

    alert(
      "Este proyecto no tiene saldo pendiente."
    );

    return;

  }


  const confirmar =
    confirm(
      `¿Confirmás que cobraste el saldo de Bs. ${formatearMonto(
        saldo
      )} del proyecto ${proyecto.codigo}?`
    );


  if (!confirmar)
    return;


  const ahora =
    new Date();


  const fecha =
    `${ahora.getFullYear()}-${String(
      ahora.getMonth() + 1
    ).padStart(2, "0")}-${String(
      ahora.getDate()
    ).padStart(2, "0")}`;


  try {

    // --------------------------------------------------------
    // CREAMOS EL REGISTRO DE INGRESO
    // --------------------------------------------------------

    const ingresoRef =
      db.collection(
        "ingresos"
      ).doc();


    // --------------------------------------------------------
    // ACTUALIZAMOS EL PROYECTO
    // --------------------------------------------------------

    const proyectoRef =
      db.collection(
        "proyectos"
      ).doc(
        idProyecto
      );


    const batch =
      db.batch();


    batch.set(
      ingresoRef,
      {

        proyectoId:
          idProyecto,

        codigo:
          proyecto.codigo || "",

        cliente:
          proyecto.cliente || "",

        mueble:
          proyecto.mueble || "",

        monto:
          saldo,

        fecha:
          fecha,

        fechaRegistro:
          new Date().toISOString(),

        tipo:
          "Saldo final"

      }
    );


    batch.update(
      proyectoRef,
      {

        saldo:
          0,

        ingresoRegistrado:
          true,

        ingresoFecha:
          fecha

      }
    );


    await batch.commit();


    alert(
      `Ingreso registrado correctamente: Bs. ${formatearMonto(
        saldo
      )}`
    );


    await cargarProyectosDesdeNube();

    await cargarIngresosDesdeNube();

    renderProyectosAdmin();

    renderIngresos();


  } catch (error) {

    console.error(
      "Error registrando ingreso:",
      error
    );


    alert(
      "No se pudo registrar el ingreso."
    );

  }

}


// ============================================================
// 15. CAMBIAR ESTADO
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

    alert(
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
      .collection(
        "proyectos"
      )
      .doc(
        idFirebase
      )
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


    alert(
      "No se pudo actualizar el estado."
    );

  }

}


// ============================================================
// 16. ELIMINAR PROYECTO
// ============================================================

async function eliminarProyecto(
  idFirebase
) {

  if (
    !esAdmin ||
    !auth.currentUser
  ) {

    alert(
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
      .collection(
        "proyectos"
      )
      .doc(
        idFirebase
      )
      .delete();


    await cargarProyectosDesdeNube();

    await cargarIngresosDesdeNube();

    renderProyectosAdmin();

    renderIngresos();


  } catch (error) {

    console.error(
      "Error eliminando:",
      error
    );


    alert(
      "No se pudo eliminar el proyecto."
    );

  }

}


// ============================================================
// 17. EDITAR PROYECTO
// ============================================================

function activarEdicionInline(
  index
) {

  const p =
    proyectos[index];


  const info =
    document.getElementById(
      `info-view-${index}`
    );


  if (!info || !p)
    return;


  info.innerHTML = `

    <div
      style="
        display:flex;
        flex-direction:column;
        gap:8px;
      "
    >

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
          onclick="
            guardarEdicionInline(
              '${p.id}',
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
          onclick="
            renderProyectosAdmin()
          "
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


// ============================================================
// 18. GUARDAR EDICIÓN
// ============================================================

async function guardarEdicionInline(
  idFirebase,
  index
) {

  if (
    !esAdmin ||
    !auth.currentUser
  ) {

    alert(
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
    ).value
      .trim();


  const nuevoMueble =
    document.getElementById(
      `edit-mueble-${index}`
    ).value
      .trim();


  const nuevoTelefono =
    document.getElementById(
      `edit-telefono-${index}`
    ).value
      .trim();


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


  const proyectoActual =
    proyectos[index];


  let nuevoSaldo =
    Math.max(
      0,
      nuevoPresupuesto -
      nuevoAdelanto
    );


  // Si se modifica el dinero de un proyecto
  // cuyo saldo todavía no fue cobrado,
  // recalculamos el saldo.
  if (
    !proyectoActual.ingresoRegistrado
  ) {

    nuevoSaldo =
      Math.max(
        0,
        nuevoPresupuesto -
        nuevoAdelanto
      );

  } else {

    // Si ya fue registrado el ingreso,
    // no volvemos a ponerlo como pendiente.
    nuevoSaldo = 0;

  }


  try {

    await db
      .collection(
        "proyectos"
      )
      .doc(
        idFirebase
      )
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
          nuevoSaldo,

        fechaEntrega:
          nuevaFecha

      });


    await cargarProyectosDesdeNube();

    renderProyectosAdmin();

    renderIngresos();


  } catch (error) {

    console.error(
      "Error actualizando:",
      error
    );


    alert(
      "No se pudo actualizar el proyecto."
    );

  }

}


// ============================================================
// 19. WHATSAPP
// ============================================================

function notificarWhatsApp(
  index
) {

  if (!esAdmin) {

    alert(
      "Solo el administrador puede realizar esta acción."
    );

    return;

  }


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
      .replace(
        /\D/g,
        ""
      );


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
