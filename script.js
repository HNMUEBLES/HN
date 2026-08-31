// ============================================================
// HN MUEBLES - SCRIPT PRINCIPAL
// Firebase Authentication + Firestore
// Gestión de proyectos + Gestión de ingresos
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
let esAdmin = false;


// ============================================================
// 2. UTILIDADES
// ============================================================

function formatearMonto(valor) {

  const num = Number(valor);

  if (isNaN(num)) {
    return "0";
  }

  return Number.isInteger(num)
    ? num.toString()
    : num.toFixed(2);
}


function generarCodigoAleatorio() {

  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let aleatorio = "";

  for (let i = 0; i < 5; i++) {

    aleatorio += caracteres.charAt(
      Math.floor(
        Math.random() * caracteres.length
      )
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

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// ============================================================
// 3. AUTENTICACIÓN
// ============================================================

auth.onAuthStateChanged(
  async (user) => {

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

        renderProyectosAdmin();

        renderGestionIngresos();

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

  }
);


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
              await auth.signInWithEmailAndPassword(
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


          const codigoInput =
            document.getElementById(
              "input-codigo"
            );


          if (!codigoInput) {
            return;
          }


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


    // --------------------------------------------------------
    // CÁLCULO SALDO NUEVO PROYECTO
    // --------------------------------------------------------

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
          pres - adel,
          0
        );


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
              presupuesto - adelanto,
              0
            );


          // --------------------------------------------------
          // NUEVO PROYECTO
          // --------------------------------------------------

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

            // NUEVO:
            // todavía no se ha registrado el cobro final
            ingresoFinal:
              0,

            ingresoFinalRegistrado:
              false,

            fechaIngresoFinal:
              "",

            fechaEntrega:
              fechaIn
                ? fechaIn.value
                : ""

          };


          try {

            await db
              .collection("proyectos")
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

            renderProyectosAdmin();

            renderGestionIngresos();


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
        "No se cargan proyectos privados."
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

        const datos =
          docSnap.data();


        const presupuesto =
          Number(
            datos.presupuesto
          ) || 0;


        const adelanto =
          Number(
            datos.adelanto
          ) || 0;


        // Compatibilidad con proyectos
        // antiguos que no tengan saldo
        const saldo =
          datos.saldo !== undefined
            ? Number(datos.saldo) || 0
            : Math.max(
                presupuesto - adelanto,
                0
              );


        proyectos.push({

          id:
            docSnap.id,

          ...datos,

          saldo:
            saldo,

          ingresoFinal:
            Number(
              datos.ingresoFinal
            ) || 0,

          ingresoFinalRegistrado:
            datos.ingresoFinalRegistrado === true,

          fechaIngresoFinal:
            datos.fechaIngresoFinal || ""

        });

      }
    );


    if (esAdmin) {

      renderProyectosAdmin();

      renderGestionIngresos();

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
// 8. BÚSQUEDA PÚBLICA
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

      if (resultBox) {

        resultBox.classList.add(
          "hidden"
        );

      }


      if (errorMsg) {

        errorMsg.classList.remove(
          "hidden"
        );

      }


      return;

    }


    const doc =
      snapshot.docs[0];


    const encontrado =
      doc.data();


    if (errorMsg) {

      errorMsg.classList.add(
        "hidden"
      );

    }


    if (resultBox) {

      resultBox.classList.remove(
        "hidden"
      );

    }


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


    if (codigoEl) {

      codigoEl.innerText =
        encontrado.codigo || "";

    }


    if (muebleEl) {

      muebleEl.innerText =
        encontrado.mueble || "";

    }


    if (clienteEl) {

      clienteEl.innerText =
        `Cliente: ${
          encontrado.cliente || ""
        }`;

    }


    if (estadoEl) {

      estadoEl.innerText =
        encontrado.estado || "";

    }


    if (porcentajeEl) {

      porcentajeEl.innerText =
        `${
          encontrado.progreso || 0
        }%`;

    }


    if (barEl) {

      barEl.style.width =
        `${
          encontrado.progreso || 0
        }%`;

    }


    if (detallesEl) {

      detallesEl.innerText =
        encontrado.detalles ||
        `El proyecto se encuentra en etapa de ${
          encontrado.estado || ""
        }.`;

    }


  } catch (error) {

    console.error(
      "Error buscando proyecto público:",
      error
    );


    if (resultBox) {

      resultBox.classList.add(
        "hidden"
      );

    }


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
// 9. ENLACE DIRECTO
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


  if (!codigoUrl) {
    return;
  }


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
// 10. RENDER ADMIN
// ============================================================

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
          presupuesto - adelanto,
          0
        );


      const ingresoFinal =
        Number(
          p.ingresoFinal
        ) || 0;


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


            <!-- DATOS FINANCIEROS -->

            <div
              style="
                background:rgba(0,0,0,0.3);
                border:1px solid rgba(255,255,255,0.08);
                padding:0.7rem 0.8rem;
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
                    color:#f87171;
                  "
                >
                  Bs.
                  ${formatearMonto(
                    saldo
                  )}
                </strong>

              </div>


              <div>

                Ingreso final:

                <strong
                  style="
                    color:#4ade80;
                  "
                >
                  Bs.
                  ${formatearMonto(
                    ingresoFinal
                  )}
                </strong>

              </div>

            </div>


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
                display:flex;
                gap:6px;
                flex-wrap:wrap;
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


              ${
                p.ingresoFinalRegistrado
                  ? `
                    <span
                      style="
                        background:rgba(16,185,129,0.15);
                        color:#4ade80;
                        border:1px solid rgba(16,185,129,0.3);
                        padding:0.4rem 0.8rem;
                        border-radius:6px;
                        font-size:0.8rem;
                      "
                    >
                      ✓ Saldo registrado
                    </span>
                  `
                  : ""
              }

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
// 11. GESTIÓN DE INGRESOS
// ============================================================

