import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  GatePassTicket, 
  TicketGenerationRequest, 
  TicketFilters, 
  UseTicketsReturn,
  TicketQRData
} from '../types/ticket';
import { generateTicketPDF } from '../utils/ticketPDF';
import QRCode from 'qrcode';

export const useTickets = (): UseTicketsReturn => {
  const [tickets, setTickets] = useState<GatePassTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async (filters?: TicketFilters) => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('gate_pass_tickets')
        .select(`
          *,
          gate_pass_requests!inner(
            name,
            purpose,
            mobile_number,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.dateFrom) {
        query = query.gte('permitted_entry_date', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('permitted_entry_date', filters.dateTo);
      }

      if (filters?.status) {
        if (filters.status === 'used') {
          query = query.eq('is_used', true);
        } else if (filters.status === 'issued') {
          query = query.eq('is_used', false);
        }
      }

      if (filters?.search) {
        query = query.or(`
          ticket_number.ilike.%${filters.search}%,
          gate_pass_requests.name.ilike.%${filters.search}%
        `);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setTickets(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tickets';
      setError(errorMessage);
      console.error('Error fetching tickets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateTicket = useCallback(async (request: TicketGenerationRequest): Promise<GatePassTicket> => {
    console.log('🎫 useTickets.generateTicket: Starting ticket generation with request:', request);
    
    try {
      setIsLoading(true);
      setError(null);

      // First, get the gate pass details
      console.log('🎫 useTickets.generateTicket: Fetching gate pass details...');
      const { data: gatePassData, error: gatePassError } = await supabase
        .from('gate_pass_requests')
        .select('*')
        .eq('id', request.gatePassId)
        .single();

      if (gatePassError || !gatePassData) {
        console.error('❌ useTickets.generateTicket: Gate pass not found:', gatePassError);
        throw new Error('Gate pass not found');
      }

      console.log('🎫 useTickets.generateTicket: Gate pass data retrieved:', gatePassData);

      // Create QR code data
      const qrData: TicketQRData = {
        ticketId: '', // Will be set after insertion
        visitorName: gatePassData.name,
        purposeOfVisit: gatePassData.purpose,
        permittedEntryDate: request.permittedEntryDate,
        permittedEntryTime: request.permittedEntryTime,
        permittedExitDate: request.permittedExitDate,
        permittedExitTime: request.permittedExitTime,
        gatePassId: request.gatePassId
      };

      const qrCodeData = JSON.stringify(qrData);
      console.log('🎫 useTickets.generateTicket: Generated QR data:', qrData);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ useTickets.generateTicket: User not authenticated');
        throw new Error('User not authenticated');
      }

      // Insert ticket into database
      console.log('🎫 useTickets.generateTicket: Inserting ticket into database...');
      const { data: ticketData, error: insertError } = await supabase
        .from('gate_pass_tickets')
        .insert({
          gate_pass_request_id: request.gatePassId,
          permitted_entry_date: request.permittedEntryDate,
          permitted_entry_time: request.permittedEntryTime,
          qr_code_data: qrCodeData,
          issued_by: user.id
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ useTickets.generateTicket: Database insertion error:', insertError);
        throw new Error(insertError.message);
      }

      console.log('🎫 useTickets.generateTicket: Ticket inserted successfully:', ticketData);

      // Update QR code data with actual ticket ID
      const updatedQrData: TicketQRData = {
        ...qrData,
        ticketId: ticketData.id
      };

      const updatedQrCodeData = JSON.stringify(updatedQrData);

      // Update ticket with correct QR code data
      console.log('🎫 useTickets.generateTicket: Updating ticket with QR code data...');
      const { data: finalTicketData, error: updateError } = await supabase
        .from('gate_pass_tickets')
        .update({ qr_code_data: updatedQrCodeData })
        .eq('id', ticketData.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ useTickets.generateTicket: QR code update error:', updateError);
        throw new Error(updateError.message);
      }

      // Refresh tickets list
      await fetchTickets();

      console.log('✅ useTickets.generateTicket: Ticket created successfully:', finalTicketData);
      return finalTicketData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate ticket';
      console.error('❌ useTickets.generateTicket: Error:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchTickets]);

  const markTicketAsUsed = useCallback(async (ticketId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('gate_pass_tickets')
        .update({ 
          is_used: true, 
          used_at: new Date().toISOString() 
        })
        .eq('id', ticketId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Refresh tickets list
      await fetchTickets();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark ticket as used';
      setError(errorMessage);
      console.error('Error marking ticket as used:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchTickets]);

  const downloadTicketPDF = useCallback(async (ticketId: string): Promise<void> => {
    console.log('📥 useTickets.downloadTicketPDF: Starting PDF download for ticket ID:', ticketId);
    
    try {
      setIsLoading(true);
      setError(null);

      // Fetch ticket details with gate pass information
      console.log('📥 useTickets.downloadTicketPDF: Fetching ticket details from database...');
      const { data: ticket, error } = await supabase
        .from('gate_pass_tickets')
        .select(`
          *,
          gate_pass_requests (
            name,
            purpose,
            mobile_number,
            email,
            designation,
            person_to_meet
          )
        `)
        .eq('id', ticketId)
        .single();

      if (error || !ticket) {
        console.error('❌ useTickets.downloadTicketPDF: Ticket not found:', error);
        throw new Error('Ticket not found');
      }

      console.log('✅ useTickets.downloadTicketPDF: Ticket data retrieved:', ticket);

      // Generate QR code data URL
      console.log('📥 useTickets.downloadTicketPDF: Generating QR code...');
      const qrCodeDataUrl = await QRCode.toDataURL(ticket.qr_code_data, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      console.log('✅ useTickets.downloadTicketPDF: QR code generated successfully');

      // Generate and download PDF
      console.log('📥 useTickets.downloadTicketPDF: Calling generateTicketPDF...');
      try {
        await generateTicketPDF(ticket, qrCodeDataUrl);
        console.log('✅ useTickets.downloadTicketPDF: PDF generation and download completed successfully');
      } catch (pdfError) {
        console.error('❌ useTickets.downloadTicketPDF: PDF generation failed:', pdfError);
        throw new Error(`PDF generation failed: ${pdfError}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download ticket';
      console.error('❌ useTickets.downloadTicketPDF: Error:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const issueTicket = useCallback(async (request: TicketGenerationRequest): Promise<void> => {
    console.log('🎫 useTickets.issueTicket: Starting ticket issuance with data:', request);
    
    try {
      // Generate the ticket
      console.log('🎫 useTickets.issueTicket: Calling generateTicket...');
      const ticket = await generateTicket(request);
      
      if (ticket) {
        console.log('✅ useTickets.issueTicket: Ticket generated successfully:', ticket);
        console.log('📥 useTickets.issueTicket: Starting PDF download...');
        
        // Automatically download the PDF
        try {
          await downloadTicketPDF(ticket.id);
          console.log('✅ useTickets.issueTicket: PDF download completed successfully');
        } catch (downloadError) {
          console.error('❌ useTickets.issueTicket: PDF download failed:', downloadError);
          throw new Error(`PDF download failed: ${downloadError}`);
        }
      } else {
        console.error('❌ useTickets.issueTicket: Ticket generation returned null/undefined');
        throw new Error('Ticket generation failed - no ticket returned');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to issue ticket';
      setError(errorMessage);
      console.error('❌ useTickets.issueTicket: Error issuing ticket:', err);
      throw err;
    }
  }, [generateTicket, downloadTicketPDF]);

  return {
    tickets,
    isLoading,
    error,
    generateTicket,
    markTicketAsUsed,
    downloadTicketPDF,
    fetchTickets,
    issueTicket
  };
};