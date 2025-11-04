import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function ApplicationSuccess() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const applicationNumber = searchParams.get("app");
  const applicationType = searchParams.get("type");
  const mobileNumber = searchParams.get("mobile");
  const [academicYear, setAcademicYear] = useState<string>("");

  useEffect(() => {
    const loadYear = async () => {
      if (!applicationType) return;
      const formType = applicationType === "kg-std" ? "kg_std" : "plus_one";
      const { data } = await supabase
        .from('admission_forms')
        .select('academic_year')
        .eq('form_type', formType)
        .maybeSingle();
      if (data?.academic_year) setAcademicYear(data.academic_year);
    };
    loadYear();
  }, [applicationType]);

  const downloadApplicationPDF = async () => {
    if (!applicationNumber || !applicationType || !mobileNumber) return;

    setDownloadingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-application-pdf', {
        body: { applicationNumber, applicationType, mobileNumber }
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

  useEffect(() => {
    // Redirect if no application number
    if (!applicationNumber || !applicationType || !mobileNumber) {
      navigate("/");
      return;
    }

    // Auto-download PDF summary after a short delay
    const timer = setTimeout(() => {
      downloadApplicationPDF();
    }, 2000);

    return () => clearTimeout(timer);
  }, [applicationNumber, applicationType, navigate]);

  if (!applicationNumber || !applicationType || !mobileNumber) {
    return null;
  }

  const formName = applicationType === "kg-std" ? "KG & STD" : "+1 / HSS";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              Application Submitted Successfully!
            </CardTitle>
            <CardDescription className="text-lg">
              Your {formName} application for Academic Year {academicYear} has been received.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-800 mb-2">
                Your Application Number
              </h3>
              <div className="text-2xl font-bold text-green-700 tracking-wide">
                {applicationNumber}
              </div>
              <p className="text-sm text-green-600 mt-2">
                Please save this number for future reference
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Download className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Application Summary PDF</h4>
                    <p className="text-sm text-blue-600">
                      A PDF copy of your application has been automatically downloaded to your device.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-left space-y-2 text-sm text-muted-foreground">
                <h4 className="font-medium text-foreground">Next Steps:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Keep your application number safe for tracking purposes</li>
                  <li>You will receive updates on your registered mobile number</li>
                  <li>Use the "Track Application" feature to check your status</li>
                  <li>The admission committee will review your application</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              
              <Button
                onClick={downloadApplicationPDF}
                variant="outline"
                className="flex-1"
                disabled={downloadingPdf}
              >
                <Download className="w-4 h-4 mr-2" />
                {downloadingPdf ? "Generating PDF..." : "Download Again"}
              </Button>
              
              <Button
                onClick={() => navigate(`/admissions/track?app=${encodeURIComponent(applicationNumber)}&mobile=${encodeURIComponent(mobileNumber)}`)}
                className="flex-1"
              >
                Track Application
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
