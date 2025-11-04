import React, { useState, useEffect } from 'react';
import { Save, Upload, Building, Phone, Mail, MapPin, User, Globe, Image } from 'lucide-react';
import { useSchoolConfig } from '../../hooks/useSchoolConfig';
import { toast } from 'sonner';

export const SchoolConfigForm: React.FC = () => {
  const { config, isLoading, error, updateConfig, uploadLogo, fetchConfig } = useSchoolConfig();
  
  const [formData, setFormData] = useState({
    school_name: '',
    primary_phone: '',
    secondary_phone: '',
    tertiary_phone: '',
    address: '',
    email: '',
    website: '',
    principal_name: '',
    vice_principal_name: ''
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (config) {
      setFormData({
        school_name: config.school_name || '',
        primary_phone: config.primary_phone || '',
        secondary_phone: config.secondary_phone || '',
        tertiary_phone: config.tertiary_phone || '',
        address: config.address || '',
        email: config.email || '',
        website: config.website || '',
        principal_name: config.principal_name || '',
        vice_principal_name: config.vice_principal_name || ''
      });
      setLogoPreview(config.school_logo_url || null);
    }
  }, [config]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return null;

    try {
      setIsUploading(true);
      const logoUrl = await uploadLogo(logoFile);
      toast.success('Logo uploaded successfully!');
      return logoUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      let logoUrl = config?.school_logo_url;
      
      // Upload logo if a new one is selected
      if (logoFile) {
        const uploadedLogoUrl = await handleLogoUpload();
        if (uploadedLogoUrl) {
          logoUrl = uploadedLogoUrl;
        }
      }
      
      // Update configuration
      await updateConfig({
        ...formData,
        school_logo_url: logoUrl
      });
      
      toast.success('School configuration updated successfully!');
      setLogoFile(null);
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast.error('Failed to update configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !config) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Building className="h-6 w-6" />
            School Configuration
          </h2>
          <p className="text-gray-600 mt-1">
            Manage school details that will appear on gate pass tickets
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* School Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Image className="h-4 w-4 inline mr-1" />
              School Logo
            </label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                <div className="w-20 h-20 border border-gray-300 rounded-lg overflow-hidden">
                  <img
                    src={logoPreview}
                    alt="School Logo Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="logo-upload"
                  disabled={isUploading || isSaving}
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="h-4 w-4" />
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG up to 5MB. Recommended: 200x200px
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4 inline mr-1" />
                School Name *
              </label>
              <input
                type="text"
                name="school_name"
                value={formData.school_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter school name"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="school@example.com"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-1" />
                Primary Phone *
              </label>
              <input
                type="tel"
                name="primary_phone"
                value={formData.primary_phone}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+91-XXXXXXXXXX"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-1" />
                Secondary Phone
              </label>
              <input
                type="tel"
                name="secondary_phone"
                value={formData.secondary_phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+91-XXXXXXXXXX"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-1" />
                Tertiary Phone
              </label>
              <input
                type="tel"
                name="tertiary_phone"
                value={formData.tertiary_phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+91-XXXXXXXXXX"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              Address *
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter complete school address"
              disabled={isSaving}
            />
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="h-4 w-4 inline mr-1" />
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://school-website.com"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Principal Name
              </label>
              <input
                type="text"
                name="principal_name"
                value={formData.principal_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Principal's name"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Vice Principal Name
              </label>
              <input
                type="text"
                name="vice_principal_name"
                value={formData.vice_principal_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Vice Principal's name"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};