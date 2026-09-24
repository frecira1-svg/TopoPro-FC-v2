-- =====================================================
-- SISTEMA COMERCIAL TOPROPRO
-- Planes y suscripciones
-- =====================================================

CREATE TYPE "CodigoPlan" AS ENUM (
  'FREE',
  'PROFESSIONAL',
  'COMPANY'
);

CREATE TYPE "EstadoSuscripcion" AS ENUM (
  'ACTIVA',
  'VENCIDA',
  'CANCELADA',
  'PENDIENTE'
);

CREATE TABLE "planes" (
  "id" SERIAL NOT NULL,
  "codigo" "CodigoPlan" NOT NULL,
  "nombre" TEXT NOT NULL,
  "descripcion" TEXT,
  "precioMensual" INTEGER NOT NULL DEFAULT 0,
  "maxProyectos" INTEGER,
  "maxPuntosProyecto" INTEGER,
  "maxUsuarios" INTEGER NOT NULL DEFAULT 1,
  "permiteExportacion" BOOLEAN NOT NULL DEFAULT false,
  "permiteOffline" BOOLEAN NOT NULL DEFAULT true,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "planes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "planes_codigo_key"
ON "planes"("codigo");

CREATE TABLE "suscripciones" (
  "id" SERIAL NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "planId" INTEGER NOT NULL,
  "estado" "EstadoSuscripcion" NOT NULL DEFAULT 'ACTIVA',
  "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fechaFin" TIMESTAMP(3),
  "proyectoGratisUsado" BOOLEAN NOT NULL DEFAULT false,
  "proveedor" TEXT,
  "proveedorClienteId" TEXT,
  "proveedorSuscripcionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "suscripciones_usuarioId_key"
ON "suscripciones"("usuarioId");

CREATE INDEX "suscripciones_planId_idx"
ON "suscripciones"("planId");

CREATE INDEX "suscripciones_estado_idx"
ON "suscripciones"("estado");

ALTER TABLE "suscripciones"
ADD CONSTRAINT "suscripciones_usuarioId_fkey"
FOREIGN KEY ("usuarioId")
REFERENCES "usuarios"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "suscripciones"
ADD CONSTRAINT "suscripciones_planId_fkey"
FOREIGN KEY ("planId")
REFERENCES "planes"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;