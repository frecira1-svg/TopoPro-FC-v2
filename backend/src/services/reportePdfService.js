const PDFDocument = require('pdfkit');

function generarReportePDF(reporte, res) {

  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: 50,
      bottom: 55,
      left: 50,
      right: 50
    }
  });

  const nombreArchivo =
    `reporte_${reporte.proyecto.id}.pdf`;

  res.setHeader(
    'Content-Type',
    'application/pdf'
  );

  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${nombreArchivo}"`
  );

  doc.pipe(res);


  // =====================================================
  // CONFIGURACIÓN
  // =====================================================

  const margenIzquierdo =
    doc.page.margins.left;

  const anchoContenido =
    doc.page.width -
    doc.page.margins.left -
    doc.page.margins.right;


  // =====================================================
  // NÚMERO DE PÁGINA
  // =====================================================

  let numeroPagina = 1;


  // =====================================================
  // DIBUJAR PIE
  // =====================================================

  function dibujarPie() {

    const y =
      doc.page.height -
      35;

    doc.save();

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#666666');

    doc.text(
      `TopoPro FC - Reporte técnico | Página ${numeroPagina}`,
      margenIzquierdo,
      y,
      {
        width: anchoContenido,
        align: 'center',
        lineBreak: false
      }
    );

    doc.restore();

  }


  // =====================================================
  // CREAR NUEVA PÁGINA
  // =====================================================

  function nuevaPagina() {

    // Primero dibujamos el pie de la página actual
    dibujarPie();

    // Incrementamos el número
    numeroPagina++;

    // Creamos la nueva página
    doc.addPage();

  }


  // =====================================================
  // PORTADA
  // =====================================================

  doc.moveDown(5);

  doc
    .font('Helvetica-Bold')
    .fontSize(28)
    .text(
      'TopoPro FC',
      {
        width: anchoContenido,
        align: 'center'
      }
    );

  doc.moveDown(1.5);

  doc
    .font('Helvetica-Bold')
    .fontSize(21)
    .text(
      'REPORTE TÉCNICO',
      {
        width: anchoContenido,
        align: 'center'
      }
    );

  doc.moveDown(1);

  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .text(
      valor(reporte.proyecto.nombre),
      {
        width: anchoContenido,
        align: 'center'
      }
    );

  doc.moveDown(2);

  doc
    .font('Helvetica')
    .fontSize(11)
    .text(
      `Cliente: ${valor(reporte.proyecto.cliente)}`,
      {
        width: anchoContenido,
        align: 'center'
      }
    );

  doc.text(
    `Ubicación: ${valor(reporte.proyecto.ubicacion)}`,
    {
      width: anchoContenido,
      align: 'center'
    }
  );

  doc.moveDown();

  doc.text(
    `Estado: ${valor(reporte.proyecto.estado)}`,
    {
      width: anchoContenido,
      align: 'center'
    }
  );

  doc.moveDown(2);


  // =====================================================
  // RESPONSABLE
  // =====================================================

  if (reporte.responsable) {

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(
        'Responsable',
        {
          width: anchoContenido,
          align: 'center'
        }
      );

    doc
      .font('Helvetica')
      .text(
        `${valor(reporte.responsable.nombre)} ${valor(reporte.responsable.apellido)}`,
        {
          width: anchoContenido,
          align: 'center'
        }
      );

    if (reporte.responsable.profesion) {

      doc.text(
        valor(reporte.responsable.profesion),
        {
          width: anchoContenido,
          align: 'center'
        }
      );

    }

    if (reporte.responsable.empresa) {

      doc.text(
        valor(reporte.responsable.empresa),
        {
          width: anchoContenido,
          align: 'center'
        }
      );

    }

  }


  // =====================================================
  // PIE DE PORTADA
  // =====================================================

  dibujarPie();


  // =====================================================
  // SEGUNDA PÁGINA
  // =====================================================

  numeroPagina++;

  doc.addPage();


  // =====================================================
  // 1. INFORMACIÓN GENERAL
  // =====================================================

  titulo(
    doc,
    '1. Información General'
  );

  campo(
    doc,
    'Nombre del proyecto',
    reporte.proyecto.nombre
  );

  campo(
    doc,
    'Descripción',
    reporte.proyecto.descripcion
  );

  campo(
    doc,
    'Cliente',
    reporte.proyecto.cliente
  );

  campo(
    doc,
    'Ubicación',
    reporte.proyecto.ubicacion
  );

  campo(
    doc,
    'Estado',
    reporte.proyecto.estado
  );

  campo(
    doc,
    'Fecha de inicio',
    formatearFecha(
      reporte.proyecto.fechaInicio
    )
  );

  campo(
    doc,
    'Fecha de finalización',
    formatearFecha(
      reporte.proyecto.fechaFin
    )
  );

  campo(
    doc,
    'Latitud',
    reporte.proyecto.latitud
  );

  campo(
    doc,
    'Longitud',
    reporte.proyecto.longitud
  );


  // =====================================================
  // 2. RESUMEN ESTADÍSTICO
  // =====================================================

  titulo(
    doc,
    '2. Resumen Estadístico'
  );

  const e =
    reporte.estadisticas;

  campo(
    doc,
    'Total de puntos',
    e.totalPuntos
  );

  campo(
    doc,
    'Total de levantamientos',
    e.totalLevantamientos
  );

  campo(
    doc,
    'Total de equipos',
    e.totalEquipos
  );

  campo(
    doc,
    'Total de archivos',
    e.totalArchivos
  );

  campo(
    doc,
    'Elevación mínima',
    formatearNumero(
      e.elevacionMinima
    )
  );

  campo(
    doc,
    'Elevación máxima',
    formatearNumero(
      e.elevacionMaxima
    )
  );

  campo(
    doc,
    'Elevación promedio',
    formatearNumero(
      e.elevacionPromedio
    )
  );


  // =====================================================
  // 3. PUNTOS POR TIPO
  // =====================================================

  titulo(
    doc,
    '3. Puntos por Tipo'
  );

  const tipos =
    Object.entries(
      e.puntosPorTipo || {}
    );

  if (!tipos.length) {

    doc.text(
      'No existen datos disponibles.'
    );

  } else {

    for (const [tipo, cantidad] of tipos) {

      asegurarEspacio(
        doc,
        25,
        nuevaPagina
      );

      doc
        .font('Helvetica')
        .fontSize(10)
        .text(
          `${tipo}: ${cantidad}`
        );

    }

  }


  // =====================================================
  // 4. LEVANTAMIENTOS POR ESTADO
  // =====================================================

  titulo(
    doc,
    '4. Levantamientos por Estado'
  );

  const estados =
    Object.entries(
      e.levantamientosPorEstado || {}
    );

  if (!estados.length) {

    doc.text(
      'No existen datos disponibles.'
    );

  } else {

    for (
      const [estado, cantidad]
      of estados
    ) {

      asegurarEspacio(
        doc,
        25,
        nuevaPagina
      );

      doc
        .font('Helvetica')
        .fontSize(10)
        .text(
          `${estado}: ${cantidad}`
        );

    }

  }


  // =====================================================
  // 5. PUNTOS TOPOGRÁFICOS
  // =====================================================

  titulo(
    doc,
    '5. Puntos Topográficos'
  );

  if (!reporte.puntos.length) {

    doc.text(
      'No existen puntos registrados.'
    );

  } else {

    for (const punto of reporte.puntos) {

      asegurarEspacio(
        doc,
        125,
        nuevaPagina
      );

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(
          valor(punto.codigo)
        );

      doc
        .font('Helvetica')
        .fontSize(9);

      campoPequeno(
        doc,
        'Norte',
        punto.norte
      );

      campoPequeno(
        doc,
        'Este',
        punto.este
      );

      campoPequeno(
        doc,
        'Elevación',
        punto.elevacion
      );

      campoPequeno(
        doc,
        'Tipo',
        punto.tipo
      );

      campoPequeno(
        doc,
        'Precisión',
        punto.precision
      );

      campoPequeno(
        doc,
        'Equipo',
        punto.equipo
      );

      campoPequeno(
        doc,
        'Método',
        punto.metodo
      );

      campoPequeno(
        doc,
        'Descripción',
        punto.descripcion
      );

      campoPequeno(
        doc,
        'Observaciones',
        punto.observaciones
      );

      doc.moveDown(0.6);

    }

  }


  // =====================================================
  // 6. LEVANTAMIENTOS
  // =====================================================

  titulo(
    doc,
    '6. Levantamientos'
  );

  if (!reporte.levantamientos.length) {

    doc.text(
      'No existen levantamientos registrados.'
    );

  } else {

    for (
      const levantamiento
      of reporte.levantamientos
    ) {

      asegurarEspacio(
        doc,
        105,
        nuevaPagina
      );

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(
          formatearFecha(
            levantamiento.fecha
          )
        );

      doc
        .font('Helvetica')
        .fontSize(9);

      campoPequeno(
        doc,
        'Estado',
        levantamiento.estado
      );

      campoPequeno(
        doc,
        'Descripción',
        levantamiento.descripcion
      );

      campoPequeno(
        doc,
        'Observaciones',
        levantamiento.observaciones
      );

      if (levantamiento.equipo) {

        campoPequeno(
          doc,
          'Equipo',
          levantamiento.equipo.nombre
        );

        campoPequeno(
          doc,
          'Marca',
          levantamiento.equipo.marca
        );

        campoPequeno(
          doc,
          'Modelo',
          levantamiento.equipo.modelo
        );

      }

      if (levantamiento.responsable) {

        campoPequeno(
          doc,
          'Responsable',
          `${valor(levantamiento.responsable.nombre)} ${valor(levantamiento.responsable.apellido)}`
        );

      }

      doc.moveDown(0.6);

    }

  }


  // =====================================================
  // 7. EQUIPOS
  // =====================================================

  titulo(
    doc,
    '7. Equipos'
  );

  if (!reporte.equipos.length) {

    doc.text(
      'No existen equipos registrados.'
    );

  } else {

    for (const equipo of reporte.equipos) {

      asegurarEspacio(
        doc,
        90,
        nuevaPagina
      );

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(
          valor(equipo.nombre)
        );

      doc
        .font('Helvetica')
        .fontSize(9);

      campoPequeno(
        doc,
        'Tipo',
        equipo.tipo
      );

      campoPequeno(
        doc,
        'Marca',
        equipo.marca
      );

      campoPequeno(
        doc,
        'Modelo',
        equipo.modelo
      );

      campoPequeno(
        doc,
        'Número de serie',
        equipo.numeroSerie
      );

      campoPequeno(
        doc,
        'Estado',
        equipo.estado
      );

      campoPequeno(
        doc,
        'Fecha de compra',
        formatearFecha(
          equipo.fechaCompra
        )
      );

      doc.moveDown(0.6);

    }

  }


  // =====================================================
  // 8. ARCHIVOS
  // =====================================================

  titulo(
    doc,
    '8. Archivos'
  );

  if (!reporte.archivos.length) {

    doc.text(
      'No existen archivos asociados.'
    );

  } else {

    for (const archivo of reporte.archivos) {

      asegurarEspacio(
        doc,
        75,
        nuevaPagina
      );

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(
          valor(archivo.nombre)
        );

      doc
        .font('Helvetica')
        .fontSize(9);

      campoPequeno(
        doc,
        'Tipo',
        archivo.tipo
      );

      campoPequeno(
        doc,
        'Fecha',
        formatearFecha(
          archivo.createdAt
        )
      );

      campoPequeno(
        doc,
        'URL',
        archivo.url
      );

      doc.moveDown(0.6);

    }

  }


  // =====================================================
  // PIE DE LA ÚLTIMA PÁGINA
  // =====================================================

  dibujarPie();


  // =====================================================
  // FINALIZAR PDF
  // =====================================================

  doc.end();

}


