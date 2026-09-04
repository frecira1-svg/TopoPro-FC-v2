CREATE EXTENSION IF NOT EXISTS postgis;

-- Columna geoespacial para Proyecto
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS ubicacion_geo geography(Point, 4326);

-- Columna geoespacial para PuntoTopografico
ALTER TABLE puntos_topograficos ADD COLUMN IF NOT EXISTS ubicacion_geo geography(Point, 4326);

-- Función que sincroniza latitud/longitud -> ubicacion_geo automáticamente
CREATE OR REPLACE FUNCTION sync_ubicacion_geo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitud IS NOT NULL AND NEW.longitud IS NOT NULL THEN
    NEW.ubicacion_geo := ST_SetSRID(ST_MakePoint(NEW.longitud, NEW.latitud), 4326)::geography;
  ELSE
    NEW.ubicacion_geo := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para proyectos
DROP TRIGGER IF EXISTS trigger_sync_ubicacion_proyecto ON proyectos;
CREATE TRIGGER trigger_sync_ubicacion_proyecto
  BEFORE INSERT OR UPDATE OF latitud, longitud ON proyectos
  FOR EACH ROW
  EXECUTE FUNCTION sync_ubicacion_geo();

-- Trigger para puntos topográficos
DROP TRIGGER IF EXISTS trigger_sync_ubicacion_punto ON puntos_topograficos;
CREATE TRIGGER trigger_sync_ubicacion_punto
  BEFORE INSERT OR UPDATE OF latitud, longitud ON puntos_topograficos
  FOR EACH ROW
  EXECUTE FUNCTION sync_ubicacion_geo();

-- Índices espaciales (GIST) para consultas rápidas de radio/distancia
CREATE INDEX IF NOT EXISTS idx_proyectos_ubicacion_geo ON proyectos USING GIST (ubicacion_geo);
CREATE INDEX IF NOT EXISTS idx_puntos_ubicacion_geo ON puntos_topograficos USING GIST (ubicacion_geo);