export interface GatePassRequest {
  id: string;
  name: string;
  mobile_number: string;
  email: string;
  address: string;
  purpose: string;
  designation: 'parent' | 'alumni' | 'maintenance' | 'other';
  student_name?: string;
  class?: string;
  admission_number?: string;
  person_to_meet?: string;
  authorized_person?: string;
  id_proof_document_path: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_comments?: string;
  created_at: string;
  updated_at: string;
}

export interface GatePassFormData {
  name: string;
  mobile_number: string;
  email: string;
  address: string;
  purpose: string;
  designation: 'parent' | 'alumni' | 'maintenance' | 'other';
  student_name?: string;
  class?: string;
  admission_number?: string;
  person_to_meet?: string;
  authorized_person?: string;
}

export interface GatePassSubmission {
  name: string;
  mobile_number: string;
  email: string;
  address: string;
  purpose: string;
  designation: string;
  student_name?: string;
  class?: string;
  admission_number?: string;
  person_to_meet?: string;
  authorized_person?: string;
  id_proof_document_path: string;
}

export interface AdminGatePassUpdate {
  status: 'pending' | 'approved' | 'rejected';
  admin_comments?: string;
}

export const DESIGNATION_OPTIONS = [
  { value: 'parent', label: 'Parent' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' }
] as const;

export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
] as const;