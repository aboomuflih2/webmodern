import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Filter, Search, Users, Calendar, Check, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { exportApplicationsToExcelWithMetadata } from "@/utils/excelExport";

interface Application {
  id: string;
  application_number: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  father_name: string;
  mother_name: string;
  house_name: string;
  village: string;
  post_office: string;
  district: string;
  pincode: string;
  mobile_number: string;
  email?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  interview_date?: string | null;
  interview_time?: string | null;
  has_siblings?: boolean | null;
  siblings_names?: string | null;
  type: "kg_std" | "plus_one";
  
  // KG/STD specific fields
  stage?: string;
  previous_school?: string | null;
  need_madrassa?: boolean | null;
  previous_madrassa?: string | null;
  
  // Plus One specific fields
  stream?: string;
  board?: string;
  exam_roll_number?: string;
  exam_year?: string;
  tenth_school?: string;
  landmark?: string | null;
  tenth_total_marks?: number | null;
  tenth_obtained_marks?: number | null;
  tenth_percentage?: number | null;
  tenth_grade?: string | null;
  tenth_result?: string | null;
  mathematics_marks?: number | null;
  science_marks?: number | null;
  english_marks?: number | null;
  social_science_marks?: number | null;
  language_marks?: number | null;
  additional_subject_1?: string | null;
  additional_subject_1_marks?: number | null;
  additional_subject_2?: string | null;
  additional_subject_2_marks?: number | null;
}

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "shortlisted_for_interview", label: "Shortlisted for Interview" },
  { value: "interview_complete", label: "Interview Complete" },
  { value: "admitted", label: "Admitted" },
  { value: "not_admitted", label: "Not Admitted" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "submitted": return "bg-blue-500";
    case "under_review": return "bg-yellow-500";
    case "shortlisted_for_interview": return "bg-purple-500";
    case "interview_complete": return "bg-orange-500";
    case "admitted": return "bg-green-500";
    case "not_admitted": return "bg-red-500";
    default: return "bg-gray-500";
  }
};

const getStatusLabel = (status: string) => {
  return statusOptions.find(opt => opt.value === status)?.label || status;
};

