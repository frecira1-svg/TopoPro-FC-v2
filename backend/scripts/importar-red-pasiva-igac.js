const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function validarPunto(p, indice) {
  const fid = Number(p.FID);
  const latitud = p.Latitud;
  const longitud = p.Longitud;
  const altura = p.Altura_eli;

  if (
    p.FID == null ||
    String(p.FID).trim() === '' ||
    !Number.isInteger(fid) ||
    !String(p.Nomenclatu ?? '').trim() ||
    !String(p.Municipio ?? '').trim() ||
    !String(p.Departamen ?? '').trim()
  ) {
    throw new Error(`Registro ${indice + 1} inválido: FID o campos obligatorios.`);
  }

  if (
    latitud == null || String(latitud).trim() === '' ||
    longitud == null || String(longitud).trim() === '' ||
    !Number.isFinite(Number(latitud)) ||
    !Number.isFinite(Number(longitud)) ||
    Number(latitud) < -90 || Number(latitud) > 90 ||
    Number(longitud) < -180 || Number(longitud) > 180
  ) {
    throw new Error(`Coordenadas inválidas en el FID ${p.FID}.`);
  }

  if (
    altura != null &&
    String(altura).trim() !== '' &&
    !Number.isFinite(Number(altura))
  ) {
    throw new Error(`Altura elipsoidal inválida en el FID ${p.FID}.`);
  }

  return fid;
}

async function main() {
  const archivo = path.resolve(
    __dirname,
    '..',
    '..',
    'puntos-igac-red-pasiva-completo.json'
  );

  if (!fs.existsSync(archivo)) {
    throw new Error(`No se encontró el archivo: ${archivo}`);
  }

  const puntos = JSON.parse(
    fs.readFileSync(archivo, 'utf8').replace(/^\uFEFF/, '')
  );

  if (!Array.isArray(puntos) || puntos.length === 0) {
    throw new Error('El JSON no contiene una lista válida de puntos.');
  }

  const fids = new Set();

  puntos.forEach((p, indice) => {
    const fid = validarPunto(p, indice);

    if (fids.has(fid)) {
      throw new Error(`FID duplicado en el JSON: ${p.FID}`);
    }

    fids.add(fid);
  });

  const totalAntes = await prisma.redPasivaIGAC.count();
  let insertados = 0;

  console.log(`Puntos en archivo: ${puntos.length}`);
  console.log(`Registros existentes: ${totalAntes}`);
  console.log('Iniciando importación por lotes...');

  for (let i = 0; i < puntos.length; i += 500) {
    const lote = puntos.slice(i, i + 500).map((p) => ({
      fid: Number(p.FID),
      nomenclatura: String(p.Nomenclatu).trim(),
      municipio: String(p.Municipio).trim(),
      departamento: String(p.Departamen).trim(),
      estado:
        p.Estado_pun == null || p.Estado_pun === ''
          ? null
          : String(p.Estado_pun).trim(),
      latitud: Number(p.Latitud),
      longitud: Number(p.Longitud),
      alturaElipsoidal:
        p.Altura_eli == null || String(p.Altura_eli).trim() === ''
          ? null
          : Number(p.Altura_eli),
    }));

    const resultado = await prisma.redPasivaIGAC.createMany({
      data: lote,
      skipDuplicates: true,
    });

    insertados += resultado.count;

    console.log(
      `Procesados ${Math.min(i + lote.length, puntos.length)}/${puntos.length} | nuevos: ${resultado.count}`
    );
  }

  const totalFinal = await prisma.redPasivaIGAC.count();
  const fidsArchivo = [...fids];
  const encontrados = new Set();

  for (let i = 0; i < fidsArchivo.length; i += 500) {
    const loteFids = fidsArchivo.slice(i, i + 500);
    const registros = await prisma.redPasivaIGAC.findMany({
      where: { fid: { in: loteFids } },
      select: { fid: true },
    });

    for (const registro of registros) {
      encontrados.add(registro.fid);
    }
  }

  const faltantes = fidsArchivo.filter((fid) => !encontrados.has(fid));

  console.log('\n===== RESULTADO DE IMPORTACIÓN =====');
  console.log(`Registros antes: ${totalAntes}`);
  console.log(`Registros nuevos: ${insertados}`);
  console.log(`Total actual en la tabla: ${totalFinal}`);
  console.log(`FID del archivo encontrados: ${encontrados.size}/${fidsArchivo.length}`);

  if (faltantes.length > 0) {
    console.error('Ejemplos de FID faltantes:', faltantes.slice(0, 20));
    throw new Error(`La verificación detectó ${faltantes.length} FID faltantes.`);
  }

  console.log('Importación y verificación completadas.');
}

main()
  .catch((error) => {
    console.error('\nERROR EN LA IMPORTACIÓN:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });