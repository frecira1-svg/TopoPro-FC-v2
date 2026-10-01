const prisma = require('./src/config/prisma');

async function probar() {
  try {
    const suscripciones = await prisma.suscripcion.findMany({
      include: {
        plan: true
      }
    });

    console.log(
      JSON.stringify(suscripciones, null, 2)
    );

  } catch (error) {
    console.error(error);

  } finally {
    await prisma.$disconnect();
  }
}

probar();