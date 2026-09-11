import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para la base de datos
export interface User {
  id: string
  email: string
  full_name?: string
  nickname?: string
  avatar_url?: string
  role?: string
  created_at?: string
}

export interface Round {
  id: string
  round_number: number
  name: string
  start_date: string
  end_date: string
  close_date?: string
  status: 'open' | 'closed' | 'completed'
  is_active: boolean
  is_completed: boolean
  is_test: boolean
  created_at: string
}

export interface Match {
  id: string
  round_id: string
  home_team: string
  away_team: string
  home_score?: number
  away_score?: number
  result_home?: number
  result_away?: number
  match_date: string
  is_completed: boolean
  is_valid: boolean
  created_at: string
  updated_at: string
}

export interface Prediction {
  id: string
  user_id: string
  match_id: string
  predicted_home_score: number
  predicted_away_score: number
  points_earned: number
  total_hits: number
  prediction_data?: any
  name?: string
  payment_status: string
  receipt?: string
  receipt_name?: string
  transfer_notified: boolean
  created_at: string
  updated_at: string
}

export interface Score {
  id: string
  user_id: string
  round_id: string
  total_points: number
  rank?: number
  created_at: string
  updated_at: string
}

export interface Settings {
  id: string
  entry_fee: number
  max_predictions_per_user: number
  created_at: string
  updated_at: string
}

export interface Prize {
  id: string
  user_id: string
  round_id: string
  winning_prediction_id?: string
  amount: number
  status: string
  cbu_alias?: string
  claimed_at?: string
  paid_at?: string
  created_at: string
}

