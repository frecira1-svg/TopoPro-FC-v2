-- CreateTable
CREATE TABLE "archivos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "proyectoId" INTEGER,
    "puntoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archivos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_puntoId_fkey" FOREIGN KEY ("puntoId") REFERENCES "puntos_topograficos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
