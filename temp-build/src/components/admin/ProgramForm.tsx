import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AcademicProgram, ProgramFormData, PROGRAM_CATEGORIES, VALIDATION_RULES, ImageUploadResponse } from '../../types/academic';
import ImageUpload from './ImageUpload';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface ProgramFormProps {
  program?: AcademicProgram | null;
  onSubmit: (data: ProgramFormData) => Promise<void>;
  onCancel: () => void;
  onImageUpload: (file: File) => Promise<ImageUploadResponse>;
  isLoading?: boolean;
  isOpen: boolean;
}

export default function ProgramForm({
  program,
  onSubmit,
  onCancel,
  onImageUpload,
  isLoading = false,
  isOpen
}: ProgramFormProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(program?.main_image || null);
  const [imagePreview, setImagePreview] = useState<string | null>(program?.main_image || null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
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
      setImagePreview(program.main_image);
    } else {
      reset({
        program_title: '',
        short_description: '',
        full_description: '',
        category: 'primary',
        is_active: true
      });
      setImageUrl(null);
      setImagePreview(null);
    }
    setSelectedImage(null);
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

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setValue('image_file', file, { shouldDirty: true });
    }
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

  if (!isOpen) return null;

  // Check if we're in edit page context (no modal needed)
  const isEditPage = window.location.pathname.includes('/edit/');

  if (isEditPage) {
    return (
      <div className="w-full">
        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="space-y-6">
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
                rows={6}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {program ? 'Edit Academic Program' : 'Create New Academic Program'}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label htmlFor="program_title" className="block text-sm font-medium text-gray-700 mb-2">
                  Program Title *
                </label>
                <input
                  {...register('program_title', { required: 'Program title is required' })}
                  type="text"
                  id="program_title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter program title"
                />
                {errors.program_title && (
                  <p className="mt-1 text-sm text-red-600">{errors.program_title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  id="category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="postgraduate">Postgraduate</option>
                  <option value="diploma">Diploma</option>
                  <option value="certificate">Certificate</option>
                  <option value="professional">Professional</option>
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
                {...register('short_description', { required: 'Short description is required' })}
                id="short_description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the program"
              />
              {errors.short_description && (
                <p className="mt-1 text-sm text-red-600">{errors.short_description.message}</p>
              )}
            </div>

            {/* Detailed Description */}
            <div>
              <label htmlFor="detailed_description" className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description
              </label>
              <textarea
                {...register('detailed_description')}
                id="detailed_description"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Comprehensive description of the program"
              />
            </div>

            {/* Duration and Fees */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <input
                  {...register('duration')}
                  type="text"
                  id="duration"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 4 years, 2 semesters"
                />
              </div>

              <div>
                <label htmlFor="fees" className="block text-sm font-medium text-gray-700 mb-2">
                  Fees
                </label>
                <input
                  {...register('fees')}
                  type="text"
                  id="fees"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., $10,000 per year"
                />
              </div>
            </div>

            {/* Eligibility and Career Prospects */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label htmlFor="eligibility" className="block text-sm font-medium text-gray-700 mb-2">
                  Eligibility Criteria
                </label>
                <textarea
                  {...register('eligibility')}
                  id="eligibility"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Admission requirements and eligibility criteria"
                />
              </div>

              <div>
                <label htmlFor="career_prospects" className="block text-sm font-medium text-gray-700 mb-2">
                  Career Prospects
                </label>
                <textarea
                  {...register('career_prospects')}
                  id="career_prospects"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Career opportunities and job prospects"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto h-32 w-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setSelectedImage(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="image-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="image-upload"
                            name="image-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    {...register('is_active')}
                    type="radio"
                    value="true"
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    {...register('is_active')}
                    type="radio"
                    value="false"
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inactive</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {program ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                program ? 'Update Program' : 'Create Program'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
