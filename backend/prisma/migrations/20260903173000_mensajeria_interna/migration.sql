CREATE TABLE "conversaciones" (
  "id" SERIAL NOT NULL,
  "usuario1Id" INTEGER NOT NULL,
  "usuario2Id" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "conversaciones_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "conversaciones_usuario1Id_usuario2Id_key" ON "conversaciones"("usuario1Id","usuario2Id");
CREATE INDEX "conversaciones_usuario1Id_updatedAt_idx" ON "conversaciones"("usuario1Id","updatedAt");
CREATE INDEX "conversaciones_usuario2Id_updatedAt_idx" ON "conversaciones"("usuario2Id","updatedAt");
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_usuario1Id_fkey" FOREIGN KEY ("usuario1Id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_usuario2Id_fkey" FOREIGN KEY ("usuario2Id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "mensajes_internos" (
  "id" SERIAL NOT NULL,
  "contenido" TEXT NOT NULL,
  "leido" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "conversacionId" INTEGER NOT NULL,
  "remitenteId" INTEGER NOT NULL,
  CONSTRAINT "mensajes_internos_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "mensajes_internos_conversacionId_createdAt_idx" ON "mensajes_internos"("conversacionId","createdAt");
CREATE INDEX "mensajes_internos_remitenteId_leido_idx" ON "mensajes_internos"("remitenteId","leido");
ALTER TABLE "mensajes_internos" ADD CONSTRAINT "mensajes_internos_conversacionId_fkey" FOREIGN KEY ("conversacionId") REFERENCES "conversaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mensajes_internos" ADD CONSTRAINT "mensajes_internos_remitenteId_fkey" FOREIGN KEY ("remitenteId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
