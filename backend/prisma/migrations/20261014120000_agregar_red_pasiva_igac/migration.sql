CREATE TABLE IF NOT EXISTS "red_pasiva_igac" (
    "id" SERIAL NOT NULL,
    "fid" INTEGER NOT NULL,
    "nomenclatura" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "estado" TEXT,
    "latitud" DOUBLE PRECISION NOT NULL,
    "longitud" DOUBLE PRECISION NOT NULL,
    "alturaElipsoidal" DOUBLE PRECISION,

    CONSTRAINT "red_pasiva_igac_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "red_pasiva_igac_fid_key"
    ON "red_pasiva_igac"("fid");

CREATE INDEX IF NOT EXISTS "red_pasiva_igac_departamento_idx"
    ON "red_pasiva_igac"("departamento");

CREATE INDEX IF NOT EXISTS "red_pasiva_igac_municipio_idx"
    ON "red_pasiva_igac"("municipio");

CREATE INDEX IF NOT EXISTS "red_pasiva_igac_nomenclatura_idx"
    ON "red_pasiva_igac"("nomenclatura");
