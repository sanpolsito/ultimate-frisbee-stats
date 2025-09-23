import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseKey ? 'present' : 'missing'
  })
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Tipos de base de datos
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          city: string | null
          logo: string | null
          founded: number | null
          coach: string | null
          category: 'masculina' | 'femenina' | 'mixta'
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          city?: string | null
          logo?: string | null
          founded?: number | null
          coach?: string | null
          category: 'masculina' | 'femenina' | 'mixta'
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          city?: string | null
          logo?: string | null
          founded?: number | null
          coach?: string | null
          category?: 'masculina' | 'femenina' | 'mixta'
          created_by?: string
          created_at?: string
        }
      }
      team_players: {
        Row: {
          id: string
          team_id: string
          name: string
          number: number | null
          position: string | null
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          name: string
          number?: number | null
          position?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          name?: string
          number?: number | null
          position?: string | null
          created_at?: string
        }
      }
      games: {
        Row: {
          id: string
          team_a: string
          team_b: string
          score_a: number
          score_b: number
          date: string
          is_active: boolean
          start_time: string | null
          game_time_elapsed: number
          config: any
          soft_cap_reached: boolean
          hard_cap_reached: boolean
          is_halftime: boolean
          profile: 'planillero' | 'coach'
          is_mixed_game: boolean
          current_point_gender: 'masculino' | 'femenino' | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          team_a: string
          team_b: string
          score_a?: number
          score_b?: number
          date: string
          is_active?: boolean
          start_time?: string | null
          game_time_elapsed?: number
          config: any
          soft_cap_reached?: boolean
          hard_cap_reached?: boolean
          is_halftime?: boolean
          profile: 'planillero' | 'coach'
          is_mixed_game?: boolean
          current_point_gender?: 'masculino' | 'femenino' | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          team_a?: string
          team_b?: string
          score_a?: number
          score_b?: number
          date?: string
          is_active?: boolean
          start_time?: string | null
          game_time_elapsed?: number
          config?: any
          soft_cap_reached?: boolean
          hard_cap_reached?: boolean
          is_halftime?: boolean
          profile?: 'planillero' | 'coach'
          is_mixed_game?: boolean
          current_point_gender?: 'masculino' | 'femenino' | null
          created_by?: string
          created_at?: string
        }
      }
      game_players: {
        Row: {
          id: string
          game_id: string
          player_id: string | null
          name: string
          team: string
          points: number
          assists: number
          drops: number
          blocks: number
          turnovers: number
          pools: number
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id?: string | null
          name: string
          team: string
          points?: number
          assists?: number
          drops?: number
          blocks?: number
          turnovers?: number
          pools?: number
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string | null
          name?: string
          team?: string
          points?: number
          assists?: number
          drops?: number
          blocks?: number
          turnovers?: number
          pools?: number
          created_at?: string
        }
      }
      stat_events: {
        Row: {
          id: string
          game_id: string
          player_id: string
          type: 'point' | 'assist' | 'drop' | 'block' | 'turnover' | 'throw_away' | 'pool'
          minute: number
          second: number
          timestamp: number
          pool_duration: number | null
          pool_result: 'in' | 'out' | null
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          type: 'point' | 'assist' | 'drop' | 'block' | 'turnover' | 'throw_away' | 'pool'
          minute: number
          second: number
          timestamp: number
          pool_duration?: number | null
          pool_result?: 'in' | 'out' | null
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string
          type?: 'point' | 'assist' | 'drop' | 'block' | 'turnover' | 'throw_away' | 'pool'
          minute?: number
          second?: number
          timestamp?: number
          pool_duration?: number | null
          pool_result?: 'in' | 'out' | null
          created_at?: string
        }
      }
    }
  }
}