function renderGestionIngresos() {

  if (!esAdmin) {
    return;
  }


  const container =
    document.getElementById(
      "lista-ingresos"
    );


  if (!container) {
    return;
  }


  container.innerHTML = "";


  if (proyectos.length === 0) {

    container.innerHTML = `

      <div
        style="
          color:#777;
          text-align:center;
          padding:15px;
        "
      >
        Todavía no hay proyectos registrados.
      </div>

    `;

    return;

  }


  proyectos.forEach(
    (p, index) => {


      const total =
        Number(
          p.presupuesto
        ) || 0;


      const adelanto =
        Number(
          p.adelanto
        ) || 0;


      const saldo =
        Math.max(
          total - adelanto,
          0
        );


      const ingresoFinal =
        Number(
          p.ingresoFinal
        ) || 0;


      const registrado =
        p.ingresoFinalRegistrado === true;


      const item =
        document.createElement(
          "div"
        );


      item.style.cssText =
        "background:rgba(255,255,255,0.04);" +
        "border:1px solid rgba(255,255,255,0.08);" +
        "border-radius:8px;" +
        "padding:10px;" +
        "margin-bottom:8px;";


      item.innerHTML = `

        <div
          style="
            display:flex;
            justify-content:space-between;
            gap:10px;
            flex-wrap:wrap;
            align-items:center;
          "
        >

          <div>

            <strong>
              ${p.codigo || ""}
            </strong>

            <div
              style="
                color:#aaa;
                font-size:0.8rem;
                margin-top:3px;
              "
            >
              ${p.cliente || ""}
              —
              ${p.mueble || ""}
            </div>

          </div>


          <div
            style="
              font-size:0.8rem;
              text-align:right;
            "
          >

            <div>
              Total:
              <strong>
                Bs. ${formatearMonto(total)}
              </strong>
            </div>

            <div>
              Adelanto:
              <strong>
                Bs. ${formatearMonto(adelanto)}
              </strong>
            </div>

            <div
              style="
                color:#f87171;
              "
            >
              Saldo:
              <strong>
                Bs. ${formatearMonto(saldo)}
              </strong>
            </div>

          </div>

        </div>


        <div
          style="
            margin-top:10px;
            padding-top:10px;
            border-top:1px solid rgba(255,255,255,0.08);
          "
        >

          ${
            registrado

              ? `

                <div
                  style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:10px;
                    flex-wrap:wrap;
                  "
                >

                  <div>

                    <div
                      style="
                        color:#4ade80;
                        font-weight:bold;
                      "
                    >
                      ✓ Ingreso final registrado
                    </div>

                    <div
                      style="
                        color:#aaa;
                        font-size:0.8rem;
                      "
                    >
                      Fecha:
                      ${
                        p.fechaIngresoFinal
                          ? formatearFecha(
                              p.fechaIngresoFinal
                            )
                          : "Sin fecha"
                      }
                    </div>

                  </div>


                  <strong
                    style="
                      color:#4ade80;
                      font-size:1.1rem;
                    "
                  >
                    Bs.
                    ${formatearMonto(
                      ingresoFinal
                    )}
                  </strong>


                  <button
                    type="button"
                    onclick="
                      quitarIngresoFinal(
                        '${p.id}'
                      )
                    "
                    style="
                      background:#7f1d1d;
                      color:#fff;
                      border:none;
                      padding:6px 8px;
                      border-radius:6px;
                      cursor:pointer;
                    "
                  >
                    Deshacer
                  </button>

                </div>

              `

              : `

                <div>

                  <div
                    style="
                      display:grid;
                      grid-template-columns:1fr 1fr;
                      gap:6px;
                      margin-bottom:7px;
                    "
                  >

                    <input
                      type="number"
                      id="ingreso-monto-${index}"
                      value="${saldo}"
                      min="0"
                      step="0.01"
                      placeholder="Monto recibido"
                      style="
                        width:100%;
                        box-sizing:border-box;
                      "
                    />


                    <input
                      type="date"
                      id="ingreso-fecha-${index}"
                      style="
                        width:100%;
                        box-sizing:border-box;
                      "
                    />

                  </div>


                  <button
                    type="button"
                    onclick="
                      registrarIngresoFinal(
                        '${p.id}',
                        ${index}
                      )
                    "
                    style="
                      width:100%;
                      background:#16a34a;
                      color:#fff;
                      border:none;
                      padding:8px;
                      border-radius:6px;
                      cursor:pointer;
                      font-weight:bold;
                    "
                  >

                    <i class="fa-solid fa-check"></i>

                    Registrar ingreso final

                  </button>

                </div>

              `

          }

        </div>

      `;


      container.appendChild(
        item
      );

    }
  );

}


