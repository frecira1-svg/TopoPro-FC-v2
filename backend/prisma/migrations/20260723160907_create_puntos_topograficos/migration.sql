-- CreateTable
CREATE TABLE "public"."puntos_topograficos" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "norte" DOUBLE PRECISION NOT NULL,
    "este" DOUBLE PRECISION NOT NULL,
    "elevacion" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT,
    "precision" DOUBLE PRECISION,
    "equipo" TEXT,
    "metodo" TEXT,
    "observaciones" TEXT,
    "proyectoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "puntos_topograficos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."puntos_topograficos" ADD CONSTRAINT "puntos_topograficos_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "public"."proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
