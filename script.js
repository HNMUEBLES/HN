// ============================================================
// HN MUEBLES - SCRIPT PRINCIPAL
// Firebase Authentication + Firestore
// Gestión de Proyectos + Gestión de Ingresos
// ============================================================


// ============================================================
// 1. FIREBASE
// ============================================================

const firebaseConfig = {

  apiKey:
    "AIzaSyCLrVUpGCTxFxuMR0ATlwj2t3osSP0dD7Y",

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


const db =
  firebase.firestore();


const auth =
  firebase.auth();


const EMAIL_ADMIN =
  "hn24muebles@gmail.com";


let proyectos = [];

let ingresos = [];

let esAdmin = false;


// ============================================================
// 2. UTILIDADES
// ============================================================

function formatearMonto(valor) {

  const num =
    Number(valor) || 0;

  return Number.isInteger(num)
    ? num.toString()
    : num.toFixed(2);

}


function generarCodigoAleatorio() {

  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let aleatorio = "";

  for (
    let i = 0;
    i < 5;
    i++
  ) {

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
    top:0,
    behavior:"smooth"
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


        await limpiarIngresosSinProyecto();


        await cargarIngresosDesdeNube();


        renderProyectosAdmin();

        renderGestionIngresos();

      }

      else {

        console.warn(
          "Usuario no autorizado:",
          user.email
        );

        await auth.signOut();

        esAdmin = false;

        ocultarPanelAdministrador();

      }

    }

    else {

      esAdmin = false;

      ocultarPanelAdministrador();

    }

  }
);


// ============================================================
// 4. MOSTRAR / OCULTAR ADMIN
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


  if (login) {

    login.classList.add(
      "hidden"
    );

  }


  if (panel) {

    panel.classList.remove(
      "hidden"
    );

  }

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


  if (panel) {

    panel.classList.add(
      "hidden"
    );

  }


  if (login) {

    login.classList.remove(
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

    // ========================================================
    // LOGIN
    // ========================================================

    const formLogin =
      document.getElementById(
        "form-login"
      );


    if (formLogin) {

      formLogin.addEventListener(
        "submit",
        async function (e) {

          e.preventDefault();


          const email =
            document.getElementById(
              "input-email"
            )?.value.trim();


          const password =
            document.getElementById(
              "input-pass"
            )?.value;


          const errorMsg =
            document.getElementById(
              "login-error-msg"
            );


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
                "NO_AUTORIZADO"
              );

            }


            const passInput =
              document.getElementById(
                "input-pass"
              );


            if (passInput) {

              passInput.value =
                "";

            }

          }

          catch (error) {

            console.error(
              "Error login:",
              error
            );


            const passInput =
              document.getElementById(
                "input-pass"
              );


            if (passInput) {

              passInput.value =
                "";

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
              "NO_AUTORIZADO"
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
    // CÁLCULO MONTOS NUEVO PROYECTO
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

            return;

          }


          if (
            auth.currentUser.email.toLowerCase() !==
            EMAIL_ADMIN.toLowerCase()
          ) {

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
            )?.value
            || "";


          const pendiente =
            Math.max(
              presupuesto -
              adelanto,
              0
            );


          // ==================================================
          // REFERENCIAS
          // ==================================================

          const proyectoRef =
            db
              .collection("proyectos")
              .doc();


          const ingresoRef =
            db
              .collection("ingresos")
              .doc();


          const publicoRef =
            db
              .collection("proyectos_publicos")
              .doc(
                proyectoRef.id
              );


          // ==================================================
          // PROYECTO
          // ==================================================

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


          // ==================================================
          // INGRESO
          // ==================================================

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


          // ==================================================
          // PÚBLICO
          // ==================================================

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


            // =================================================
            // LIMPIAR
            // =================================================

            const idsLimpiar = [

              "nuevo-codigo",

              "nuevo-cliente",

              "nuevo-mueble",

              "nuevo-telefono",

              "nuevo-presupuesto",

              "nuevo-adelanto",

              "nuevo-fecha"

            ];


            idsLimpiar.forEach(
              id => {

                const campo =
                  document.getElementById(
                    id
                  );

                if (campo) {

                  campo.value =
                    "";

                }

              }
            );


            calcularSaldoNuevo();


            // =================================================
            // ACTUALIZAR
            // =================================================

            await cargarProyectosDesdeNube();

            await limpiarIngresosSinProyecto();

            await cargarIngresosDesdeNube();


            renderProyectosAdmin();

            renderGestionIngresos();

          }

          catch (error) {

            console.error(
              "Error creando proyecto:",
              error
            );


            mostrarMensajeInterno(
              "No se pudo guardar. Revisa las Rules de Firestore.",
              true
            );

          }

        }
      );

    }


    // ========================================================
    // MES INGRESOS
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

  }
);


// ============================================================
// 6. LIMPIAR INGRESOS SIN PROYECTO
// ============================================================

async function limpiarIngresosSinProyecto() {

  if (
    !esAdmin ||
    !auth.currentUser
  ) {

    return;

  }


  try {

    // Obtener proyectos existentes

    const proyectosSnap =
      await db
        .collection("proyectos")
        .get();


    const proyectosIds =
      new Set();


    proyectosSnap.forEach(
      doc => {

        proyectosIds.add(
          doc.id
        );

      }
    );


    // Obtener ingresos

    const ingresosSnap =
      await db
        .collection("ingresos")
        .get();


    const batch =
      db.batch();


    let eliminados =
      0;


    ingresosSnap.forEach(
      doc => {

        const data =
          doc.data();


        const proyectoId =
          data.proyectoId;


        // Si el proyecto ya no existe,
        // se elimina su ingreso.

        if (
          !proyectoId ||
          !proyectosIds.has(
            proyectoId
          )
        ) {

          batch.delete(
            doc.ref
          );

          eliminados++;

        }

      }
    );


    if (eliminados > 0) {

      await batch.commit();

      console.log(
        `Se eliminaron ${eliminados} ingresos sin proyecto.`
      );

    }

  }

  catch (error) {

    console.error(
      "Error limpiando ingresos sin proyecto:",
      error
    );

  }

}


// ============================================================
// 7. MENSAJE INTERNO
// ============================================================

function mostrarMensajeInterno(
  mensaje,
  error = false
) {

  const elemento =
    document.getElementById(
      "ingreso-mensaje"
    );


  if (!elemento) return;


  elemento.textContent =
    mensaje;


  elemento.style.color =
    error
      ? "#ef4444"
      : "#4ade80";


  setTimeout(() => {

    elemento.textContent =
      "";

  }, 3000);

}


// ============================================================
// 8. CERRAR SESIÓN
// ============================================================

async function cerrarSesionAdmin() {

  try {

    await auth.signOut();

    esAdmin = false;

    ocultarPanelAdministrador();


    const modal =
      document.getElementById(
        "modal-ingresos"
      );


    if (modal) {

      modal.classList.add(
        "hidden"
      );

    }


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
// 9. CARGAR PROYECTOS
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


    snapshot.forEach(
      doc => {

        proyectos.push({

          id:
            doc.id,

          ...doc.data()

        });

      }
    );

  }

  catch (error) {

    console.error(
      "Error cargando proyectos:",
      error
    );

  }

}


// ============================================================
// 10. CARGAR INGRESOS
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


    snapshot.forEach(
      doc => {

        ingresos.push({

          id:
            doc.id,

          ...doc.data()

        });

      }
    );

  }

  catch (error) {

    console.error(
      "Error cargando ingresos:",
      error
    );

  }

}


// ============================================================
// 11. BÚSQUEDA PÚBLICA
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


    errorMsg.innerText =
      "No se pudo consultar el proyecto.";


    errorMsg.classList.remove(
      "hidden"
    );

  }

}


