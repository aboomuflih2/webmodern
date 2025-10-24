import { format } from "date-fns";
import { X, User, Phone, Mail, MapPin, FileText, Users, Calendar, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GatePassStatusBadge } from "./GatePassStatusBadge";
import { GatePassRequest } from "@/types/gatePass";
import { useGatePassList } from "@/hooks/useGatePass";

interface GatePassDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: GatePassRequest | null;
}

export const GatePassDetailsModal = ({ isOpen, onClose, request }: GatePassDetailsModalProps) => {
  const { downloadDocument } = useGatePassList();
  
  if (!request) return null;

  const handleDownloadDocument = () => {
    if (request.id_proof_document_path) {
      const fileName = `${request.name}_ID_Proof.${request.id_proof_document_path.split('.').pop()}`;
      downloadDocument(request.id_proof_document_path, fileName);
    }
  };

  const renderConditionalFields = () => {
    switch (request.designation) {
      case 'parent':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Student Name:</span>
              <span>{request.student_name || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Class:</span>
              <span>{request.class || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Admission Number:</span>
              <span>{request.admission_number || 'N/A'}</span>
            </div>
          </div>
        );
      case 'other':
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Person to Meet:</span>
            <span>{request.person_to_meet || 'N/A'}</span>
          </div>
        );
      case 'maintenance':
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Authorized Person/Reporting To:</span>
            <span>{request.authorized_person || 'N/A'}</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Gate Pass Request Details</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">{request.name}</h3>
              <GatePassStatusBadge status={request.status} />
            </div>
            <Badge variant="outline" className="capitalize">
              {request.designation}
            </Badge>
          </div>
          
          <Separator />
          
          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-base">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Mobile:</span>
                <span>{request.mobile_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span>{request.email}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
              <span className="font-medium">Address:</span>
              <span className="flex-1">{request.address}</span>
            </div>
          </div>
          
          <Separator />
          
          {/* Visit Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-base">Visit Information</h4>
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-1" />
              <span className="font-medium">Purpose:</span>
              <span className="flex-1">{request.purpose}</span>
            </div>
            
            {/* Conditional Fields */}
            {renderConditionalFields()}
          </div>
          
          <Separator />
          
          {/* Admin Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-base">Administrative Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Submitted:</span>
                <span>{format(new Date(request.created_at), "PPP 'at' p")}</span>
              </div>
              {request.updated_at !== request.created_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Last Updated:</span>
                  <span>{format(new Date(request.updated_at), "PPP 'at' p")}</span>
                </div>
              )}
            </div>
            
            {/* ID Proof Document Download */}
            {request.id_proof_document_path && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">ID Proof Document:</span>
                  <span className="text-sm text-muted-foreground">Uploaded</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadDocument}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            )}
            
            {request.admin_comments && (
              <div className="space-y-2">
                <span className="font-medium">Admin Comments:</span>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">{request.admin_comments}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};