import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { JobApplication, JobApplicationFormData, JobApplicationFilters, BulkImportResult } from '@/types/job-applications';
import { v4 as uuidv4 } from 'uuid';

export const useJobApplications = (options?: { autoFetch?: boolean }) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const normalized = (data || []).map((row: any) => ({
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
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!anonKey) {
        console.error('[JobApplications] Missing VITE_SUPABASE_ANON_KEY');
      } else {
        console.debug('[JobApplications] Using anon key', {
          len: anonKey.length,
          prefix: anonKey.slice(0, 12)
        });
      }

      // Create a fresh public client that strips Authorization and only sends apikey
      const strippedFetch: typeof fetch = (input, init) => {
        const headers = new Headers(init?.headers || {});
        if (headers.has('Authorization')) {
          headers.delete('Authorization');
        }
        if (anonKey && !headers.has('apikey')) {
          headers.set('apikey', anonKey);
        }
        const nextInit: RequestInit = { ...(init || {}), headers };
        return fetch(input as RequestInfo, nextInit);
      };

      const publicClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        anonKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          global: {
            headers: {
              apikey: anonKey || '',
            },
            fetch: strippedFetch,
          },
        }
      );

      let cvFilePath: string | undefined;

      // Upload CV file if provided
      if (formData.cv_file) {
        const fileExt = formData.cv_file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('document-uploads')
          .upload(fileName, formData.cv_file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          throw new Error(`Failed to upload CV: ${error.message}`);
        }

        // On success, use the returned path
        cvFilePath = data?.path || fileName;
        if (onProgress) {
          try { onProgress(100); } catch {}
        }
      } 

      // Prepare application data (using new database columns)
      const applicationData = {
        application_number: `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        position: formData.designation || 'Not specified', // Keep position for backward compatibility
        designation: formData.designation || null, // New column
        experience_years: formData.experience_years || 0,
        qualification: formData.qualifications || 'Not specified', // Keep qualification for backward compatibility
        qualifications: formData.qualifications || null, // New column
        date_of_birth: formData.date_of_birth || null,
        address: formData.address || null,
        district: formData.district || null,
        subject: formData.subject || null,
        other_designation: formData.other_designation || null,
        previous_experience: formData.previous_experience || null,
        why_join: formData.why_join || null,
        cv_file: cvFilePath || null,
        cover_letter: formData.why_join || null, // Use why_join as cover letter for backward compatibility
        status: 'pending',
      };

      const { error: insertError } = await publicClient
        .from('job_applications')
        .insert([applicationData]);

      if (insertError) {
        console.error('[JobApplications] Insert error', {
          code: (insertError as any).code,
          message: insertError.message,
          details: (insertError as any).details,
          hint: (insertError as any).hint,
        });
        // If the main insert failed, log the error and re-throw it
        // The applicationData should now have the correct field mapping
        console.error('[JobApplications] Main insert failed, no legacy fallback needed');
        
        if (cvFilePath) {
          try {
            await supabase.storage
              .from('document-uploads')
              .remove([cvFilePath]);
          } catch (remErr) {
            console.warn('[JobApplications] Cleanup remove CV failed', remErr);
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
        await supabase.storage
          .from('document-uploads')
          .remove([cvFilePath]);
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
      const { data, error } = await supabase.storage
        .from('document-uploads')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
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

  const bulkImport = async (importData: any[]): Promise<BulkImportResult> => {
    try {
      const { data, error } = await supabase
        .rpc('bulk_import_job_applications', {
          applications_data: importData
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

  const applyFilters = () => {
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
  };

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
  }, [applications, filters]);

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
        .upload(fileName, file, {
          onUploadProgress: (progress) => {
            setUploadProgress((progress.loaded / progress.total) * 100);
          }
        });

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
