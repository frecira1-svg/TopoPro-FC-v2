const ExcelJS = require('exceljs');

async function generarReporteExcel(reporte, res) {

  const workbook = new ExcelJS.Workbook();

  workbook.creator = 'TopoPro';
  workbook.lastModifiedBy = 'TopoPro';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ==========================================
  // ESTILOS
  // ==========================================

  const titulo = {
    font: {
      bold: true,
      size: 16
    },
    alignment: {
      horizontal: 'center',
      vertical: 'middle'
    }
  };

  const encabezado = {
    font: {
      bold: true
    },
    alignment: {
      horizontal: 'center',
      vertical: 'middle'
    }
  };


  // ==========================================
  // HOJA RESUMEN
  // ==========================================

  const resumen = workbook.addWorksheet('Resumen');

  resumen.mergeCells('A1:D1');

  resumen.getCell('A1').value =
    'TOPOPRO - REPORTE TÉCNICO DE PROYECTO';

  resumen.getCell('A1').style = titulo;

  resumen.getRow(1).height = 30;

  resumen.addRow([]);

  resumen.addRow([
    'Información del proyecto',
    '',
    '',
    ''
  ]);

  resumen.addRow([
    'ID',
    reporte.proyecto.id
  ]);

  resumen.addRow([
    'Nombre',
    reporte.proyecto.nombre
  ]);

  resumen.addRow([
    'Descripción',
    reporte.proyecto.descripcion || ''
  ]);

  resumen.addRow([
    'Cliente',
    reporte.proyecto.cliente || ''
  ]);

  resumen.addRow([
    'Ubicación',
    reporte.proyecto.ubicacion || ''
  ]);

  resumen.addRow([
    'Estado',
    reporte.proyecto.estado || ''
  ]);

  resumen.addRow([
    'Fecha inicio',
    reporte.proyecto.fechaInicio || ''
  ]);

  resumen.addRow([
    'Fecha fin',
    reporte.proyecto.fechaFin || ''
  ]);

  resumen.addRow([
    'Latitud',
    reporte.proyecto.latitud ?? ''
  ]);

  resumen.addRow([
    'Longitud',
    reporte.proyecto.longitud ?? ''
  ]);

  resumen.addRow([]);

  resumen.addRow([
    'Responsable',
    ''
  ]);

  resumen.addRow([
    'Nombre',
    reporte.responsable
      ? `${reporte.responsable.nombre} ${reporte.responsable.apellido}`
      : ''
  ]);

  resumen.addRow([
    'Correo',
    reporte.responsable?.correo || ''
  ]);

  resumen.addRow([
    'Empresa',
    reporte.responsable?.empresa || ''
  ]);

  resumen.addRow([
    'Profesión',
    reporte.responsable?.profesion || ''
  ]);

  resumen.addRow([]);

  resumen.addRow([
    'ESTADÍSTICAS',
    ''
  ]);

  resumen.addRow([
    'Total puntos',
    reporte.estadisticas.totalPuntos
  ]);

  resumen.addRow([
    'Total levantamientos',
    reporte.estadisticas.totalLevantamientos
  ]);

  resumen.addRow([
    'Total equipos',
    reporte.estadisticas.totalEquipos
  ]);

  resumen.addRow([
    'Total archivos',
    reporte.estadisticas.totalArchivos
  ]);

  resumen.addRow([
    'Elevación mínima',
    reporte.estadisticas.elevacionMinima ?? ''
  ]);

  resumen.addRow([
    'Elevación máxima',
    reporte.estadisticas.elevacionMaxima ?? ''
  ]);

  resumen.addRow([
    'Elevación promedio',
    reporte.estadisticas.elevacionPromedio ?? ''
  ]);

  resumen.getColumn(1).width = 28;
  resumen.getColumn(2).width = 45;


  // ==========================================
  // HOJA PUNTOS
  // ==========================================

  const puntos = workbook.addWorksheet('Puntos Topográficos');

  puntos.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Código', key: 'codigo', width: 18 },
    { header: 'Norte', key: 'norte', width: 18 },
    { header: 'Este', key: 'este', width: 18 },
    { header: 'Elevación', key: 'elevacion', width: 15 },
    { header: 'Descripción', key: 'descripcion', width: 30 },
    { header: 'Tipo', key: 'tipo', width: 18 },
    { header: 'Precisión', key: 'precision', width: 15 },
    { header: 'Equipo', key: 'equipo', width: 20 },
    { header: 'Método', key: 'metodo', width: 20 },
    { header: 'Observaciones', key: 'observaciones', width: 35 },
    { header: 'Latitud', key: 'latitud', width: 15 },
    { header: 'Longitud', key: 'longitud', width: 15 },
    { header: 'Fecha creación', key: 'createdAt', width: 22 }
  ];

  for (const punto of reporte.puntos) {

    puntos.addRow({
      id: punto.id,
      codigo: punto.codigo,
      norte: punto.norte,
      este: punto.este,
      elevacion: punto.elevacion,
      descripcion: punto.descripcion,
      tipo: punto.tipo,
      precision: punto.precision,
      equipo: punto.equipo,
      metodo: punto.metodo,
      observaciones: punto.observaciones,
      latitud: punto.latitud,
      longitud: punto.longitud,
      createdAt: punto.createdAt
    });

  }

  puntos.getRow(1).eachCell(cell => {
    cell.style = encabezado;
  });

  puntos.autoFilter = {
    from: 'A1',
    to: 'N1'
  };

  puntos.views = [
    {
      state: 'frozen',
      ySplit: 1
    }
  ];


  // ==========================================
  // HOJA LEVANTAMIENTOS
  // ==========================================

  const levantamientos =
    workbook.addWorksheet('Levantamientos');

  levantamientos.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Fecha', key: 'fecha', width: 22 },
    { header: 'Descripción', key: 'descripcion', width: 35 },
    { header: 'Observaciones', key: 'observaciones', width: 40 },
    { header: 'Estado', key: 'estado', width: 18 },
    { header: 'Equipo', key: 'equipo', width: 25 },
    { header: 'Tipo equipo', key: 'tipoEquipo', width: 20 },
    { header: 'Marca', key: 'marca', width: 20 },
    { header: 'Modelo', key: 'modelo', width: 20 },
    { header: 'Responsable', key: 'responsable', width: 30 }
  ];

  for (const levantamiento of reporte.levantamientos) {

    levantamientos.addRow({
      id: levantamiento.id,
      fecha: levantamiento.fecha,
      descripcion: levantamiento.descripcion,
      observaciones: levantamiento.observaciones,
      estado: levantamiento.estado,
      equipo: levantamiento.equipo?.nombre || '',
      tipoEquipo: levantamiento.equipo?.tipo || '',
      marca: levantamiento.equipo?.marca || '',
      modelo: levantamiento.equipo?.modelo || '',
      responsable: levantamiento.responsable
        ? `${levantamiento.responsable.nombre} ${levantamiento.responsable.apellido}`
        : ''
    });

  }

  levantamientos.getRow(1).eachCell(cell => {
    cell.style = encabezado;
  });

  levantamientos.views = [
    {
      state: 'frozen',
      ySplit: 1
    }
  ];


  // ==========================================
  // HOJA EQUIPOS
  // ==========================================

  const equipos = workbook.addWorksheet('Equipos');

  equipos.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Nombre', key: 'nombre', width: 25 },
    { header: 'Tipo', key: 'tipo', width: 20 },
    { header: 'Marca', key: 'marca', width: 20 },
    { header: 'Modelo', key: 'modelo', width: 20 },
    { header: 'Número de serie', key: 'numeroSerie', width: 25 },
    { header: 'Estado', key: 'estado', width: 18 },
    { header: 'Fecha compra', key: 'fechaCompra', width: 22 }
  ];

  for (const equipo of reporte.equipos) {

    equipos.addRow({
      id: equipo.id,
      nombre: equipo.nombre,
      tipo: equipo.tipo,
      marca: equipo.marca,
      modelo: equipo.modelo,
      numeroSerie: equipo.numeroSerie,
      estado: equipo.estado,
      fechaCompra: equipo.fechaCompra
    });

  }

  equipos.getRow(1).eachCell(cell => {
    cell.style = encabezado;
  });


  // ==========================================
  // HOJA ARCHIVOS
  // ==========================================

  const archivos = workbook.addWorksheet('Archivos');

  archivos.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Nombre', key: 'nombre', width: 35 },
    { header: 'Tipo', key: 'tipo', width: 20 },
    { header: 'URL', key: 'url', width: 60 },
    { header: 'Fecha', key: 'createdAt', width: 22 }
  ];

  for (const archivo of reporte.archivos) {

    archivos.addRow({
      id: archivo.id,
      nombre: archivo.nombre,
      tipo: archivo.tipo,
      url: archivo.url,
      createdAt: archivo.createdAt
    });

  }

  archivos.getRow(1).eachCell(cell => {
    cell.style = encabezado;
  });


  // ==========================================
  // GENERAR ARCHIVO
  // ==========================================

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );

  res.setHeader(
    'Content-Disposition',
    `attachment; filename="reporte-proyecto-${reporte.proyecto.id}.xlsx"`
  );

  await workbook.xlsx.write(res);

  res.end();
}


module.exports = {
  generarReporteExcel
};