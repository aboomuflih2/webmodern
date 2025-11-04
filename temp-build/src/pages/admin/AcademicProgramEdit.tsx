import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ProgramForm from '@/components/admin/ProgramForm';
import { AcademicProgram, ProgramFormData } from '@/types/academic';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AcademicProgramEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [program, setProgram] = React.useState<AcademicProgram | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (id) {
      fetchProgram(id);
    }
  }, [id]);

  const fetchProgram = async (programId: string) => {
    try {
      const { data, error } = await supabase
        .from('academic_programs')
        .select('*')
        .eq('id', programId)
        .single();

      if (error) throw error;

      setProgram(data);
    } catch (error) {
      console.error('Error fetching program:', error);
      toast.error('Failed to load academic program');
      navigate('/admin/academics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: ProgramFormData) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('academic_programs')
        .update({
          program_title: formData.program_title,
          category: formData.category,
          short_description: formData.short_description,
          full_description: formData.full_description,
          main_image: formData.main_image,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Academic program updated successfully!');
      navigate('/admin/academics');
    } catch (error) {
      console.error('Error updating program:', error);
      toast.error('Failed to update academic program. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/academics');
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `program-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('program-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('program-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading academic program...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Program Not Found</h2>
          <p className="text-gray-600 mb-4">The academic program you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/admin/academics')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Academic Programs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
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
          <h1 className="text-2xl font-bold text-gray-900">Edit Academic Program</h1>
          <p className="text-gray-600 mt-1">Update the details of {program.program_title}</p>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <ProgramForm
                  program={program}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  onImageUpload={handleImageUpload}
                  isLoading={isSubmitting}
                  isOpen={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicProgramEdit;