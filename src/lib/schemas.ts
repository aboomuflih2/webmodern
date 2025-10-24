import { z } from 'zod';

// Job Application Form Schema
export const jobApplicationSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s.]+$/, 'Name can only contain letters, spaces, and dots'),
  
  email: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email must not exceed 255 characters'),
  
  mobile: z.string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number starting with 6-9'),
  
  designation: z.string()
    .min(1, 'Please select a designation'),
  
  subject_specification: z.string()
    .optional()
    .refine((val, ctx) => {
      const designation = ctx.parent.designation;
      if (designation === 'Teaching Staff' && (!val || val.trim() === '')) {
        return false;
      }
      return true;
    }, {
      message: 'Subject specification is required for teaching staff'
    }),
  
  specify_other: z.string()
    .optional()
    .refine((val, ctx) => {
      const designation = ctx.parent.designation;
      if (designation === 'Other' && (!val || val.trim() === '')) {
        return false;
      }
      return true;
    }, {
      message: 'Please specify the designation'
    }),
  
  place: z.string()
    .min(2, 'Place must be at least 2 characters')
    .max(100, 'Place must not exceed 100 characters'),
  
  post_office: z.string()
    .min(2, 'Post office must be at least 2 characters')
    .max(100, 'Post office must not exceed 100 characters'),
  
  district: z.string()
    .min(1, 'Please select a district'),
  
  pincode: z.string()
    .regex(/^\d{6}$/, 'Please enter a valid 6-digit pincode'),
  
  cv_file: z.instanceof(File)
    .optional()
    .refine((file) => {
      if (!file) return true; // Optional file
      return file.size <= 10 * 1024 * 1024; // 10MB limit
    }, 'File size must be less than 10MB')
    .refine((file) => {
      if (!file) return true;
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      return allowedTypes.includes(file.type);
    }, 'Only PDF, DOC, and DOCX files are allowed')
});

// Type inference from schema
export type JobApplicationFormData = z.infer<typeof jobApplicationSchema>;

// Designation options
export const designationOptions = [
  'Teaching Staff',
  'Non-Teaching Staff',
  'Administrative Staff',
  'Support Staff',
  'Other'
] as const;

// Subject options for teaching staff
export const subjectOptions = [
  'Mathematics',
  'Science',
  'English',
  'Hindi',
  'Malayalam',
  'Social Science',
  'Computer Science',
  'Physical Education',
  'Art & Craft',
  'Music',
  'Dance',
  'Other'
] as const;

// Kerala districts
export const districtOptions = [
  'Alappuzha',
  'Ernakulam',
  'Idukki',
  'Kannur',
  'Kasaragod',
  'Kollam',
  'Kottayam',
  'Kozhikode',
  'Malappuram',
  'Palakkad',
  'Pathanamthitta',
  'Thiruvananthapuram',
  'Thrissur',
  'Wayanad'
] as const;

// Bulk import schema for admin
export const bulkImportSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => {
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      return allowedTypes.includes(file.type);
    }, 'Only CSV, XLS, and XLSX files are allowed')
    .refine((file) => {
      return file.size <= 5 * 1024 * 1024; // 5MB limit
    }, 'File size must be less than 5MB')
});

export type BulkImportFormData = z.infer<typeof bulkImportSchema>;

// Column mapping schema for bulk import
export const columnMappingSchema = z.object({
  name: z.string().min(1, 'Name column is required'),
  email: z.string().min(1, 'Email column is required'),
  mobile: z.string().min(1, 'Mobile column is required'),
  designation: z.string().min(1, 'Designation column is required'),
  place: z.string().min(1, 'Place column is required'),
  post_office: z.string().min(1, 'Post office column is required'),
  district: z.string().min(1, 'District column is required'),
  pincode: z.string().min(1, 'Pincode column is required'),
  subject_specification: z.string().optional(),
  specify_other: z.string().optional()
});

export type ColumnMappingData = z.infer<typeof columnMappingSchema>;