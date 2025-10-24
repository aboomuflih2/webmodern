import { useState } from "react";
import { GatePassStats } from "./GatePassStats";
import { GatePassTable } from "./GatePassTable";
import { GatePassDetailsModal } from "./GatePassDetailsModal";
import { GatePassEditModal } from "./GatePassEditModal";
import { GatePassRequest } from "@/types/gatePass";

export const GatePassDashboard = () => {
  const [selectedRequest, setSelectedRequest] = useState<GatePassRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const handleViewDetails = (request: GatePassRequest) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };
  
  const handleEditRequest = (request: GatePassRequest) => {
    setSelectedRequest(request);
    setIsEditModalOpen(true);
  };
  
  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedRequest(null);
  };
  
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedRequest(null);
  };
  
  return (
    <div className="space-y-8">
      {/* Statistics */}
      <GatePassStats />
      
      {/* Gate Pass Table */}
      <GatePassTable 
        onViewDetails={handleViewDetails}
        onEditRequest={handleEditRequest}
      />
      
      {/* Modals */}
      <GatePassDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        request={selectedRequest}
      />
      
      <GatePassEditModal 
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        request={selectedRequest}
      />
    </div>
  );
};