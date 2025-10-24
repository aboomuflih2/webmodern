import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AcademicProgram } from '../../types/academic';
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface AcademicProgramsGridProps {
  programs: AcademicProgram[];
  onEdit: (program: AcademicProgram) => void;
  onDelete: (programId: string) => void;
  onView: (program: AcademicProgram) => void;
  onToggleStatus: (programId: string, isActive: boolean) => void;
  isLoading?: boolean;
}

export default function AcademicProgramsGrid({
  programs,
  onEdit,
  onDelete,
  onView,
  onToggleStatus,
  isLoading = false
}: AcademicProgramsGridProps) {
  const navigate = useNavigate();
  const handleDelete = (program: AcademicProgram) => {
    if (window.confirm(`Are you sure you want to delete "${program.program_title}"? This action cannot be undone.`)) {
      onDelete(program.id);
    }
  };

  const handleToggleStatus = (program: AcademicProgram) => {
    const action = program.is_active ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} "${program.program_title}"?`)) {
      onToggleStatus(program.id, !program.is_active);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      primary: 'bg-blue-100 text-blue-800',
      secondary: 'bg-green-100 text-green-800',
      higher_secondary: 'bg-purple-100 text-purple-800',
      undergraduate: 'bg-orange-100 text-orange-800',
      postgraduate: 'bg-red-100 text-red-800',
      diploma: 'bg-yellow-100 text-yellow-800',
      certificate: 'bg-gray-100 text-gray-800',
      other: 'bg-indigo-100 text-indigo-800'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      primary: 'Primary',
      secondary: 'Secondary',
      higher_secondary: 'Higher Secondary',
      undergraduate: 'Undergraduate',
      postgraduate: 'Postgraduate',
      diploma: 'Diploma',
      certificate: 'Certificate',
      other: 'Other'
    };
    return labels[category as keyof typeof labels] || 'Other';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-4 w-3/4"></div>
            <div className="flex justify-between items-center">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Academic Programs</h3>
        <p className="text-gray-500 mb-4">Get started by creating your first academic program.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {programs.map((program) => (
        <div
          key={program.id}
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
        >
          {/* Image */}
          <div className="relative h-48 bg-gray-200">
            {program.main_image ? (
              <img
                src={program.main_image}
                alt={program.program_title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/api/placeholder/400/300';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
            
            {/* Status Badge */}
            <div className="absolute top-3 right-3">
              {program.is_active ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircleIcon className="w-3 h-3 mr-1" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <XCircleIcon className="w-3 h-3 mr-1" />
                  Inactive
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Category */}
            <div className="mb-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(program.category)}`}>
                {getCategoryLabel(program.category)}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {program.program_title}
            </h3>

            {/* Short Description */}
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {program.short_description}
            </p>

            {/* Metadata */}
            <div className="text-xs text-gray-500 mb-4 space-y-1">
              <div>Created: {formatDate(program.created_at)}</div>
              {program.updated_at !== program.created_at && (
                <div>Updated: {formatDate(program.updated_at)}</div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleToggleStatus(program)}
                className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                  program.is_active
                    ? 'text-red-700 bg-red-100 hover:bg-red-200'
                    : 'text-green-700 bg-green-100 hover:bg-green-200'
                }`}
                title={program.is_active ? 'Deactivate program' : 'Activate program'}
              >
                {program.is_active ? 'Deactivate' : 'Activate'}
              </button>

              <div className="flex space-x-2">
                <button
                  onClick={() => onView(program)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="View program"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit ? onEdit(program) : navigate(`/admin/academics/${program.id}/edit`)}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                  title="Edit program"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(program)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete program"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// CSS for line-clamp (add to your global CSS or Tailwind config)
// .line-clamp-2 {
//   display: -webkit-box;
//   -webkit-line-clamp: 2;
//   -webkit-box-orient: vertical;
//   overflow: hidden;
// }
// 
// .line-clamp-3 {
//   display: -webkit-box;
//   -webkit-line-clamp: 3;
//   -webkit-box-orient: vertical;
//   overflow: hidden;
// }