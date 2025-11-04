import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { gatePassFormSchema, GatePassFormSchema } from '../schemas/gatePassSchema';
import { useGatePassSubmission } from '../hooks/useGatePass';
import { DESIGNATION_OPTIONS } from '../types/gatePass';
import ConditionalFields from './ConditionalFields';
import { X, Send, User, Phone, Mail, MapPin, FileText, Users, Upload, CheckCircle } from 'lucide-react';

interface GatePassFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const GatePassForm: React.FC<GatePassFormProps> = ({ isOpen, onClose }) => {
  const [selectedDesignation, setSelectedDesignation] = useState<string>('');
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const { submitGatePass, isSubmitting } = useGatePassSubmission();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<GatePassFormSchema>({
    resolver: zodResolver(gatePassFormSchema),
    mode: 'onChange'
  });

  const designation = watch('designation');

  React.useEffect(() => {
    setSelectedDesignation(designation || '');
  }, [designation]);

  // Simple file change handler like in Careers.tsx
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPEG, PNG, and PDF files are allowed');
        return;
      }
      setIdProofFile(file);
    }
  };



  const onSubmit = async (data: GatePassFormSchema) => {
    // Validate file presence like in job application form
    if (!idProofFile) {
      alert('ID Proof Document is required');
      return;
    }
    
    // Add the file to form data
    const formDataWithFile = {
      ...data,
      id_proof_document: idProofFile
    };
    
    const success = await submitGatePass(formDataWithFile);
    if (success) {
      reset();
      setSelectedDesignation('');
      setIdProofFile(null);
      onClose();
    }
  };

  const handleClose = () => {
    reset();
    setSelectedDesignation('');
    setIdProofFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Gate Pass Request
              </h2>
              <p className="text-sm text-gray-600">
                Fill out the form to request a gate pass
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  <User className="inline h-4 w-4 mr-1" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  {...register('name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="mobile_number" className="block text-sm font-medium text-gray-700">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="mobile_number"
                  {...register('mobile_number')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter 10-digit mobile number"
                />
                {errors.mobile_number && (
                  <p className="text-red-500 text-sm">{errors.mobile_number.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                <Mail className="inline h-4 w-4 mr-1" />
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                <MapPin className="inline h-4 w-4 mr-1" />
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                {...register('address')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your complete address"
              />
              {errors.address && (
                <p className="text-red-500 text-sm">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="id_proof_document" className="block text-sm font-medium text-gray-700">
                <Upload className="inline h-4 w-4 mr-1" />
                ID Proof Document <span className="text-red-500">*</span>
              </label>
              <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                idProofFile 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-blue-400'
              }`}>
                <div className="space-y-1 text-center">
                  {idProofFile ? (
                    <>
                      <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                      <div className="text-sm text-green-700">
                        <p className="font-medium">{idProofFile.name}</p>
                        <p className="text-xs text-green-600">
                          {(idProofFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIdProofFile(null);
                          // Reset the file input
                          const fileInput = document.getElementById('id_proof_document') as HTMLInputElement;
                          if (fileInput) {
                            fileInput.value = '';
                          }
                        }}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Remove file
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="id_proof_document"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="id_proof_document"
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            className="sr-only cursor-pointer"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, PDF up to 5MB
                      </p>
                    </>
                  )}
                </div>
              </div>
              {!idProofFile && (
                <p className="text-red-500 text-sm">ID proof document is required</p>
              )}
            </div>
          </div>

          {/* Visit Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Visit Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="designation" className="block text-sm font-medium text-gray-700">
                  <Users className="inline h-4 w-4 mr-1" />
                  Designation <span className="text-red-500">*</span>
                </label>
                <select
                  id="designation"
                  {...register('designation')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select your designation</option>
                  {DESIGNATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.designation && (
                  <p className="text-red-500 text-sm">{errors.designation.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Purpose of Visit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="purpose"
                  {...register('purpose')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Briefly describe your purpose"
                />
                {errors.purpose && (
                  <p className="text-red-500 text-sm">{errors.purpose.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Conditional Fields */}
          {selectedDesignation && (
            <ConditionalFields
              designation={selectedDesignation}
              register={register}
              errors={errors}
            />
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GatePassForm;