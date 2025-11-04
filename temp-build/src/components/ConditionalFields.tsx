import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { GatePassFormSchema } from '../schemas/gatePassSchema';

interface ConditionalFieldsProps {
  designation: string;
  register: UseFormRegister<GatePassFormSchema>;
  errors: FieldErrors<GatePassFormSchema>;
}

const ConditionalFields: React.FC<ConditionalFieldsProps> = ({
  designation,
  register,
  errors
}) => {
  const renderParentFields = () => (
    <>
      <div className="space-y-2">
        <label htmlFor="student_name" className="block text-sm font-medium text-gray-700">
          Student Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="student_name"
          {...register('student_name')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter student's full name"
        />
        {errors.student_name && (
          <p className="text-red-500 text-sm">{errors.student_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="class" className="block text-sm font-medium text-gray-700">
          Student Class <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="class"
          {...register('class')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., 10th A, 12th Science"
        />
        {errors.class && (
          <p className="text-red-500 text-sm">{errors.class.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="admission_number" className="block text-sm font-medium text-gray-700">
          Admission Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="admission_number"
          {...register('admission_number')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter student's admission number"
        />
        {errors.admission_number && (
          <p className="text-red-500 text-sm">{errors.admission_number.message}</p>
        )}
      </div>
    </>
  );

  const renderOtherFields = () => (
    <div className="space-y-2">
      <label htmlFor="person_to_meet" className="block text-sm font-medium text-gray-700">
        Person to Meet <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        id="person_to_meet"
        {...register('person_to_meet')}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Enter the name of person you want to meet"
      />
      {errors.person_to_meet && (
        <p className="text-red-500 text-sm">{errors.person_to_meet.message}</p>
      )}
    </div>
  );

  const renderMaintenanceFields = () => (
    <div className="space-y-2">
      <label htmlFor="authorized_person" className="block text-sm font-medium text-gray-700">
        Authorized Person/Reporting To <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        id="authorized_person"
        {...register('authorized_person')}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Enter the name of authorized person"
      />
      {errors.authorized_person && (
        <p className="text-red-500 text-sm">{errors.authorized_person.message}</p>
      )}
    </div>
  );

  switch (designation) {
    case 'parent':
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
            Student Information
          </h3>
          {renderParentFields()}
        </div>
      );
    
    case 'other':
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
            Meeting Information
          </h3>
          {renderOtherFields()}
        </div>
      );
    
    case 'maintenance':
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
            Authorization Information
          </h3>
          {renderMaintenanceFields()}
        </div>
      );
    
    case 'alumni':
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
            Alumni Information
          </h3>
          <p className="text-sm text-gray-600">
            No additional information required for alumni visits.
          </p>
        </div>
      );
    
    default:
      return null;
  }
};

export default ConditionalFields;