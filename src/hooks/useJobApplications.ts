import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { JobApplication, JobApplicationFormData, JobApplicationFilters, BulkImportResult } from '@/types/job-applications';
import { v4 as uuidv4 } from 'uuid';

export const useJobApplications = (options?: { autoFetch?: boolean }) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { uploadFile, deleteFile } = useFileUpload();

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      type JobApplicationsRow = {
        id: string;
        full_name?: string | null;
        name?: string | null;
        email?: string | null;
        phone?: string | null;
        mobile?: string | null;
        designation?: string | null;
        subject?: string | null;
        subject_specification?: string | null;
        other_designation?: string | null;
        specify_other?: string | null;
        experience_years?: number | null;
        qualifications?: string | null;
        district?: string | null;
        address?: string | null;
        place?: string | null;
        post_office?: string | null;
        pincode?: string | null;
        cv_file?: string | null;
        cover_letter?: string | null;
        created_at: string;
        updated_at?: string | null;
      };
      const normalized = (data || []).map((row: JobApplicationsRow) => ({
        id: row.id,
        full_name: row.full_name ?? row.name ?? '',
        email: row.email ?? '',
        phone: row.phone ?? row.mobile ?? '',
        designation: row.designation ?? '',
        subject: row.subject ?? row.subject_specification ?? undefined,
        other_designation: row.other_designation ?? row.specify_other ?? undefined,
        experience_years: row.experience_years ?? 0,
        qualifications: row.qualifications ?? '',
        district: row.district ?? '',
        address:
          row.address ?? [row.place, row.post_office, row.pincode].filter(Boolean).join(', '),
        cv_file: row.cv_file ?? null,
        cover_letter: row.cover_letter ?? undefined,
        created_at: row.created_at,
        updated_at: row.updated_at ?? undefined,
      }));
      setApplications(normalized);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch job applications';
      setError(errorMessage);
      console.error('Error fetching job applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitApplication = async (formData: JobApplicationFormData, onProgress?: (progress: number) => void): Promise<boolean> => {
    try {
      

      let cvFilePath: string | undefined;

      // Upload CV file if provided
      if (formData.cv_file) {
        const uploaded = await uploadFile(formData.cv_file, 'cv-uploads');
        if (uploaded) {
          cvFilePath = uploaded;
          onProgress?.(100);
        } else {
          console.warn('[JobApplications] CV upload failed via helper, continuing without CV');
        }
      }

      const parseAddress = (address: string | null | undefined) => {
        let place = '';
        let post_office = '';
        let pincode = '';
        const src = (address || '').trim();
        if (src) {
          const pinMatch = src.match(/(\b\d{6}\b)/);
          if (pinMatch) pincode = pinMatch[1];
          const parts = src.split(/[,|]/).map(s => s.trim()).filter(Boolean);
          if (parts.length > 0) place = parts[0];
          const poPart = parts.find(p => /\b(po|post)\b/i.test(p));
          if (poPart) {
            post_office = poPart.replace(/\b(po|post)\b/ig, '').trim() || poPart;
          }
        }
        return { place, post_office, pincode };
      };

      const { place, post_office, pincode } = parseAddress(formData.address);

      let payload: Record<string, any> = {
        // union of modern + legacy fields; unknown ones will be pruned on error
        application_number: `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        full_name: formData.full_name,
        name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        mobile: formData.phone,
        position: formData.designation || 'Not specified',
        designation: formData.designation || 'Not specified',
        experience_years: formData.experience_years || 0,
        qualification: formData.qualifications || 'Not specified',
        qualifications: formData.qualifications || null,
        date_of_birth: formData.date_of_birth || null,
        address: formData.address || null,
        district: formData.district || '',
        subject: formData.subject || null,
        subject_specification: formData.subject || null,
        other_designation: formData.other_designation || null,
        specify_other: formData.other_designation || null,
        previous_experience: formData.previous_experience || null,
        why_join: formData.why_join || null,
        cv_file: cvFilePath || null,
        cv_file_path: cvFilePath || null,
        cv_file_name: formData.cv_file?.name || null,
        status: 'pending',
        place,
        post_office,
        pincode,
      };

      let insertError: any = null;
      for (let i = 0; i < 10; i++) {
        const { error } = await (supabase as unknown as { from: (t: string) => { insert: (v: any) => Promise<{ data: any; error: any }> } })
          .from('job_applications')
          .insert([payload]);
        if (!error) {
          insertError = null;
          break;
        }
        insertError = error;
        const msg = (error as any)?.message || '';
        const m = msg.match(/Could not find '([^']+)' column/);
        if (m && m[1] && payload.hasOwnProperty(m[1])) {
          delete payload[m[1]];
          continue;
        }
        break;
      }

      if (insertError) {
        const ie = insertError as unknown as { code?: string; details?: string; hint?: string; message: string };
        console.error('[JobApplications] Insert error', {
          code: ie.code,
          message: ie.message,
          details: ie.details,
          hint: ie.hint,
        });
        if (cvFilePath) {
          const removed = await deleteFile(cvFilePath, 'cv-uploads');
          if (!removed) {
            await deleteFile(cvFilePath, 'document-uploads');
          }
        }
        throw insertError;
      }

      toast({
        title: "Success",
        description: "Your job application has been submitted successfully!",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit application';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Error submitting application:', err);
      return false;
    }
  };

  const deleteApplication = async (id: string, cvFilePath?: string): Promise<boolean> => {
    try {
      // Delete CV file if exists
      if (cvFilePath) {
        try {
          await supabase.storage.from('cv-uploads').remove([cvFilePath]);
        } catch (e1) {
          try {
            await supabase.storage.from('document-uploads').remove([cvFilePath]);
          } catch (e2) {
            console.warn('Error deleting CV from both buckets', e1, e2);
          }
        }
      }

      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application deleted successfully",
      });

      // Refresh applications list
      await fetchApplications();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete application';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Error deleting application:', err);
      return false;
    }
  };

  const downloadCV = async (filePath: string, applicantName: string): Promise<boolean> => {
    try {
      let url: string | null = null;
      try {
        const { data } = await supabase.storage
          .from('cv-uploads')
          .download(filePath);
        url = URL.createObjectURL(data);
      } catch (e1) {
        const { data, error: err2 } = await supabase.storage
          .from('document-uploads')
          .download(filePath);
        if (err2) throw err2;
        url = URL.createObjectURL(data);
      }
      const a = document.createElement('a');
      a.href = url;
      a.download = `${applicantName}_CV.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "CV downloaded successfully",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download CV';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Error downloading CV:', err);
      return false;
    }
  };

  const bulkImport = async (importData: unknown[]): Promise<BulkImportResult> => {
    try {
      const { data, error } = await (supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: any; error: any }> })
        .rpc('bulk_import_job_applications', {
          applications_data: importData as unknown,
        });

      if (error) throw error;

      const result = data[0] as BulkImportResult;
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${result.success_count} applications. ${result.error_count} errors.`,
        variant: result.error_count > 0 ? "destructive" : "default",
      });

      // Refresh applications list
      await fetchApplications();
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import applications';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Error importing applications:', err);
      return {
        success_count: 0,
        error_count: 1,
        errors: [errorMessage]
      };
    }
  };

  useEffect(() => {
    const shouldAutoFetch = options?.autoFetch !== false;
    if (shouldAutoFetch) {
      fetchApplications();
    } else {
      setLoading(false);
    }
  }, [options?.autoFetch]);

  return {
    applications,
    loading,
    error,
    fetchApplications,
    submitApplication,
    deleteApplication,
    downloadCV,
    bulkImport,
  };
};

export const useJobApplicationFilters = (applications: JobApplication[]) => {
  const [filters, setFilters] = useState<JobApplicationFilters>({
    name: '',
    designation: 'all',
    subject: 'all',
    mobile: '',
    email: '',
    district: 'all'
  });

  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>(applications);

  const applyFilters = useCallback(() => {
    let filtered = applications;

    if (filters.name) {
      filtered = filtered.filter(app => 
        app.full_name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.designation && filters.designation !== 'all') {
      filtered = filtered.filter(app => app.designation === filters.designation);
    }

    if (filters.subject && filters.subject !== 'all') {
      filtered = filtered.filter(app => app.subject === filters.subject);
    }

    if (filters.mobile) {
      filtered = filtered.filter(app => 
        app.phone.includes(filters.mobile)
      );
    }

    if (filters.email) {
      filtered = filtered.filter(app => 
        app.email.toLowerCase().includes(filters.email.toLowerCase())
      );
    }

    if (filters.district && filters.district !== 'all') {
      filtered = filtered.filter(app => app.district === filters.district);
    }

    setFilteredApplications(filtered);
  }, [applications, filters]);

  const clearFilters = () => {
    setFilters({
      name: '',
      designation: 'all',
      subject: 'all',
      mobile: '',
      email: '',
      district: 'all'
    });
  };

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return {
    filters,
    setFilters,
    filteredApplications,
    clearFilters,
  };
};

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = async (file: File, bucket: string = 'cv-uploads'): Promise<string | null> => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Please upload a PDF or Word document');
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) throw error;
      
      setUploadProgress(100);
      return fileName;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Error uploading file:', err);
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const deleteFile = async (filePath: string, bucket: string = 'cv-uploads'): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting file:', err);
      return false;
    }
  };

  return {
    uploading,
    uploadProgress,
    uploadFile,
    deleteFile,
  };
};
