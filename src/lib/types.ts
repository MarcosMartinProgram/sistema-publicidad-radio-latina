/** Estructura de la base de datos en Supabase (Postgres). */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          nombre: string;
          rol: "admin" | "operador";
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          nombre?: string;
          rol?: "admin" | "operador";
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nombre?: string;
          rol?: "admin" | "operador";
          created_at?: string;
        };
        Relationships: [];
      };
      clientes: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          telefono: string;
          email: string | null;
          cuit: string | null;
          notas: string | null;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nombre: string;
          telefono: string;
          email?: string | null;
          cuit?: string | null;
          notas?: string | null;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nombre?: string;
          telefono?: string;
          email?: string | null;
          cuit?: string | null;
          notas?: string | null;
          activo?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      pautas: {
        Row: {
          id: string;
          user_id: string;
          cliente_id: string;
          nombre: string;
          pases: number;
          tarifa: number;
          fecha_inicio: string;
          fecha_fin: string;
          estado: "activa" | "pausada" | "finalizada";
          monto_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cliente_id: string;
          nombre: string;
          pases: number;
          tarifa: number;
          fecha_inicio: string;
          fecha_fin: string;
          estado?: "activa" | "pausada" | "finalizada";
          monto_total?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cliente_id?: string;
          nombre?: string;
          pases?: number;
          tarifa?: number;
          fecha_inicio?: string;
          fecha_fin?: string;
          estado?: "activa" | "pausada" | "finalizada";
          monto_total?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      cobros: {
        Row: {
          id: string;
          user_id: string;
          pauta_id: string;
          monto: number;
          metodo: "efectivo" | "transferencia" | "mercadopago" | "otro";
          fecha_pago: string;
          estado: "pendiente" | "aprobado" | "vencido";
          fecha_vencimiento: string;
          nro_recibo: string | null;
          nota: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pauta_id: string;
          monto: number;
          metodo: "efectivo" | "transferencia" | "mercadopago" | "otro";
          fecha_pago?: string;
          estado?: "pendiente" | "aprobado" | "vencido";
          fecha_vencimiento?: string;
          nro_recibo?: string | null;
          nota?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          pauta_id?: string;
          monto?: number;
          metodo?: "efectivo" | "transferencia" | "mercadopago" | "otro";
          fecha_pago?: string;
          estado?: "pendiente" | "aprobado" | "vencido";
          fecha_vencimiento?: string;
          nro_recibo?: string | null;
          nota?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

/** Tipos de dominio para la app (más cómodos de usar). */
export type Cliente = Database["public"]["Tables"]["clientes"]["Row"];
export type Pauta = Database["public"]["Tables"]["pautas"]["Row"];
export type Cobro = Database["public"]["Tables"]["cobros"]["Row"];
export type Perfil = Database["public"]["Tables"]["profiles"]["Row"];

export type PautaConCliente = Pauta & { clientes: Pick<Cliente, "nombre" | "telefono"> | null };
export type CobroConPauta = Cobro & {
  pautas:
    | (Pick<Pauta, "nombre"> & {
        clientes: Pick<Cliente, "nombre" | "telefono" | "cuit"> | null;
      })
    | null;
};
