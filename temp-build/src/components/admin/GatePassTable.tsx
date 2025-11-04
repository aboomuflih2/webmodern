import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Eye, Edit, Trash2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GatePassStatusBadge } from "./GatePassStatusBadge";
import { ApprovalWithTicketModal } from "./ApprovalWithTicketModal";
import { GatePassRequest } from "@/types/gatePass";
import { useGatePassList } from "@/hooks/useGatePass";

import { useToast } from "@/hooks/use-toast";

interface GatePassTableProps {
  onViewDetails: (request: GatePassRequest) => void;
  onEditRequest: (request: GatePassRequest) => void;
}

export const GatePassTable = ({ onViewDetails, onEditRequest }: GatePassTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [designationFilter, setDesignationFilter] = useState<string>("all");
  const [approvingRequest, setApprovingRequest] = useState<GatePassRequest | null>(null);
  
  const { 
    gatePassRequests: requests, 
    isLoading, 
    fetchGatePassRequests,
    deleteGatePassRequest 
  } = useGatePassList();
  
  // Auto-fetch data when component mounts and when filters change
  useEffect(() => {
    const filters = {
      status: statusFilter === "all" ? undefined : statusFilter,
      designation: designationFilter === "all" ? undefined : designationFilter
    };
    fetchGatePassRequests(filters);
  }, [statusFilter, designationFilter, fetchGatePassRequests]);
  
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this gate pass request?")) {
      const success = await deleteGatePassRequest(id);
      if (!success) {
        toast({
          title: "Error",
          description: "Failed to delete gate pass request",
          variant: "destructive",
        });
      }
    }
  };





  const filteredRequests = requests?.filter(request => {
    const matchesSearch = searchTerm === "" || 
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.mobile_number.includes(searchTerm);
    
    return matchesSearch;
  }) || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading gate pass requests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Gate Pass Requests
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Search by name, email, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={designationFilter} onValueChange={setDesignationFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by designation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Designations</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="alumni">Alumni</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No gate pass requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.name}</TableCell>
                    <TableCell>{request.mobile_number}</TableCell>
                    <TableCell className="capitalize">{request.designation}</TableCell>
                    <TableCell className="max-w-xs truncate">{request.purpose}</TableCell>
                    <TableCell>
                      <GatePassStatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(request)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setApprovingRequest(request)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        


                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(request.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      <ApprovalWithTicketModal
        isOpen={!!approvingRequest}
        onClose={() => setApprovingRequest(null)}
        request={approvingRequest}
      />
    </Card>
  );
};