export default function AdmissionApplications() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [bulkInterviewModalOpen, setBulkInterviewModalOpen] = useState(false);
  const [bulkInterviewDate, setBulkInterviewDate] = useState("");
  const [bulkInterviewTime, setBulkInterviewTime] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter, typeFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      // Fetch KG STD applications with all fields
      const { data: kgStdData, error: kgStdError } = await supabase
        .from('kg_std_applications')
        .select(`
          id, application_number, full_name, date_of_birth, gender, father_name, mother_name,
          house_name, village, post_office, district, pincode, mobile_number, email,
          previous_school, stage, need_madrassa, previous_madrassa, has_siblings, siblings_names,
          interview_date, interview_time, status, created_at, updated_at
        `)
        .order('created_at', { ascending: false });

      if (kgStdError) throw kgStdError;

      // Fetch Plus One applications with all fields including marks
      const { data: plusOneData, error: plusOneError } = await supabase
        .from('plus_one_applications')
        .select(`
          id, application_number, full_name, date_of_birth, gender, father_name, mother_name,
          house_name, village, post_office, district, pincode, mobile_number, email,
          stream, board, exam_roll_number, exam_year, tenth_school, landmark,
          has_siblings, siblings_names, interview_date, interview_time, status, created_at, updated_at,
          tenth_total_marks, tenth_obtained_marks, tenth_percentage, tenth_grade, tenth_result,
          mathematics_marks, science_marks, english_marks, social_science_marks, language_marks,
          additional_subject_1, additional_subject_1_marks, additional_subject_2, additional_subject_2_marks
        `)
        .order('created_at', { ascending: false });

      if (plusOneError) throw plusOneError;

      // Combine and format applications
      const combinedApplications: Application[] = [
        ...(kgStdData || []).map(app => ({
          ...app,
          type: "kg_std" as const,
        })),
        ...(plusOneData || []).map(app => ({
          ...app,
          type: "plus_one" as const,
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setApplications(combinedApplications);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app => {
        return app.application_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (app.full_name && app.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
               app.mobile_number.includes(searchTerm);
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(app => app.type === typeFilter);
    }

    setFilteredApplications(filtered);
  };

  const viewApplication = (application: Application) => {
    navigate(`/admin/applications/${application.type}/${application.id}`);
  };

  const toggleApplicationSelection = (applicationId: string) => {
    const newSelected = new Set(selectedApplications);
    if (newSelected.has(applicationId)) {
      newSelected.delete(applicationId);
    } else {
      newSelected.add(applicationId);
    }
    setSelectedApplications(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedApplications.size === filteredApplications.length) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(filteredApplications.map(app => app.id)));
    }
  };

  const scheduleInterviewForSelected = async () => {
    if (selectedApplications.size === 0 || !bulkInterviewDate || !bulkInterviewTime) {
      toast({
        title: "Error",
        description: "Please select applications and provide interview date/time",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update KG STD applications
      const kgStdIds = Array.from(selectedApplications).filter(id => 
        filteredApplications.find(app => app.id === id)?.type === "kg_std"
      );
      
      if (kgStdIds.length > 0) {
        const { error: kgError } = await supabase
          .from('kg_std_applications')
          .update({
            status: 'shortlisted_for_interview',
            interview_date: bulkInterviewDate,
            interview_time: bulkInterviewTime
          })
          .in('id', kgStdIds);

        if (kgError) throw kgError;
      }

      // Update Plus One applications
      const plusOneIds = Array.from(selectedApplications).filter(id => 
        filteredApplications.find(app => app.id === id)?.type === "plus_one"
      );
      
      if (plusOneIds.length > 0) {
        const { error: plusError } = await supabase
          .from('plus_one_applications')
          .update({
            status: 'shortlisted_for_interview',
            interview_date: bulkInterviewDate,
            interview_time: bulkInterviewTime
          })
          .in('id', plusOneIds);

        if (plusError) throw plusError;
      }

      toast({
        title: "Success",
        description: `Interview scheduled for ${selectedApplications.size} applications`,
      });

      // Reset state
      setSelectedApplications(new Set());
      setBulkInterviewModalOpen(false);
      setBulkInterviewDate("");
      setBulkInterviewTime("");
      
      // Refresh applications
      fetchApplications();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to schedule interviews",
        variant: "destructive"
      });
    }
  };

  const handleExportToExcel = async () => {
    setExportLoading(true);
    try {
      // Prepare the applications data for export
      const applicationsToExport = filteredApplications.map(app => ({
        id: app.id,
        application_number: app.application_number,
        full_name: app.full_name || '',
        gender: app.gender || '',
        date_of_birth: app.date_of_birth || '',
        father_name: app.father_name || '',
        mother_name: app.mother_name || '',
        house_name: app.house_name || '',
        post_office: app.post_office || '',
        village: app.village || '',
        pincode: app.pincode || '',
        district: app.district || '',
        email: app.email || '',
        mobile_number: app.mobile_number,
        status: app.status,
        created_at: app.created_at,
        interview_date: app.interview_date,
        interview_time: app.interview_time,
        // Type-specific fields
        ...(app.type === 'kg_std' ? {
          stage: app.stage,
          need_madrassa: app.need_madrassa,
          previous_madrassa: app.previous_madrassa,
          previous_school: app.previous_school,
          has_siblings: app.has_siblings,
          siblings_names: app.siblings_names,
        } : {}),
        ...(app.type === 'plus_one' ? {
          landmark: app.landmark,
          tenth_school: app.tenth_school,
          board: app.board,
          exam_roll_number: app.exam_roll_number,
          exam_year: app.exam_year,
          stream: app.stream,
          tenth_total_marks: app.tenth_total_marks,
          tenth_obtained_marks: app.tenth_obtained_marks,
          tenth_percentage: app.tenth_percentage,
          tenth_grade: app.tenth_grade,
          tenth_result: app.tenth_result,
          mathematics_marks: app.mathematics_marks,
          science_marks: app.science_marks,
          english_marks: app.english_marks,
          social_science_marks: app.social_science_marks,
          language_marks: app.language_marks,
          additional_subject_1: app.additional_subject_1,
          additional_subject_1_marks: app.additional_subject_1_marks,
          additional_subject_2: app.additional_subject_2,
          additional_subject_2_marks: app.additional_subject_2_marks,
          has_siblings: app.has_siblings,
          siblings_names: app.siblings_names,
        } : {}),
      }));

      // Prepare metadata
      const metadata = {
        totalApplications: applications.length,
        filteredApplications: filteredApplications.length,
        exportDate: new Date().toISOString(),
        filters: {
          search: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
        },
      };

      // Export to Excel
      exportApplicationsToExcelWithMetadata(applicationsToExport, metadata);

      toast({
        title: "Success",
        description: `Exported ${filteredApplications.length} applications to Excel`,
      });
    } catch (error: unknown) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export applications to Excel",
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          Admission Applications
        </h1>
        <p className="text-muted-foreground">
          View and manage all submitted applications
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">KG & STD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter(app => app.type === "kg_std").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">+1 / HSS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter(app => app.type === "plus_one").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {applications.filter(app => app.status === "admitted").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Application Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="kg_std">KG & STD</SelectItem>
                  <SelectItem value="plus_one">+1 / HSS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
                variant="outline"
                className="flex-1"
              >
                Clear Filters
              </Button>
              <Button
                onClick={handleExportToExcel}
                disabled={exportLoading || filteredApplications.length === 0}
                variant="default"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                {exportLoading ? "Exporting..." : "Export to Excel"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedApplications.size > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                {selectedApplications.size} Applications Selected
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={handleExportToExcel}
                  disabled={exportLoading}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportLoading ? "Exporting..." : "Export to Excel"}
                </Button>
                <Dialog open={bulkInterviewModalOpen} onOpenChange={setBulkInterviewModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Interview for Selected
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule Interview for {selectedApplications.size} Applications</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Interview Date</Label>
                      <Input
                        type="date"
                        value={bulkInterviewDate}
                        onChange={(e) => setBulkInterviewDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Interview Time</Label>
                      <Input
                        type="time"
                        value={bulkInterviewTime}
                        onChange={(e) => setBulkInterviewTime(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setBulkInterviewModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={scheduleInterviewForSelected}>
                        Schedule Interviews
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            Showing {filteredApplications.length} of {applications.length} applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedApplications.size === filteredApplications.length && filteredApplications.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Application No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Stage/Stream</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={`${application.type}-${application.id}`}>
                    <TableCell>
                      <Checkbox
                        checked={selectedApplications.has(application.id)}
                        onCheckedChange={() => toggleApplicationSelection(application.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {application.application_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {application.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {application.mobile_number}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {application.type === "kg_std" ? "KG & STD" : "+1 / HSS"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {application.type === 'kg_std' ? (application.stage || '-') : (application.stream || '-')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(application.status)}>
                        {getStatusLabel(application.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(application.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => viewApplication(application)}
                        size="sm"
                        variant="outline"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredApplications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No applications found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
