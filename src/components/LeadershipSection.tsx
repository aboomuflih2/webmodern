import React, { useState } from 'react';
import { useBoardMembers } from '../hooks/useBoardMembers';
import { BoardMember, BOARD_TYPE_LABELS } from '../../shared/types/board-members';
import { User, Mail, Phone, MapPin } from 'lucide-react';

interface LeadershipSectionProps {
  onMemberClick: (member: BoardMember) => void;
}

interface MemberCardProps {
  member: BoardMember;
  onClick: (member: BoardMember) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105 overflow-hidden"
      onClick={() => onClick(member)}
    >
      <div className="relative">
        {member.photo_url ? (
          <img 
            src={member.photo_url} 
            alt={member.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <User className="w-16 h-16 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
        <p className="text-blue-600 font-medium mb-3">{member.designation}</p>
        
        {member.bio && (
          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
            {member.bio.replace(/<[^>]*>/g, '').substring(0, 120)}...
          </p>
        )}
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {member.email && (
            <div className="flex items-center gap-1">
              <Mail className="w-4 h-4" />
              <span className="truncate">{member.email}</span>
            </div>
          )}
          {member.mobile && (
            <div className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              <span>{member.mobile}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface BoardSectionProps {
  title: string;
  members: BoardMember[];
  onMemberClick: (member: BoardMember) => void;
  loading: boolean;
}

const BoardSection: React.FC<BoardSectionProps> = ({ title, members, onMemberClick, loading }) => {
  if (loading) {
    return (
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="w-full h-48 bg-gray-200" />
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
                <div className="h-16 bg-gray-200 rounded mb-4" />
                <div className="flex gap-4">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{title}</h2>
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No members found in this section.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-16">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {members.map((member) => (
          <MemberCard 
            key={member.id} 
            member={member} 
            onClick={onMemberClick}
          />
        ))}
      </div>
    </div>
  );
};

const LeadershipSection: React.FC<LeadershipSectionProps> = ({ onMemberClick }) => {
  const { members: governingBoard, loading: governingLoading, error: governingError } = useBoardMembers('governing_board');
  const { members: boardOfDirectors, loading: directorsLoading, error: directorsError } = useBoardMembers('board_of_directors');

  const hasError = governingError || directorsError;
  const isLoading = governingLoading || directorsLoading;

  if (hasError) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Leadership</h2>
            <p className="text-gray-600 mb-4">
              {governingError || directorsError}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Director Board</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Meet the dedicated professionals who guide our institution towards excellence in education and community service.
          </p>
        </div>

        <BoardSection 
          title={BOARD_TYPE_LABELS.governing_board}
          members={governingBoard}
          onMemberClick={onMemberClick}
          loading={governingLoading}
        />

        <BoardSection 
          title={BOARD_TYPE_LABELS.board_of_directors}
          members={boardOfDirectors}
          onMemberClick={onMemberClick}
          loading={directorsLoading}
        />
      </div>
    </section>
  );
};

export default LeadershipSection;