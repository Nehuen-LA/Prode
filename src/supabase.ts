import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase. Verificá el archivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para la base de datos
export interface Database {
  prode_users: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
  };
  prode_rounds: {
    id: string;
    round_number: number;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    is_completed: boolean;
    created_at: string;
  };
  prode_matches: {
    id: string;
    round_id: string;
    home_team: string;
    away_team: string;
    home_score: number | null;
    away_score: number | null;
    match_date: string;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
  };
  prode_predictions: {
    id: string;
    user_id: string;
    match_id: string;
    predicted_home_score: number;
    predicted_away_score: number;
    points_earned: number;
    created_at: string;
    updated_at: string;
  };
  prode_scores: {
    id: string;
    user_id: string;
    round_id: string;
    total_points: number;
    rank: number | null;
    created_at: string;
    updated_at: string;
  };
}
