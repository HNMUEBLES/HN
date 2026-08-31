// ============================================================
// HN MUEBLES - SCRIPT PRINCIPAL
// Firebase Authentication + Firestore + Storage
// Proyectos + Ingresos + Portafolio
// ============================================================


// ============================================================
// 1. FIREBASE
// ============================================================

const firebaseConfig = {

  apiKey: "AIzaSyCLrVUpGCTxFxuMR0ATlwj2t3osSP0dD7Y",

  authDomain:
    "hn-muebles.firebaseapp.com",

  projectId:
    "hn-muebles",

  storageBucket:
    "hn-muebles.firebasestorage.app",

  messagingSenderId:
    "175601256381",

  appId:
    "1:175601256381:web:db2031a56faa87a02bf4d4",

  measurementId:
    "G-8PJGERB67Q"

};


firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

const auth = firebase.auth();

const storage = firebase.storage();

const EMAIL_ADMIN =
  "hn24muebles@gmail.com";


let proyectos = [];

let ingresos = [];

let esAdmin = false;

let portafolio = [];


// ============================================================
// 2. UTILIDADES
// ============================================================

function formatearMonto(valor) {

  const num = Number(valor) || 0;

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
    document.getElementById("nuevo-codigo");

  if (input) {

    input.value =
      generarCodigoAleatorio();

  }

}


