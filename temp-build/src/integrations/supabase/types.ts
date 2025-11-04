export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      academic_programs: {
        Row: {
          created_at: string
          detailed_description: string | null
          display_order: number
          duration: string | null
          full_description: string | null
          icon_image: string | null
          id: string
          is_active: boolean
          main_image: string | null
          program_title: string
          short_description: string
          subjects: string[] | null
          updated_at: string
        }
      job_applications: {
        Row: {
          created_at: string
          cv_file_name: string | null
          cv_file_path: string | null
          designation: string
          district: string
          email: string
          id: string
          mobile: string
          name: string
          pincode: string
          place: string
          post_office: string
          specify_other: string | null
          status: string
          subject_specification: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cv_file_name?: string | null
          cv_file_path?: string | null
          designation: string
          district: string
          email: string
          id?: string
          mobile: string
          name: string
          pincode: string
          place: string
          post_office: string
          specify_other?: string | null
          status?: string
          subject_specification?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cv_file_name?: string | null
          cv_file_path?: string | null
          designation?: string
          district?: string
          email?: string
          id?: string
          mobile?: string
          name?: string
          pincode?: string
          place?: string
          post_office?: string
          specify_other?: string | null
          status?: string
          subject_specification?: string | null
          updated_at?: string
        }
        Relationships: []
      }
        Insert: {
          created_at?: string
          detailed_description?: string | null
          display_order?: number
          duration?: string | null
          full_description?: string | null
          icon_image?: string | null
          id?: string
          is_active?: boolean
          main_image?: string | null
          program_title: string
          short_description: string
          subjects?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          detailed_description?: string | null
          display_order?: number
          duration?: string | null
          full_description?: string | null
          icon_image?: string | null
          id?: string
          is_active?: boolean
          main_image?: string | null
          program_title?: string
          short_description?: string
          subjects?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      admission_forms: {
        Row: {
          academic_year: string
          created_at: string
          form_type: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          academic_year?: string
          created_at?: string
          form_type: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          form_type?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      article_comments: {
        Row: {
          article_id: string
          author_email: string
          author_name: string
          comment_text: string
          created_at: string
          id: string
          is_approved: boolean
          updated_at: string
        }
        Insert: {
          article_id: string
          author_email: string
          author_name: string
          comment_text: string
          created_at?: string
          id?: string
          is_approved?: boolean
          updated_at?: string
        }
        Update: {
          article_id?: string
          author_email?: string
          author_name?: string
          comment_text?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      article_likes: {
        Row: {
          article_id: string
          created_at: string
          id: string
          user_ip: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          user_ip: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          user_ip?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_likes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      breaking_news: {
        Row: {
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          priority: number
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          date_time: string
          description: string
          event_type: string | null
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_time: string
          description: string
          event_type?: string | null
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_time?: string
          description?: string
          event_type?: string | null
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_photos: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          background_image: string | null
          button_link: string
          button_text: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          slide_subtitle: string
          slide_title: string
          updated_at: string
        }
        Insert: {
          background_image?: string | null
          button_link: string
          button_text: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          slide_subtitle: string
          slide_title: string
          updated_at?: string
        }
        Update: {
          background_image?: string | null
          button_link?: string
          button_text?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          slide_subtitle?: string
          slide_title?: string
          updated_at?: string
        }
        Relationships: []
      }
      interview_subject_templates: {
        Row: {
          created_at: string
          display_order: number
          form_type: string
          id: string
          is_active: boolean
          max_marks: number
          subject_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          form_type: string
          id?: string
          is_active?: boolean
          max_marks?: number
          subject_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          form_type?: string
          id?: string
          is_active?: boolean
          max_marks?: number
          subject_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      interview_subjects: {
        Row: {
          application_id: string
          application_type: string
          created_at: string
          id: string
          marks: number | null
          subject_name: string
          updated_at: string
        }
        Insert: {
          application_id: string
          application_type: string
          created_at?: string
          id?: string
          marks?: number | null
          subject_name: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          application_type?: string
          created_at?: string
          id?: string
          marks?: number | null
          subject_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      kg_std_applications: {
        Row: {
          application_number: string
          created_at: string
          date_of_birth: string
          district: string
          email: string | null
          father_name: string
          full_name: string
          gender: string
          has_siblings: boolean | null
          house_name: string
          id: string
          interview_date: string | null
          interview_time: string | null
          mobile_number: string
          mother_name: string
          need_madrassa: boolean | null
          pincode: string
          post_office: string
          previous_madrassa: string | null
          previous_school: string | null
          siblings_names: string | null
          stage: string
          status: string
          updated_at: string
          village: string
        }
        Insert: {
          application_number: string
          created_at?: string
          date_of_birth: string
          district: string
          email?: string | null
          father_name: string
          full_name: string
          gender: string
          has_siblings?: boolean | null
          house_name: string
          id?: string
          interview_date?: string | null
          interview_time?: string | null
          mobile_number: string
          mother_name: string
          need_madrassa?: boolean | null
          pincode: string
          post_office: string
          previous_madrassa?: string | null
          previous_school?: string | null
          siblings_names?: string | null
          stage: string
          status?: string
          updated_at?: string
          village: string
        }
        Update: {
          application_number?: string
          created_at?: string
          date_of_birth?: string
          district?: string
          email?: string | null
          father_name?: string
          full_name?: string
          gender?: string
          has_siblings?: boolean | null
          house_name?: string
          id?: string
          interview_date?: string | null
          interview_time?: string | null
          mobile_number?: string
          mother_name?: string
          need_madrassa?: boolean | null
          pincode?: string
          post_office?: string
          previous_madrassa?: string | null
          previous_school?: string | null
          siblings_names?: string | null
          stage?: string
          status?: string
          updated_at?: string
          village?: string
        }
        Relationships: []
      }
      leadership_messages: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          message_content: string
          person_name: string
          person_title: string
          photo_url: string | null
          position: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          message_content: string
          person_name: string
          person_title: string
          photo_url?: string | null
          position: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          message_content?: string
          person_name?: string
          person_title?: string
          photo_url?: string | null
          position?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_posts: {
        Row: {
          author: string
          content: string
          created_at: string
          excerpt: string
          featured_image: string | null
          id: string
          is_published: boolean
          like_count: number
          publication_date: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author: string
          content: string
          created_at?: string
          excerpt: string
          featured_image?: string | null
          id?: string
          is_published?: boolean
          like_count?: number
          publication_date?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          content?: string
          created_at?: string
          excerpt?: string
          featured_image?: string | null
          id?: string
          is_published?: boolean
          like_count?: number
          publication_date?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_content: {
        Row: {
          content: string
          created_at: string
          id: string
          meta_description: string | null
          page_key: string
          page_title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          meta_description?: string | null
          page_key: string
          page_title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          meta_description?: string | null
          page_key?: string
          page_title?: string
          updated_at?: string
        }
        Relationships: []
      }
      plus_one_applications: {
        Row: {
          application_number: string
          board: string
          created_at: string
          date_of_birth: string
          district: string
          email: string | null
          exam_roll_number: string
          exam_year: string
          father_name: string
          full_name: string
          gender: string
          has_siblings: boolean | null
          house_name: string
          id: string
          interview_date: string | null
          interview_time: string | null
          landmark: string | null
          mobile_number: string
          mother_name: string
          pincode: string
          post_office: string
          siblings_names: string | null
          status: string
          stream: string
          tenth_school: string
          updated_at: string
          village: string
        }
        Insert: {
          application_number: string
          board: string
          created_at?: string
          date_of_birth: string
          district: string
          email?: string | null
          exam_roll_number: string
          exam_year: string
          father_name: string
          full_name: string
          gender: string
          has_siblings?: boolean | null
          house_name: string
          id?: string
          interview_date?: string | null
          interview_time?: string | null
          landmark?: string | null
          mobile_number: string
          mother_name: string
          pincode: string
          post_office: string
          siblings_names?: string | null
          status?: string
          stream: string
          tenth_school: string
          updated_at?: string
          village: string
        }
        Update: {
          application_number?: string
          board?: string
          created_at?: string
          date_of_birth?: string
          district?: string
          email?: string | null
          exam_roll_number?: string
          exam_year?: string
          father_name?: string
          full_name?: string
          gender?: string
          has_siblings?: boolean | null
          house_name?: string
          id?: string
          interview_date?: string | null
          interview_time?: string | null
          landmark?: string | null
          mobile_number?: string
          mother_name?: string
          pincode?: string
          post_office?: string
          siblings_names?: string | null
          status?: string
          stream?: string
          tenth_school?: string
          updated_at?: string
          village?: string
        }
        Relationships: []
      }
      school_features: {
        Row: {
          created_at: string
          display_order: number
          feature_description: string
          feature_title: string
          icon_name: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          feature_description: string
          feature_title: string
          icon_name: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          feature_description?: string
          feature_title?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      school_stats: {
        Row: {
          created_at: string
          display_order: number
          icon_name: string
          id: string
          is_active: boolean
          label: string
          suffix: string | null
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon_name?: string
          id?: string
          is_active?: boolean
          label: string
          suffix?: string | null
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          display_order?: number
          icon_name?: string
          id?: string
          is_active?: boolean
          label?: string
          suffix?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      social_media_links: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          platform: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          platform: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          platform?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      staff_counts: {
        Row: {
          created_at: string
          guides_staff: number
          id: string
          professional_staff: number
          security_staff: number
          teaching_staff: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          guides_staff?: number
          id?: string
          professional_staff?: number
          security_staff?: number
          teaching_staff?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          guides_staff?: number
          id?: string
          professional_staff?: number
          security_staff?: number
          teaching_staff?: number
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          person_name: string
          photo: string | null
          quote: string
          rating: number | null
          relation: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          person_name: string
          photo?: string | null
          quote: string
          rating?: number | null
          relation: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          person_name?: string
          photo?: string | null
          quote?: string
          rating?: number | null
          relation?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          created_at: string
          cv_file_name: string | null
          cv_file_path: string | null
          designation: string
          district: string
          email: string
          id: string
          mobile: string
          name: string
          pincode: string
          place: string
          post_office: string
          specify_other: string | null
          status: string
          subject_specification: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cv_file_name?: string | null
          cv_file_path?: string | null
          designation: string
          district: string
          email: string
          id?: string
          mobile: string
          name: string
          pincode: string
          place: string
          post_office: string
          specify_other?: string | null
          status?: string
          subject_specification?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cv_file_name?: string | null
          cv_file_path?: string | null
          designation?: string
          district?: string
          email?: string
          id?: string
          mobile?: string
          name?: string
          pincode?: string
          place?: string
          post_office?: string
          specify_other?: string | null
          status?: string
          subject_specification?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
