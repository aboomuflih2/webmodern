import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AcademicProgram, ProgramFormData, PROGRAM_CATEGORIES, VALIDATION_RULES, ImageUploadResponse } from '../../types/academic';
import ImageUpload from './ImageUpload';

interface AcademicProgramFormProps {
  program?: AcademicProgram | null;
  onSubmit: (data: ProgramFormData) => Promise<void>;
  onCancel: () => void;
  onImageUpload: (file: File) => Promise<ImageUploadResponse>;
  isLoading?: boolean;
}

export default function AcademicProgramForm({
  program,
  onSubmit,
  onCancel,
  onImageUpload,
  isLoading = false
}: AcademicProgramFormProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(program?.main_image || null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch
  } = useForm<ProgramFormData>({
    defaultValues: {
      program_title: program?.program_title || '',
      short_description: program?.short_description || '',
      full_description: program?.full_description || '',
      category: program?.category || 'primary',
      is_active: program?.is_active ?? true
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    if (program) {
      reset({
        program_title: program.program_title,
        short_description: program.short_description,
        full_description: program.full_description,
        category: program.category,
        is_active: program.is_active
      });
      setImageUrl(program.main_image);
    } else {
      reset({
        program_title: '',
        short_description: '',
        full_description: '',
        category: 'primary',
        is_active: true
      });
      setImageUrl(null);
    }
    setSubmitError(null);
  }, [program, reset]);

  const handleImageUpload = async (file: File): Promise<ImageUploadResponse> => {
    const result = await onImageUpload(file);
    setImageUrl(result.url);
    setValue('image_file', file, { shouldDirty: true });
    return result;
  };

  const handleImageRemove = () => {
    setImageUrl(null);
    setValue('image_file', undefined, { shouldDirty: true });
  };

  const onFormSubmit = async (data: ProgramFormData) => {
    try {
      setSubmitError(null);
      await onSubmit({
        ...data,
        image_file: data.image_file
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save program');
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  return (
    <div className="w-full">
      {/* Form */}
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-1">
            <label htmlFor="program_title" className="block text-sm font-medium text-gray-700 mb-2">
              Program Title *
            </label>
            <input
              {...register('program_title', {
                required: VALIDATION_RULES.program_title.required,
                minLength: VALIDATION_RULES.program_title.minLength,
                maxLength: VALIDATION_RULES.program_title.maxLength
              })}
              type="text"
              id="program_title"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.program_title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter program title"
              disabled={isLoading}
            />
            {errors.program_title && (
              <p className="mt-1 text-sm text-red-600">{errors.program_title.message}</p>
            )}
          </div>

          <div className="lg:col-span-1">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              {...register('category', {
                required: VALIDATION_RULES.category.required
              })}
              id="category"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.category ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isLoading}
            >
              {PROGRAM_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>
        </div>

        {/* Short Description */}
        <div>
          <label htmlFor="short_description" className="block text-sm font-medium text-gray-700 mb-2">
            Short Description *
          </label>
          <textarea
            {...register('short_description', {
              required: VALIDATION_RULES.short_description.required,
              minLength: VALIDATION_RULES.short_description.minLength,
              maxLength: VALIDATION_RULES.short_description.maxLength
            })}
            id="short_description"
            rows={3}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.short_description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter a brief description of the program"
            disabled={isLoading}
          />
          <div className="flex justify-between mt-1">
            {errors.short_description ? (
              <p className="text-sm text-red-600">{errors.short_description.message}</p>
            ) : (
              <span></span>
            )}
            <span className="text-xs text-gray-500">
              {watchedValues.short_description?.length || 0}/500
            </span>
          </div>
        </div>

        {/* Full Description */}
        <div>
          <label htmlFor="full_description" className="block text-sm font-medium text-gray-700 mb-2">
            Full Description *
          </label>
          <textarea
            {...register('full_description', {
              required: VALIDATION_RULES.full_description.required,
              minLength: VALIDATION_RULES.full_description.minLength,
              maxLength: VALIDATION_RULES.full_description.maxLength
            })}
            id="full_description"
            rows={8}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y ${
              errors.full_description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter detailed description of the program"
            disabled={isLoading}
          />
          <div className="flex justify-between mt-1">
            {errors.full_description ? (
              <p className="text-sm text-red-600">{errors.full_description.message}</p>
            ) : (
              <span></span>
            )}
            <span className="text-xs text-gray-500">
              {watchedValues.full_description?.length || 0}/5000
            </span>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Program Image
          </label>
          <ImageUpload
            onUpload={handleImageUpload}
            currentImage={imageUrl}
            onRemove={handleImageRemove}
            disabled={isLoading}
          />
        </div>

        {/* Status */}
        <div className="flex items-center">
          <input
            {...register('is_active')}
            type="checkbox"
            id="is_active"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isLoading}
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
            Active (visible to public)
          </label>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {program ? 'Updating...' : 'Creating...'}
              </div>
            ) : (
              program ? 'Update Program' : 'Create Program'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
