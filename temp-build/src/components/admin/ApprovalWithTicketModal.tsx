import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, X, Calendar, Clock, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { GatePassRequest, AdminGatePassUpdate } from "@/types/gatePass";
import { adminGatePassUpdateSchema } from "@/schemas/gatePassSchema";
import { useGatePassList } from "@/hooks/useGatePass";

import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";

interface ApprovalWithTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: GatePassRequest | null;
}

interface ApprovalFormData extends AdminGatePassUpdate {
  permitted_entry_date?: string;
  permitted_entry_time?: string;
  permitted_exit_date?: string;
  permitted_exit_time?: string;
}

export const ApprovalWithTicketModal = ({ isOpen, onClose, request }: ApprovalWithTicketModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateGatePassStatus, refreshData } = useGatePassList();

  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<ApprovalFormData>({
    resolver: zodResolver(adminGatePassUpdateSchema)
  });
  
  const watchedStatus = watch("status");
  
  useEffect(() => {
    if (request && isOpen) {
      setValue("status", request.status);
      setValue("admin_comments", request.admin_comments || "");
      
      // Set default date to tomorrow and time to 9:00 AM
      const tomorrow = addDays(new Date(), 1);
      setValue("permitted_entry_date", format(tomorrow, "yyyy-MM-dd"));
      setValue("permitted_entry_time", "09:00");
      
      // Set default exit date to same day and time to 5:00 PM
      setValue("permitted_exit_date", format(tomorrow, "yyyy-MM-dd"));
      setValue("permitted_exit_time", "17:00");
    }
  }, [request, isOpen, setValue]);
  
  const onSubmit = async (data: ApprovalFormData) => {
    if (!request) return;
    
    console.log('🚀 ApprovalWithTicketModal: Starting onSubmit with data:', data);
    console.log('🚀 ApprovalWithTicketModal: Selected request:', request);
    console.log('🚀 ApprovalWithTicketModal: Request ID:', request.id);
    console.log('🚀 ApprovalWithTicketModal: Current request status:', request.status);

    setIsSubmitting(true);
    try {
      // First update the gate pass status
      const updateData: AdminGatePassUpdate = {
        status: data.status,
        admin_comments: data.admin_comments
      };
      
      console.log('🚀 ApprovalWithTicketModal: Update data to send:', updateData);
      console.log('🚀 ApprovalWithTicketModal: Calling updateGatePassStatus with ID:', request.id);
      const success = await updateGatePassStatus(request.id, updateData);
      console.log('🚀 ApprovalWithTicketModal: updateGatePassStatus result:', success);
      
      if (success) {
        console.log('✅ ApprovalWithTicketModal: Gate pass status updated successfully');
        toast({
            title: "Success",
            description: `Gate pass ${data.status} successfully!`,
          });
        
        console.log('✅ ApprovalWithTicketModal: Process completed successfully');
        await refreshData(); // Refresh the data
        onClose();
        reset();
      }
    } catch (error) {
      console.error('❌ ApprovalWithTicketModal: Approval error:', error);
      toast({
        title: "Error",
        description: "Failed to update gate pass request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    reset();
    onClose();
  };
  
  if (!request) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Gate Pass Approval
            </span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Request Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">{request.name}</h4>
            <p className="text-sm text-muted-foreground">
              {request.designation} • {request.purpose}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Mobile: {request.mobile_number} • Email: {request.email}
            </p>
          </div>
          
          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">Decision *</Label>
            <Select
              value={watchedStatus}
              onValueChange={(value) => setValue("status", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">✅ Approve Request</SelectItem>
                <SelectItem value="rejected">❌ Reject</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>
          

          
          {/* Admin Comments */}
          <div className="space-y-2">
            <Label htmlFor="admin_comments">
              Comments
              {watchedStatus === 'rejected' && " *"}
            </Label>
            <Textarea
              id="admin_comments"
              placeholder={watchedStatus === 'rejected' 
                ? "Please provide a reason for rejection..."
                : watchedStatus === 'approved'
                ? "Add any special instructions or notes for the visitor..."
                : "Add any comments or notes..."
              }
              rows={3}
              {...register("admin_comments", {
                required: watchedStatus === 'rejected' ? "Reason for rejection is required" : false
              })}
            />
            {errors.admin_comments && (
              <p className="text-sm text-red-600">{errors.admin_comments.message}</p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={watchedStatus === 'approved' 
                ? 'flex items-center gap-2 bg-green-600 hover:bg-green-700' 
                : watchedStatus === 'rejected'
                ? 'flex items-center gap-2 bg-red-600 hover:bg-red-700'
                : 'flex items-center gap-2'}
            >
              {watchedStatus === 'approved' ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {isSubmitting ? "Processing..." : "Approve Request"}
                </>
              ) : watchedStatus === 'rejected' ? (
                <>
                  <X className="h-4 w-4" />
                  {isSubmitting ? "Processing..." : "Reject Request"}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Processing..." : "Update Request"}
                </>
              )}
            </Button>
          </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};