const prisma = require('../config/prisma');

const campos = {
  fid: true,
  nomenclatura: true,
  municipio: true,
  departamento: true,
  estado: true,
  latitud: true,
  longitud: true,
  alturaElipsoidal: true,
};

const texto = (valor) =>
  typeof valor === 'string' ? valor.trim() : '';

exports.listar = async (req, res, next) => {
  try {
    const pagina = Math.max(1, Number.parseInt(req.query.pagina, 10) || 1);
    const limiteSolicitado = Number.parseInt(req.query.limite, 10) || 50;
    const limite = Math.min(100, Math.max(1, limiteSolicitado));
    const skip = (pagina - 1) * limite;

    const departamento = texto(req.query.departamento);
    const municipio = texto(req.query.municipio);
    const busqueda = texto(req.query.busqueda);

    const where = {};

    if (departamento) {
      where.departamento = {
        contains: departamento,
        mode: 'insensitive',
      };
    }

    if (municipio) {
      where.municipio = {
        contains: municipio,
        mode: 'insensitive',
      };
    }

    if (busqueda) {
      where.OR = [
        { nomenclatura: { contains: busqueda, mode: 'insensitive' } },
        { municipio: { contains: busqueda, mode: 'insensitive' } },
        { departamento: { contains: busqueda, mode: 'insensitive' } },
      ];
    }

    const [total, puntos] = await prisma.$transaction([
      prisma.redPasivaIGAC.count({ where }),
      prisma.redPasivaIGAC.findMany({
        where,
        select: campos,
        orderBy: { fid: 'asc' },
        skip,
        take: limite,
      }),
    ]);

    res.json({
      datos: puntos,
      paginacion: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.listarDepartamentos = async (req, res, next) => {
  try {
    const departamentos = await prisma.redPasivaIGAC.findMany({
      distinct: ['departamento'],
      select: { departamento: true },
      orderBy: { departamento: 'asc' },
    });

    res.json(departamentos.map((item) => item.departamento));
  } catch (error) {
    next(error);
  }
};

exports.listarMunicipios = async (req, res, next) => {
  try {
    const departamento = texto(req.query.departamento);

    const where = departamento
      ? {
          departamento: {
            equals: departamento,
            mode: 'insensitive',
          },
        }
      : {};

    const municipios = await prisma.redPasivaIGAC.findMany({
      where,
      distinct: ['municipio'],
      select: { municipio: true },
      orderBy: { municipio: 'asc' },
    });

    res.json(municipios.map((item) => item.municipio));
  } catch (error) {
    next(error);
  }
};

exports.listarCercanos = async (req, res, next) => {
  try {
    const latitud = Number(req.query.latitud);
    const longitud = Number(req.query.longitud);
    const radioKm = Number(req.query.radioKm ?? 10);
    const limite = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limite, 10) || 20)
    );

    if (
      !Number.isFinite(latitud) ||
      !Number.isFinite(longitud) ||
      latitud < -90 ||
      latitud > 90 ||
      longitud < -180 ||
      longitud > 180
    ) {
      return res.status(400).json({
        error: 'Debes proporcionar latitud y longitud válidas.',
      });
    }

    if (!Number.isFinite(radioKm) || radioKm <= 0 || radioKm > 200) {
      return res.status(400).json({
        error: 'El radioKm debe ser mayor que 0 y no superar 200.',
      });
    }

    // Preselección por caja geográfica; la distancia exacta se calcula
    // después con la fórmula de Haversine.
    const deltaLat = radioKm / 111.32;
    const deltaLon =
      radioKm / (111.32 * Math.max(0.01, Math.cos(latitud * Math.PI / 180)));

    const puntos = await prisma.redPasivaIGAC.findMany({
      where: {
        latitud: {
          gte: Math.max(-90, latitud - deltaLat),
          lte: Math.min(90, latitud + deltaLat),
        },
        longitud: {
          gte: Math.max(-180, longitud - deltaLon),
          lte: Math.min(180, longitud + deltaLon),
        },
      },
      select: campos,
    });

    const rad = (grados) => grados * Math.PI / 180;

    const cercanos = puntos
      .map((punto) => {
        const dLat = rad(punto.latitud - latitud);
        const dLon = rad(punto.longitud - longitud);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(rad(latitud)) *
            Math.cos(rad(punto.latitud)) *
            Math.sin(dLon / 2) ** 2;

        const distanciaKm =
          6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return {
          ...punto,
          distanciaKm: Number(distanciaKm.toFixed(3)),
        };
      })
      .filter((punto) => punto.distanciaKm <= radioKm)
      .sort((a, b) => a.distanciaKm - b.distanciaKm)
      .slice(0, limite);

    res.json({
      origen: { latitud, longitud },
      radioKm,
      totalDevuelto: cercanos.length,
      datos: cercanos,
    });
  } catch (error) {
    next(error);
  }
};
