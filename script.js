// ============================================================
// HN MUEBLES - SCRIPT PRINCIPAL
// Firebase Authentication + Firestore
// Proyectos + Gestión de Ingresos
// ============================================================


// ============================================================
// 1. FIREBASE
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
let ingresos = [];


// ============================================================
// 2. UTILIDADES
// ============================================================

function formatearMonto(valor) {

  const num = Number(valor);

  if (isNaN(num)) return "0";

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

  const input =
    document.getElementById(
      "nuevo-codigo"
    );

  if (input) {

    input.value =
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
        "Error al copiar:",
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
        user.email.toLowerCase() ===
        EMAIL_ADMIN.toLowerCase()
      ) {

        esAdmin = true;

        mostrarPanelAdministrador();

        await cargarProyectosDesdeNube();

        renderProyectosAdmin();

      } else {

        await auth.signOut();

        esAdmin = false;

        ocultarPanelAdministrador();

        alert(
          "Esta cuenta no tiene permisos de administrador."
        );

      }

    } else {

      esAdmin = false;

      ocultarPanelAdministrador();

    }

  }
);


// ============================================================
// 4. PANEL ADMIN
// ============================================================

function mostrarPanelAdministrador() {

  const login =
    document.getElementById(
      "admin-login"
    );

  const panel =
    document.getElementById(
      "admin-panel"
    );

  if (login)
    login.classList.add("hidden");

  if (panel)
    panel.classList.remove("hidden");

}


function ocultarPanelAdministrador() {

  const login =
    document.getElementById(
      "admin-login"
    );

  const panel =
    document.getElementById(
      "admin-panel"
    );

  if (panel)
    panel.classList.add("hidden");

  if (login)
    login.classList.remove("hidden");

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


          try {

            if (errorMsg)
              errorMsg.classList.add("hidden");


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


            if (passInput)
              passInput.value = "";


          } catch (error) {

            console.error(
              "Error de autenticación:",
              error
            );


            if (passInput)
              passInput.value = "";


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
      document.getElementById(
        "form-buscar"
      );


    if (formBuscar) {

      formBuscar.addEventListener(
        "submit",
        async function (e) {

          e.preventDefault();


          const input =
            document.getElementById(
              "input-codigo"
            );


          if (!input) return;


          const codigo =
            input.value
              .trim()
              .toUpperCase();


          buscarProyectoPublico(
            codigo
          );

        }
      );

    }


    // ========================================================
    // CÁLCULO SALDO
    // ========================================================

    const presupuestoInput =
      document.getElementById(
        "nuevo-presupuesto"
      );

    const adelantoInput =
      document.getElementById(
        "nuevo-adelanto"
      );


    function calcularSaldoEnVivo() {

      const presupuesto =
        parseFloat(
          presupuestoInput
            ? presupuestoInput.value
            : 0
        ) || 0;


      const adelanto =
        parseFloat(
          adelantoInput
            ? adelantoInput.value
            : 0
        ) || 0;


      const saldo =
        presupuesto - adelanto;


      const label =
        document.getElementById(
          "lbl-nuevo-saldo"
        );


      if (label) {

        label.innerText =
          `Bs. ${formatearMonto(saldo)}`;

        label.style.color =
          saldo > 0
            ? "#f87171"
            : "#4ade80";

      }

    }


    if (presupuestoInput) {

      presupuestoInput.addEventListener(
        "input",
        calcularSaldoEnVivo
      );

    }


    if (adelantoInput) {

      adelantoInput.addEventListener(
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


          let codigo =
            codIn
              ? codIn.value
                  .trim()
                  .toUpperCase()
              : "";


          if (!codigo) {

            codigo =
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


          const nuevoProyecto = {

            codigo,

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

            presupuesto,

            adelanto,

            saldo:
              presupuesto - adelanto,

            fechaEntrega:
              fechaIn
                ? fechaIn.value
                : "",

            fechaCreacion:
              new Date()
                .toISOString()

          };


          try {

            const docRef =
              await db
                .collection("proyectos")
                .add(
                  nuevoProyecto
                );


            // ==================================================
            // REGISTRAR AUTOMÁTICAMENTE EL ADELANTO
            // COMO INGRESO SI ES MAYOR A CERO
            // ==================================================

            if (adelanto > 0) {

              await db
                .collection("ingresos")
                .add({

                  proyectoId:
                    docRef.id,

                  codigo,
                  cliente:
                    nuevoProyecto.cliente,

                  mueble:
                    nuevoProyecto.mueble,

                  monto:
                    adelanto,

                  tipo:
                    "Adelanto",

                  fecha:
                    new Date()
                      .toISOString()
                      .substring(0,10),

                  observacion:
                    "Adelanto registrado al crear el proyecto.",

                  creadoEn:
                    firebase.firestore.FieldValue.serverTimestamp()

                });

            }


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

          } catch (error) {

            console.error(
              "Error guardando proyecto:",
              error
            );

            alert(
              "No se pudo guardar el proyecto. Verifica las Rules de Firestore."
            );

          }

        }
      );

    }


    // ========================================================
    // FILTRO INGRESOS
    // ========================================================

    const filtroIngresos =
      document.getElementById(
        "filtro-ingresos-mes"
      );


    if (filtroIngresos) {

      const ahora =
        new Date();


      filtroIngresos.value =
        `${ahora.getFullYear()}-${String(
          ahora.getMonth() + 1
        ).padStart(2,"0")}`;


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

      return;

    }


    const snapshot =
      await db
        .collection("proyectos")
        .get();


    proyectos = [];


    snapshot.forEach(
      doc => {

        proyectos.push({

          id: doc.id,

          ...doc.data()

        });

      }
    );


    renderProyectosAdmin();


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


    const encontrado =
      snapshot.docs[0].data();


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
        `Cliente: ${encontrado.cliente || ""}`;


    if (estadoEl)
      estadoEl.innerText =
        encontrado.estado || "";


    if (porcentajeEl)
      porcentajeEl.innerText =
        `${encontrado.progreso || 0}%`;


  } catch (error) {

    console.error(
      "Error buscando:",
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
// 9. RENDER PROYECTOS
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


  if (total)
    total.innerText =
      proyectos.length;


  if (!container)
    return;


  container.innerHTML = "";


  const etapas = [

    "Diseño Aprobado",
    "Corte",
    "Armado",
    "Instalación",
    "Finalizado"

  ];


  proyectos.forEach(
    (p,index) => {

      const presupuesto =
        Number(
          p.presupuesto
        ) || 0;


      const adelanto =
        Number(
          p.adelanto
        ) || 0;


      const saldo =
        presupuesto -
        adelanto;


      const fecha =
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


      card.style.cssText = `
        background:rgba(255,255,255,.05);
        border:1px solid rgba(255,255,255,.1);
        border-radius:12px;
        padding:1.2rem;
        margin-bottom:1rem;
      `;


      const botones =
        etapas.map(
          (etapa,idx) => {

            const activo =
              p.estado === etapa;


            return `

              <button
                type="button"
                onclick="cambiarEstadoPorId('${p.id}',${idx},${(idx+1)*20})"
                style="
                  border:none;
                  padding:.4rem .7rem;
                  border-radius:6px;
                  cursor:pointer;
                  font-size:.8rem;
                  margin:.2rem;
                  background:${activo ? "#f59e0b" : "rgba(255,255,255,.1)"};
                  color:${activo ? "#000" : "#fff"};
                  font-weight:${activo ? "bold" : "normal"};
                "
              >
                ${etapa}
              </button>

            `;

          }
        ).join("");


      card.innerHTML = `

        <div id="info-view-${index}">

          <div
            style="
              display:flex;
              align-items:center;
              gap:.5rem;
              flex-wrap:wrap;
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
              ${p.codigo || ""}
            </span>


            <button
              type="button"
              onclick="copiarCodigoAlPortapapeles('${p.codigo || ""}')"
              style="
                background:rgba(255,255,255,.1);
                color:#fff;
                border:1px solid rgba(255,255,255,.2);
                padding:.2rem .5rem;
                border-radius:4px;
                cursor:pointer;
                font-size:.75rem;
              "
            >
              Copiar
            </button>


            <strong>
              ${p.mueble || ""}
            </strong>

          </div>


          <p
            style="
              margin:.4rem 0;
              color:#a3a3a3;
              font-size:.85rem;
            "
          >
            Cliente: ${p.cliente || ""}
            |
            Tel: ${p.telefono || "Sin registrar"}
          </p>


          <p
            style="
              margin:.2rem 0 .5rem;
              color:#38bdf8;
              font-size:.85rem;
            "
          >

            Entrega estimada:

            <strong>
              ${fecha}
            </strong>

          </p>


          <div
            style="
              background:rgba(0,0,0,.3);
              border:1px solid rgba(255,255,255,.08);
              padding:.6rem .8rem;
              border-radius:8px;
              margin:.6rem 0;
              display:flex;
              gap:1rem;
              flex-wrap:wrap;
              font-size:.85rem;
            "
          >

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
            ${botones}
          </div>


          <div
            style="
              margin-top:.8rem;
              display:flex;
              gap:6px;
            "
          >

            <button
              type="button"
              onclick="activarEdicionInline(${index})"
              style="
                background:#3b82f6;
                color:#fff;
                border:none;
                padding:.6rem .8rem;
                border-radius:8px;
                cursor:pointer;
              "
            >
              ✏️ Editar
            </button>


            <button
              type="button"
              onclick="notificarWhatsApp(${index})"
              style="
                background:#16a34a;
                color:#fff;
                border:none;
                padding:.6rem .8rem;
                border-radius:8px;
                cursor:pointer;
              "
            >
              WhatsApp
            </button>


            <button
              type="button"
              onclick="eliminarProyecto('${p.id}')"
              style="
                background:#ef4444;
                color:#fff;
                border:none;
                padding:.6rem .8rem;
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
// 10. CAMBIAR ESTADO
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


  try {

    await db
      .collection("proyectos")
      .doc(id)
      .update({

        estado:
          etapas[etapaIdx],

        progreso,

        detalles:
          descripciones[etapaIdx]

      });


    await cargarProyectosDesdeNube();


  } catch (error) {

    console.error(
      error
    );

    alert(
      "No se pudo actualizar el estado."
    );

  }

}


// ============================================================
// 11. ELIMINAR
// ============================================================

async function eliminarProyecto(
  id
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
      "¿Deseas eliminar este proyecto?"
    )
  ) return;


  try {

    await db
      .collection("proyectos")
      .doc(id)
      .delete();


    await cargarProyectosDesdeNube();


  } catch (error) {

    console.error(
      error
    );

    alert(
      "No se pudo eliminar el proyecto."
    );

  }

}


// ============================================================
// 12. EDITAR
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


  if (!p || !info)
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
      >

      <input
        type="number"
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
  id,
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
    parseFloat(
      document.getElementById(
        `edit-presupuesto-${index}`
      ).value
    ) || 0;


  const adelanto =
    parseFloat(
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

        saldo:
          presupuesto - adelanto,

        fechaEntrega:
          fecha

      });


    await cargarProyectosDesdeNube();


  } catch (error) {

    console.error(
      error
    );

    alert(
      "No se pudo actualizar el proyecto."
    );

  }

}


// ============================================================
// 13. GESTIÓN DE INGRESOS
// ============================================================

async function cargarGestionIngresos() {

  if (
    !esAdmin ||
    !auth.currentUser
  ) return;


  try {

    // Cargar todos los ingresos
    const snapshot =
      await db
        .collection("ingresos")
        .get();


    ingresos = [];


    snapshot.forEach(
      doc => {

        ingresos.push({

          id: doc.id,

          ...doc.data()

        });

      }
    );


    llenarSelectorProyectosIngreso();

    renderIngresos();


  } catch (error) {

    console.error(
      "Error cargando ingresos:",
      error
    );

  }

}


// ============================================================
// 14. SELECTOR DE PROYECTOS
// ============================================================

function llenarSelectorProyectosIngreso() {

  const select =
    document.getElementById(
      "ing-proyecto-select"
    );


  if (!select)
    return;


  select.innerHTML = `

    <option value="">
      Seleccionar proyecto
    </option>

  `;


  proyectos.forEach(
    p => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        p.id;


      option.textContent =
        `${p.codigo || ""} - ${p.cliente || ""} - ${p.mueble || ""}`;


      select.appendChild(
        option
      );

    }
  );

}


// ============================================================
// 15. REGISTRAR INGRESO MANUAL
// ============================================================

async function registrarIngresoManual() {

  if (
    !esAdmin ||
    !auth.currentUser
  ) {

    alert(
      "Sesión de administrador no válida."
    );

    return;

  }


  const select =
    document.getElementById(
      "ing-proyecto-select"
    );


  const montoInput =
    document.getElementById(
      "ing-monto"
    );


  const fechaInput =
    document.getElementById(
      "ing-fecha"
    );


  const tipoInput =
    document.getElementById(
      "ing-tipo"
    );


  const observacionInput =
    document.getElementById(
      "ing-observacion"
    );


  const proyectoId =
    select
      ? select.value
      : "";


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


  const tipo =
    tipoInput
      ? tipoInput.value
      : "Otro";


  const observacion =
    observacionInput
      ? observacionInput.value.trim()
      : "";


  if (!proyectoId) {

    alert(
      "Selecciona un proyecto."
    );

    return;

  }


  if (monto <= 0) {

    alert(
      "Ingresa un monto válido."
    );

    return;

  }


  if (!fecha) {

    alert(
      "Selecciona la fecha del cobro."
    );

    return;

  }


  const proyecto =
    proyectos.find(
      p => p.id === proyectoId
    );


  if (!proyecto) {

    alert(
      "No se encontró el proyecto."
    );

    return;

  }


  try {

    await db
      .collection("ingresos")
      .add({

        proyectoId,

        codigo:
          proyecto.codigo || "",

        cliente:
          proyecto.cliente || "",

        mueble:
          proyecto.mueble || "",

        monto,

        tipo,

        fecha,

        observacion,

        creadoEn:
          firebase.firestore.FieldValue.serverTimestamp()

      });


    alert(
      "Ingreso registrado correctamente."
    );


    if (montoInput)
      montoInput.value = "";


    if (observacionInput)
      observacionInput.value = "";


    await cargarGestionIngresos();


  } catch (error) {

    console.error(
      "Error registrando ingreso:",
      error
    );

    alert(
      "No se pudo registrar el ingreso. Verifica las Rules de Firestore."
    );

  }

}


// ============================================================
// 16. RENDER INGRESOS
// ============================================================

function renderIngresos() {

  const lista =
    document.getElementById(
      "lista-ingresos"
    );


  if (!lista)
    return;


  const filtro =
    document.getElementById(
      "filtro-ingresos-mes"
    );


  const mes =
    filtro
      ? filtro.value
      : "";


  const movimientos =
    ingresos.filter(
      ingreso => {

        if (!mes)
          return true;

        return (
          ingreso.fecha &&
          ingreso.fecha.startsWith(
            mes
          )
        );

      }
    );


  let totalIngresado = 0;

  let totalAdelantos = 0;

  let totalSaldos = 0;


  movimientos.forEach(
    ingreso => {

      const monto =
        Number(
          ingreso.monto
        ) || 0;


      totalIngresado +=
        monto;


      if (
        ingreso.tipo ===
        "Adelanto"
      ) {

        totalAdelantos +=
          monto;

      }


      if (
        ingreso.tipo ===
        "Saldo"
      ) {

        totalSaldos +=
          monto;

      }

    }
  );


  // ==========================================================
  // TOTAL CONTRATADO DEL MES
  // ==========================================================

  let totalContratado = 0;


  proyectos.forEach(
    proyecto => {

      const fecha =
        proyecto.fechaEntrega ||
        "";


      if (
        !mes ||
        fecha.startsWith(mes)
      ) {

        totalContratado +=
          Number(
            proyecto.presupuesto
          ) || 0;

      }

    }
  );


  const contratadoEl =
    document.getElementById(
      "ing-total-contratado"
    );


  const adelantosEl =
    document.getElementById(
      "ing-total-adelantos"
    );


  const saldosEl =
    document.getElementById(
      "ing-total-saldos"
    );


  const ingresadoEl =
    document.getElementById(
      "ing-total-ingresado"
    );


  if (contratadoEl)
    contratadoEl.innerText =
      `Bs. ${formatearMonto(totalContratado)}`;


  if (adelantosEl)
    adelantosEl.innerText =
      `Bs. ${formatearMonto(totalAdelantos)}`;


  if (saldosEl)
    saldosEl.innerText =
      `Bs. ${formatearMonto(totalSaldos)}`;


  if (ingresadoEl)
    ingresadoEl.innerText =
      `Bs. ${formatearMonto(totalIngresado)}`;


  // ==========================================================
  // LISTA
  // ==========================================================

  lista.innerHTML = "";


  if (movimientos.length === 0) {

    lista.innerHTML = `

      <div
        style="
          padding:20px;
          text-align:center;
          color:#888;
          background:rgba(255,255,255,.03);
          border-radius:8px;
        "
      >

        No hay ingresos registrados
        para este mes.

      </div>

    `;

    return;

  }


  movimientos
    .sort(
      (a,b) =>
        (b.fecha || "")
          .localeCompare(
            a.fecha || ""
          )
    )
    .forEach(
      ingreso => {

        const item =
          document.createElement(
            "div"
          );


        item.style.cssText = `

          background:rgba(255,255,255,.04);

          border:1px solid
          rgba(255,255,255,.08);

          border-radius:9px;

          padding:10px;

          margin-bottom:7px;

        `;


        item.innerHTML = `

          <div
            style="
              display:flex;
              justify-content:space-between;
              gap:10px;
            "
          >

            <div>

              <strong>
                ${ingreso.codigo || ""}
              </strong>

              <div
                style="
                  color:#aaa;
                  font-size:.8rem;
                  margin-top:3px;
                "
              >

                ${ingreso.cliente || ""}

                -
                
                ${ingreso.mueble || ""}

              </div>

            </div>


            <strong
              style="
                color:#10b981;
                white-space:nowrap;
              "
            >

              Bs.
              ${formatearMonto(
                ingreso.monto
              )}

            </strong>

          </div>


          <div
            style="
              display:flex;
              justify-content:space-between;
              margin-top:7px;
              font-size:.75rem;
              color:#999;
            "
          >

            <span>
              ${ingreso.tipo || "Ingreso"}
            </span>

            <span>
              ${formatearFecha(
                ingreso.fecha
              )}
            </span>

          </div>


          ${
            ingreso.observacion
              ? `
                <div
                  style="
                    margin-top:5px;
                    color:#aaa;
                    font-size:.75rem;
                  "
                >
                  ${ingreso.observacion}
                </div>
              `
              : ""
          }

        `;


        lista.appendChild(
          item
        );

      }
    );

}


// ============================================================
// 17. FORMATEAR FECHA
// ============================================================

function formatearFecha(
  fecha
) {

  if (!fecha)
    return "";


  const partes =
    fecha.split("-");


  if (
    partes.length !== 3
  )
    return fecha;


  return `${partes[2]}/${partes[1]}/${partes[0]}`;

}


// ============================================================
// 18. EXPORTAR PDF
// ============================================================

function exportarIngresosPDF() {

  if (
    !esAdmin
  ) {

    alert(
      "Solo el administrador puede exportar este reporte."
    );

    return;

  }


  if (
    typeof window.jspdf ===
    "undefined"
  ) {

    alert(
      "No se pudo cargar el sistema de PDF."
    );

    return;

  }


  const filtro =
    document.getElementById(
      "filtro-ingresos-mes"
    );


  const mes =
    filtro
      ? filtro.value
      : "";


  if (!mes) {

    alert(
      "Selecciona un mes para generar el reporte."
    );

    return;

  }


  const movimientos =
    ingresos
      .filter(
        ingreso =>
          ingreso.fecha &&
          ingreso.fecha.startsWith(
            mes
          )
      )
      .sort(
        (a,b) =>
          (a.fecha || "")
            .localeCompare(
              b.fecha || ""
            )
      );


  let totalIngresado = 0;

  let totalAdelantos = 0;

  let totalSaldos = 0;


  movimientos.forEach(
    ingreso => {

      const monto =
        Number(
          ingreso.monto
        ) || 0;


      totalIngresado +=
        monto;


      if (
        ingreso.tipo ===
        "Adelanto"
      )
        totalAdelantos +=
          monto;


      if (
        ingreso.tipo ===
        "Saldo"
      )
        totalSaldos +=
          monto;

    }
  );


  let totalContratado = 0;


  proyectos.forEach(
    proyecto => {

      if (
        proyecto.fechaEntrega &&
        proyecto.fechaEntrega
          .startsWith(mes)
      ) {

        totalContratado +=
          Number(
            proyecto.presupuesto
          ) || 0;

      }

    }
  );


  const saldoPendiente =
    totalContratado -
    totalIngresado;


  const {
    jsPDF
  } =
    window.jspdf;


  const doc =
    new jsPDF();


  // ==========================================================
  // ENCABEZADO
  // ==========================================================

  doc.setFontSize(
    20
  );

  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.text(
    "HN MUEBLES",
    20,
    20
  );


  doc.setFontSize(
    12
  );


  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.text(
    "REPORTE MENSUAL DE INGRESOS",
    20,
    29
  );


  doc.setFontSize(
    10
  );


  doc.text(
    `Periodo: ${mes}`,
    20,
    37
  );


  doc.text(
    `Generado: ${formatearFecha(
      new Date()
        .toISOString()
        .substring(0,10)
    )}`,
    20,
    43
  );


  // ==========================================================
  // RESUMEN
  // ==========================================================

  let y = 55;


  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.text(
    "RESUMEN FINANCIERO",
    20,
    y
  );


  y += 8;


  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.text(
    `Total contratado: Bs. ${formatearMonto(totalContratado)}`,
    20,
    y
  );


  y += 6;


  doc.text(
    `Adelantos recibidos: Bs. ${formatearMonto(totalAdelantos)}`,
    20,
    y
  );


  y += 6;


  doc.text(
    `Saldos cobrados: Bs. ${formatearMonto(totalSaldos)}`,
    20,
    y
  );


  y += 6;


  doc.text(
    `TOTAL INGRESADO: Bs. ${formatearMonto(totalIngresado)}`,
    20,
    y
  );


  y += 6;


  doc.text(
    `Pendiente: Bs. ${formatearMonto(
      Math.max(
        0,
        saldoPendiente
      )
    )}`,
    20,
    y
  );


  // ==========================================================
  // TABLA
  // ==========================================================

  y += 15;


  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.text(
    "DETALLE DE MOVIMIENTOS",
    20,
    y
  );


  y += 8;


  doc.setFontSize(
    8
  );


  doc.text(
    "Fecha",
    20,
    y
  );

  doc.text(
    "Codigo",
    43,
    y
  );

  doc.text(
    "Cliente",
    68,
    y
  );

  doc.text(
    "Tipo",
    125,
    y
  );

  doc.text(
    "Monto",
    160,
    y
  );


  y += 5;


  doc.line(
    20,
    y,
    190,
    y
  );


  y += 6;


  doc.setFont(
    "helvetica",
    "normal"
  );


  movimientos.forEach(
    ingreso => {

      if (y > 275) {

        doc.addPage();

        y = 20;

      }


      const cliente =
        (ingreso.cliente || "")
          .substring(
            0,
            28
          );


      doc.text(
        formatearFecha(
          ingreso.fecha
        ),
        20,
        y
      );


      doc.text(
        (ingreso.codigo || "")
          .substring(
            0,
            12
          ),
        43,
        y
      );


      doc.text(
        cliente,
        68,
        y
      );


      doc.text(
        ingreso.tipo || "",
        125,
        y
      );


      doc.text(
        `Bs. ${formatearMonto(
          ingreso.monto
        )}`,
        160,
        y
      );


      y += 6;

    }
  );


  // ==========================================================
  // PIE
  // ==========================================================

  y += 8;


  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.text(
    `TOTAL INGRESADO: Bs. ${formatearMonto(totalIngresado)}`,
    20,
    y
  );


  doc.setFont(
    "helvetica",
    "normal"
  );


  y += 15;


  doc.setFontSize(
    8
  );


  doc.text(
    "HN Muebles - Documento interno de control financiero.",
    20,
    y
  );


  // ==========================================================
  // DESCARGAR
  // ==========================================================

  doc.save(
    `HN-Muebles-Ingresos-${mes}.pdf`
  );

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


  let numero =
    p.telefono
      .toString()
      .replace(
        /\D/g,
        ""
      );


  if (
    !numero.startsWith("591") &&
    numero.length === 8
  ) {

    numero =
      "591" + numero;

  }


  const linkBase =
    window.location.origin +
    window.location.pathname;


  const link =
    `${linkBase}?codigo=${p.codigo}`;


  const mensaje =

`Hola *${p.cliente}* 👋, desde *HN Muebles* te informamos el estado de tu proyecto *"${p.mueble}"*:

🛠️ *Estado:* ${p.estado}

📊 *Progreso:* ${p.progreso}%

📅 *Fecha estimada de entrega:* ${
  p.fechaEntrega
    ? formatearFecha(
        p.fechaEntrega
      )
    : "Por coordinar"
}

🔍 *Consulta el estado de tu proyecto:*
${link}`;


  window.open(
    `https://wa.me/${numero}?text=${encodeURIComponent(
      mensaje
    )}`,
    "_blank"
  );

}