function copiarCodigoAlPortapapeles(codigo) {

  navigator.clipboard
    .writeText(codigo)
    .then(() => {

      const boton =
        document.querySelector(
          `[data-copy-code="${codigo}"]`
        );

      if (boton) {

        const textoOriginal =
          boton.innerText;

        boton.innerText =
          "Copiado ✓";

        setTimeout(() => {

          boton.innerText =
            textoOriginal;

        }, 1200);

      }

    })
    .catch(error => {

      console.error(
        "Error copiando:",
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
    (user.email || "")
      .trim()
      .toLowerCase();


  const emailAdmin =
    EMAIL_ADMIN
      .trim()
      .toLowerCase();


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

  }

  catch (error) {

    console.error(
      "Error cargando panel:",
      error
    );

  }

});


// ============================================================
// 4. ADMIN
// ============================================================

function mostrarPanelAdministrador() {

  const login =
    document.getElementById("admin-login");

  const panel =
    document.getElementById("admin-panel");


  if (login)
    login.classList.add("hidden");


  if (panel)
    panel.classList.remove("hidden");

}


function ocultarPanelAdministrador() {

  const login =
    document.getElementById("admin-login");

  const panel =
    document.getElementById("admin-panel");


  if (panel)
    panel.classList.add("hidden");


  if (login)
    login.classList.remove("hidden");

}


// ============================================================
// 5. DOM READY
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

          const passwordInput =
            document.getElementById("input-pass");

          const errorMsg =
            document.getElementById("login-error-msg");

          const boton =
            formLogin.querySelector(
              'button[type="submit"]'
            );


          const email =
            emailInput?.value
              .trim()
              .toLowerCase();

          const password =
            passwordInput?.value || "";


          if (errorMsg) {

            errorMsg.textContent = "";

            errorMsg.classList.add("hidden");

          }


          if (!email || !password) {

            if (errorMsg) {

              errorMsg.textContent =
                "Ingresa tu correo y contraseña.";

              errorMsg.classList.remove("hidden");

            }

            return;

          }


          try {

            if (boton) {

              boton.disabled = true;

              boton.dataset.textoOriginal =
                boton.innerText;

              boton.innerText =
                "Ingresando...";

            }


            await auth.signInWithEmailAndPassword(
              email,
              password
            );


            if (passwordInput) {

              passwordInput.value = "";

            }

          }

          catch (error) {

            console.error(
              "ERROR LOGIN:",
              error
            );


            let mensaje =
              "No se pudo iniciar sesión.";


            switch (error.code) {

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

              errorMsg.classList.remove("hidden");

            }

          }

          finally {

            if (boton) {

              boton.disabled = false;

              boton.innerText =
                boton.dataset.textoOriginal ||
                "Ingresar";

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


      if (totalPreview)
        totalPreview.innerText =
          `Bs. ${formatearMonto(total)}`;


      if (adelantoPreview)
        adelantoPreview.innerText =
          `Bs. ${formatearMonto(adelanto)}`;


      if (saldoPreview)
        saldoPreview.innerText =
          `Bs. ${formatearMonto(saldo)}`;

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
              .toUpperCase()
            ||
            generarCodigoAleatorio();


          const cliente =
            document.getElementById(
              "nuevo-cliente"
            )?.value.trim()
            || "";


          const mueble =
            document.getElementById(
              "nuevo-mueble"
            )?.value.trim()
            || "";


          const telefono =
            document.getElementById(
              "nuevo-telefono"
            )?.value.trim()
            || "";


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
              presupuesto - adelanto,
              0
            );


          const proyectoRef =
            db.collection("proyectos").doc();


          const ingresoRef =
            db.collection("ingresos").doc();


          const publicoRef =
            db
              .collection("proyectos_publicos")
              .doc(proyectoRef.id);


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
              firebase.firestore.FieldValue.serverTimestamp()

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
              firebase.firestore.FieldValue.serverTimestamp(),

            fechaUltimoPago:
              adelanto > 0
                ? firebase.firestore.FieldValue.serverTimestamp()
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
            ).value = "";


            document.getElementById(
              "nuevo-mueble"
            ).value = "";


            document.getElementById(
              "nuevo-telefono"
            ).value = "";


            document.getElementById(
              "nuevo-presupuesto"
            ).value = "";


            document.getElementById(
              "nuevo-adelanto"
            ).value = "";


            document.getElementById(
              "nuevo-fecha"
            ).value = "";


            calcularSaldoNuevo();


            await cargarProyectosDesdeNube();

            await cargarIngresosDesdeNube();


            renderProyectosAdmin();

            renderGestionIngresos();


            alert(
              "Proyecto guardado correctamente."
            );

          }

          catch (error) {

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


    // ========================================================
    // FILTRO INGRESOS
    // ========================================================

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
        ).padStart(2,"0")}`;


      filtroIngresos.addEventListener(
        "change",
        function () {

          renderGestionIngresos();

        }
      );

    }


    // ========================================================
    // PORTAFOLIO
    // ========================================================

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


// ============================================================
// 6. MENSAJE
// ============================================================

function mostrarMensajeInterno(
  mensaje,
  error = false
) {

  console.log(
    error ? "ERROR:" : "OK:",
    mensaje
  );

}


// ============================================================
// 7. CERRAR SESIÓN
// ============================================================

async function cerrarSesionAdmin() {

  try {

    await auth.signOut();

    esAdmin = false;

    ocultarPanelAdministrador();


    const modalIngresos =
      document.getElementById(
        "modal-ingresos"
      );


    const modalPortfolio =
      document.getElementById(
        "modal-portafolio"
      );


    modalIngresos?.classList.add(
      "hidden"
    );


    modalPortfolio?.classList.add(
      "hidden"
    );


    irInicio();

  }

  catch (error) {

    console.error(
      "Error cerrando sesión:",
      error
    );

  }

}


// ============================================================
// 8. PROYECTOS
// ============================================================

async function cargarProyectosDesdeNube() {

  if (
    !auth.currentUser ||
    !esAdmin
  ) {

    return;

  }


  try {

    const snapshot =
      await db
        .collection("proyectos")
        .get();


    proyectos = [];


    snapshot.forEach(doc => {

      proyectos.push({

        id:
          doc.id,

        ...doc.data()

      });

    });

  }

  catch (error) {

    console.error(
      "Error cargando proyectos:",
      error
    );

  }

}


// ============================================================
// 9. INGRESOS
// ============================================================

async function cargarIngresosDesdeNube() {

  if (
    !auth.currentUser ||
    !esAdmin
  ) {

    return;

  }


  try {

    const snapshot =
      await db
        .collection("ingresos")
        .get();


    ingresos = [];


    snapshot.forEach(doc => {

      ingresos.push({

        id:
          doc.id,

        ...doc.data()

      });

    });

  }

  catch (error) {

    console.error(
      "Error cargando ingresos:",
      error
    );

  }

}


// ============================================================
// 10. BÚSQUEDA PÚBLICA
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
        .collection("proyectos_publicos")
        .where(
          "codigo",
          "==",
          codigo
        )
        .limit(1)
        .get();


    if (snapshot.empty) {

      resultBox?.classList.add(
        "hidden"
      );

      errorMsg?.classList.remove(
        "hidden"
      );

      return;

    }


    const data =
      snapshot.docs[0].data();


    errorMsg?.classList.add(
      "hidden"
    );

    resultBox?.classList.remove(
      "hidden"
    );


    document.getElementById(
      "res-codigo"
    ).innerText =
      data.codigo || "";


    document.getElementById(
      "res-mueble"
    ).innerText =
      data.mueble || "";


    document.getElementById(
      "res-cliente"
    ).innerText =
      `Cliente: ${data.cliente || ""}`;


    document.getElementById(
      "res-estado"
    ).innerText =
      data.estado || "";


    document.getElementById(
      "res-porcentaje"
    ).innerText =
      `${data.progreso || 0}%`;

  }

  catch (error) {

    console.error(
      "Error búsqueda pública:",
      error
    );


    resultBox?.classList.add(
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
// 11. RENDER PROYECTOS ADMIN
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


  if (!container) return;


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
        etapas.map(
          (estado,idx) => {

            const activo =
              p.estado === estado;


            return `
              <button
                type="button"
                onclick="cambiarEstadoPorId(
                  '${p.id}',
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

          }
        ).join("");


      card.innerHTML = `

        <div id="info-view-${index}">

          <div style="
            display:flex;
            justify-content:space-between;
            gap:10px;
            flex-wrap:wrap;
          ">

            <div style="flex:1;min-width:260px;">

              <span style="
                background:#f59e0b;
                color:#000;
                padding:.2rem .6rem;
                border-radius:4px;
                font-weight:bold;
                font-size:.85rem;
              ">
                ${p.codigo || ""}
              </span>

              <strong style="margin-left:.4rem;">
                ${p.mueble || ""}
              </strong>

              <p style="
                margin:.4rem 0;
                color:#a3a3a3;
                font-size:.85rem;
              ">
                Cliente:
                ${p.cliente || ""}
                |
                Tel:
                ${p.telefono || "Sin registrar"}
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
                grid-template-columns:repeat(3,minmax(0,1fr));
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
                    Bs. ${formatearMonto(presupuesto)}
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
                    Bs. ${formatearMonto(adelanto)}
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
                    Bs. ${formatearMonto(saldo)}
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

    }
  );

}


// ============================================================
// 12. CAMBIAR ESTADO
// ============================================================

async function cambiarEstadoPorId(
  id,
  etapaIdx,
  progreso
) {

  if (
    !esAdmin ||
    !auth.currentUser
  ) return;


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
      db
        .collection("proyectos")
        .doc(id);


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

  }

  catch (error) {

    console.error(
      "Error estado:",
      error
    );

  }

}


// ============================================================
// 13. ELIMINAR PROYECTO
// ============================================================

async function eliminarProyecto(id) {

  if (
    !esAdmin ||
    !auth.currentUser
  ) return;


  if (
    !confirm(
      "¿Seguro que quieres eliminar este proyecto?"
    )
  ) return;


  try {

    const proyecto =
      proyectos.find(
        p => p.id === id
      );


    const batch =
      db.batch();


    batch.delete(
      db
        .collection("proyectos")
        .doc(id)
    );


    if (proyecto) {

      const publicSnap =
        await db
          .collection("proyectos_publicos")
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

  }

  catch (error) {

    console.error(
      "Error eliminando:",
      error
    );

  }

}


// ============================================================
// 14. EDITAR PROYECTO
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
      gap:7px;
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


// ============================================================
// 15. GUARDAR EDICIÓN
// ============================================================

async function guardarEdicionInline(
  id,
  index
) {

  if (
    !esAdmin ||
    !auth.currentUser
  ) return;


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

      const ingreso =
        ingresoDoc.data();


      const pagosFinales =
        Number(
          ingreso.pagosFinales
        ) || 0;


      const cobrado =
        adelanto +
        pagosFinales;


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

  }

  catch (error) {

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
// 16. GESTIÓN INGRESOS
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


          if (!fecha)
            return true;


          const mes =
            `${fecha.getFullYear()}-${String(
              fecha.getMonth() + 1
            ).padStart(2,"0")}`;


          return mes === filtro;

        }
      );

  }


  let totalCobrado = 0;

  let totalPendiente = 0;


  lista.forEach(
    ingreso => {

      totalCobrado +=
        Number(
          ingreso.cobrado
        ) || 0;


      totalPendiente +=
        Number(
          ingreso.pendiente
        ) || 0;

    }
  );


  document.getElementById(
    "ing-resumen-proyectos"
  ).innerText =
    lista.length;


  document.getElementById(
    "ing-resumen-cobrado"
  ).innerText =
    `Bs. ${formatearMonto(totalCobrado)}`;


  document.getElementById(
    "ing-resumen-pendiente"
  ).innerText =
    `Bs. ${formatearMonto(totalPendiente)}`;


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
              ${ingreso.cliente || ""}
            </strong>

            <div style="
              color:#a3a3a3;
              font-size:.75rem;
            ">
              ${ingreso.codigo || ""}
              ·
              ${ingreso.mueble || ""}
            </div>

          </div>

          <div style="
            color:#38bdf8;
            font-weight:bold;
            font-size:.85rem;
          ">
            Total:
            Bs. ${formatearMonto(presupuesto)}
          </div>

        </div>


        <div style="
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:5px;
          margin-top:8px;
        ">

          <div class="summary-box amber">
            Adelanto
            <strong>
              Bs. ${formatearMonto(adelanto)}
            </strong>
          </div>

          <div class="summary-box green">
            Cobrado
            <strong>
              Bs. ${formatearMonto(cobrado)}
            </strong>
          </div>

          <div class="summary-box red">
            Pendiente
            <strong>
              Bs. ${formatearMonto(pendiente)}
            </strong>
          </div>

        </div>


        ${
          pendiente > 0

          ?

          `
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

          :

          `
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


// ============================================================
// 17. REGISTRAR PAGO
// ============================================================

async function registrarPago(
  ingresoId
) {

  if (
    !esAdmin ||
    !auth.currentUser
  ) return;


  const input =
    document.getElementById(
      `pago-${ingresoId}`
    );


  const monto =
    Number(input?.value) || 0;


  if (monto <= 0)
    return;


  const ingreso =
    ingresos.find(
      i => i.id === ingresoId
    );


  if (!ingreso)
    return;


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


  if (pago <= 0)
    return;


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

  }

  catch (error) {

    console.error(
      "Error registrando pago:",
      error
    );

  }

}


```js
// ============================================================
// 18. EXPORTAR PDF - REPORTE PROFESIONAL
// ============================================================

function exportarIngresosPDF() {

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

    console.error(
      "jsPDF no disponible."
    );

    alert(
      "No se pudo generar el PDF porque jsPDF no está disponible."
    );

    return;

  }


  // ==========================================================
  // OBTENER INGRESOS DEL MES
  // ==========================================================

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
      orientation: "portrait",
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


  // ==========================================================
  // COLORES DEL REPORTE
  // ==========================================================

  const NEGRO = [25, 25, 25];

  const GRIS =
    [100, 100, 100];

  const GRIS_CLARO =
    [235, 235, 235];

  const BLANCO =
    [255, 255, 255];

  const DORADO =
    [156, 113, 81];

  const VERDE =
    [34, 139, 94];

  const ROJO =
    [190, 65, 65];

  const AZUL =
    [45, 110, 150];


  // ==========================================================
  // FECHA DE GENERACIÓN
  // ==========================================================

  const ahora =
    new Date();


  const fechaGeneracion =
    `${String(
      ahora.getDate()
    ).padStart(2, "0")}/${
      String(
        ahora.getMonth() + 1
      ).padStart(2, "0")
    }/${ahora.getFullYear()}`;


  // ==========================================================
  // LOGO
  // ==========================================================

  // Si existe logo.png en la misma carpeta,
  // intentamos cargarlo automáticamente.

  const logo =
    new Image();


  logo.src =
    "logo.png";


  let logoCargado = false;


  try {

    logoCargado =
      logo.complete &&
      logo.naturalWidth > 0;

  }

  catch (error) {

    logoCargado = false;

  }


  // ==========================================================
  // ENCABEZADO
  // ==========================================================

  // Fondo superior

  doc.setFillColor(
    ...NEGRO
  );

  doc.rect(
    0,
    0,
    210,
    38,
    "F"
  );


  // Línea decorativa

  doc.setFillColor(
    ...DORADO
  );

  doc.rect(
    0,
    36,
    210,
    2,
    "F"
  );


  // Logo

  if (logoCargado) {

    try {

      doc.addImage(
        logo,
        "PNG",
        14,
        8,
        28,
        20
      );

    }

    catch (error) {

      console.warn(
        "No se pudo insertar el logo:",
        error
      );

    }

  }


  // Nombre empresa

  doc.setTextColor(
    ...BLANCO
  );


  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.setFontSize(
    18
  );


  doc.text(
    "HN MUEBLES",
    logoCargado ? 47 : 14,
    16
  );


  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.setFontSize(
    8
  );


  doc.setTextColor(
    210,
    210,
    210
  );


  doc.text(
    "DISEÑO Y FABRICACIÓN A MEDIDA",
    logoCargado ? 47 : 14,
    23
  );


  // Título del reporte

  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.setFontSize(
    10
  );


  doc.setTextColor(
    ...DORADO
  );


  doc.text(
    "GESTIÓN DE INGRESOS",
    196,
    15,
    {
      align: "right"
    }
  );


  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.setFontSize(
    8
  );


  doc.setTextColor(
    210,
    210,
    210
  );


  doc.text(
    `${nombreMes} ${anio}`,
    196,
    22,
    {
      align: "right"
    }
  );


  // ==========================================================
  // SUBENCABEZADO
  // ==========================================================

  doc.setTextColor(
    ...NEGRO
  );


  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.setFontSize(
    13
  );


  doc.text(
    "Reporte financiero mensual",
    14,
    51
  );


  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.setFontSize(
    8
  );


  doc.setTextColor(
    ...GRIS
  );


  doc.text(
    `Período: ${nombreMes} ${anio}`,
    14,
    57
  );


  doc.text(
    `Generado el: ${fechaGeneracion}`,
    196,
    57,
    {
      align: "right"
    }
  );


  // ==========================================================
  // CALCULAR TOTALES
  // ==========================================================

  let totalProyecto = 0;

  let totalAdelanto = 0;

  let totalCobrado = 0;

  let totalPendiente = 0;


  lista.forEach(
    ingreso => {

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


      totalProyecto +=
        total;


      totalAdelanto +=
        adelanto;


      totalCobrado +=
        cobrado;


      totalPendiente +=
        pendiente;

    }
  );


  // ==========================================================
  // TARJETAS RESUMEN
  // ==========================================================

  const tarjetas = [

    {
      titulo:
        "PROYECTOS",

      valor:
        String(lista.length),

      color:
        AZUL
    },

    {
      titulo:
        "CONTRATADO",

      valor:
        `Bs. ${formatearMonto(
          totalProyecto
        )}`,

      color:
        DORADO
    },

    {
      titulo:
        "COBRADO",

      valor:
        `Bs. ${formatearMonto(
          totalCobrado
        )}`,

      color:
        VERDE
    },

    {
      titulo:
        "PENDIENTE",

      valor:
        `Bs. ${formatearMonto(
          totalPendiente
        )}`,

      color:
        ROJO
    }

  ];


  const tarjetaY =
    65;


  const tarjetaW =
    43.5;


  const tarjetaH =
    25;


  tarjetas.forEach(
    (tarjeta, index) => {

      const x =
        14 +
        index * 45.5;


      // Fondo

      doc.setFillColor(
        248,
        248,
        248
      );


      doc.roundedRect(
        x,
        tarjetaY,
        tarjetaW,
        tarjetaH,
        2.5,
        2.5,
        "F"
      );


      // Barra superior

      doc.setFillColor(
        ...tarjeta.color
      );


      doc.roundedRect(
        x,
        tarjetaY,
        tarjetaW,
        2.5,
        2.5,
        2.5,
        "F"
      );


      doc.setTextColor(
        ...GRIS
      );


      doc.setFont(
        "helvetica",
        "bold"
      );


      doc.setFontSize(
        6.5
      );


      doc.text(
        tarjeta.titulo,
        x + 4,
        tarjetaY + 9
      );


      doc.setTextColor(
        ...NEGRO
      );


      doc.setFont(
        "helvetica",
        "bold"
      );


      doc.setFontSize(
        tarjeta.titulo === "PROYECTOS"
          ? 15
          : 9.5
      );


      doc.text(
        tarjeta.valor,
        x + 4,
        tarjetaY + 18
      );

    }
  );


  // ==========================================================
  // TABLA
  // ==========================================================

  const filas =
    lista.map(
      ingreso => {

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


        return [

          ingreso.codigo ||
            "-",

          ingreso.cliente ||
            "-",

          ingreso.mueble ||
            "-",

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

      }
    );


  const tablaY =
    98;


  if (
    typeof doc.autoTable ===
    "function"
  ) {

    doc.autoTable({

      startY:
        tablaY,

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

      body:
        filas,

      theme:
        "grid",

      styles: {

        font:
          "helvetica",

        fontSize:
          7.5,

        textColor:
          NEGRO,

        cellPadding:
          3,

        lineColor:
          [220, 220, 220],

        lineWidth:
          0.2,

        valign:
          "middle"

      },

      headStyles: {

        fillColor:
          NEGRO,

        textColor:
          BLANCO,

        fontStyle:
          "bold",

        fontSize:
          7,

        halign:
          "center",

        cellPadding:
          3.5

      },

      alternateRowStyles: {

        fillColor:
          [248, 248, 248]

      },

      columnStyles: {

        0: {
          cellWidth:
            20,
          halign:
            "center"
        },

        1: {
          cellWidth:
            32
        },

        2: {
          cellWidth:
            39
        },

        3: {
          cellWidth:
            23,
          halign:
            "right"
        },

        4: {
          cellWidth:
            23,
          halign:
            "right"
        },

        5: {
          cellWidth:
            23,
          halign:
            "right"
        },

        6: {
          cellWidth:
            23,
          halign:
            "right"
        }

      },

      didParseCell:
        function(data) {

          if (
            data.section ===
            "body"
          ) {

            // Pendiente

            if (
              data.column.index === 6
            ) {

              data.cell.styles.textColor =
                ROJO;

            }

            // Cobrado

            if (
              data.column.index === 5
            ) {

              data.cell.styles.textColor =
                VERDE;

            }

          }

        },

      didDrawPage:
        function() {

          // Encabezado de páginas
          // adicionales

          if (
            doc.internal.getNumberOfPages() > 1
          ) {

            doc.setFillColor(
              ...NEGRO
            );

            doc.rect(
              0,
              0,
              210,
              10,
              "F"
            );


            doc.setTextColor(
              ...BLANCO
            );


            doc.setFont(
              "helvetica",
              "bold"
            );


            doc.setFontSize(
              7
            );


            doc.text(
              "HN MUEBLES",
              14,
              6.5
            );


            doc.setFont(
              "helvetica",
              "normal"
            );


            doc.text(
              `Gestión de Ingresos · ${nombreMes} ${anio}`,
              196,
              6.5,
              {
                align:
                  "right"
              }
            );

          }

        }

    });

  }


  // ==========================================================
  // BLOQUE FINAL DE TOTALES
  // ==========================================================

  let finalY =
    doc.lastAutoTable
      ? doc.lastAutoTable.finalY + 10
      : tablaY + 20;


  // Si queda poco espacio,
  // crear nueva página.

  if (
    finalY > 250
  ) {

    doc.addPage();

    finalY = 25;

  }


  doc.setFillColor(
    248,
    248,
    248
  );


  doc.roundedRect(
    14,
    finalY,
    182,
    42,
    3,
    3,
    "F"
  );


  // Título resumen

  doc.setTextColor(
    ...NEGRO
  );


  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.setFontSize(
    10
  );


  doc.text(
    "RESUMEN FINANCIERO",
    20,
    finalY + 8
  );


  // Línea

  doc.setDrawColor(
    ...DORADO
  );


  doc.setLineWidth(
    0.6
  );


  doc.line(
    20,
    finalY + 11,
    190,
    finalY + 11
  );


  // Primera columna

  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.setFontSize(
    8
  );


  doc.setTextColor(
    ...GRIS
  );


  doc.text(
    "Total contratado",
    20,
    finalY + 19
  );


  doc.text(
    "Total adelantos",
    20,
    finalY + 27
  );


  doc.text(
    "Total cobrado",
    20,
    finalY + 35
  );


  // Segunda columna

  doc.setTextColor(
    ...NEGRO
  );


  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.text(
    `Bs. ${formatearMonto(
      totalProyecto
    )}`,
    78,
    finalY + 19,
    {
      align:
        "right"
    }
  );


  doc.text(
    `Bs. ${formatearMonto(
      totalAdelanto
    )}`,
    78,
    finalY + 27,
    {
      align:
        "right"
    }
  );


  doc.setTextColor(
    ...VERDE
  );


  doc.text(
    `Bs. ${formatearMonto(
      totalCobrado
    )}`,
    78,
    finalY + 35,
    {
      align:
        "right"
    }
  );


  // Tercera columna

  doc.setTextColor(
    ...GRIS
  );


  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.text(
    "Total pendiente",
    112,
    finalY + 19
  );


  doc.text(
    "Cantidad de proyectos",
    112,
    finalY + 27
  );


  doc.text(
    "Estado del período",
    112,
    finalY + 35
  );


  // Cuarta columna

  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.setTextColor(
    ...ROJO
  );


  doc.text(
    `Bs. ${formatearMonto(
      totalPendiente
    )}`,
    190,
    finalY + 19,
    {
      align:
        "right"
    }
  );


  doc.setTextColor(
    ...NEGRO
  );


  doc.text(
    String(lista.length),
    190,
    finalY + 27,
    {
      align:
        "right"
    }
  );


  const estadoPeriodo =
    totalPendiente <= 0
      ? "PAGADO"
      : "EN GESTIÓN";


  doc.setTextColor(
    totalPendiente <= 0
      ? ...VERDE
      : ...DORADO
  );


  doc.text(
    estadoPeriodo,
    190,
    finalY + 35,
    {
      align:
        "right"
    }
  );


  // ==========================================================
  // PIE DE PÁGINA
  // ==========================================================

  const paginas =
    doc.internal.getNumberOfPages();


  for (
    let i = 1;
    i <= paginas;
    i++
  ) {

    doc.setPage(i);


    const altura =
      doc.internal.pageSize.height;


    doc.setDrawColor(
      220,
      220,
      220
    );


    doc.setLineWidth(
      0.3
    );


    doc.line(
      14,
      altura - 15,
      196,
      altura - 15
    );


    doc.setFont(
      "helvetica",
      "normal"
    );


    doc.setFontSize(
      7
    );


    doc.setTextColor(
      ...GRIS
    );


    doc.text(
      "HN MUEBLES · Diseño y Fabricación a Medida",
      14,
      altura - 9
    );


    doc.text(
      `Página ${i} de ${paginas}`,
      196,
      altura - 9,
      {
        align:
          "right"
      }
    );

  }


  // ==========================================================
  // GUARDAR
  // ==========================================================

  doc.save(
    `HN-Muebles-Reporte-Ingresos-${filtro}.pdf`
  );

}
```

// ============================================================
// 19. WHATSAPP
// ============================================================

function notificarWhatsApp(index) {

  if (!esAdmin) return;


  const p =
    proyectos[index];


  if (
    !p ||
    !p.telefono
  ) return;


  let numero =
    p.telefono
      .toString()
      .replace(/\D/g,"");


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


  const mensaje =
`Hola *${p.cliente}* 👋, desde *HN Muebles* te informamos el estado de tu proyecto *"${p.mueble}"*:

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
// ============================================================
// PORTAFOLIO
// ============================================================
// ============================================================


// ============================================================
// 20. CARGAR PORTAFOLIO PÚBLICO
// ============================================================

async function cargarPortafolioPublico() {

  const container =
    document.getElementById(
      "portfolio-grid"
    );


  if (!container)
    return;


  try {

    const snapshot =
      await db
        .collection("portafolio")
        .orderBy(
          "creadoEn",
          "desc"
        )
        .get();


    portafolio = [];


    snapshot.forEach(doc => {

      portafolio.push({

        id:
          doc.id,

        ...doc.data()

      });

    });


    renderPortafolioPublico();

  }

  catch (error) {

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


// ============================================================
// 21. RENDER PORTAFOLIO PÚBLICO
// ============================================================

function renderPortafolioPublico() {

  const container =
    document.getElementById(
      "portfolio-grid"
    );


  if (!container)
    return;


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
          Próximamente mostraremos nuestros trabajos aquí.
        </p>

      </div>

    `;

    return;

  }


  portafolio.forEach(
    trabajo => {

      const card =
        document.createElement("article");


      card.className =
        "portfolio-card";


      const media =
        trabajo.media || [];


      const primerMedia =
        media[0];


      let mediaHTML = "";


      if (primerMedia) {

        if (
          primerMedia.tipo === "video"
        ) {

          mediaHTML = `

            <div class="portfolio-media">

              <video
                src="${primerMedia.url}"
                muted
                playsinline
                preload="metadata"
                controls
              ></video>

              <div class="portfolio-video-badge">
                <i class="fa-solid fa-video"></i>
                Video
              </div>

            </div>

          `;

        }

        else {

          mediaHTML = `

            <div class="portfolio-media">

              <img
                src="${primerMedia.url}"
                alt="${trabajo.titulo || "Trabajo HN Muebles"}"
                loading="lazy"
              />

              ${
                media.length > 1
                  ? `
                    <div class="portfolio-video-badge">
                      <i class="fa-solid fa-images"></i>
                      ${media.length} archivos
                    </div>
                  `
                  : ""
              }

            </div>

          `;

        }

      }


      card.innerHTML = `

        ${mediaHTML}

        <div class="portfolio-card-body">

          <div class="portfolio-card-title">
            ${escaparHTML(
              trabajo.titulo || "Proyecto HN Muebles"
            )}
          </div>

          <div class="portfolio-card-description">
            ${escaparHTML(
              trabajo.descripcion || ""
            )}
          </div>

        </div>

      `;


      container.appendChild(card);

    }
  );

}


// ============================================================
// 22. CARGAR PORTAFOLIO ADMIN
// ============================================================

async function cargarPortafolioAdmin() {

  if (
    !esAdmin ||
    !auth.currentUser
  ) return;


  try {

    const snapshot =
      await db
        .collection("portafolio")
        .orderBy(
          "creadoEn",
          "desc"
        )
        .get();


    portafolio = [];


    snapshot.forEach(doc => {

      portafolio.push({

        id:
          doc.id,

        ...doc.data()

      });

    });


    renderPortafolioAdmin();

  }

  catch (error) {

    console.error(
      "Error cargando portafolio admin:",
      error
    );

  }

}


// ============================================================
// 23. PREVIEW ARCHIVOS
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


  if (!container)
    return;


  container.innerHTML = "";


  [...fotos,...videos].forEach(
    archivo => {

      const div =
        document.createElement("div");


      div.className =
        "file-preview";


      const url =
        URL.createObjectURL(archivo);


      if (
        archivo.type.startsWith("video/")
      ) {

        div.innerHTML = `

          <video
            src="${url}"
            muted
          ></video>

          <span class="file-preview-type">
            <i class="fa-solid fa-video"></i>
            Video
          </span>

        `;

      }

      else {

        div.innerHTML = `

          <img
            src="${url}"
            alt=""
          >

          <span class="file-preview-type">
            <i class="fa-solid fa-image"></i>
            Foto
          </span>

        `;

      }


      container.appendChild(div);

    }
  );

}


// ============================================================
// 24. PUBLICAR TRABAJO
// ============================================================

async function publicarTrabajoPortafolio(e) {

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
    )?.value.trim()
    || "";


  const descripcion =
    document.getElementById(
      "portfolio-descripcion"
    )?.value.trim()
    || "";


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
    [...fotos,...videos];


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


  // Máximo aproximado por archivo
  const MAX_IMAGEN =
    15 * 1024 * 1024;

  const MAX_VIDEO =
    100 * 1024 * 1024;


  for (
    const archivo of archivos
  ) {

    if (
      archivo.type.startsWith("image/") &&
      archivo.size > MAX_IMAGEN
    ) {

      alert(
        `La imagen "${archivo.name}" supera los 15 MB.`
      );

      return;

    }


    if (
      archivo.type.startsWith("video/") &&
      archivo.size > MAX_VIDEO
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

      boton.disabled = true;

      boton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo...';

    }


    progressContainer?.classList.remove(
      "hidden"
    );


    const media =
      [];


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


      const tipo =
        archivo.type.startsWith("video/")
          ? "video"
          : "imagen";


      const extension =
        archivo.name
          .split(".")
          .pop()
          .toLowerCase();


      const nombreSeguro =
        `${Date.now()}_${Math.random()
          .toString(36)
          .substring(2,9)}.${extension}`;


      const ruta =
        `portafolio/${auth.currentUser.uid}/${nombreSeguro}`;


      const ref =
        storage.ref(ruta);


      const uploadTask =
        ref.put(
          archivo,
          {
            contentType:
              archivo.type
          }
        );


      await new Promise(
        (resolve,reject) => {

          uploadTask.on(

            "state_changed",

            snapshot => {

              const porcentajeArchivo =
                snapshot.totalBytes
                  ? (
                      snapshot.bytesTransferred /
                      snapshot.totalBytes
                    ) * 100
                  : 0;


              const porcentajeTotal =
                (
                  (i + porcentajeArchivo / 100) /
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

            },

            error => {

              reject(error);

            },

            async () => {

              try {

                const url =
                  await uploadTask.snapshot
                    .ref
                    .getDownloadURL();


                media.push({

                  tipo,
                  url,
                  ruta,
                  nombre:
                    archivo.name

                });


                resolve();

              }

              catch (error) {

                reject(error);

              }

            }

          );

        }
      );

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


    document.getElementById(
      "form-portafolio"
    ).reset();


    document.getElementById(
      "portfolio-files-preview"
    ).innerHTML =
      "";


    progressContainer?.classList.add(
      "hidden"
    );


    if (progressBar)
      progressBar.style.width =
        "0%";


    await cargarPortafolioAdmin();

    await cargarPortafolioPublico();

  }

  catch (error) {

    console.error(
      "ERROR SUBIENDO PORTAFOLIO:",
      error
    );


    alert(
      "No se pudo publicar el trabajo. Revisa las Storage Rules y Firestore Rules."
    );

  }

  finally {

    if (boton) {

      boton.disabled = false;

      boton.innerHTML =
        '<i class="fa-solid fa-cloud-arrow-up"></i> Publicar Trabajo';

    }

  }

}


// ============================================================
// 25. RENDER ADMIN PORTAFOLIO
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


  if (total)
    total.innerText =
      portafolio.length;


  if (!container)
    return;


  container.innerHTML = "";


  if (!portafolio.length) {

    container.innerHTML = `

      <div style="
        text-align:center;
        color:#777;
        padding:25px;
      ">

        Todavía no tienes trabajos publicados.

      </div>

    `;

    return;

  }


  portafolio.forEach(
    trabajo => {

      const card =
        document.createElement("div");


      card.className =
        "portfolio-admin-card";


      const primerMedia =
        trabajo.media?.[0];


      const thumb =
        primerMedia?.url || "";


      card.innerHTML = `

        ${
          primerMedia?.tipo === "video"

          ?

          `
          <video
            src="${thumb}"
            class="portfolio-admin-thumb"
            muted
            preload="metadata"
          ></video>
          `

          :

          `
          <img
            src="${thumb}"
            class="portfolio-admin-thumb"
            alt=""
          >
          `
        }


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
            ${
              trabajo.media?.length || 0
            }
            archivo(s)
          </p>

        </div>


        <div class="portfolio-admin-actions">

          <button
            type="button"
            class="delete-portfolio-btn"
            onclick="eliminarTrabajoPortafolio('${trabajo.id}')"
          >
            <i class="fa-solid fa-trash"></i>
            Eliminar
          </button>

        </div>

      `;


      container.appendChild(card);

    }
  );

}


// ============================================================
// 26. ELIMINAR TRABAJO PORTAFOLIO
// ============================================================

async function eliminarTrabajoPortafolio(
  id
) {

  if (
    !esAdmin ||
    !auth.currentUser
  ) return;


  const trabajo =
    portafolio.find(
      p => p.id === id
    );


  if (!trabajo)
    return;


  if (
    !confirm(
      "¿Seguro que quieres eliminar este trabajo del portafolio?"
    )
  ) return;


  try {

    // Primero eliminamos archivos de Storage
    if (
      trabajo.media &&
      Array.isArray(trabajo.media)
    ) {

      for (
        const archivo
        of trabajo.media
      ) {

        if (archivo.ruta) {

          try {

            await storage
              .ref(archivo.ruta)
              .delete();

          }

          catch (error) {

            console.warn(
              "No se pudo eliminar archivo:",
              archivo.ruta,
              error
            );

          }

        }

      }

    }


    // Luego eliminamos documento
    await db
      .collection("portafolio")
      .doc(id)
      .delete();


    await cargarPortafolioAdmin();

    await cargarPortafolioPublico();


    alert(
      "Trabajo eliminado correctamente."
    );

  }

  catch (error) {

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
// 27. ESCAPAR HTML
// ============================================================

function escaparHTML(texto) {

  const div =
    document.createElement("div");


  div.textContent =
    texto || "";


  return div.innerHTML;

}
