// Refleja supabase/migrations. Regenerar con `supabase gen types typescript` cuando haya CLI.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type TipoEtapaDB = "abierta" | "ganada" | "perdida";

export interface Database {
  public: {
    Tables: {
      etapas_embudo: {
        Row: {
          id: string;
          asesor_id: string;
          nombre: string;
          orden: number;
          tipo: TipoEtapaDB;
          created_at: string;
        };
        Insert: {
          id?: string;
          asesor_id?: string;
          nombre: string;
          orden: number;
          tipo?: TipoEtapaDB;
          created_at?: string;
        };
        Update: {
          nombre?: string;
          orden?: number;
          tipo?: TipoEtapaDB;
        };
        Relationships: [];
      };
      prospectos: {
        Row: {
          id: string;
          asesor_id: string;
          etapa_id: string;
          nombre: string;
          rut: string;
          telefono: string;
          email: string | null;
          edad: number | null;
          renta_imponible_clp: number | null;
          isapre_actual: string | null;
          cargas: Json;
          proximo_contacto: string | null;
          hora_contacto: string | null;
          cerrado_en: string | null;
          uf_cierre: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          asesor_id?: string;
          etapa_id: string;
          nombre: string;
          rut: string;
          telefono: string;
          email?: string | null;
          edad?: number | null;
          renta_imponible_clp?: number | null;
          isapre_actual?: string | null;
          cargas?: Json;
          proximo_contacto?: string | null;
          hora_contacto?: string | null;
          cerrado_en?: string | null;
          uf_cierre?: number | null;
        };
        Update: {
          etapa_id?: string;
          nombre?: string;
          rut?: string;
          telefono?: string;
          email?: string | null;
          edad?: number | null;
          renta_imponible_clp?: number | null;
          isapre_actual?: string | null;
          cargas?: Json;
          proximo_contacto?: string | null;
          hora_contacto?: string | null;
          cerrado_en?: string | null;
          uf_cierre?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "prospectos_etapa_id_fkey";
            columns: ["etapa_id"];
            isOneToOne: false;
            referencedRelation: "etapas_embudo";
            referencedColumns: ["id"];
          },
        ];
      };
      notas_prospecto: {
        Row: {
          id: string;
          asesor_id: string;
          prospecto_id: string;
          contenido: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          asesor_id?: string;
          prospecto_id: string;
          contenido: string;
        };
        Update: {
          contenido?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notas_prospecto_prospecto_id_fkey";
            columns: ["prospecto_id"];
            isOneToOne: false;
            referencedRelation: "prospectos";
            referencedColumns: ["id"];
          },
        ];
      };
      cotizaciones: {
        Row: {
          id: string;
          asesor_id: string;
          prospecto_id: string;
          valor_uf: number;
          fecha_uf: string;
          fuente_uf: "mindicador" | "manual";
          tope_imponible_uf: number;
          entrada: Json;
          resultado: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          asesor_id?: string;
          prospecto_id: string;
          valor_uf: number;
          fecha_uf: string;
          fuente_uf: "mindicador" | "manual";
          tope_imponible_uf: number;
          entrada: Json;
          resultado: Json;
        };
        Update: { [_ in never]: never };
        Relationships: [
          {
            foreignKeyName: "cotizaciones_prospecto_id_fkey";
            columns: ["prospecto_id"];
            isOneToOne: false;
            referencedRelation: "prospectos";
            referencedColumns: ["id"];
          },
        ];
      };
      perfiles_asesor: {
        Row: {
          asesor_id: string;
          nombre: string;
          telefono: string | null;
          email: string | null;
          meta_uf_mes: number | null;
          meta_contratos_mes: number | null;
          updated_at: string;
        };
        Insert: {
          asesor_id?: string;
          nombre: string;
          telefono?: string | null;
          email?: string | null;
          meta_uf_mes?: number | null;
          meta_contratos_mes?: number | null;
        };
        Update: {
          nombre?: string;
          telefono?: string | null;
          email?: string | null;
          meta_uf_mes?: number | null;
          meta_contratos_mes?: number | null;
        };
        Relationships: [];
      };
      dispositivos_push: {
        Row: {
          id: string;
          asesor_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          asesor_id?: string;
          endpoint: string;
          p256dh: string;
          auth: string;
        };
        Update: {
          endpoint?: string;
          p256dh?: string;
          auth?: string;
        };
        Relationships: [];
      };
      notificaciones: {
        Row: {
          id: string;
          asesor_id: string;
          tipo: string;
          titulo: string;
          cuerpo: string;
          prospecto_id: string | null;
          dedup: string;
          leida: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          asesor_id?: string;
          tipo: string;
          titulo: string;
          cuerpo: string;
          prospecto_id?: string | null;
          dedup: string;
          leida?: boolean;
        };
        Update: {
          leida?: boolean;
        };
        Relationships: [];
      };
      documentos: {
        Row: {
          id: string;
          asesor_id: string;
          prospecto_id: string;
          nombre: string;
          tipo_doc: string;
          file_path: string;
          mime: string;
          tamano_bytes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          asesor_id?: string;
          prospecto_id: string;
          nombre: string;
          tipo_doc: string;
          file_path: string;
          mime: string;
          tamano_bytes: number;
        };
        Update: {
          nombre?: string;
          tipo_doc?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
