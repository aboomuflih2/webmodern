import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Download, Filter, Users, Calendar, Upload, Phone, Mail, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useJobApplications, useJobApplicationFilters } from "@/hooks/useJobApplications";
import { JobApplication, ColumnMapping, REQUIRED_COLUMNS, OPTIONAL_COLUMNS } from "@/types/job-applications";

const JobApplications = () => {
  const { applications, loading, downloadCV, bulkImport } = useJobApplications();
  const { filters, setFilters, filteredApplications, clearFilters } = useJobApplicationFilters(applications);

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const { toast } = useToast();

  // Generate dynamic options from actual applications data
  const dynamicOptions = useMemo(() => {
    if (!applications || applications.length === 0) {
      return {
        designationOptions: [],
        subjectOptions: [],
        districtOptions: []
      };
    }

    // Extract unique designations
    const designations = [...new Set(applications.map(app => app.designation).filter(Boolean))];
    const designationOptions = designations.map(designation => ({
      value: designation,
      label: designation
    }));

    // Extract unique subjects (handle comma-separated subjects)
    const allSubjects = applications.map(app => app.subject).filter(Boolean);
    const subjectList: string[] = [];
    allSubjects.forEach(subjectStr => {
      if (subjectStr) {
        const subjects = subjectStr.split(',').map(s => s.trim()).filter(Boolean);
        subjectList.push(...subjects);
      }
    });
    const uniqueSubjects = [...new Set(subjectList)];
    const subjectOptions = uniqueSubjects.map(subject => ({
      value: subject,
      label: subject
    }));

    // Extract unique districts
    const districts = [...new Set(applications.map(app => app.district).filter(Boolean))];
    const districtOptions = districts.map(district => ({
      value: district,
      label: district
    }));

    return {
      designationOptions,
      subjectOptions,
      districtOptions
    };
  }, [applications]);



  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast({
        title: "Error",
        description: "Please upload a CSV or Excel file",
        variant: "destructive",
      });
      return;
    }

    setCsvFile(file);
    
    // Parse CSV headers
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        setCsvHeaders(headers);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (!csvFile || !csvHeaders.length) {
      toast({
        title: "Error",
        description: "Please upload a valid CSV file",
        variant: "destructive",
      });
      return;
    }

    // Validate required column mappings
    const missingMappings = REQUIRED_COLUMNS.filter(col => !columnMapping[col]);
    if (missingMappings.length > 0) {
      toast({
        title: "Error",
        description: `Please map required columns: ${missingMappings.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').slice(1); // Skip header
        
        const importData = lines
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const rowData: any = {};
            
            // Map required columns
            REQUIRED_COLUMNS.forEach(col => {
              const csvIndex = csvHeaders.indexOf(columnMapping[col]);
              if (csvIndex !== -1) {
                rowData[col] = values[csvIndex] || '';
              }
            });
            
            // Map optional columns
            OPTIONAL_COLUMNS.forEach(col => {
              if (columnMapping[col] && columnMapping[col] !== 'none') {
                const csvIndex = csvHeaders.indexOf(columnMapping[col]);
                if (csvIndex !== -1) {
                  rowData[col] = values[csvIndex] || null;
                }
              }
            });
            
            // Convert experience_years to number
            if (rowData.experience_years) {
              rowData.experience_years = parseInt(rowData.experience_years) || 0;
            }
            
            return rowData;
          });

        await bulkImport(importData);

        setBulkImportOpen(false);
        setCsvFile(null);
        setColumnMapping({});
        setCsvHeaders([]);
      };
      reader.readAsText(csvFile);
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: "Error",
        description: "Failed to import job applications",
        variant: "destructive",
      });
    }
  };

  const getDesignationLabel = (designation: string) => {
    const option = designationOptions.find(opt => opt.value === designation);
    return option?.label || designation;
  };

  const getSubjectLabel = (subject?: string) => {
    if (!subject) return '-';
    const option = subjectOptions.find(opt => opt.value === subject);
    return option?.label || subject;
  };

  const getDistrictLabel = (district: string) => {
    const option = districtOptions.find(opt => opt.value === district);
    return option?.label || district;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Job Applications</h1>
          <p className="text-muted-foreground">Manage and review job applications</p>
        </div>
        <Dialog open={bulkImportOpen} onOpenChange={setBulkImportOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bulk Import Job Applications</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="csv-file">Upload CSV/Excel File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
              </div>
              
              {csvHeaders.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Column Mapping</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {REQUIRED_COLUMNS.map(column => (
                      <div key={column}>
                        <Label>{column.replace('_', ' ').toUpperCase()} *</Label>
                        <Select
                          value={columnMapping[column] || ''}
                          onValueChange={(value) => setColumnMapping(prev => ({ ...prev, [column]: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select CSV column" />
                          </SelectTrigger>
                          <SelectContent>
                            {csvHeaders.map(header => (
                              <SelectItem key={header} value={header}>{header}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                    {OPTIONAL_COLUMNS.map(column => (
                      <div key={column}>
                        <Label>{column.replace('_', ' ').toUpperCase()}</Label>
                        <Select
                          value={columnMapping[column] || ''}
                          onValueChange={(value) => setColumnMapping(prev => ({ ...prev, [column]: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select CSV column (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {csvHeaders.map(header => (
                              <SelectItem key={header} value={header}>{header}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleBulkImport} className="w-full">
                    Import Applications
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teaching Positions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter(app => app.designation === 'teacher').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Teaching Positions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter(app => app.designation !== 'teacher').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter(app => {
                const appDate = new Date(app.created_at);
                const now = new Date();
                return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="name-filter">Name</Label>
              <Input
                id="name-filter"
                placeholder="Search by name"
                value={filters.name}
                onChange={(e) => updateFilter('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="designation-filter">Designation</Label>
              <Select
                value={filters.designation}
                onValueChange={(value) => updateFilter('designation', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All designations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All designations</SelectItem>
                  {dynamicOptions.designationOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject-filter">Subject</Label>
              <Select
                value={filters.subject}
                onValueChange={(value) => updateFilter('subject', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {dynamicOptions.subjectOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mobile-filter">Mobile</Label>
              <Input
                id="mobile-filter"
                placeholder="Search by mobile"
                value={filters.mobile}
                onChange={(e) => updateFilter('mobile', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email-filter">Email</Label>
              <Input
                id="email-filter"
                placeholder="Search by email"
                value={filters.email}
                onChange={(e) => updateFilter('email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="district-filter">District</Label>
              <Select
                value={filters.district}
                onValueChange={(value) => updateFilter('district', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All districts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All districts</SelectItem>
                  {dynamicOptions.districtOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({filteredApplications.length})</CardTitle>
          <CardDescription>
            Showing {filteredApplications.length} of {applications.length} applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>CV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{application.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {application.qualifications}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {application.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {application.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getDesignationLabel(application.designation)}
                      </Badge>
                      {application.other_designation && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {application.other_designation}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getSubjectLabel(application.subject)}
                    </TableCell>
                    <TableCell>
                      {application.experience_years} years
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {getDistrictLabel(application.district)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(application.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadCV(application.cv_file, application.full_name)}
                        disabled={!application.cv_file}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download CV
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredApplications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No job applications found matching your filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobApplications;