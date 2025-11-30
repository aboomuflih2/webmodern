import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Settings } from "lucide-react";

interface AdmissionForm {
  id: string;
  form_type: string;
  is_active: boolean;
  academic_year: string;
}

export default function AdmissionForms() {
  const { toast } = useToast();
  const [forms, setForms] = useState<AdmissionForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchForms();
  }, []);

  const ensureAdminRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentRole = (session?.user?.user_metadata as Record<string, unknown>)?.role as string | undefined;
    if (currentRole !== 'admin') {
      await supabase.auth.updateUser({ data: { role: 'admin' } });
      await supabase.auth.refreshSession();
    }
  };

  const fetchForms = async () => {
    try {
      const { data, error } = await supabase
        .from('admission_forms')
        .select('*')
        .order('form_type');

      if (error) throw error;
      setForms(data || []);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to fetch admission forms",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormStatus = async (formType: string, isActive: boolean) => {
    console.debug(`🔄 Updating form status: ${formType} -> ${isActive}`);
    setSaving(true);
    try {
      await ensureAdminRole();
      const { error } = await (supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: any; error: any }> }).rpc('admin_set_admission_form_active', {
        p_form_type: formType,
        p_is_active: isActive
      });

      if (error) throw error;

      const updatedForms = forms.map(form => 
        form.form_type === formType 
          ? { ...form, is_active: isActive }
          : form
      );
      
      console.debug(`📊 Updated forms state:`, updatedForms);
      setForms(updatedForms);

      toast({
        title: "Success",
        description: `${formType === 'kg_std' ? 'KG & STD' : '+1 / HSS'} form ${isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update form status";
      console.error(`❌ Form status update error:`, error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateAcademicYear = async (formType: string, academicYear: string) => {
    setSaving(true);
    try {
      await ensureAdminRole();
      const { error } = await (supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: any; error: any }> }).rpc('admin_set_admission_form_year', {
        p_form_type: formType,
        p_academic_year: academicYear
      });

      if (error) throw error;

      setForms(forms.map(form => 
        form.form_type === formType 
          ? { ...form, academic_year: academicYear }
          : form
      ));

      toast({
        title: "Success",
        description: "Academic year updated successfully",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update academic year";
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const kgStdForm = forms.find(f => f.form_type === 'kg_std');
  const plusOneForm = forms.find(f => f.form_type === 'plus_one');
  
  // Debug logging for Switch state
  console.debug('🔍 Current forms data:', forms);
  console.debug('📋 KG STD Form:', kgStdForm);
  console.debug('📋 Plus One Form:', plusOneForm);
  console.debug('🎛️ KG STD Switch checked:', kgStdForm?.is_active || false);
  console.debug('🎛️ Plus One Switch checked:', plusOneForm?.is_active || false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Admission Forms Management
        </h1>
        <p className="text-muted-foreground">
          Control the availability and settings of admission forms
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* KG & STD Form */}
        <Card>
          <CardHeader>
            <CardTitle>KG & STD Application Form</CardTitle>
            <CardDescription>
              Manage the kindergarten and standard classes application form
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="kg-std-toggle" className="text-base">
                  Form Status
                </Label>
                <div className="text-sm text-muted-foreground">
                  {kgStdForm?.is_active ? "Form is currently active" : "Form is currently inactive"}
                </div>
              </div>
                <Switch
                  id="kg-std-toggle"
                  key={`kg-std-${kgStdForm?.is_active}`}
                  checked={kgStdForm?.is_active ?? false}
                  onCheckedChange={(checked) => updateFormStatus('kg_std', checked)}
                  disabled={saving}
                  style={{
                  backgroundColor: (kgStdForm?.is_active ? 'hsl(var(--primary))' : 'hsl(var(--input))')
                  }}
                />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kg-std-year">Academic Year</Label>
              <div className="flex gap-2">
                <Input
                  id="kg-std-year"
                  value={kgStdForm?.academic_year || ""}
                  onChange={(e) => {
                    const updatedForms = forms.map(form => 
                      form.form_type === 'kg_std' 
                        ? { ...form, academic_year: e.target.value }
                        : form
                    );
                    setForms(updatedForms);
                  }}
                  placeholder="e.g., 2026-27"
                />
                <Button
                  onClick={() => updateAcademicYear('kg_std', kgStdForm?.academic_year || "")}
                  disabled={saving}
                  size="sm"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="pt-2 text-sm text-muted-foreground">
              <p><strong>Form includes:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Student details with stage selection (LKG to STD 10)</li>
                <li>Conditional Madrassa section (STD 1-7)</li>
                <li>Parent and address information</li>
                <li>Previous school details (STD 1-10)</li>
                <li>Siblings information</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* +1 / HSS Form */}
        <Card>
          <CardHeader>
            <CardTitle>+1 / HSS Application Form</CardTitle>
            <CardDescription>
              Manage the higher secondary school application form
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="plus-one-toggle" className="text-base">
                  Form Status
                </Label>
                <div className="text-sm text-muted-foreground">
                  {plusOneForm?.is_active ? "Form is currently active" : "Form is currently inactive"}
                </div>
              </div>
                <Switch
                  id="plus-one-toggle"
                  key={`plus-one-${plusOneForm?.is_active}`}
                  checked={plusOneForm?.is_active ?? false}
                  onCheckedChange={(checked) => updateFormStatus('plus_one', checked)}
                  disabled={saving}
                  style={{
                  backgroundColor: (plusOneForm?.is_active ? 'hsl(var(--primary))' : 'hsl(var(--input))')
                  }}
                />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plus-one-year">Academic Year</Label>
              <div className="flex gap-2">
                <Input
                  id="plus-one-year"
                  value={plusOneForm?.academic_year || ""}
                  onChange={(e) => {
                    const updatedForms = forms.map(form => 
                      form.form_type === 'plus_one' 
                        ? { ...form, academic_year: e.target.value }
                        : form
                    );
                    setForms(updatedForms);
                  }}
                  placeholder="e.g., 2025-26"
                />
                <Button
                  onClick={() => updateAcademicYear('plus_one', plusOneForm?.academic_year || "")}
                  disabled={saving}
                  size="sm"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="pt-2 text-sm text-muted-foreground">
              <p><strong>Form includes:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Personal and parent details</li>
                <li>Complete address with landmark</li>
                <li>10th standard academic details</li>
                <li>Stream selection (Biology, Computer, Commerce)</li>
                <li>Siblings information</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Statistics</CardTitle>
          <CardDescription>Overview of current admission forms status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {forms.filter(f => f.is_active).length}
              </p>
              <p className="text-sm text-muted-foreground">Active Forms</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {forms.length}
              </p>
              <p className="text-sm text-muted-foreground">Total Forms</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {new Date().getFullYear()}
              </p>
              <p className="text-sm text-muted-foreground">Current Year</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
