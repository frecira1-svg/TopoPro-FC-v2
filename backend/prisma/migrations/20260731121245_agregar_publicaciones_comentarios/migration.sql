/*
  Warnings:

  - You are about to drop the column `ubicacion_geo` on the `proyectos` table. All the data in the column will be lost.
  - You are about to drop the column `ubicacion_geo` on the `puntos_topograficos` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoPublicacion" AS ENUM ('NOTICIA', 'COMUNIDAD');

-- DropIndex
DROP INDEX "idx_proyectos_ubicacion_geo";

-- DropIndex
DROP INDEX "idx_puntos_ubicacion_geo";

-- AlterTable
ALTER TABLE "proyectos" DROP COLUMN "ubicacion_geo";

-- AlterTable
ALTER TABLE "puntos_topograficos" DROP COLUMN "ubicacion_geo";

-- CreateTable
CREATE TABLE "publicaciones" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "tipo" "TipoPublicacion" NOT NULL DEFAULT 'COMUNIDAD',
    "imagen" TEXT,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publicaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios" (
    "id" SERIAL NOT NULL,
    "contenido" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "publicacionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_publicacionId_fkey" FOREIGN KEY ("publicacionId") REFERENCES "publicaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
