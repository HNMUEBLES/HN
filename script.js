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
  // DATOS DEL PERÍODO
  // ==========================================================

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


        const mesIngreso =
          `${fecha.getFullYear()}-${String(
            fecha.getMonth() + 1
          ).padStart(2, "0")}`;


        return mesIngreso === filtro;

      }
    );


  // ==========================================================
  // CREAR DOCUMENTO
  // ==========================================================

  const jsPDF =
    window.jspdf.jsPDF;


  const doc =
    new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });


  // ==========================================================
  // COLORES
  // ==========================================================

  const NEGRO = [24, 24, 24];

  const GRIS = [100, 100, 100];

  const GRIS_CLARO = [245, 245, 245];

  const BLANCO = [255, 255, 255];

  const DORADO = [245, 158, 11];

  const VERDE = [22, 163, 74];

  const ROJO = [220, 38, 38];

  const AZUL = [56, 189, 248];


  // ==========================================================
  // TOTALES
  // ==========================================================

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


        return [

          ingreso.codigo || "-",

          ingreso.cliente || "-",

          ingreso.mueble || "-",

          `Bs. ${formatearMonto(total)}`,

          `Bs. ${formatearMonto(adelanto)}`,

          `Bs. ${formatearMonto(cobrado)}`,

          `Bs. ${formatearMonto(pendiente)}`

        ];

      }
    );


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


  const horaGeneracion =
    `${String(
      ahora.getHours()
    ).padStart(2, "0")}:${
      String(
        ahora.getMinutes()
      ).padStart(2, "0")
    }`;


  // ==========================================================
  // ENCABEZADO
  // ==========================================================

  doc.setFillColor(
    ...NEGRO
  );


  doc.rect(
    0,
    0,
    297,
    32,
    "F"
  );


  // Nombre empresa

  doc.setTextColor(
    ...BLANCO
  );


  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.setFontSize(
    20
  );


  doc.text(
    "HN MUEBLES",
    14,
    14
  );


  // Subtítulo

  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.setFontSize(
    9
  );


  doc.setTextColor(
    210,
    210,
    210
  );


  doc.text(
    "GESTIÓN FINANCIERA",
    14,
    21
  );


  // Fecha derecha

  doc.setFontSize(
    8
  );


  doc.text(
    `Generado: ${fechaGeneracion} ${horaGeneracion}`,
    283,
    14,
    {
      align: "right"
    }
  );


  doc.text(
    "Reporte administrativo",
    283,
    21,
    {
      align: "right"
    }
  );


  // ==========================================================
  // TÍTULO DEL REPORTE
  // ==========================================================

  doc.setTextColor(
    ...NEGRO
  );


  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.setFontSize(
    16
  );


  doc.text(
    "Reporte de Ingresos",
    14,
    45
  );


  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.setFontSize(
    10
  );


  doc.setTextColor(
    ...GRIS
  );


  doc.text(
    `${nombreMes} ${anio}`,
    14,
    52
  );


  // Línea decorativa

  doc.setDrawColor(
    ...DORADO
  );


  doc.setLineWidth(
    1
  );


  doc.line(
    14,
    57,
    283,
    57
  );


  // ==========================================================
  // RESUMEN FINANCIERO
  // ==========================================================

  const resumenY =
    64;


  const anchoCaja =
    64;


  const espacio =
    4;


  const cajas = [

    {
      titulo: "PROYECTOS",
      valor:
        lista.length.toString(),
      color: AZUL
    },

    {
      titulo: "CONTRATADO",
      valor:
        `Bs. ${formatearMonto(
          totalProyecto
        )}`,
      color: DORADO
    },

    {
      titulo: "COBRADO",
      valor:
        `Bs. ${formatearMonto(
          totalCobrado
        )}`,
      color: VERDE
    },

    {
      titulo: "PENDIENTE",
      valor:
        `Bs. ${formatearMonto(
          totalPendiente
        )}`,
      color: ROJO
    }

  ];


  cajas.forEach(
    (caja, index) => {

      const x =
        14 +
        index *
          (anchoCaja + espacio);


      // Fondo

      doc.setFillColor(
        ...GRIS_CLARO
      );


      doc.roundedRect(
        x,
        resumenY,
        anchoCaja,
        22,
        3,
        3,
        "F"
      );


      // Línea superior

      doc.setFillColor(
        ...caja.color
      );


      doc.roundedRect(
        x,
        resumenY,
        anchoCaja,
        2.5,
        1,
        1,
        "F"
      );


      // Título

      doc.setTextColor(
        ...GRIS
      );


      doc.setFont(
        "helvetica",
        "bold"
      );


      doc.setFontSize(
        7
      );


      doc.text(
        caja.titulo,
        x + 5,
        resumenY + 9
      );


      // Valor

      doc.setTextColor(
        ...NEGRO
      );


      doc.setFont(
        "helvetica",
        "bold"
      );


      doc.setFontSize(
        11
      );


      doc.text(
        caja.valor,
        x + 5,
        resumenY + 17
      );

    }
  );


  // ==========================================================
  // INFORMACIÓN ADICIONAL
  // ==========================================================

  const porcentajeCobrado =
    totalProyecto > 0
      ? (
          totalCobrado /
          totalProyecto
        ) * 100
      : 0;


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
    `Adelantos registrados: Bs. ${formatearMonto(
      totalAdelanto
    )}`,
    14,
    93
  );


  doc.text(
    `Porcentaje cobrado: ${porcentajeCobrado.toFixed(1)}%`,
    283,
    93,
    {
      align: "right"
    }
  );


  // ==========================================================
  // TABLA
  // ==========================================================

  if (
    typeof doc.autoTable ===
    "function"
  ) {

    doc.autoTable({

      startY: 99,

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
        filas.length
          ? filas
          : [[
              "-",
              "Sin registros",
              "-",
              "Bs. 0",
              "Bs. 0",
              "Bs. 0",
              "Bs. 0"
            ]],

      theme:
        "grid",

      styles: {

        font:
          "helvetica",

        fontSize:
          8,

        cellPadding:
          4,

        textColor:
          NEGRO,

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
          7.5,

        halign:
          "center",

        cellPadding:
          4

      },

      alternateRowStyles: {

        fillColor:
          [250, 250, 250]

      },

      columnStyles: {

        0: {
          cellWidth: 25,
          halign: "center"
        },

        1: {
          cellWidth: 48
        },

        2: {
          cellWidth: 60
        },

        3: {
          cellWidth: 34,
          halign: "right"
        },

        4: {
          cellWidth: 34,
          halign: "right"
        },

        5: {
          cellWidth: 34,
          halign: "right"
        },

        6: {
          cellWidth: 34,
          halign: "right"
        }

      },

      didParseCell:
        function(data) {

          // Pendiente

          if (
            data.section === "body" &&
            data.column.index === 6
          ) {

            data.cell.styles.textColor =
              ROJO;

            data.cell.styles.fontStyle =
              "bold";

          }


          // Cobrado

          if (
            data.section === "body" &&
            data.column.index === 5
          ) {

            data.cell.styles.textColor =
              VERDE;

          }


          // Adelanto

          if (
            data.section === "body" &&
            data.column.index === 4
          ) {

            data.cell.styles.textColor =
              [180, 110, 0];

          }

        },

      didDrawPage:
        function() {

          // Encabezado de páginas posteriores

          if (
            doc.internal.getNumberOfPages() > 1
          ) {

            doc.setFillColor(
              ...NEGRO
            );


            doc.rect(
              0,
              0,
              297,
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
              8
            );


            doc.text(
              "HN MUEBLES · REPORTE DE INGRESOS",
              14,
              6.5
            );

          }

        }

    });

  }

  else {

    console.error(
      "AutoTable no está disponible."
    );

    alert(
      "No se pudo generar la tabla del PDF porque AutoTable no está disponible."
    );

    return;

  }


  // ==========================================================
  // RESUMEN FINAL
  // ==========================================================

  let finalY =
    doc.lastAutoTable
      ? doc.lastAutoTable.finalY + 12
      : 115;


  // Evitar que el resumen quede cortado

  if (
    finalY > 175
  ) {

    doc.addPage();

    finalY = 20;

  }


  doc.setFillColor(
    ...GRIS_CLARO
  );


  doc.roundedRect(
    14,
    finalY,
    269,
    38,
    3,
    3,
    "F"
  );


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
    "RESUMEN DEL PERÍODO",
    20,
    finalY + 9
  );


  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.setFontSize(
    9
  );


  doc.text(
    `Proyectos registrados: ${lista.length}`,
    20,
    finalY + 18
  );


  doc.text(
    `Total contratado: Bs. ${formatearMonto(
      totalProyecto
    )}`,
    20,
    finalY + 25
  );


  doc.text(
    `Total adelantos: Bs. ${formatearMonto(
      totalAdelanto
    )}`,
    105,
    finalY + 18
  );


  doc.text(
    `Total cobrado: Bs. ${formatearMonto(
      totalCobrado
    )}`,
    105,
    finalY + 25
  );


  doc.setTextColor(
    ...ROJO
  );


  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.text(
    `Saldo pendiente: Bs. ${formatearMonto(
      totalPendiente
    )}`,
    190,
    finalY + 21
  );


  // ==========================================================
  // PIE DE PÁGINA
  // ==========================================================

  const paginas =
    doc.internal.getNumberOfPages();


  for (
    let pagina = 1;
    pagina <= paginas;
    pagina++
  ) {

    doc.setPage(
      pagina
    );


    const altoPagina =
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
      altoPagina - 13,
      283,
      altoPagina - 13
    );


    doc.setTextColor(
      ...GRIS
    );


    doc.setFont(
      "helvetica",
      "normal"
    );


    doc.setFontSize(
      7
    );


    doc.text(
      "HN MUEBLES · Gestión administrativa de ingresos",
      14,
      altoPagina - 7
    );


    doc.text(
      `Página ${pagina} de ${paginas}`,
      283,
      altoPagina - 7,
      {
        align: "right"
      }
    );

  }


  // ==========================================================
  // GUARDAR PDF
  // ==========================================================

  doc.save(
    `HN-Muebles-Reporte-Ingresos-${filtro}.pdf`
  );

}
