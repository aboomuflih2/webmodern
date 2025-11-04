import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { SchoolConfiguration, UseSchoolConfigReturn } from '../types/ticket';

export const useSchoolConfig = (): UseSchoolConfigReturn => {
  const [config, setConfig] = useState<SchoolConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('school_configuration')
        .select('*')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" - not an error for this case
        throw new Error(fetchError.message);
      }

      setConfig(data || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch school configuration';
      setError(errorMessage);
      console.error('Error fetching school configuration:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadLogo = useCallback(async (file: File): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `school-logo-${Date.now()}.${fileExt}`;
      const filePath = `school-assets/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(uploadData.path);

      return publicUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload logo';
      setError(errorMessage);
      console.error('Error uploading logo:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (configUpdate: Partial<SchoolConfiguration>): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if configuration exists
      const { data: existingConfig } = await supabase
        .from('school_configuration')
        .select('id')
        .single();

      let result;

      if (existingConfig) {
        // Update existing configuration
        result = await supabase
          .from('school_configuration')
          .update({
            ...configUpdate,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id)
          .select()
          .single();
      } else {
        // Create new configuration
        result = await supabase
          .from('school_configuration')
          .insert({
            ...configUpdate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      setConfig(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update school configuration';
      setError(errorMessage);
      console.error('Error updating school configuration:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    config,
    isLoading,
    error,
    updateConfig,
    uploadLogo,
    fetchConfig
  };
};