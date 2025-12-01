import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GatePassFormSchema } from '../schemas/gatePassSchema';
import { GatePassRequest, GatePassSubmission, AdminGatePassUpdate } from '../types/gatePass';
import { toast } from 'sonner';

export const useGatePassSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitGatePass = useCallback(async (data: GatePassFormSchema) => {
    setIsSubmitting(true);
    try {
      // First, upload the file to Supabase storage
      const file = data.id_proof_document;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gate-pass-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast.error('Failed to upload document. Please try again.');
        return false;
      }

      // Prepare data for database insertion (exclude the file object)
      const { id_proof_document, ...dbData } = data;
      const submissionData = {
        ...dbData,
        id_proof_document_path: filePath
      };

      const { error } = await supabase
        .from('gate_pass_requests')
        .insert([submissionData]);

      if (error) {
        console.error('Error submitting gate pass:', error);
        // Clean up uploaded file if database insertion fails
        await supabase.storage.from('gate-pass-documents').remove([filePath]);
        toast.error('Failed to submit gate pass request. Please try again.');
        return false;
      }

      toast.success('Gate pass request submitted successfully!');
      return true;
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred. Please try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    submitGatePass,
    isSubmitting
  };
};

export const useGatePassList = () => {
  const [gatePassRequests, setGatePassRequests] = useState<GatePassRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGatePassRequests = useCallback(async (filters?: {
    status?: string;
    designation?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('gate_pass_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters if provided
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.designation && filters.designation !== 'all') {
        query = query.eq('designation', filters.designation);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching gate pass requests:', error);
        setError('Failed to fetch gate pass requests');
        return;
      }

      setGatePassRequests(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateGatePassStatus = useCallback(async (id: string, update: AdminGatePassUpdate) => {
    console.log('🔄 useGatePass: updateGatePassStatus called with:', { id, update });
    
    // Check current user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔄 useGatePass: Current user:', user);
    console.log('🔄 useGatePass: Auth error:', authError);
    
    // Check if user is authenticated
    if (!user) {
      console.error('❌ useGatePass: No authenticated user found');
      toast.error('You must be logged in to update gate pass status');
      return false;
    }
    
    try {
      const updatePayload = {
        status: update.status,
        admin_comments: update.admin_comments,
        updated_at: new Date().toISOString()
      };
      console.log('🔄 useGatePass: Update payload:', updatePayload);
      console.log('🔄 useGatePass: Updating record with ID:', id, 'Type:', typeof id);
      
      // First, let's check if the record exists
      const { data: existingRecord, error: fetchError } = await supabase
        .from('gate_pass_requests')
        .select('*')
        .eq('id', id)
        .single();
        
      console.log('🔄 useGatePass: Existing record check:', { existingRecord, fetchError });
      
      if (fetchError) {
        console.error('❌ useGatePass: Error fetching existing record:', fetchError);
        toast.error('Failed to find gate pass request');
        return false;
      }
      
      if (!existingRecord) {
        console.error('❌ useGatePass: No record found with ID:', id);
        toast.error('Gate pass request not found');
        return false;
      }
      
      console.log('✅ useGatePass: Found existing record:', existingRecord);
      
      const { data, error } = await supabase
        .from('gate_pass_requests')
        .update(updatePayload)
        .eq('id', id)
        .select();

      console.log('🔄 useGatePass: Supabase update response:', { data, error });
      console.log('🔄 useGatePass: Update data length:', data?.length);
      console.log('🔄 useGatePass: Updated record details:', data?.[0]);

      if (error) {
        console.error('❌ useGatePass: Error updating gate pass status:', error);
        toast.error('Failed to update gate pass status');
        return false;
      }
      
      console.log('✅ useGatePass: Database update successful, updated records:', data);

      // Update local state
      console.log('🔄 useGatePass: Updating local state for ID:', id);
      console.log('🔄 useGatePass: Current requests count:', gatePassRequests.length);
      
      setGatePassRequests(prev => {
        const updated = prev.map(request => 
          request.id === id 
            ? { 
                ...request, 
                status: update.status, 
                admin_comments: update.admin_comments,
                updated_at: new Date().toISOString()
              }
            : request
        );
        console.log('✅ useGatePass: Local state updated, found matching request:', 
          updated.some(r => r.id === id && r.status === update.status));
        return updated;
      });

      toast.success('Gate pass status updated successfully');
      console.log('✅ useGatePass: updateGatePassStatus completed successfully');
      return true;
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
      return false;
    }
  }, []);

  const deleteGatePassRequest = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('gate_pass_requests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting gate pass request:', error);
        toast.error('Failed to delete gate pass request');
        return false;
      }

      // Update local state
      setGatePassRequests(prev => prev.filter(request => request.id !== id));
      toast.success('Gate pass request deleted successfully');
      return true;
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
      return false;
    }
  }, []);

  const downloadDocument = useCallback(async (filePath: string, fileName?: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('gate-pass-documents')
        .download(filePath);

      if (error) {
        console.error('Error downloading file:', error);
        toast.error('Failed to download document');
        return;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || filePath.split('/').pop() || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    }
  }, []);

  return {
    gatePassRequests,
    isLoading,
    error,
    fetchGatePassRequests,
    updateGatePassStatus,
    deleteGatePassRequest,
    downloadDocument,
    refreshData: fetchGatePassRequests
  };
};

export const useGatePassStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gate_pass_requests')
        .select('status');

      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      const total = data?.length || 0;
      const pending = data?.filter(item => item.status === 'pending').length || 0;
      const approved = data?.filter(item => item.status === 'approved').length || 0;
      const rejected = data?.filter(item => item.status === 'rejected').length || 0;

      setStats({ total, pending, approved, rejected });
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    stats,
    isLoading,
    fetchStats
  };
};