// ============================================================
// 12. RENDER PROYECTOS ADMIN
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


  container.innerHTML =
    "";


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
        Math.max(
          presupuesto -
          adelanto,
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
        document.createElement(
          "div"
        );


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
                  ${(idx+1)*20}
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

          <div
            style="
              display:flex;
              justify-content:space-between;
              gap:10px;
              flex-wrap:wrap;
            "
          >

            <div>

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


              <strong
                style="
                  margin-left:.4rem;
                "
              >
                ${p.mueble || ""}
              </strong>


              <p
                style="
                  margin:.4rem 0;
                  color:#a3a3a3;
                  font-size:.85rem;
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
                  display:flex;
                  gap:6px;
                  flex-wrap:wrap;
                  margin-top:8px;
                "
              >

                <div
                  style="
                    background:rgba(56,189,248,.07);
                    border:1px solid rgba(56,189,248,.25);
                    color:#38bdf8;
                    padding:7px;
                    border-radius:7px;
                    font-size:.8rem;
                  "
                >
                  Total:
                  <strong>
                    Bs. ${formatearMonto(presupuesto)}
                  </strong>
                </div>


                <div
                  style="
                    background:rgba(245,158,11,.07);
                    border:1px solid rgba(245,158,11,.25);
                    color:#f59e0b;
                    padding:7px;
                    border-radius:7px;
                    font-size:.8rem;
                  "
                >
                  Adelanto:
                  <strong>
                    Bs. ${formatearMonto(adelanto)}
                  </strong>
                </div>


                <div
                  style="
                    background:rgba(239,68,68,.07);
                    border:1px solid rgba(239,68,68,.25);
                    color:#ef4444;
                    padding:7px;
                    border-radius:7px;
                    font-size:.8rem;
                  "
                >
                  Pendiente:
                  <strong>
                    Bs. ${formatearMonto(saldo)}
                  </strong>
                </div>

              </div>


              <div
                style="
                  margin-top:.7rem;
                "
              >
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


            <div
              style="
                display:flex;
                gap:5px;
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
                ✏️
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

        </div>

      `;


      container.appendChild(
        card
      );

    }
  );

}


// ============================================================
// 13. CAMBIAR ESTADO
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
        .collection(
          "proyectos_publicos"
        )
        .where(
          "codigo",
          "==",
          proyecto?.codigo
        )
        .limit(1)
        .get();


    publicoQuery.forEach(
      doc => {

        batch.update(
          doc.ref,
          {
            estado,
            progreso,
            detalles
          }
        );

      }
    );


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
// 14. ELIMINAR PROYECTO
// ============================================================

async function eliminarProyecto(
  id
) {

  if (
    !esAdmin ||
    !auth.currentUser
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


    // PROYECTO

    batch.delete(
      db
        .collection("proyectos")
        .doc(id)
    );


    // PÚBLICO

    if (proyecto) {

      const publicSnap =
        await db
          .collection(
            "proyectos_publicos"
          )
          .where(
            "codigo",
            "==",
            proyecto.codigo
          )
          .get();


      publicSnap.forEach(
        doc => {

          batch.delete(
            doc.ref
          );

        }
      );

    }


    // INGRESOS
    // IMPORTANTE:
    // eliminamos TODOS los ingresos relacionados.

    const ingresoSnap =
      await db
        .collection("ingresos")
        .where(
          "proyectoId",
          "==",
          id
        )
        .get();


    ingresoSnap.forEach(
      doc => {

        batch.delete(
          doc.ref
        );

      }
    );


    await batch.commit();


    // Volver a cargar todo

    await cargarProyectosDesdeNube();


    await limpiarIngresosSinProyecto();


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
// 15. EDITAR PROYECTO
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


  if (!info || !p) return;


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


// ============================================================
// 16. GUARDAR EDICIÓN
// ============================================================

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

        fechaEntrega:
          fecha

      });


    // INGRESO RELACIONADO

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
          presupuesto -
          cobrado,
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


    await cargarProyectosDesdeNube();

    await limpiarIngresosSinProyecto();

    await cargarIngresosDesdeNube();


    renderProyectosAdmin();

    renderGestionIngresos();

  }

  catch (error) {

    console.error(
      "Error editando:",
      error
    );

  }

}


// ============================================================
// 17. GESTIÓN DE INGRESOS
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
    )?.value
    || "";


  // SOLO mostrar ingresos cuyos proyectos existen

  const idsProyectos =
    new Set(
      proyectos.map(
        p => p.id
      )
    );


  let lista =
    ingresos.filter(
      ingreso =>
        ingreso.proyectoId &&
        idsProyectos.has(
          ingreso.proyectoId
        )
    );


  // FILTRO POR MES

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
              ingreso
                .fechaCreacion
                .toDate();

          }


          if (!fecha) {

            return true;

          }


          const mes =
            `${fecha.getFullYear()}-${String(
              fecha.getMonth()+1
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


  // ==========================================================
  // RESUMEN
  // ==========================================================

  const resumen =
    document.getElementById(
      "resumen-ingresos"
    );


  if (resumen) {

    resumen.innerHTML = `

      <div
        style="
          background:rgba(56,189,248,.08);
          border:1px solid rgba(56,189,248,.25);
          border-radius:8px;
          padding:10px;
        "
      >

        <div
          style="
            color:#38bdf8;
            font-size:.78rem;
          "
        >
          Proyectos
        </div>

        <strong
          style="
            color:#38bdf8;
            font-size:1rem;
          "
        >
          ${lista.length}
        </strong>

      </div>


      <div
        style="
          background:rgba(74,222,128,.08);
          border:1px solid rgba(74,222,128,.25);
          border-radius:8px;
          padding:10px;
        "
      >

        <div
          style="
            color:#4ade80;
            font-size:.78rem;
          "
        >
          Cobrado
        </div>

        <strong
          style="
            color:#4ade80;
            font-size:1rem;
          "
        >
          Bs. ${formatearMonto(totalCobrado)}
        </strong>

      </div>


      <div
        style="
          background:rgba(239,68,68,.08);
          border:1px solid rgba(239,68,68,.25);
          border-radius:8px;
          padding:10px;
        "
      >

        <div
          style="
            color:#ef4444;
            font-size:.78rem;
          "
        >
          Pendiente
        </div>

        <strong
          style="
            color:#ef4444;
            font-size:1rem;
          "
        >
          Bs. ${formatearMonto(totalPendiente)}
        </strong>

      </div>

    `;

  }


  container.innerHTML =
    "";


  // ==========================================================
  // SIN PROYECTOS
  // ==========================================================

  if (!lista.length) {

    container.innerHTML = `

      <div
        style="
          text-align:center;
          color:#777;
          padding:25px;
        "
      >

        <i
          class="fa-solid fa-receipt"
          style="
            font-size:1.5rem;
            margin-bottom:8px;
          "
        ></i>

        <div>
          No hay proyectos registrados.
        </div>

      </div>

    `;

    return;

  }


  // ==========================================================
  // LISTA
  // ==========================================================

  lista.forEach(
    ingreso => {

      const card =
        document.createElement(
          "div"
        );


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
          presupuesto -
          cobrado,
          0
        );


      card.innerHTML = `

        <div
          style="
            display:flex;
            justify-content:space-between;
            gap:8px;
            align-items:flex-start;
          "
        >

          <div>

            <strong>
              ${ingreso.cliente || ""}
            </strong>

            <div
              style="
                color:#a3a3a3;
                font-size:.75rem;
                margin-top:2px;
              "
            >
              ${ingreso.codigo || ""}
              ·
              ${ingreso.mueble || ""}
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
            Bs. ${formatearMonto(presupuesto)}
          </div>

        </div>


        <div
          style="
            display:grid;
            grid-template-columns:repeat(3,1fr);
            gap:5px;
            margin-top:8px;
          "
        >

          <div
            style="
              background:rgba(245,158,11,.06);
              border:1px solid rgba(245,158,11,.2);
              color:#f59e0b;
              border-radius:6px;
              padding:6px;
              font-size:.72rem;
            "
          >

            Adelanto

            <strong
              style="
                display:block;
              "
            >
              Bs. ${formatearMonto(adelanto)}
            </strong>

          </div>


          <div
            style="
              background:rgba(74,222,128,.06);
              border:1px solid rgba(74,222,128,.2);
              color:#4ade80;
              border-radius:6px;
              padding:6px;
              font-size:.72rem;
            "
          >

            Cobrado

            <strong
              style="
                display:block;
              "
            >
              Bs. ${formatearMonto(cobrado)}
            </strong>

          </div>


          <div
            style="
              background:rgba(239,68,68,.06);
              border:1px solid rgba(239,68,68,.2);
              color:#ef4444;
              border-radius:6px;
              padding:6px;
              font-size:.72rem;
            "
          >

            Pendiente

            <strong
              style="
                display:block;
              "
            >
              Bs. ${formatearMonto(pendiente)}
            </strong>

          </div>

        </div>


        ${
          pendiente > 0

          ?

          `

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
              style="
                flex:1;
                background:#0a0a0a;
                border:1px solid #333;
                color:#fff;
                padding:7px;
                border-radius:6px;
                box-sizing:border-box;
              "
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

          <div
            style="
              margin-top:8px;
              color:#4ade80;
              font-size:.78rem;
              text-align:center;
            "
          >

            <i class="fa-solid fa-circle-check"></i>

            Proyecto pagado completamente

          </div>

          `

        }

      `;


      container.appendChild(
        card
      );

    }
  );

}


// ============================================================
// 18. REGISTRAR PAGO
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


  const input =
    document.getElementById(
      `pago-${ingresoId}`
    );


  const monto =
    Number(
      input?.value
    ) || 0;


  if (monto <= 0) {

    return;

  }


  const ingreso =
    ingresos.find(
      i => i.id === ingresoId
    );


  if (!ingreso) return;


  const presupuesto =
    Number(
      ingreso.presupuesto
    ) || 0;


  const cobradoActual =
    Number(
      ingreso.cobrado
    ) || 0;


  const pendienteActual =
    Math.max(
      presupuesto -
      cobradoActual,
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
    pagosFinalesActuales +
    pago;


  const nuevoCobrado =
    cobradoActual +
    pago;


  const nuevoPendiente =
    Math.max(
      presupuesto -
      nuevoCobrado,
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


// ============================================================
// 19. EXPORTAR PDF
// ============================================================

function exportarIngresosPDF() {

  if (!esAdmin) return;


  const filtro =
    document.getElementById(
      "ingresos-mes"
    )?.value
    || "";


  if (!filtro) return;


  const idsProyectos =
    new Set(
      proyectos.map(
        p => p.id
      )
    );


  const lista =
    ingresos.filter(
      ingreso => {

        if (
          !ingreso.proyectoId ||
          !idsProyectos.has(
            ingreso.proyectoId
          )
        ) {

          return false;

        }


        if (
          !ingreso.fechaCreacion ||
          !ingreso.fechaCreacion.toDate
        ) {

          return true;

        }


        const fecha =
          ingreso
            .fechaCreacion
            .toDate();


        const mes =
          `${fecha.getFullYear()}-${String(
            fecha.getMonth()+1
          ).padStart(2,"0")}`;


        return mes === filtro;

      }
    );


  const jsPDF =
    window.jspdf.jsPDF;


  const doc =
    new jsPDF();


  const [anio,mes] =
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


  doc.setFontSize(18);


  doc.text(
    "HN MUEBLES",
    14,
    18
  );


  doc.setFontSize(12);


  doc.text(
    `Registro de Ingresos - ${nombresMes[Number(mes)-1]} ${anio}`,
    14,
    27
  );


  let totalProyecto = 0;

  let totalAdelanto = 0;

  let totalCobrado = 0;

  let totalPendiente = 0;


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
            total -
            cobrado,
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


        return [

          ingreso.codigo || "",

          ingreso.cliente || "",

          ingreso.mueble || "",

          `Bs. ${formatearMonto(total)}`,

          `Bs. ${formatearMonto(adelanto)}`,

          `Bs. ${formatearMonto(cobrado)}`,

          `Bs. ${formatearMonto(pendiente)}`

        ];

      }
    );


  // AutoTable puede no estar incluido en algunas versiones.
  // Se mantiene exactamente el comportamiento anterior.

  if (typeof doc.autoTable === "function") {

    doc.autoTable({

      startY:35,

      head:[[

        "Código",

        "Cliente",

        "Proyecto",

        "Total",

        "Adelanto",

        "Cobrado",

        "Pendiente"

      ]],

      body:filas,

      styles:{
        fontSize:8
      },

      headStyles:{
        fontStyle:"bold"
      }

    });

  }


  const finalY =
    doc.lastAutoTable
      ? doc.lastAutoTable.finalY + 10
      : 40;


  doc.setFontSize(10);


  doc.text(
    `Total proyectos: ${lista.length}`,
    14,
    finalY
  );


  doc.text(
    `Total contratado: Bs. ${formatearMonto(totalProyecto)}`,
    14,
    finalY + 7
  );


  doc.text(
    `Total adelantos: Bs. ${formatearMonto(totalAdelanto)}`,
    14,
    finalY + 14
  );


  doc.text(
    `Total cobrado: Bs. ${formatearMonto(totalCobrado)}`,
    14,
    finalY + 21
  );


  doc.text(
    `Total pendiente: Bs. ${formatearMonto(totalPendiente)}`,
    14,
    finalY + 28
  );


  doc.save(
    `HN-Muebles-Ingresos-${filtro}.pdf`
  );

}


// ============================================================
// 20. WHATSAPP
// ============================================================

function notificarWhatsApp(
  index
) {

  if (!esAdmin) return;


  const p =
    proyectos[index];


  if (
    !p ||
    !p.telefono
  ) {

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
      "591" +
      numero;

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
