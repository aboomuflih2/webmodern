import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GatePassRequest, AdminGatePassUpdate, STATUS_OPTIONS } from "@/types/gatePass";
import { adminGatePassUpdateSchema } from "@/schemas/gatePassSchema";
import { useGatePassList } from "@/hooks/useGatePass";
import { useToast } from "@/hooks/use-toast";

interface GatePassEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: GatePassRequest | null;
}

export const GatePassEditModal = ({ isOpen, onClose, request }: GatePassEditModalProps) => {
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
  } = useForm<AdminGatePassUpdate>({
    resolver: zodResolver(adminGatePassUpdateSchema)
  });
  
  const watchedStatus = watch("status");
  
  useEffect(() => {
    if (request && isOpen) {
      setValue("status", request.status);
      setValue("admin_comments", request.admin_comments || "");
    }
  }, [request, isOpen, setValue]);
  
  const onSubmit = async (data: AdminGatePassUpdate) => {
    if (!request) return;
    
    setIsSubmitting(true);
    try {
      const success = await updateGatePassStatus(request.id, data);
      if (success) {
        await refreshData(); // Refresh the data after successful update
        toast({
          title: "Success",
          description: "Gate pass request updated successfully",
        });
        onClose();
        reset();
      }
    } catch (error) {
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Gate Pass Request</span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Request Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">{request.name}</h4>
            <p className="text-sm text-muted-foreground">
              {request.designation} • {request.purpose}
            </p>
          </div>
          
          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={watchedStatus}
              onValueChange={(value) => setValue("status", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>
          
          {/* Admin Comments */}
          <div className="space-y-2">
            <Label htmlFor="admin_comments">
              Admin Comments
              {watchedStatus === 'rejected' && " *"}
            </Label>
            <Textarea
              id="admin_comments"
              placeholder={watchedStatus === 'rejected' 
                ? "Please provide a reason for rejection..."
                : "Add any comments or notes..."
              }
              rows={4}
              {...register("admin_comments")}
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
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Updating..." : "Update Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};