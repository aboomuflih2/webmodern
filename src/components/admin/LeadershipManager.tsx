import React, { useState, useEffect } from 'react';
import { BoardMember } from '../../../shared/types/board-members';
import { useBoardMemberAdmin } from '../../hooks/useBoardMembers';
import { Plus, Edit, Trash2, Eye, Search, Filter, Users, AlertCircle } from 'lucide-react';
import MemberProfileModal from '../MemberProfileModal';

interface LeadershipManagerProps {
  onAddMember: () => void;
  onEditMember: (member: BoardMember) => void;
  onViewMember?: (member: BoardMember) => void;
}

const LeadershipManager: React.FC<LeadershipManagerProps> = ({ onAddMember, onEditMember, onViewMember }) => {
  const { loading, error, deleteMember, getAllMembers } = useBoardMemberAdmin();
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<BoardMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch members on component mount
  useEffect(() => {
    const fetchMembers = async () => {
      const fetchedMembers = await getAllMembers();
      setMembers(fetchedMembers);
    };
    fetchMembers();
  }, [getAllMembers]);

  // Filter and search members
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || member.board_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleViewMember = (member: BoardMember) => {
    if (onViewMember) {
      onViewMember(member);
    } else {
      setSelectedMember(member);
      setIsModalOpen(true);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (deleteConfirm === memberId) {
      try {
        const success = await deleteMember(memberId);
        if (success) {
          // Refresh the members list
          const fetchedMembers = await getAllMembers();
          setMembers(fetchedMembers);
        }
        setDeleteConfirm(null);
      } catch (error) {
        console.error('Failed to delete member:', error);
      }
    } else {
      setDeleteConfirm(memberId);
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const getBoardTypeLabel = (type: string) => {
    switch (type) {
      case 'governing_board': return 'Governing Board';
      case 'board_of_directors': return 'Board of Directors';
      default: return type;
    }
  };

  const getBoardTypeColor = (type: string) => {
    switch (type) {
      case 'governing_board': return 'bg-blue-100 text-blue-800';
      case 'board_of_directors': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading members...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">Error loading members: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Leadership Management</h1>
        </div>
        <button
          onClick={onAddMember}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search members by name or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Boards</option>
            <option value="governing_board">Governing Board</option>
            <option value="board_of_directors">Board of Directors</option>
          </select>
        </div>
      </div>

      {/* Members Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredMembers.length} of {members.length} members
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first board member.'}
          </p>
          {(!searchTerm && filterType === 'all') && (
            <button
              onClick={onAddMember}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Member
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <div key={member.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              {/* Member Photo */}
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-t-lg overflow-hidden">
                {member.photo_url ? (
                  <img 
                    src={member.photo_url} 
                    alt={member.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <Users className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Member Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">{member.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBoardTypeColor(member.board_type)}`}>
                    {getBoardTypeLabel(member.board_type)}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{member.designation}</p>
                
                {member.bio && (
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                    {member.bio.replace(/<[^>]*>/g, '').substring(0, 100)}...
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewMember(member)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  
                  <button
                    onClick={() => onEditMember(member)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-md transition-colors ${
                      deleteConfirm === member.id
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleteConfirm === member.id ? 'Confirm' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Member Profile Modal */}
      <MemberProfileModal
        member={selectedMember}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMember(null);
        }}
      />
    </div>
  );
};

export default LeadershipManager;