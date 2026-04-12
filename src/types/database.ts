// Auto-generated Supabase types - regenerate with:
// npx supabase gen types typescript --project-id kbfolxwbrjpajylkphwl > src/types/database.ts
// Last synced from live Supabase schema: 2026-03-02

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Supabase enums
export type CertificationLevel = 'EMT' | 'AEMT' | 'Paramedic'
export type ItemType = 'MC' | 'MR' | 'BL' | 'DD' | 'OB' | 'CL'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type MembershipTier = 'pro' | 'max'
export type MemberStatus = 'active' | 'inactive' | 'trial' | 'expired'

export type Database = {
  public: {
    Tables: {
      students: {
        Row: {
          id: string
          user_id: string
          email: string
          full_name: string | null
          certification_level: CertificationLevel | null
          target_exam_date: string | null
          program_name: string | null
          membership_tier: MembershipTier | null
          member_status: MemberStatus | null
          stripe_customer_id: string | null
          questions_used_this_period: number | null
          questions_limit: number | null
          exams_taken_this_period: number | null
          total_questions_answered: number | null
          total_correct: number | null
          current_streak_days: number | null
          longest_streak_days: number | null
          last_activity_date: string | null
          preferred_question_count: number | null
          show_rationales_immediately: boolean | null
          created_at: string
          updated_at: string | null
          role: string | null
        }
        Insert: Partial<Database['public']['Tables']['students']['Row']> & { user_id: string; email: string }
        Update: Partial<Database['public']['Tables']['students']['Row']>
      }
      questions: {
        Row: {
          id: string
          item_code: string | null
          level: CertificationLevel
          domain_id: string
          item_type: ItemType
          difficulty: Difficulty | null
          stem: string
          scenario_context: string | null
          instructions: string | null
          options: Json
          correct_answer: Json
          rationale_correct: string
          rationales_distractors: Json | null
          cj_steps: string[] | null
          scenario_id: string | null
          scenario_phase: string | null
          embedding: unknown | null
          source_info: string | null
          reference_sources: Json | null
          is_active: boolean | null
          is_validated: boolean | null
          use_count: number | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          ecg_strip_id: string | null
          image_url: string | null
        }
        Insert: Partial<Database['public']['Tables']['questions']['Row']> & {
          level: CertificationLevel
          domain_id: string
          item_type: ItemType
          stem: string
          options: Json
          correct_answer: Json
          rationale_correct: string
        }
        Update: Partial<Database['public']['Tables']['questions']['Row']>
      }
      ecg_strips: {
        Row: {
          id: string
          rhythm_type: string
          rhythm_label: string
          description: string | null
          storage_path: string
          image_url: string
          source_record_id: string | null
          source_dataset: string | null
          source_license: string | null
          leads_shown: string | null
          difficulty: Difficulty | null
          tags: Json
          use_count: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['ecg_strips']['Row']> & {
          rhythm_type: string
          rhythm_label: string
          storage_path: string
          image_url: string
        }
        Update: Partial<Database['public']['Tables']['ecg_strips']['Row']>
      }
      exam_sessions: {
        Row: {
          id: string
          student_id: string
          certification_level: CertificationLevel | null
          question_count: number | null
          domains: string[] | null
          item_types: string[] | null
          difficulties: string[] | null
          mode: string | null
          status: string | null
          started_at: string | null
          completed_at: string | null
          total_correct: number | null
          score_percentage: number | null
          domain_stats: Json | null
          item_type_stats: Json | null
          cj_step_stats: Json | null
          time_spent_seconds: number | null
        }
        Insert: Partial<Database['public']['Tables']['exam_sessions']['Row']> & { student_id: string }
        Update: Partial<Database['public']['Tables']['exam_sessions']['Row']>
      }
      instructors: {
        Row: {
          id: string
          user_id: string
          email: string
          full_name: string | null
          institution: string | null
          role: string | null
          stripe_customer_id: string | null
          subscription_status: string | null
          subscription_plan: string | null
          max_students: number | null
          created_at: string
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['instructors']['Row']> & { user_id: string; email: string }
        Update: Partial<Database['public']['Tables']['instructors']['Row']>
      }
      classes: {
        Row: {
          id: string
          instructor_id: string
          name: string
          certification_level: CertificationLevel | null
          description: string | null
          enrollment_code: string | null
          is_active: boolean | null
          max_students: number | null
          created_at: string
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['classes']['Row']> & { instructor_id: string; name: string }
        Update: Partial<Database['public']['Tables']['classes']['Row']>
      }
      class_enrollments: {
        Row: {
          id: string
          class_id: string
          student_id: string
          enrolled_at: string
          status: string | null
        }
        Insert: Partial<Database['public']['Tables']['class_enrollments']['Row']> & { class_id: string; student_id: string }
        Update: Partial<Database['public']['Tables']['class_enrollments']['Row']>
      }
      domains: {
        Row: {
          id: string
          level: CertificationLevel
          name: string
          description: string | null
          percentage_min: number | null
          percentage_max: number | null
          display_order: number | null
          created_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['domains']['Row']> & { name: string; level: CertificationLevel }
        Update: Partial<Database['public']['Tables']['domains']['Row']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      certification_level: CertificationLevel
      item_type: ItemType
      difficulty: Difficulty
      membership_tier: MembershipTier
      member_status: MemberStatus
    }
  }
}

// Convenience type aliases
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Shorthand exports
export type Student = Tables<'students'>
export type Question = Tables<'questions'>
export type ExamSession = Tables<'exam_sessions'>
export type Domain = Tables<'domains'>
export type Instructor = Tables<'instructors'>
export type Class = Tables<'classes'>
export type ClassEnrollment = Tables<'class_enrollments'>
