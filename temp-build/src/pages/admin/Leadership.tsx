import React, { useState } from 'react';
import LeadershipManager from '@/components/admin/LeadershipManager';
import MemberForm from '@/components/admin/MemberForm';
import MemberProfileModal from '@/components/MemberProfileModal';
import { BoardMember } from '../../../shared/types/board-members';

const Leadership = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<BoardMember | null>(null);
  const [viewingMember, setViewingMember] = useState<BoardMember | null>(null);

  const handleAddMember = () => {
    setEditingMember(null);
    setShowForm(true);
  };

  const handleEditMember = (member: BoardMember) => {
    setEditingMember(member);
    setShowForm(true);
  };

  const handleViewMember = (member: BoardMember) => {
    setViewingMember(member);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMember(null);
  };

  const handleCloseModal = () => {
    setViewingMember(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingMember(null);
    // The LeadershipManager component will automatically refresh the data
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Director Board Management</h1>
        <p className="text-muted-foreground">Manage director board members and their profiles</p>
      </div>

      <LeadershipManager 
        onAddMember={handleAddMember}
        onEditMember={handleEditMember}
        onViewMember={handleViewMember}
      />

      {viewingMember && (
        <MemberProfileModal 
          member={viewingMember}
          isOpen={true}
          onClose={handleCloseModal}
        />
      )}

      <MemberForm 
        member={editingMember}
        isOpen={showForm}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default Leadership;
