export interface JobApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  designation: string;
  subject?: string;
  other_designation?: string;
  experience_years: number;
  qualifications: string;
  district: string;
  address: string;
  cv_file_path?: string;
  cover_letter?: string;
  created_at: string;
  updated_at?: string;
}

export interface JobApplicationFormData {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  designation: string;
  subject?: string;
  other_designation?: string;
  experience_years: number;
  qualifications: string;
  district: string;
  address: string;
  previous_experience?: string;
  why_join: string;
  cv_file?: File;
  cover_letter?: string;
}

export interface JobApplicationFilters {
  name: string;
  designation: string;
  subject: string;
  mobile: string;
  email: string;
  district: string;
}

export interface BulkImportResult {
  success_count: number;
  error_count: number;
  errors: string[];
}

export interface ColumnMapping {
  [key: string]: string;
}

export const REQUIRED_COLUMNS = [
  'full_name',
  'email', 
  'phone',
  'designation',
  'experience_years',
  'qualifications',
  'district',
  'address'
] as const;

export const OPTIONAL_COLUMNS = [
  'subject',
  'other_designation', 
  'cover_letter'
] as const;

export type RequiredColumn = typeof REQUIRED_COLUMNS[number];
export type OptionalColumn = typeof OPTIONAL_COLUMNS[number];
export type ImportColumn = RequiredColumn | OptionalColumn;