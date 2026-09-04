CREATE TABLE "publicacion_imagenes" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "nombre" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicacionId" INTEGER NOT NULL,
    CONSTRAINT "publicacion_imagenes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "publicacion_imagenes_publicacionId_idx" ON "publicacion_imagenes"("publicacionId");

ALTER TABLE "publicacion_imagenes"
ADD CONSTRAINT "publicacion_imagenes_publicacionId_fkey"
FOREIGN KEY ("publicacionId") REFERENCES "publicaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "publicacion_imagenes" ("url", "nombre", "orden", "publicacionId")
SELECT "imagen", 'imagen-principal', 0, "id"
FROM "publicaciones"
WHERE "imagen" IS NOT NULL AND "imagen" <> '';
