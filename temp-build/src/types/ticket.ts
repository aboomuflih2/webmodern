export interface GatePassTicket {
  id: string;
  gate_pass_request_id: string;
  ticket_number: string;
  permitted_entry_date: string;
  permitted_entry_time: string;
  qr_code_data: string;
  pdf_file_path?: string;
  issued_by: string;
  issued_at: string;
  entry_logged_at?: string;
  entry_status: string;
  created_at: string;
  updated_at: string;
  gate_pass_requests?: {
    name: string;
    purpose: string;
    mobile_number: string;
    email: string;
    address: string;
    designation: string;
    student_name?: string;
    class?: string;
    admission_number?: string;
    person_to_meet?: string;
    authorized_person?: string;
  };
}

export interface SchoolConfiguration {
  id: string;
  school_name: string;
  school_logo_url?: string;
  primary_phone: string;
  secondary_phone?: string;
  tertiary_phone?: string;
  address: string;
  email?: string;
  website?: string;
  principal_name?: string;
  vice_principal_name?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketQRData {
  ticketId: string;
  visitorName: string;
  purposeOfVisit: string;
  permittedEntryDate: string;
  permittedEntryTime: string;
  permittedExitDate?: string;
  permittedExitTime?: string;
  gatePassId: string;
}

export interface TicketGenerationRequest {
  gatePassId: string;
  permittedEntryDate: string;
  permittedEntryTime: string;
  permittedExitDate?: string;
  permittedExitTime?: string;
}

export interface TicketPDFData {
  ticket: GatePassTicket;
  gatePass: {
    name: string;
    purpose: string;
    mobile_number: string;
    email: string;
    designation: string;
    person_to_meet?: string;
  };
  schoolConfig: SchoolConfiguration;
  qrCodeDataURL: string;
}

export type TicketStatus = 'issued' | 'used' | 'expired';

export interface TicketFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: TicketStatus;
  search?: string;
}

export interface UseTicketsReturn {
  tickets: GatePassTicket[];
  isLoading: boolean;
  error: string | null;
  generateTicket: (request: TicketGenerationRequest) => Promise<GatePassTicket>;
  markTicketAsUsed: (ticketId: string) => Promise<void>;
  downloadTicketPDF: (ticketId: string) => Promise<void>;
  fetchTickets: (filters?: TicketFilters) => Promise<void>;
  issueTicket: (request: TicketGenerationRequest) => Promise<void>;
}

export interface UseSchoolConfigReturn {
  config: SchoolConfiguration | null;
  isLoading: boolean;
  error: string | null;
  updateConfig: (config: Partial<SchoolConfiguration>) => Promise<void>;
  uploadLogo: (file: File) => Promise<string>;
  fetchConfig: () => Promise<void>;
}