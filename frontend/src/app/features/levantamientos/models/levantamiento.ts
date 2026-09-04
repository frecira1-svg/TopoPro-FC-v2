export interface Levantamiento {
id?: number;

fecha: string;

descripcion?: string | null;

observaciones?: string | null;

estado: string;

proyectoId: number;

equipoId?: number | null;

responsableId?: number;

createdAt?: string;

updatedAt?: string;

proyecto?: {
id: number;
nombre: string;
};

equipo?: {
id: number;
nombre: string;
} | null;

responsable?: {
id: number;
nombre: string;
apellido: string;
};
}
