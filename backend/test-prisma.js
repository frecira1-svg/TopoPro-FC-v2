const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error']
});

async function main() {
  const proyecto = await prisma.proyecto.create({
    data: {
      nombre: 'Prueba Prisma',
      descripcion: 'Prueba',
      cliente: 'Cliente',
      ubicacion: 'Medellín',
      estado: 'EN_PROGRESO',
      usuarioId: 2
    }
  });

  console.log(proyecto);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });