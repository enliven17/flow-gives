export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          title: string
          description: string
          funding_goal: number
          total_raised: number
          contributor_count: number
          fundraiser_address: string
          status: 'draft' | 'active' | 'funded' | 'expired' | 'cancelled'
          deadline: string
          image_url: string | null
          category: string | null
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          funding_goal: number
          total_raised?: number
          contributor_count?: number
          fundraiser_address: string
          status?: 'draft' | 'active' | 'funded' | 'expired' | 'cancelled'
          deadline: string
          image_url?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          funding_goal?: number
          total_raised?: number
          contributor_count?: number
          fundraiser_address?: string
          status?: 'draft' | 'active' | 'funded' | 'expired' | 'cancelled'
          deadline?: string
          image_url?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
      }
      contributions: {
        Row: {
          id: string
          project_id: string
          contributor_address: string
          amount: number
          tx_hash: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          contributor_address: string
          amount: number
          tx_hash: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          contributor_address?: string
          amount?: number
          tx_hash?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          project_id: string
          author_address: string
          content: string
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          author_address: string
          content: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          author_address?: string
          content?: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          wallet_address: string
          created_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          created_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
