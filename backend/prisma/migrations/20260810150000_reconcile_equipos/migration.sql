-- Reconciliación del esquema existente.
-- Estas estructuras ya existen en PostgreSQL.
-- Esta migración sirve para que el historial de Prisma las represente.

CREATE TABLE IF NOT EXISTS "equipos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "numeroSerie" TEXT,
    "fechaCompra" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'DISPONIBLE',
    "proyectoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "equipos_numeroSerie_key"
ON "equipos"("numeroSerie");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'equipos_proyectoId_fkey'
    ) THEN
        ALTER TABLE "equipos"
        ADD CONSTRAINT "equipos_proyectoId_fkey"
        FOREIGN KEY ("proyectoId")
        REFERENCES "proyectos"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;
    END IF;
END $$;

ALTER TABLE "proyectos"
ADD COLUMN IF NOT EXISTS "ubicacion_geo" geography(Point, 4326);

ALTER TABLE "puntos_topograficos"
ADD COLUMN IF NOT EXISTS "ubicacion_geo" geography(Point, 4326);




