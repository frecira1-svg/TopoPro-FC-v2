require('./src/config/env');

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {

  const usuarios = await prisma.usuario.findMany({
    where: {
      id: {
        in: [1, 12, 13, 14]
      }
    },
    include: {
      suscripcion: {
        include: {
          plan: true
        }
      }
    }
  });

  for (const u of usuarios) {

    console.log('\n================================');
    console.log('USUARIO:', u.id);
    console.log('CORREO:', u.correo);
    console.log('ROL:', u.rol);

    console.log(
      'SUSCRIPCIÓN:',
      u.suscripcion
        ? {
            id: u.suscripcion.id,
            estado: u.suscripcion.estado,
            plan: u.suscripcion.plan?.codigo,
            proveedor: u.suscripcion.proveedor,
            proveedorClienteId:
              u.suscripcion.proveedorClienteId,
            proveedorSuscripcionId:
              u.suscripcion.proveedorSuscripcionId
          }
        : null
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
