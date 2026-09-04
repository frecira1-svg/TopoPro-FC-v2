const prisma = require('../lib/prisma');


// =====================================================
// VALIDAR PROYECTO Y PERMISOS
// =====================================================

async function obtenerProyectoAutorizado(proyectoId, usuario) {

  const proyecto = await prisma.proyecto.findUnique({
    where: {
      id: Number(proyectoId)
    }
  });

  if (!proyecto) {

    const error = new Error('El proyecto no existe');
    error.status = 404;

    throw error;
  }

  // ADMIN puede acceder a cualquier proyecto
  if (usuario.rol === 'ADMIN') {
    return proyecto;
  }

  // Usuario normal solamente puede acceder
  // a sus propios proyectos
  if (Number(proyecto.usuarioId) !== Number(usuario.id)) {

    const error = new Error(
      'No tienes permisos para acceder a este proyecto'
    );

    error.status = 403;

    throw error;
  }

  return proyecto;
}


// =====================================================
// VALIDAR PUNTO Y PERMISOS
// =====================================================

async function obtenerPuntoAutorizado(id, usuario) {

  const punto = await prisma.puntoTopografico.findUnique({
    where: {
      id: Number(id)
    },
    include: {
      proyecto: true
    }
  });

  if (!punto) {

    const error = new Error(
      'Punto topográfico no encontrado'
    );

    error.status = 404;

    throw error;
  }

  // ADMIN puede acceder a cualquier punto
  if (usuario.rol === 'ADMIN') {
    return punto;
  }

  // Usuario normal solamente puede acceder
  // a puntos de sus proyectos
  if (
    Number(punto.proyecto.usuarioId) !==
    Number(usuario.id)
  ) {

    const error = new Error(
      'No tienes permisos para acceder a este punto topográfico'
    );

    error.status = 403;

    throw error;
  }

  return punto;
}


// =====================================================
// CREAR PUNTO
// =====================================================

async function crearPunto(datos, usuario) {

  const {
    codigo,
    norte,
    este,
    elevacion,
    descripcion,
    tipo,
    precision,
    equipo,
    metodo,
    observaciones,
    proyectoId,
    latitud,
    longitud
  } = datos;

  // -----------------------------------------------
  // VALIDAR CAMPOS OBLIGATORIOS
  // -----------------------------------------------

  if (!codigo || !codigo.trim()) {

    const error = new Error(
      'El código del punto es obligatorio'
    );

    error.status = 400;

    throw error;
  }

  if (
    norte === undefined || norte === null ||
    este === undefined || este === null ||
    elevacion === undefined || elevacion === null
  ) {

    const error = new Error(
      'Norte, este y elevación son obligatorios'
    );

    error.status = 400;

    throw error;
  }


  // -----------------------------------------------
  // VALIDAR PROYECTO Y PERMISOS
  // -----------------------------------------------

  await obtenerProyectoAutorizado(
    proyectoId,
    usuario
  );


  // -----------------------------------------------
  // VALIDAR CÓDIGO DUPLICADO
  // -----------------------------------------------

  const codigoLimpio =
    codigo.trim();

  const puntoExistente =
    await prisma.puntoTopografico.findFirst({

      where: {
        proyectoId: Number(proyectoId),
        codigo: codigoLimpio
      }

    });


  if (puntoExistente) {

    const error = new Error(
      `Ya existe un punto con el código "${codigoLimpio}" en este proyecto`
    );

    error.status = 400;

    throw error;
  }


  // -----------------------------------------------
  // CREAR PUNTO
  // -----------------------------------------------

  const punto =
    await prisma.puntoTopografico.create({

      data: {

        codigo:
          codigoLimpio,

        norte,

        este,

        elevacion,

        descripcion,

        tipo,

        precision,

        equipo,

        metodo,

        observaciones,

        proyectoId:
          Number(proyectoId),

        latitud,

        longitud

      }

    });


  return punto;
}


// =====================================================
// OBTENER TODOS LOS PUNTOS
// =====================================================

async function obtenerPuntos(usuario) {

  const where =
    usuario.rol === 'ADMIN'
      ? {}
      : {
          proyecto: {
            usuarioId: Number(usuario.id)
          }
        };

  return await prisma.puntoTopografico.findMany({

    where,

    include: {
      proyecto: true
    },

    orderBy: {
      id: 'desc'
    }

  });

}


// =====================================================
// OBTENER PUNTOS POR PROYECTO
// =====================================================

async function obtenerPuntosPorProyecto(
  proyectoId,
  usuario
) {

  // Verificar propietario del proyecto
  await obtenerProyectoAutorizado(
    proyectoId,
    usuario
  );

  return await prisma.puntoTopografico.findMany({

    where: {
      proyectoId: Number(proyectoId)
    },

    orderBy: {
      id: 'asc'
    }

  });

}


// =====================================================
// OBTENER PUNTO POR ID
// =====================================================

async function obtenerPuntoPorId(
  id,
  usuario
) {

  return await obtenerPuntoAutorizado(
    id,
    usuario
  );

}


// =====================================================
// ACTUALIZAR PUNTO
// =====================================================

async function actualizarPunto(
  id,
  datos,
  usuario
) {

  // -----------------------------------------------
  // VERIFICAR QUE EL PUNTO EXISTA Y TENGA PERMISO
  // -----------------------------------------------

  const punto =
    await obtenerPuntoAutorizado(
      id,
      usuario
    );


  // -----------------------------------------------
  // DETERMINAR PROYECTO
  // -----------------------------------------------

  let proyectoId =
    punto.proyectoId;


  // Si se intenta cambiar de proyecto,
  // validar el nuevo proyecto
  if (
    datos.proyectoId !== undefined &&
    datos.proyectoId !== null
  ) {

    const nuevoProyectoId =
      Number(datos.proyectoId);

    await obtenerProyectoAutorizado(
      nuevoProyectoId,
      usuario
    );

    proyectoId =
      nuevoProyectoId;
  }


  // -----------------------------------------------
  // VALIDAR CÓDIGO
  // -----------------------------------------------

  if (
    datos.codigo !== undefined &&
    datos.codigo !== null
  ) {

    const codigoLimpio =
      String(datos.codigo).trim();


    if (!codigoLimpio) {

      const error = new Error(
        'El código del punto es obligatorio'
      );

      error.status = 400;

      throw error;
    }


    // ---------------------------------------------
    // BUSCAR OTRO PUNTO CON EL MISMO CÓDIGO
    // ---------------------------------------------

    const puntoExistente =
      await prisma.puntoTopografico.findFirst({

        where: {

          proyectoId,

          codigo:
            codigoLimpio,

          NOT: {
            id: Number(id)
          }

        }

      });


    if (puntoExistente) {

      const error = new Error(
        `Ya existe un punto con el código "${codigoLimpio}" en este proyecto`
      );

      error.status = 400;

      throw error;
    }


    datos.codigo =
      codigoLimpio;

  }


  // -----------------------------------------------
  // ACTUALIZAR
  // -----------------------------------------------

  return await prisma.puntoTopografico.update({

    where: {
      id: Number(id)
    },

    data: {

      codigo:
        datos.codigo,

      norte:
        datos.norte,

      este:
        datos.este,

      elevacion:
        datos.elevacion,

      descripcion:
        datos.descripcion,

      tipo:
        datos.tipo,

      precision:
        datos.precision,

      equipo:
        datos.equipo,

      metodo:
        datos.metodo,

      observaciones:
        datos.observaciones,

      proyectoId,

      latitud:
        datos.latitud,

      longitud:
        datos.longitud

    }

  });

}


// =====================================================
// ELIMINAR PUNTO
// =====================================================

async function eliminarPunto(
  id,
  usuario
) {

  await obtenerPuntoAutorizado(
    id,
    usuario
  );

  await prisma.puntoTopografico.delete({

    where: {
      id: Number(id)
    }

  });

  return {
    mensaje:
      'Punto topográfico eliminado correctamente'
  };

}


// =====================================================
// PUNTOS CERCANOS
// =====================================================

async function obtenerPuntosCercanos(
  lat,
  lng,
  radioKm,
  usuario
) {

  const radioMetros =
    radioKm * 1000;

  let puntos;


  if (usuario.rol === 'ADMIN') {

    puntos =
      await prisma.$queryRaw`

      SELECT

        pt.id,

        pt.codigo,

        pt.norte,

        pt.este,

        pt.elevacion,

        pt.descripcion,

        pt.tipo,

        pt.latitud,

        pt.longitud,

        pt."proyectoId",

        ST_Distance(

          pt.ubicacion_geo,

          ST_SetSRID(

            ST_MakePoint(
              ${lng},
              ${lat}
            ),

            4326

          )::geography

        ) / 1000 AS distancia_km

      FROM puntos_topograficos pt

      WHERE pt.ubicacion_geo IS NOT NULL

        AND ST_DWithin(

          pt.ubicacion_geo,

          ST_SetSRID(

            ST_MakePoint(
              ${lng},
              ${lat}
            ),

            4326

          )::geography,

          ${radioMetros}

        )

      ORDER BY distancia_km ASC

    `;

  } else {

    puntos =
      await prisma.$queryRaw`

      SELECT

        pt.id,

        pt.codigo,

        pt.norte,

        pt.este,

        pt.elevacion,

        pt.descripcion,

        pt.tipo,

        pt.latitud,

        pt.longitud,

        pt."proyectoId",

        ST_Distance(

          pt.ubicacion_geo,

          ST_SetSRID(

            ST_MakePoint(
              ${lng},
              ${lat}
            ),

            4326

          )::geography

        ) / 1000 AS distancia_km

      FROM puntos_topograficos pt

      INNER JOIN proyectos p

        ON p.id = pt."proyectoId"

      WHERE pt.ubicacion_geo IS NOT NULL

        AND p."usuarioId" =
          ${Number(usuario.id)}

        AND ST_DWithin(

          pt.ubicacion_geo,

          ST_SetSRID(

            ST_MakePoint(
              ${lng},
              ${lat}
            ),

            4326

          )::geography,

          ${radioMetros}

        )

      ORDER BY distancia_km ASC

    `;

  }

  return puntos;

}


// =====================================================
// IMPORTAR PUNTOS DESDE CSV
// =====================================================

async function importarPuntosCSV(
  proyectoId,
  contenidoCSV,
  usuario
) {

  // Validar propietario antes de importar
  await obtenerProyectoAutorizado(
    proyectoId,
    usuario
  );


  const lineas =
    contenidoCSV

      .split(/\r?\n/)

      .map(l => l.trim())

      .filter(
        l => l.length > 0
      );


  if (lineas.length < 2) {

    const error = new Error(
      'El archivo CSV está vacío o no tiene datos'
    );

    error.status = 400;

    throw error;
  }


  const delimitador =
    lineas[0].includes(';')
      ? ';'
      : ',';


  const encabezados =
    lineas[0]

      .split(delimitador)

      .map(
        h =>
          h.trim().toLowerCase()
      );


  const parseNumero =
    (valor) => {

      if (
        valor === undefined ||
        valor === null ||
        valor.trim() === ''
      ) {

        return null;
      }


      let limpio =
        valor.trim();


      if (
        limpio.includes(',') &&
        !limpio.includes('.')
      ) {

        limpio =
          limpio.replace(
            ',',
            '.'
          );

      } else {

        limpio =
          limpio.replace(
            /,/g,
            ''
          );

      }


      const num =
        parseFloat(limpio);


      return isNaN(num)
        ? null
        : num;

    };


  const filas =
    lineas

      .slice(1)

      .map(
        (linea, index) => {

          const valores =
            linea.split(
              delimitador
            );


          const fila = {};


          encabezados.forEach(
            (h, i) => {

              fila[h] =
                valores[i] !== undefined
                  ? valores[i].trim()
                  : '';

            }
          );


          if (!fila['codigo']) {

            const error =
              new Error(
                `Fila ${index + 2}: el código es obligatorio`
              );

            error.status =
              400;

            throw error;
          }


          const norte =
            parseNumero(
              fila['norte']
            );


          const este =
            parseNumero(
              fila['este']
            );


          const elevacion =
            parseNumero(
              fila['elevacion']
            );


          if (
            norte === null ||
            este === null ||
            elevacion === null
          ) {

            const error =
              new Error(
                `Fila ${index + 2}: norte, este y elevación son obligatorios y deben ser numéricos`
              );

            error.status =
              400;

            throw error;
          }


          return {

            codigo:
              fila['codigo'].trim(),

            norte,

            este,

            elevacion,

            descripcion:
              fila['descripcion'] ||
              null,

            tipo:
              fila['tipo'] ||
              null,

            precision:
              parseNumero(
                fila['precision']
              ),

            equipo:
              fila['equipo'] ||
              null,

            metodo:
              fila['metodo'] ||
              null,

            observaciones:
              fila['observaciones'] ||
              null,

            latitud:
              parseNumero(
                fila['latitud']
              ),

            longitud:
              parseNumero(
                fila['longitud']
              ),

            proyectoId:
              Number(proyectoId)

          };

        }
      );


  // -----------------------------------------------
  // VALIDAR CÓDIGOS DUPLICADOS EN EL CSV
  // -----------------------------------------------

  const codigos =
    new Set();

  for (
    const fila of filas
  ) {

    const codigo =
      fila.codigo.trim();


    if (
      codigos.has(codigo)
    ) {

      const error =
        new Error(
          `El archivo CSV contiene el código duplicado "${codigo}"`
        );

      error.status =
        400;

      throw error;
    }


    codigos.add(codigo);

  }


  // -----------------------------------------------
  // VALIDAR CÓDIGOS YA EXISTENTES
  // -----------------------------------------------

  const codigosExistentes =
    await prisma.puntoTopografico.findMany({

      where: {

        proyectoId:
          Number(proyectoId),

        codigo: {
          in: Array.from(codigos)
        }

      },

      select: {
        codigo: true
      }

    });


  if (
    codigosExistentes.length > 0
  ) {

    const duplicados =
      codigosExistentes
        .map(
          punto =>
            punto.codigo
        )
        .join(', ');


    const error =
      new Error(
        `Los siguientes códigos ya existen en este proyecto: ${duplicados}`
      );

    error.status =
      400;

    throw error;
  }


  // -----------------------------------------------
  // CREAR PUNTOS
  // -----------------------------------------------

  const resultado =
    await prisma.puntoTopografico.createMany({

      data:
        filas

    });


  return {

    mensaje:
      `${resultado.count} puntos importados correctamente`,

    total:
      resultado.count

  };

}


// =====================================================
// EXPORTACIONES
// =====================================================

module.exports = {

  crearPunto,

  obtenerPuntos,

  obtenerPuntosPorProyecto,

  obtenerPuntoPorId,

  actualizarPunto,

  eliminarPunto,

  obtenerPuntosCercanos,

  importarPuntosCSV

};