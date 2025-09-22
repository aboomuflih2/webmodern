import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { JobApplication, JobApplicationFormData, JobApplicationFilters, BulkImportResult } from '@/types/job-applications';
import { v4 as uuidv4 } from 'uuid';

export const useJobApplications = () => {
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
      
      setApplications(data || []);
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
        const fileExt = formData.cv_file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('cv-uploads')
          .upload(fileName, formData.cv_file);

        if (uploadError) {
          throw new Error(`Failed to upload CV: ${uploadError.message}`);
        }
        
        cvFilePath = fileName;
      }

      // Prepare application data (only include fields that exist in the database table)
      const applicationData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        designation: formData.designation,
        subject: formData.subject || null,
        other_designation: formData.other_designation || null,
        experience_years: formData.experience_years,
        qualifications: formData.qualifications,
        district: formData.district,
        address: formData.address,
        cv_file_path: cvFilePath || null,
        cover_letter: formData.cover_letter || null,
      };

      const { error: insertError } = await supabase
        .from('job_applications')
        .insert([applicationData]);

      if (insertError) {
        // If application insert fails, clean up uploaded file
        if (cvFilePath) {
          await supabase.storage
            .from('cv-uploads')
            .remove([cvFilePath]);
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
          .from('cv-uploads')
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
        .from('cv-uploads')
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
    fetchApplications();
  }, []);

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