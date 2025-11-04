import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AcademicProgram, ProgramFormData, ImageUploadResponse } from '../../types/academic';
import AcademicProgramsGrid from '../../components/admin/AcademicProgramsGrid';
import ActionToolbar from '../../components/admin/ActionToolbar';
import ProgramForm from '../../components/admin/ProgramForm';
import { EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FilterOptions {
  category: string;
  status: string;
  search: string;
}

export default function Academics() {
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProgram, setEditingProgram] = useState<AcademicProgram | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingProgram, setViewingProgram] = useState<AcademicProgram | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    category: '',
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('academic_programs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Failed to load academic programs');
    } finally {
      setLoading(false);
    }
  };

  // Filter programs based on current filters
  const filteredPrograms = useMemo(() => {
    return programs.filter(program => {
      const matchesSearch = !filters.search || 
        program.program_title.toLowerCase().includes(filters.search.toLowerCase()) ||
        program.short_description.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesCategory = !filters.category || program.category === filters.category;
      
      const matchesStatus = !filters.status || 
        (filters.status === 'active' && program.is_active) ||
        (filters.status === 'inactive' && !program.is_active);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [programs, filters]);

  // Navigation to new page is handled directly in the toolbar component

  // Navigation to edit page is handled directly in the grid component

  const handleView = (program: AcademicProgram) => {
    setViewingProgram(program);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (programId: string) => {
    try {
      const { error } = await supabase
        .from('academic_programs')
        .delete()
        .eq('id', programId);

      if (error) throw error;

      toast.success('Program deleted successfully');
      fetchPrograms();
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error('Failed to delete program');
    }
  };

  const handleToggleStatus = async (programId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('academic_programs')
        .update({ is_active: isActive })
        .eq('id', programId);

      if (error) throw error;

      toast.success(`Program ${isActive ? 'activated' : 'deactivated'} successfully`);
      fetchPrograms();
    } catch (error) {
      console.error('Error updating program status:', error);
      toast.error('Failed to update program status');
    }
  };

  const handleImageUpload = async (file: File): Promise<ImageUploadResponse> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `academic-programs/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('program-icons')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('program-icons')
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        path: filePath,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const handleFormSubmit = async (data: ProgramFormData) => {
    try {
      setSubmitting(true);
      
      let imageUrl = editingProgram?.main_image || null;
      
      // Upload new image if provided
      if (data.image_file) {
        const uploadResult = await handleImageUpload(data.image_file);
        imageUrl = uploadResult.url;
      }

      const programData = {
        program_title: data.program_title,
        short_description: data.short_description,
        full_description: data.full_description,
        category: data.category,
        is_active: data.is_active,
        main_image: imageUrl
      };

      if (editingProgram) {
        // Update existing program
        const { error } = await supabase
          .from('academic_programs')
          .update(programData)
          .eq('id', editingProgram.id);

        if (error) throw error;
        toast.success('Program updated successfully');
      } else {
        // Create new program
        const { error } = await supabase
          .from('academic_programs')
          .insert([programData]);

        if (error) throw error;
        toast.success('Program created successfully');
      }

      setIsFormOpen(false);
      setEditingProgram(null);
      fetchPrograms();
    } catch (error) {
      console.error('Error saving program:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingProgram(null);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const updateField = (field: keyof AcademicProgram, value: AcademicProgram[keyof AcademicProgram]) => {
    if (!editingProgram) return;
    setEditingProgram({
      ...editingProgram,
      [field]: value,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
        <div className="p-6">
          <AcademicProgramsGrid
            programs={[]}
            onEdit={() => {}}
            onDelete={() => {}}
            onView={() => {}}
            onToggleStatus={() => {}}
            isLoading={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Academic Programs</h1>
            <p className="text-gray-600 mt-1">Manage your institution's academic programs and courses</p>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <ActionToolbar
            onFilterChange={handleFilterChange}
            totalCount={programs.length}
            filteredCount={filteredPrograms.length}
            isLoading={loading}
          />

      {/* Main Content */}
      <div className="p-6">
        <AcademicProgramsGrid
          programs={filteredPrograms}
          onEdit={undefined}
          onDelete={handleDelete}
          onView={handleView}
          onToggleStatus={handleToggleStatus}
          isLoading={loading}
        />
      </div>

      {/* Program Form Modal */}
      <ProgramForm
        program={editingProgram}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        onImageUpload={handleImageUpload}
        isLoading={submitting}
        isOpen={isFormOpen}
      />

      {/* View Program Modal */}
      {isViewModalOpen && viewingProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Program Details</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image */}
                <div>
                  {viewingProgram.main_image ? (
                    <img
                      src={viewingProgram.main_image}
                      alt={viewingProgram.program_title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <EyeIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {viewingProgram.program_title}
                    </h3>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        viewingProgram.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {viewingProgram.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-sm text-gray-500">
                        Category: {viewingProgram.category}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Short Description</h4>
                    <p className="text-gray-700">{viewingProgram.short_description}</p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Full Description</h4>
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {viewingProgram.full_description}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Created:</span>
                      <br />
                      {formatDate(viewingProgram.created_at)}
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span>
                      <br />
                      {formatDate(viewingProgram.updated_at)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  // Navigate to edit page - this should be handled by routing
                  window.location.href = `/admin/academics/edit/${viewingProgram.id}`;
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit Program
              </button>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