// Funciones de utilidad para la API
export const api = {
  // Auth
  async signUp(email: string, password: string, fullName?: string, nickname?: string) {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          nickname: nickname || email.split('@')[0]
        }
      }
    })
  },

  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password
    })
  },

  async signOut() {
    return await supabase.auth.signOut()
  },

  async getSession() {
    return await supabase.auth.getSession()
  },

  async getUser() {
    return await supabase.auth.getUser()
  },

  // Users
  async getUsers() {
    return await supabase
      .from('prode_users')
      .select('id, email, full_name, nickname, avatar_url, role, created_at')
      .order('created_at', { ascending: false })
  },

  async getUserById(id: string) {
    return await supabase
      .from('prode_users')
      .select('*')
      .eq('id', id)
      .single()
  },

  async updateUser(id: string, data: Partial<User>) {
    return await supabase
      .from('prode_users')
      .update(data)
      .eq('id', id)
  },

  // Rounds
  async getRounds() {
    return await supabase
      .from('prode_rounds')
      .select('*')
      .order('round_number', { ascending: true })
  },

  async getRoundById(id: string) {
    return await supabase
      .from('prode_rounds')
      .select('*')
      .eq('id', id)
      .single()
  },

  async createRound(data: Omit<Round, 'id' | 'created_at'>) {
    return await supabase
      .from('prode_rounds')
      .insert(data)
      .select()
      .single()
  },

  async updateRound(id: string, data: Partial<Round>) {
    return await supabase
      .from('prode_rounds')
      .update(data)
      .eq('id', id)
      .select()
      .single()
  },

  async deleteRound(id: string) {
    return await supabase
      .from('prode_rounds')
      .delete()
      .eq('id', id)
  },

  // Matches
  async getMatches(roundId?: string) {
    let query = supabase
      .from('prode_matches')
      .select('*, prode_rounds(name)')
      .order('match_date', { ascending: true })

    if (roundId) {
      query = query.eq('round_id', roundId)
    }

    return await query
  },

  async getMatchById(id: string) {
    return await supabase
      .from('prode_matches')
      .select('*, prode_rounds(name)')
      .eq('id', id)
      .single()
  },

  async createMatch(data: Omit<Match, 'id' | 'created_at' | 'updated_at'>) {
    return await supabase
      .from('prode_matches')
      .insert(data)
      .select()
      .single()
  },

  async updateMatch(id: string, data: Partial<Match>) {
    return await supabase
      .from('prode_matches')
      .update(data)
      .eq('id', id)
      .select()
      .single()
  },

  async deleteMatch(id: string) {
    return await supabase
      .from('prode_matches')
      .delete()
      .eq('id', id)
  },

  // Predictions
  async getPredictions(userId?: string, roundId?: string) {
    let query = supabase
      .from('prode_predictions')
      .select(`
        *,
        prode_matches (
          id,
          home_team,
          away_team,
          home_score,
          away_score,
          result_home,
          result_away,
          is_completed,
          match_date,
          prode_rounds (name)
        ),
        prode_users (nickname, full_name)
      `)
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (roundId) {
      query = query.in('match_id', 
        (await supabase.from('prode_matches').select('id').eq('round_id', roundId)).data?.map(m => m.id) || []
      )
    }

    return await query
  },

  async createPrediction(data: Omit<Prediction, 'id' | 'created_at' | 'updated_at' | 'points_earned' | 'total_hits'>) {
    // Verificar si ya existe una predicción para este usuario y partido
    const existing = await supabase
      .from('prode_predictions')
      .select('id')
      .eq('user_id', data.user_id)
      .eq('match_id', data.match_id)
      .single()

    if (existing.data) {
      return await this.updatePrediction(existing.data.id, {
        predicted_home_score: data.predicted_home_score,
        predicted_away_score: data.predicted_away_score
      })
    }

    return await supabase
      .from('prode_predictions')
      .insert(data)
      .select()
      .single()
  },

  async updatePrediction(id: string, data: Partial<Prediction>) {
    return await supabase
      .from('prode_predictions')
      .update(data)
      .eq('id', id)
      .select()
      .single()
  },

  async deletePrediction(id: string) {
    return await supabase
      .from('prode_predictions')
      .delete()
      .eq('id', id)
  },

  // Scores
  async getScores(roundId?: string) {
    let query = supabase
      .from('prode_scores')
      .select(`
        *,
        prode_users (nickname, full_name, avatar_url),
        prode_rounds (name, round_number)
      `)
      .order('total_points', { ascending: false })

    if (roundId) {
      query = query.eq('round_id', roundId)
    }

    return await query
  },

  async getMyScore(userId: string, roundId?: string) {
    let query = supabase
      .from('prode_scores')
      .select(`
        *,
        prode_users (nickname, full_name, avatar_url),
        prode_rounds (name, round_number)
      `)
      .eq('user_id', userId)

    if (roundId) {
      query = query.eq('round_id', roundId)
    }

    return await query.single()
  },

  // Settings
  async getSettings() {
    return await supabase
      .from('prode_settings')
      .select('*')
      .single()
  },

  async updateSettings(data: Partial<Settings>) {
    const settings = await this.getSettings()
    
    if (settings.data) {
      return await supabase
        .from('prode_settings')
        .update(data)
        .eq('id', settings.data.id)
        .select()
        .single()
    } else {
      return await supabase
        .from('prode_settings')
        .insert(data as any)
        .select()
        .single()
    }
  },

  // Prizes
  async getPrizes(roundId?: string) {
    let query = supabase
      .from('prode_prizes')
      .select(`
        *,
        prode_users (nickname, full_name, email),
        prode_rounds (name, round_number)
      `)
      .order('created_at', { ascending: false })

    if (roundId) {
      query = query.eq('round_id', roundId)
    }

    return await query
  },

  async createPrize(data: Omit<Prize, 'id' | 'created_at'>) {
    return await supabase
      .from('prode_prizes')
      .insert(data)
      .select()
      .single()
  },

  async updatePrize(id: string, data: Partial<Prize>) {
    return await supabase
      .from('prode_prizes')
      .update(data)
      .eq('id', id)
      .select()
      .single()
  }
}
