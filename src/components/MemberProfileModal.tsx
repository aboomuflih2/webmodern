import React from 'react';
import { BoardMember, SOCIAL_PLATFORM_LABELS } from '../../shared/types/board-members';
import { X, User, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

interface MemberProfileModalProps {
  member: BoardMember | null;
  isOpen: boolean;
  onClose: () => void;
}

const getSocialIcon = (platform: string) => {
  switch (platform) {
    case 'linkedin':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      );
    case 'twitter':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    case 'facebook':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    case 'instagram':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.017 0C8.396 0 7.989.013 7.041.048 6.094.082 5.52.204 5.036.388a5.918 5.918 0 0 0-2.14 1.393A5.918 5.918 0 0 0 .388 4.036C.204 4.52.082 5.094.048 6.041.013 6.989 0 7.396 0 11.017c0 3.621.013 4.028.048 4.976.034.947.156 1.521.34 2.005a5.918 5.918 0 0 0 1.393 2.14 5.918 5.918 0 0 0 2.14 1.393c.484.184 1.058.306 2.005.34.948.035 1.355.048 4.976.048 3.621 0 4.028-.013 4.976-.048.947-.034 1.521-.156 2.005-.34a5.918 5.918 0 0 0 2.14-1.393 5.918 5.918 0 0 0 1.393-2.14c.184-.484.306-1.058.34-2.005.035-.948.048-1.355.048-4.976 0-3.621-.013-4.028-.048-4.976-.034-.947-.156-1.521-.34-2.005a5.918 5.918 0 0 0-1.393-2.14A5.918 5.918 0 0 0 19.036.388C18.552.204 17.978.082 17.031.048 16.083.013 15.676 0 12.017 0zm0 2.162c3.557 0 3.98.013 5.385.048.947.034 1.462.156 1.805.26.454.176.778.387 1.12.73.343.343.554.667.73 1.12.104.343.226.858.26 1.805.035 1.405.048 1.828.048 5.385 0 3.557-.013 3.98-.048 5.385-.034.947-.156 1.462-.26 1.805a3.016 3.016 0 0 1-.73 1.12 3.016 3.016 0 0 1-1.12.73c-.343.104-.858.226-1.805.26-1.405.035-1.828.048-5.385.048-3.557 0-3.98-.013-5.385-.048-.947-.034-1.462-.156-1.805-.26a3.016 3.016 0 0 1-1.12-.73 3.016 3.016 0 0 1-.73-1.12c-.104-.343-.226-.858-.26-1.805-.035-1.405-.048-1.828-.048-5.385 0-3.557.013-3.98.048-5.385.034-.947.156-1.462.26-1.805.176-.454.387-.778.73-1.12.343-.343.667-.554 1.12-.73.343-.104.858-.226 1.805-.26 1.405-.035 1.828-.048 5.385-.048z"/>
          <path d="M12.017 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12.017 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/>
          <path d="M19.846 5.595a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z"/>
        </svg>
      );
    default:
      return <ExternalLink className="w-5 h-5" />;
  }
};

const MemberProfileModal: React.FC<MemberProfileModalProps> = ({ member, isOpen, onClose }) => {
  if (!isOpen || !member) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Modal Content */}
        <div className="overflow-y-auto max-h-[90vh]">
          {/* Header Section */}
          <div className="relative">
            {member.photo_url ? (
              <div className="h-64 bg-gradient-to-br from-blue-500 to-blue-700 relative overflow-hidden">
                <img 
                  src={member.photo_url} 
                  alt={member.name}
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            ) : (
              <div className="h-64 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <User className="w-24 h-24 text-white opacity-80" />
              </div>
            )}
            
            {/* Member Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h1 id="modal-title" className="text-3xl font-bold mb-2">{member.name}</h1>
              <p className="text-xl font-medium opacity-90">{member.designation}</p>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6">
            {/* Bio Section */}
            {member.bio && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: member.bio }}
                />
              </div>
            )}

            {/* Contact Information */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Information</h2>
              <div className="space-y-3">
                {member.email && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <a 
                      href={`mailto:${member.email}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {member.email}
                    </a>
                  </div>
                )}
                
                {member.mobile && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <a 
                      href={`tel:${member.mobile}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {member.mobile}
                    </a>
                  </div>
                )}
                
                {member.address && (
                  <div className="flex items-start gap-3 text-gray-700">
                    <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{member.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Social Media Links */}
            {member.social_links && member.social_links.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Connect</h2>
                <div className="flex flex-wrap gap-3">
                  {member.social_links
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors group"
                    >
                      <span className="text-gray-600 group-hover:text-gray-800">
                        {getSocialIcon(link.platform)}
                      </span>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        {SOCIAL_PLATFORM_LABELS[link.platform as keyof typeof SOCIAL_PLATFORM_LABELS]}
                      </span>
                      <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberProfileModal;