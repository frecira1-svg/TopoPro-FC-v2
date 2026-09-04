export type TipoPublicacion = 'NOTICIA' | 'COMUNIDAD';

export interface UsuarioPublicacion {

    id: number;

    nombre: string;

    apellido?: string;

    foto?: string | null;

}

export interface Comentario {

    id: number;

    contenido: string;

    usuarioId: number;

    publicacionId: number;

    createdAt: string;

    usuario: UsuarioPublicacion;

}

export interface PublicacionImagen {
    id: number;
    url: string;
    publicId?: string | null;
    nombre?: string | null;
    orden: number;
}

export interface Publicacion {

    id: number;

    titulo: string;

    contenido: string;

    tipo: TipoPublicacion;

    imagen?: string;
    imagenes?: PublicacionImagen[];

    usuarioId: number;

    createdAt: string;

    updatedAt: string;

    tipoTrabajo?: string;
    ubicacion?: string;
    etiquetas?: string;

    usuario: UsuarioPublicacion;

    comentarios?: Comentario[];

    _count?: {

        comentarios: number;

    };

}

export interface PublicacionRequest {

    titulo: string;

    contenido: string;

    tipo?: TipoPublicacion;

    imagen?: string;
    imagenArchivo?: File;
    imagenesArchivos?: File[];
    tipoTrabajo?: string;
    ubicacion?: string;
    etiquetas?: string;

}

export interface ComentarioRequest {

    contenido: string;

}