// =====================================================
// TÍTULO
// =====================================================

function titulo(
  doc,
  texto
) {

  asegurarEspacio(
    doc,
    55,
    () => {
      // No se utiliza aquí porque
      // titulo() será llamada desde
      // el flujo principal.
    }
  );

  doc
    .moveDown(0.7)
    .font('Helvetica-Bold')
    .fontSize(15)
    .text(texto);

  doc.moveDown(0.4);

}


// =====================================================
// CAMPO
// =====================================================

function campo(
  doc,
  nombre,
  valorCampo
) {

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .text(
      `${nombre}: `,
      {
        continued: true
      }
    );

  doc
    .font('Helvetica')
    .fontSize(10)
    .text(
      valor(valorCampo)
    );

}


// =====================================================
// CAMPO PEQUEÑO
// =====================================================

function campoPequeno(
  doc,
  nombre,
  valorCampo
) {

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .text(
      `${nombre}: `,
      {
        continued: true
      }
    );

  doc
    .font('Helvetica')
    .fontSize(9)
    .text(
      valor(valorCampo)
    );

}


// =====================================================
// VALOR
// =====================================================

function valor(valorCampo) {

  if (
    valorCampo === null ||
    valorCampo === undefined ||
    valorCampo === ''
  ) {

    return 'No especificado';

  }

  return String(valorCampo);

}


// =====================================================
// FORMATEAR NÚMERO
// =====================================================

function formatearNumero(
  valorCampo
) {

  if (
    valorCampo === null ||
    valorCampo === undefined ||
    !Number.isFinite(
      Number(valorCampo)
    )
  ) {

    return 'N/A';

  }

  return Number(valorCampo)
    .toFixed(3);

}


// =====================================================
// FORMATEAR FECHA
// =====================================================

function formatearFecha(
  fecha
) {

  if (!fecha) {

    return 'No especificada';

  }

  const date =
    new Date(fecha);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return 'No especificada';

  }

  return date.toLocaleString(
    'es-CO'
  );

}


// =====================================================
// ASEGURAR ESPACIO
// =====================================================

function asegurarEspacio(
  doc,
  espacioNecesario,
  crearPagina
) {

  const limite =
    doc.page.height -
    doc.page.margins.bottom -
    espacioNecesario;

  if (doc.y > limite) {

    if (
      typeof crearPagina === 'function'
    ) {

      crearPagina();

    } else {

      doc.addPage();

    }

  }

}


// =====================================================
// EXPORTACIÓN
// =====================================================

module.exports = {
  generarReportePDF
};