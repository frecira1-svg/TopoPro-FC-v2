const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const usuario = await prisma.usuario.findUnique({ where: { correo: 'carlos.ruiz@example.com' } });
  console.log(usuario);
}

main().catch(e => console.error('ERROR:', e)).finally(() => prisma.$disconnect());