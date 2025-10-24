import { z } from 'zod';

// Base schema for common fields
const baseGatePassSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  mobile_number: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'),
  email: z.string().email('Please enter a valid email address'),
  address: z.string().min(10, 'Address must be at least 10 characters').max(500, 'Address must be less than 500 characters'),
  purpose: z.string().min(5, 'Purpose must be at least 5 characters').max(200, 'Purpose must be less than 200 characters'),
  designation: z.enum(['parent', 'alumni', 'maintenance', 'other'], {
    errorMap: () => ({ message: 'Please select a valid designation' })
  }),
  id_proof_document: z.string().optional() // File will be handled separately in component
});

// Conditional fields based on designation
const parentFields = z.object({
  student_name: z.string().min(2, 'Student name must be at least 2 characters').max(100, 'Student name must be less than 100 characters'),
  class: z.string().min(1, 'Student class is required').max(20, 'Student class must be less than 20 characters'),
  admission_number: z.string().min(1, 'Admission number is required').max(20, 'Admission number must be less than 20 characters')
});

const otherFields = z.object({
  person_to_meet: z.string().min(2, 'Person to meet must be at least 2 characters').max(100, 'Person to meet must be less than 100 characters')
});

const maintenanceFields = z.object({
  authorized_person: z.string().min(2, 'Authorized person must be at least 2 characters').max(100, 'Authorized person must be less than 100 characters')
});

// Main gate pass form schema with conditional validation
export const gatePassFormSchema = z.discriminatedUnion('designation', [
  baseGatePassSchema.merge(parentFields).extend({ designation: z.literal('parent') }),
  baseGatePassSchema.extend({ designation: z.literal('alumni') }),
  baseGatePassSchema.merge(maintenanceFields).extend({ designation: z.literal('maintenance') }),
  baseGatePassSchema.merge(otherFields).extend({ designation: z.literal('other') })
]);

// Admin update schema
export const adminGatePassUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected'], {
    errorMap: () => ({ message: 'Please select a valid status' })
  }),
  admin_comments: z.string().max(500, 'Comments must be less than 500 characters').optional()
});

// Type inference
export type GatePassFormSchema = z.infer<typeof gatePassFormSchema>;
export type AdminGatePassUpdateSchema = z.infer<typeof adminGatePassUpdateSchema>;