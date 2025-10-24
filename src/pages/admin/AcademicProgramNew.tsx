import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import AcademicProgramForm from '@/components/admin/AcademicProgramForm';
import { AcademicProgram, ProgramFormData } from '@/types/academic';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AcademicProgramNew: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (formData: ProgramFormData) => {
    console.log('Form submission started with data:', formData);
    setIsSubmitting(true);
    try {
      // Handle image upload first if there's an image file
      let imageUrl = null;
      if (formData.image_file) {
        console.log('Uploading image file:', formData.image_file.name);
        try {
          const uploadResult = await handleImageUpload(formData.image_file);
          imageUrl = uploadResult.url;
          console.log('Image uploaded successfully:', imageUrl);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          toast.error('Failed to upload image. Please try again.');
          return;
        }
      }

      const insertData = {
        program_title: formData.program_title,
        category: formData.category,
        short_description: formData.short_description,
        full_description: formData.full_description,
        main_image: imageUrl,
        is_active: formData.is_active,
        display_order: 0, // Default display order
      };
      
      console.log('Inserting data to database:', insertData);
      
      const { data, error } = await supabase
        .from('academic_programs')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Database error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('Program created successfully:', data);
      toast.success('Academic program created successfully!');
      navigate('/admin/academics');
    } catch (error) {
      console.error('Error creating program:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to create academic program: ${errorMessage}`);
      throw error; // Re-throw to be caught by form error handling
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/academics');
  };

  const handleImageUpload = async (file: File): Promise<{ url: string }> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `academic-programs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('program-icons')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('program-icons')
        .getPublicUrl(filePath);

      return { url: publicUrl };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCancel}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Academic Programs
          </button>
        </div>
        <div className="mt-2">
          <h1 className="text-2xl font-bold text-gray-900">Create New Academic Program</h1>
          <p className="text-gray-600 mt-1">Add a new academic program to your institution</p>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <AcademicProgramForm
                program={null}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                onImageUpload={handleImageUpload}
                isLoading={isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicProgramNew;