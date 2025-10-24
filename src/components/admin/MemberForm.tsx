import React, { useState, useEffect } from 'react';
import { BoardMember, CreateBoardMemberRequest, UpdateBoardMemberRequest, SOCIAL_PLATFORM_LABELS } from '../../../shared/types/board-members';
import { useBoardMemberAdmin } from '../../hooks/useBoardMembers';
import { Save, X, Plus, Trash2, Upload, User, AlertCircle } from 'lucide-react';
import PhotoUpload from '../PhotoUpload';

interface SocialLinkForm {
  id?: string;
  platform: string;
  url: string;
  display_order: number;
}

interface MemberFormProps {
  member?: BoardMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MemberForm: React.FC<MemberFormProps> = ({ member, isOpen, onClose, onSuccess }) => {
  const { createMember, updateMember, loading } = useBoardMemberAdmin();
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    board_type: 'governing_board',
    bio: '',
    email: '',
    mobile: '',
    address: '',
    photo_url: '',
    display_order: 0
  });
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLinkForm[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  // Initialize form data when member changes
  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        designation: member.designation || '',
        board_type: member.board_type || 'governing_board',
        bio: member.bio || '',
        email: member.email || '',
        mobile: member.mobile || '',
        address: member.address || '',
        photo_url: member.photo_url || '',
        display_order: member.display_order || 0
      });
      setCurrentPhotoUrl(member.photo_url || '');
      setSocialLinks(
        member.social_links?.map(link => ({
          id: link.id,
          platform: link.platform,
          url: link.url,
          display_order: link.display_order
        })) || []
      );
    } else {
      // Reset form for new member
      setFormData({
        name: '',
        designation: '',
        board_type: 'governing_board',
        bio: '',
        email: '',
        mobile: '',
        address: '',
        photo_url: '',
        display_order: 0
      });
      setCurrentPhotoUrl('');
      setSocialLinks([]);
    }
    setErrors({});
    setSubmitError('');
  }, [member, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.designation.trim()) {
      newErrors.designation = 'Designation is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.mobile && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.mobile.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.mobile = 'Please enter a valid mobile number';
    }

    // Validate social links
    socialLinks.forEach((link, index) => {
      if (link.url && !/^https?:\/\/.+/.test(link.url)) {
        newErrors[`social_${index}`] = 'Please enter a valid URL (starting with http:// or https://)';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addSocialLink = () => {
    setSocialLinks(prev => [
      ...prev,
      {
        platform: 'linkedin',
        url: '',
        display_order: prev.length
      }
    ]);
  };

  const updateSocialLink = (index: number, field: keyof SocialLinkForm, value: string | number) => {
    setSocialLinks(prev => prev.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    ));
    // Clear error when user starts typing
    if (errors[`social_${index}`]) {
      setErrors(prev => ({ ...prev, [`social_${index}`]: '' }));
    }
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitError('');
      
      // Filter out empty social links
      const validSocialLinks = socialLinks.filter(link => link.url.trim());

      if (member) {
        // Update existing member
        const updateData: UpdateBoardMemberRequest = {
          ...formData,
          photo_url: currentPhotoUrl,
          social_links: validSocialLinks.map(link => ({
            id: link.id,
            platform: link.platform,
            url: link.url,
            display_order: link.display_order
          }))
        };
        await updateMember(member.id, updateData);
      } else {
        // Create new member
        const createData: CreateBoardMemberRequest = {
          ...formData,
          photo_url: currentPhotoUrl,
          social_links: validSocialLinks.map(link => ({
            platform: link.platform,
            url: link.url,
            display_order: link.display_order
          }))
        };
        await createMember(createData);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save member:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to save member. Please try again.');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {member ? 'Edit Member' : 'Add New Member'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-800">{submitError}</span>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter full name"
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Designation *
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.designation ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter designation"
                />
                {errors.designation && <p className="text-red-600 text-sm mt-1">{errors.designation}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Board Type
                </label>
                <select
                  value={formData.board_type}
                  onChange={(e) => handleInputChange('board_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="governing_board">Governing Board</option>
                  <option value="board_of_directors">Board of Directors</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Member Photo
              </label>
              <PhotoUpload
                currentPhotoUrl={currentPhotoUrl}
                onPhotoChange={setCurrentPhotoUrl}
                bucket="staff-photos"
                folder="board-members"
                maxSizeInMB={5}
                className="w-full"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter member biography..."
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="email@example.com"
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile
                </label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.mobile ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="+1234567890"
                />
                {errors.mobile && <p className="text-red-600 text-sm mt-1">{errors.mobile}</p>}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter address..."
              />
            </div>

            {/* Social Media Links */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Social Media Links
                </label>
                <button
                  type="button"
                  onClick={addSocialLink}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Link
                </button>
              </div>
              
              <div className="space-y-3">
                {socialLinks.map((link, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <select
                      value={link.platform}
                      onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Object.entries(SOCIAL_PLATFORM_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors[`social_${index}`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="https://..."
                    />
                    
                    <button
                      type="button"
                      onClick={() => removeSocialLink(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {socialLinks.length === 0 && (
                  <p className="text-gray-500 text-sm italic">No social media links added yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              {member ? 'Update Member' : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberForm;