export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TextCategory = "names_places" | "currencies" | "date_time" | "custom";
export type ReportStatus = "draft" | "generating" | "completed";
export type Provider = "heypixa" | "elevenlabs";
export type Winner = "heypixa" | "elevenlabs" | "tie";
export type ElevenLabsModel = "eleven_v3" | "eleven_flash_v2_5" | "eleven_turbo_v2_5";

export interface Database {
  public: {
    Tables: {
      reports: {
        Row: {
          id: string;
          user_id: string;
          elevenlabs_model: ElevenLabsModel;
          status: ReportStatus;
          winner: Winner | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          elevenlabs_model: ElevenLabsModel;
          status?: ReportStatus;
          winner?: Winner | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          elevenlabs_model?: ElevenLabsModel;
          status?: ReportStatus;
          winner?: Winner | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      report_texts: {
        Row: {
          id: string;
          report_id: string;
          category: TextCategory;
          text_content: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          report_id: string;
          category: TextCategory;
          text_content: string;
          order_index: number;
        };
        Update: {
          id?: string;
          report_id?: string;
          category?: TextCategory;
          text_content?: string;
          order_index?: number;
        };
      };
      audio_samples: {
        Row: {
          id: string;
          report_text_id: string;
          provider: Provider;
          sample_index: number;
          audio_base64: string;
          mime_type: string;
          ttfb: number | null;
          latency: number | null;
        };
        Insert: {
          id?: string;
          report_text_id: string;
          provider: Provider;
          sample_index: number;
          audio_base64: string;
          mime_type: string;
          ttfb?: number | null;
          latency?: number | null;
        };
        Update: {
          id?: string;
          report_text_id?: string;
          provider?: Provider;
          sample_index?: number;
          audio_base64?: string;
          mime_type?: string;
          ttfb?: number | null;
          latency?: number | null;
        };
      };
      critique_results: {
        Row: {
          id: string;
          report_id: string;
          report_json: Json;
        };
        Insert: {
          id?: string;
          report_id: string;
          report_json: Json;
        };
        Update: {
          id?: string;
          report_id?: string;
          report_json?: Json;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// Helper types for working with the database
export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"];
export type ReportText = Database["public"]["Tables"]["report_texts"]["Row"];
export type ReportTextInsert = Database["public"]["Tables"]["report_texts"]["Insert"];
export type AudioSampleDB = Database["public"]["Tables"]["audio_samples"]["Row"];
export type AudioSampleInsert = Database["public"]["Tables"]["audio_samples"]["Insert"];
export type CritiqueResult = Database["public"]["Tables"]["critique_results"]["Row"];
export type CritiqueResultInsert = Database["public"]["Tables"]["critique_results"]["Insert"];
