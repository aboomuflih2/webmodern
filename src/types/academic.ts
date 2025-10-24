// Academic Manager Type Definitions
// Based on Technical Architecture Document

export interface AcademicProgram {
  id: string;
  program_title: string;
  short_description: string;
  full_description: string;
  main_image: string | null;
  category: 'pre-school' | 'primary' | 'up-school' | 'high-school' | 'higher-secondary' | 'competitive';
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramFormData {
  program_title: string;
  short_description: string;
  full_description: string;
  category: string;
  is_active: boolean;
  main_image?: string | null;
  image_file?: File;
}

export interface ImageUploadResponse {
  url: string;
  path: string;
  size: number;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  table_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  created_at: string;
}

export interface ProgramFilters {
  category?: string;
  is_active?: boolean;
  search?: string;
}

export interface ProgramSortOptions {
  field: 'program_title' | 'category' | 'created_at' | 'updated_at' | 'display_order';
  direction: 'asc' | 'desc';
}

export const PROGRAM_CATEGORIES = [
  { value: 'pre-school', label: 'Pre-School' },
  { value: 'primary', label: 'Primary School' },
  { value: 'up-school', label: 'Upper Primary School' },
  { value: 'high-school', label: 'High School' },
  { value: 'higher-secondary', label: 'Higher Secondary' },
  { value: 'competitive', label: 'Competitive Coaching' }
] as const;

export const VALIDATION_RULES = {
  program_title: {
    required: 'Program title is required',
    minLength: { value: 3, message: 'Program title must be at least 3 characters' },
    maxLength: { value: 255, message: 'Program title must not exceed 255 characters' }
  },
  short_description: {
    required: 'Short description is required',
    minLength: { value: 10, message: 'Short description must be at least 10 characters' },
    maxLength: { value: 500, message: 'Short description must not exceed 500 characters' }
  },
  full_description: {
    required: 'Full description is required',
    minLength: { value: 50, message: 'Full description must be at least 50 characters' },
    maxLength: { value: 5000, message: 'Full description must not exceed 5000 characters' }
  },
  category: {
    required: 'Category is required'
  },
  image_file: {
    maxSize: { value: 5 * 1024 * 1024, message: 'Image size must not exceed 5MB' },
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  }
} as const;
