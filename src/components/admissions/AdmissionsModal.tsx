import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Search, FileText, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdmissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdmissionsModal({ isOpen, onClose }: AdmissionsModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trackingData, setTrackingData] = useState({
    applicationNumber: "",
    mobileNumber: ""
  });
  const [formStatuses, setFormStatuses] = useState<{
    kgStd: { isActive: boolean; academicYear: string } | null;
    plusOne: { isActive: boolean; academicYear: string } | null;
  }>({ kgStd: null, plusOne: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFormStatuses = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('admission_forms')
          .select('form_type, is_active, academic_year');

        if (error) throw error;

        const kgStdForm = data?.find(form => form.form_type === 'kg_std');
        const plusOneForm = data?.find(form => form.form_type === 'plus_one');

        setFormStatuses({
          kgStd: kgStdForm ? { 
            isActive: kgStdForm.is_active, 
            academicYear: kgStdForm.academic_year 
          } : null,
          plusOne: plusOneForm ? { 
            isActive: plusOneForm.is_active, 
            academicYear: plusOneForm.academic_year 
          } : null,
        });
      } catch (error) {
        console.error('Error fetching form statuses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFormStatuses();
  }, [isOpen]);

  const handleApplyClick = (formType: "kg-std" | "plus-one") => {
    // Check if form is active before allowing navigation
    const isFormActive = formType === "kg-std" 
      ? formStatuses.kgStd?.isActive 
      : formStatuses.plusOne?.isActive;

    if (!isFormActive) {
      toast({
        title: "Form Not Available",
        description: "This application form is currently not active",
        variant: "destructive"
      });
      return;
    }

    onClose();
    navigate(`/admissions/apply/${formType}`);
  };

  const handleTrackApplication = () => {
    if (!trackingData.applicationNumber || !trackingData.mobileNumber) {
      toast({
        title: "Missing Information",
        description: "Please enter both Application Number and Mobile Number",
        variant: "destructive"
      });
      return;
    }

    onClose();
    navigate(`/admissions/track?app=${encodeURIComponent(trackingData.applicationNumber)}&mobile=${encodeURIComponent(trackingData.mobileNumber)}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <GraduationCap className="w-6 h-6" />
            School Admissions
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Apply Now Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Apply Now
              </CardTitle>
              <CardDescription>
                Submit your application for the upcoming academic year
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {formStatuses.kgStd?.isActive && (
                    <Button
                      onClick={() => handleApplyClick("kg-std")}
                      className="w-full h-12 text-left justify-start"
                      variant="outline"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      <div>
                        <div className="font-medium">KG & STD Application</div>
                        <div className="text-xs text-muted-foreground">
                          Academic Year: {formStatuses.kgStd.academicYear}
                        </div>
                      </div>
                    </Button>
                  )}

                  {formStatuses.plusOne?.isActive && (
                    <Button
                      onClick={() => handleApplyClick("plus-one")}
                      className="w-full h-12 text-left justify-start"
                      variant="outline"
                    >
                      <GraduationCap className="w-4 h-4 mr-2" />
                      <div>
                        <div className="font-medium">+1 / HSS Application</div>
                        <div className="text-xs text-muted-foreground">
                          Academic Year: {formStatuses.plusOne.academicYear}
                        </div>
                      </div>
                    </Button>
                  )}

                  {!formStatuses.kgStd?.isActive && !formStatuses.plusOne?.isActive && !loading && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No application forms are currently available.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Track Application Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Track Your Application
              </CardTitle>
              <CardDescription>
                Check the status of your submitted application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appNumber">Application Number</Label>
                <Input
                  id="appNumber"
                  placeholder="e.g., MHS2025-1001"
                  value={trackingData.applicationNumber}
                  onChange={(e) => setTrackingData({ ...trackingData, applicationNumber: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Registered Mobile Number</Label>
                <Input
                  id="mobile"
                  placeholder="Enter mobile number"
                  type="tel"
                  value={trackingData.mobileNumber}
                  onChange={(e) => setTrackingData({ ...trackingData, mobileNumber: e.target.value })}
                />
              </div>

              <Button
                onClick={handleTrackApplication}
                className="w-full"
              >
                Check Status
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
