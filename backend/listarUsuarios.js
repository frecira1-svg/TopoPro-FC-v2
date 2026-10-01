require('./src/config/env');

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      correo: true,
      nombre: true,
      apellido: true,
      rol: true,
      emailVerificado: true
    }
  });

  console.log(JSON.stringify(usuarios, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
