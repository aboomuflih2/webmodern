import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Download, Calendar, User, MapPin, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ApplicationData {
  [key: string]: unknown;
  id: string;
  application_number: string;
  full_name: string;
  mobile_number: string;
  status: string;
  interview_date?: string;
  interview_time?: string;
  created_at: string;
  // Add other fields as needed
}

interface InterviewMark {
  subject_name: string;
  marks_obtained: number | null;
  max_marks: number | null;
  display_order?: number | null;
}

const statusSteps = [
  { key: "submitted", label: "Submitted", description: "Application received" },
  { key: "under_review", label: "Under Review", description: "Being reviewed by admission committee" },
  { key: "shortlisted_for_interview", label: "Shortlisted", description: "Selected for interview" },
  { key: "interview_complete", label: "Interview Complete", description: "Interview conducted" },
  { key: "admitted", label: "Admitted", description: "Congratulations! You're admitted" },
  { key: "not_admitted", label: "Not Admitted", description: "Application not successful" }
];

export function ApplicationTracking() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [applicationType, setApplicationType] = useState<"kg_std" | "plus_one" | null>(null);
  const [academicYear, setAcademicYear] = useState<string>("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [interviewMarks, setInterviewMarks] = useState<InterviewMark[]>([]);

  const applicationNumber = searchParams.get("app");
  const mobileNumber = searchParams.get("mobile");
  const totalMarks = interviewMarks.reduce((sum, mark) => sum + (mark.marks_obtained ?? 0), 0);
  const totalMaxMarks = interviewMarks.reduce((sum, mark) => sum + (mark.max_marks ?? 0), 0);
  const overallPercentage = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0;

  useEffect(() => {
    const fetchApplication = async () => {
      if (!applicationNumber || !mobileNumber) {
        toast({
          title: "Invalid Parameters",
          description: "Application number and mobile number are required",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setLoading(true);
      try {
        console.log('Fetching application with:', { applicationNumber, mobileNumber });
        const { data, error } = await supabase.functions.invoke('get-application-status', {
          body: { applicationNumber, mobileNumber },
        });

        if (error) {
          console.error('Supabase function error:', error);
          throw new Error(error.message ?? "Failed to load application");
        }

        console.log('Application data received:', data);
        const payload = (data ?? {}) as {
          application?: ApplicationData;
          applicationType?: string;
          academicYear?: string | null;
          interviewMarks?: InterviewMark[];
          error?: string;
        };

        if (payload.error) {
          console.error('Payload error:', payload.error);
          throw new Error(payload.error);
        }

        if (!payload.application) {
          console.error('No application found in payload');
          const normalize = (v: string) => v.replace(/\D+/g, '').slice(-10);
          const inputNorm = normalize(mobileNumber);

          const plusRes = await supabase
            .from('plus_one_applications')
            .select('*')
            .eq('application_number', applicationNumber)
            .maybeSingle();

          if (plusRes.data) {
            const dbNorm = normalize(String(plusRes.data.mobile_number ?? ''));
            if (dbNorm === inputNorm) {
              const app = plusRes.data as ApplicationData;
              setApplication(app);
              setApplicationType('plus_one');
              const { data: formMeta } = await supabase
                .from('admission_forms')
                .select('academic_year')
                .eq('form_type', 'plus_one')
                .maybeSingle();
              setAcademicYear(String(formMeta?.academic_year ?? ''));
              const { data: templates } = await supabase
                .from('interview_subject_templates')
                .select('subject_name, max_marks, display_order')
                .eq('form_type', 'plus_one')
                .eq('is_active', true)
                .order('display_order', { ascending: true });
              const { data: subjectMarks } = await supabase
                .from('interview_subjects')
                .select('subject_name, marks')
                .eq('application_id', app.id)
                .eq('application_type', 'plus_one');
              const marksByName = (subjectMarks ?? []).reduce<Record<string, number | null>>((acc, s: any) => {
                acc[s.subject_name] = s.marks ?? null;
                return acc;
              }, {});
              const marksArr: InterviewMark[] = (templates ?? []).map((t: any) => ({
                subject_name: t.subject_name,
                marks_obtained: marksByName[t.subject_name] ?? null,
                max_marks: t.max_marks ?? null,
                display_order: t.display_order ?? null,
              }));
              setInterviewMarks(marksArr);
              return;
            }
          }

          const kgRes = await supabase
            .from('kg_std_applications')
            .select('*')
            .eq('application_number', applicationNumber)
            .maybeSingle();

          if (kgRes.data) {
            const dbNorm = normalize(String(kgRes.data.mobile_number ?? ''));
            if (dbNorm === inputNorm) {
              const appRaw = kgRes.data as Record<string, any>;
              const app: ApplicationData = {
                ...(appRaw as any),
                full_name: String(appRaw.full_name ?? appRaw.child_name ?? ''),
              } as ApplicationData;
              setApplication(app);
              setApplicationType('kg_std');
              const { data: formMeta } = await supabase
                .from('admission_forms')
                .select('academic_year')
                .eq('form_type', 'kg_std')
                .maybeSingle();
              setAcademicYear(String(formMeta?.academic_year ?? ''));
              const { data: templates } = await supabase
                .from('interview_subject_templates')
                .select('subject_name, max_marks, display_order')
                .eq('form_type', 'kg_std')
                .eq('is_active', true)
                .order('display_order', { ascending: true });
              const { data: subjectMarks } = await supabase
                .from('interview_subjects')
                .select('subject_name, marks')
                .eq('application_id', app.id)
                .eq('application_type', 'kg_std');
              const marksByName = (subjectMarks ?? []).reduce<Record<string, number | null>>((acc, s: any) => {
                acc[s.subject_name] = s.marks ?? null;
                return acc;
              }, {});
              const marksArr: InterviewMark[] = (templates ?? []).map((t: any) => ({
                subject_name: t.subject_name,
                marks_obtained: marksByName[t.subject_name] ?? null,
                max_marks: t.max_marks ?? null,
                display_order: t.display_order ?? null,
              }));
              setInterviewMarks(marksArr);
              return;
            }
          }

          throw new Error('Application not found');
        }

        console.log('Application status:', payload.application.status);
        console.log('Interview marks:', payload.interviewMarks);
        setApplication(payload.application);

        if (payload.applicationType === "kg_std" || payload.applicationType === "plus_one") {
          setApplicationType(payload.applicationType);
        } else {
          setApplicationType(null);
        }

        if (typeof payload.academicYear === "string") {
          setAcademicYear(payload.academicYear);
        } else {
          setAcademicYear("");
        }

        const marks = Array.isArray(payload.interviewMarks)
          ? (payload.interviewMarks as InterviewMark[])
          : [];
        console.log('Setting interview marks:', marks);
        setInterviewMarks(marks);
      } catch (error) {
        console.error("Error fetching application:", error);
        const raw = error instanceof Error ? error.message : "Failed to fetch application details";
        const friendly = raw === "Application not found"
          ? "No application found for the given details"
          : raw === "Mobile number does not match this application"
          ? "The mobile number does not match the application"
          : raw;
        toast({
          title: "Error",
          description: friendly,
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [applicationNumber, mobileNumber, navigate, toast]);

  const downloadApplicationPDF = async () => {
    if (!application || !applicationType || !mobileNumber) return;

    setDownloadingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-application-pdf', {
        body: {
          applicationNumber: application.application_number,
          applicationType,
          mobileNumber
        }
      });

      if (error) throw error;

      if (data?.htmlContent) {
        // Create a new window with the HTML content for printing/saving as PDF
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(data.htmlContent);
          printWindow.document.close();
          // Auto-trigger print dialog which allows saving as PDF
          setTimeout(() => {
            printWindow.print();
          }, 500);
        }
      }

      toast({
        title: "PDF Generated",
        description: "Application summary PDF is ready for download",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "Unable to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const downloadInterviewLetter = async () => {
    console.log('Download interview letter clicked!');
    if (!application || !applicationType || !mobileNumber) {
      console.log('Missing application or type:', { application: !!application, applicationType });
      return;
    }

    console.log('Starting interview letter download...');
    setDownloadingPdf(true);
    try {
      console.log('Calling interview letter function with:', {
        applicationNumber: application.application_number,
        applicationType
      });

      const { data, error } = await supabase.functions.invoke('generate-interview-letter', {
        body: {
          applicationNumber: application.application_number,
          applicationType,
          mobileNumber
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Interview letter response:', data);

      if (data?.htmlContent) {
        // Create a new window with the HTML content for printing/saving as PDF
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(data.htmlContent);
          printWindow.document.close();
          // Auto-trigger print dialog which allows saving as PDF
          setTimeout(() => {
            printWindow.print();
          }, 500);
        }
      } else {
        console.log('No HTML content in response');
      }

      toast({
        title: "Interview Letter Generated",
        description: "Interview call letter PDF is ready for download",
      });
    } catch (error) {
      console.error('Error generating interview letter:', error);
      toast({
        title: "Download Failed",
        description: `Unable to generate interview letter: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setDownloadingPdf(false);
      console.log('Interview letter download finished');
    }
  };

  const downloadMarkList = async () => {
    if (!application || !applicationType || !mobileNumber) return;

    setDownloadingPdf(true);
    try {
      console.log('Calling mark list function with:', {
        applicationNumber: application.application_number,
        applicationType
      });

      const { data, error } = await supabase.functions.invoke('generate-mark-list', {
        body: {
          applicationNumber: application.application_number,
          applicationType,
          mobileNumber
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Mark list response:', data);

      if (!data?.success) {
        toast({
          title: "Mark List Not Available",
          description: data?.error || "Mark list is not yet available for this application.",
          variant: "destructive",
        });
        return;
      }

      if (data?.htmlContent) {
        // Create a new window with the HTML content for printing/saving as PDF
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(data.htmlContent);
          printWindow.document.close();
          // Auto-trigger print dialog which allows saving as PDF
          setTimeout(() => {
            printWindow.print();
          }, 500);
        }
      }

      const hasMarks = data.subjects && data.subjects.some(s => s.marks !== null);
      toast({
        title: "Mark List Generated",
        description: hasMarks ? 
          "Mark list with interview scores opened for printing!" : 
          "Mark list generated (interview marks will be updated after evaluation).",
      });
    } catch (error) {
      console.error('Error generating mark list:', error);
      toast({
        title: "Download Failed",
        description: `Unable to generate mark list: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  const currentStatusIndex = statusSteps.findIndex(step => step.key === application.status);
  const progress = ((currentStatusIndex + 1) / statusSteps.length) * 100;

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

  const formName = applicationType === "kg_std" ? "KG & STD" : "+1 / HSS";

  const showInterviewLetter = application.status === "shortlisted_for_interview" && application.interview_date;
  const showMarkList = ["interview_complete", "admitted", "not_admitted"].includes(application.status);

  console.log('Application status:', application.status);
  console.log('Interview date:', application.interview_date);
  console.log('Show interview letter:', showInterviewLetter);
  console.log('Show mark list:', showMarkList);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-2xl font-bold">Application Status</h1>
          <p className="text-muted-foreground">Track your {formName} application</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Application Summary */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
                <CardDescription>
                  Application Number: {application.application_number}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{application.full_name}</p>
                      <p className="text-sm text-muted-foreground">Applicant Name</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{application.mobile_number}</p>
                      <p className="text-sm text-muted-foreground">Mobile Number</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {new Date(application.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Application Submitted</p>
                  </div>
                </div>

                <div>
                  <p className="font-medium">{formName} Application</p>
                  <p className="text-sm text-muted-foreground">Academic Year: {academicYear}</p>
                </div>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Application Progress</CardTitle>
                <CardDescription>Current status of your application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Badge className={getStatusColor(application.status)}>
                      {statusSteps[currentStatusIndex]?.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(progress)}% Complete
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="space-y-4">
                  {statusSteps.map((step, index) => (
                    <div
                      key={step.key}
                      className={`flex items-center gap-3 ${
                        index <= currentStatusIndex ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index <= currentStatusIndex
                            ? getStatusColor(step.key)
                            : "bg-muted"
                        }`}
                      />
                      <div>
                        <p className="font-medium">{step.label}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Interview Marks Display */}
            {interviewMarks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Interview Marks</CardTitle>
                  <CardDescription>Your interview performance results</CardDescription>
                </CardHeader>
                <CardContent>
                  {interviewMarks.length > 0 ? (
                    <div className="space-y-3">
                      {interviewMarks.map((mark, index) => {
                        const marks = mark.marks_obtained ?? 0;
                        const maxMarks = mark.max_marks ?? 0;
                        const percentage = maxMarks > 0 ? Math.round((marks / maxMarks) * 100) : 0;

                        return (
                          <div
                            key={`${mark.subject_name}-${index}`}
                            className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{mark.subject_name}</p>
                              <p className="text-sm text-muted-foreground">Subject</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                {marks} / {maxMarks}
                              </p>
                              <p className="text-sm text-muted-foreground">{percentage}%</p>
                            </div>
                          </div>
                        );
                      })}

                      <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Score:</span>
                          <span className="font-bold text-lg">
                            {totalMarks} / {totalMaxMarks}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm text-muted-foreground">Overall Percentage:</span>
                          <span className="font-medium">{overallPercentage}%</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Interview marks are not available yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Download Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Downloads</CardTitle>
                <CardDescription>Available documents for download</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={downloadApplicationPDF}
                  disabled={downloadingPdf}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloadingPdf ? "Generating..." : "Download Application Summary"}
                </Button>

                {showInterviewLetter && (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={downloadInterviewLetter}
                    disabled={downloadingPdf}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {downloadingPdf ? "Generating..." : "Interview Call Letter"}
                  </Button>
                )}

                {showMarkList && (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={downloadMarkList}
                    disabled={downloadingPdf}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {downloadingPdf ? "Generating..." : "Mark List"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Interview Information */}
            {application.interview_date && (
              <Card>
                <CardHeader>
                  <CardTitle>Interview Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {new Date(application.interview_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Interview Date</p>
                    </div>
                  </div>

                  {application.interview_time && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{application.interview_time}</p>
                        <p className="text-sm text-muted-foreground">Interview Time</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplicationTracking;
