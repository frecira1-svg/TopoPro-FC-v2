const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {

  const passwordHasheado = await bcrypt.hash('TopoPro Backend', 10);

  const admin = await prisma.usuario.upsert({

    where: {
      correo: 'admin@topopro.com'
    },

    update: {},

    create: {
      nombre: 'Admin',
      apellido: 'TopoPro',
      correo: 'admin@topopro.com',
      password: passwordHasheado,
      rol: 'ADMIN',
      activo: true,
      emailVerificado: true
    }

  });

  console.log('✅ Usuario admin creado/confirmado:', admin.correo);

}

main()
  .catch((err) => {
    console.error('❌ Error al crear admin:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });