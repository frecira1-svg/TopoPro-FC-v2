CREATE TYPE "EstadoContacto" AS ENUM ('PENDIENTE', 'LEIDO', 'RESPONDIDO');

CREATE TABLE "contactos_profesionales" (
  "id" SERIAL NOT NULL,
  "asunto" TEXT,
  "mensaje" TEXT NOT NULL,
  "nombreContacto" TEXT NOT NULL,
  "correoContacto" TEXT NOT NULL,
  "estado" "EstadoContacto" NOT NULL DEFAULT 'PENDIENTE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "remitenteId" INTEGER NOT NULL,
  "destinatarioId" INTEGER NOT NULL,
  CONSTRAINT "contactos_profesionales_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "contactos_profesionales_destinatarioId_createdAt_idx" ON "contactos_profesionales"("destinatarioId", "createdAt");
CREATE INDEX "contactos_profesionales_remitenteId_createdAt_idx" ON "contactos_profesionales"("remitenteId", "createdAt");
ALTER TABLE "contactos_profesionales" ADD CONSTRAINT "contactos_profesionales_remitenteId_fkey" FOREIGN KEY ("remitenteId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contactos_profesionales" ADD CONSTRAINT "contactos_profesionales_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
