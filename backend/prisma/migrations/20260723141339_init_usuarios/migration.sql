-- CreateEnum
CREATE TYPE "public"."Rol" AS ENUM ('ADMIN', 'USUARIO');

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "telefono" TEXT,
    "profesion" TEXT,
    "empresa" TEXT,
    "ciudad" TEXT,
    "pais" TEXT,
    "foto" TEXT,
    "rol" "public"."Rol" NOT NULL DEFAULT 'USUARIO',
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "public"."usuarios"("correo");