// ============================================================
// 12. REGISTRAR INGRESO FINAL
// ============================================================

async function registrarIngresoFinal(
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


  const proyecto =
    proyectos.find(
      p => p.id === idFirebase
    );


  if (!proyecto) {

    alert(
      "No se encontró el proyecto."
    );

    return;

  }


  const montoInput =
    document.getElementById(
      `ingreso-monto-${index}`
    );


  const fechaInput =
    document.getElementById(
      `ingreso-fecha-${index}`
    );


  const monto =
    montoInput
      ? parseFloat(
          montoInput.value
        ) || 0
      : 0;


  const fecha =
    fechaInput
      ? fechaInput.value
      : "";


  if (monto <= 0) {

    alert(
      "Ingresa un monto válido."
    );

    return;

  }


  if (!fecha) {

    alert(
      "Selecciona la fecha en que recibiste el ingreso."
    );

    return;

  }


  const saldo =
    Math.max(
      (Number(proyecto.presupuesto) || 0) -
      (Number(proyecto.adelanto) || 0),
      0
    );


  if (monto > saldo) {

    const confirmar =
      confirm(
        `El monto ingresado (Bs. ${formatearMonto(monto)}) supera el saldo pendiente (Bs. ${formatearMonto(saldo)}). ¿Deseas registrarlo igualmente?`
      );


    if (!confirmar) {
      return;
    }

  }


  try {

    await db
      .collection("proyectos")
      .doc(idFirebase)
      .update({

        ingresoFinal:
          monto,

        ingresoFinalRegistrado:
          true,

        fechaIngresoFinal:
          fecha

      });


    await cargarProyectosDesdeNube();

    renderProyectosAdmin();

    renderGestionIngresos();


    alert(
      "Ingreso final registrado correctamente."
    );


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
// 13. QUITAR INGRESO FINAL
// ============================================================

async function quitarIngresoFinal(
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


  const confirmar =
    confirm(
      "¿Quieres quitar el registro del ingreso final?"
    );


  if (!confirmar) {
    return;
  }


  try {

    await db
      .collection("proyectos")
      .doc(idFirebase)
      .update({

        ingresoFinal:
          0,

        ingresoFinalRegistrado:
          false,

        fechaIngresoFinal:
          ""

      });


    await cargarProyectosDesdeNube();

    renderProyectosAdmin();

    renderGestionIngresos();


  } catch (error) {

    console.error(
      "Error quitando ingreso:",
      error
    );


    alert(
      "No se pudo modificar el ingreso."
    );

  }

}


// ============================================================
// 14. RESUMEN FINANCIERO
// ============================================================

function actualizarResumenFinanciero() {

  const cantidad =
    proyectos.length;


  let totalContratado = 0;

  let totalAdelantos = 0;

  let totalIngresosFinales = 0;

  let totalCobrado = 0;

  let totalPendiente = 0;


  proyectos.forEach(
    p => {

      const total =
        Number(
          p.presupuesto
        ) || 0;


      const adelanto =
        Number(
          p.adelanto
        ) || 0;


      const ingresoFinal =
        Number(
          p.ingresoFinal
        ) || 0;


      const pendiente =
        Math.max(
          total -
          adelanto -
          ingresoFinal,
          0
        );


      totalContratado +=
        total;


      totalAdelantos +=
        adelanto;


      totalIngresosFinales +=
        ingresoFinal;


      totalCobrado +=
        adelanto +
        ingresoFinal;


      totalPendiente +=
        pendiente;

    }
  );


  const cantidadEl =
    document.getElementById(
      "reporte-cant-mes"
    );


  const contratadoEl =
    document.getElementById(
      "reporte-presupuesto-mes"
    );


  const adelantosEl =
    document.getElementById(
      "reporte-adelanto-mes"
    );


  const ingresosFinalesEl =
    document.getElementById(
      "reporte-ingreso-final"
    );


  const cobradoEl =
    document.getElementById(
      "reporte-total-cobrado"
    );


  const pendienteEl =
    document.getElementById(
      "reporte-saldo"
    );


  if (cantidadEl) {

    cantidadEl.innerText =
      cantidad;

  }


  if (contratadoEl) {

    contratadoEl.innerText =
      `Bs. ${formatearMonto(
        totalContratado
      )}`;

  }


  if (adelantosEl) {

    adelantosEl.innerText =
      `Bs. ${formatearMonto(
        totalAdelantos
      )}`;

  }


  if (ingresosFinalesEl) {

    ingresosFinalesEl.innerText =
      `Bs. ${formatearMonto(
        totalIngresosFinales
      )}`;

  }


  if (cobradoEl) {

    cobradoEl.innerText =
      `Bs. ${formatearMonto(
        totalCobrado
      )}`;

  }


  if (pendienteEl) {

    pendienteEl.innerText =
      `Bs. ${formatearMonto(
        totalPendiente
      )}`;

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

    renderGestionIngresos();


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
      .collection("proyectos")
      .doc(idFirebase)
      .delete();


    await cargarProyectosDesdeNube();

    renderProyectosAdmin();

    renderGestionIngresos();


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

function activarEdicionInline(index) {

  const p =
    proyectos[index];


  const info =
    document.getElementById(
      `info-view-${index}`
    );


  if (!info || !p) {
    return;
  }


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
          type="button"
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
          type="button"
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


  const nuevoSaldo =
    Math.max(
      nuevoPresupuesto -
      nuevoAdelanto,
      0
    );


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
          nuevoSaldo,

        fechaEntrega:
          nuevaFecha

      });


    await cargarProyectosDesdeNube();

    renderProyectosAdmin();

    renderGestionIngresos();


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
// 19. FORMATEAR FECHA
// ============================================================

function formatearFecha(
  fecha
) {

  if (!fecha) {
    return "";
  }


  const partes =
    fecha.split("-");


  if (partes.length !== 3) {
    return fecha;
  }


  return `${partes[2]}/${partes[1]}/${partes[0]}`;

}


// ============================================================
// 20. WHATSAPP
// ============================================================

function notificarWhatsApp(index) {

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
      "591" +
      num;

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
