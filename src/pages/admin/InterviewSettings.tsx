import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

interface SubjectTemplate {
  id: string;
  subject_name: string;
  max_marks: number;
  display_order: number;
  form_type?: 'kg_std' | 'plus_one';
}

const InterviewSettings = () => {
  const [kgStdSubjects, setKgStdSubjects] = useState<SubjectTemplate[]>([]);
  const [plusOneSubjects, setPlusOneSubjects] = useState<SubjectTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("interview_subject_templates")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      
      if (error) throw error;
      
      // Separate subjects by form_type
      const kgStd = data?.filter(s => s.form_type === 'kg_std') || [];
      const plusOne = data?.filter(s => s.form_type === 'plus_one') || [];
      
      setKgStdSubjects(kgStd);
      setPlusOneSubjects(plusOne);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast({
        title: "Error",
        description: `Failed to load interview subjects: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addSubject = (formType: "kg_std" | "plus_one") => {
    const newSubject: SubjectTemplate = {
      id: `new-${Date.now()}`,
      subject_name: "",
      max_marks: 25,
      display_order: formType === "kg_std" ? kgStdSubjects.length + 1 : plusOneSubjects.length + 1,
      form_type: formType,
    };

    if (formType === "kg_std") {
      setKgStdSubjects([...kgStdSubjects, newSubject]);
    } else {
      setPlusOneSubjects([...plusOneSubjects, newSubject]);
    }
  };

  const updateSubject = (id: string, field: keyof SubjectTemplate, value: string | number, formType: "kg_std" | "plus_one") => {
    const updateList = formType === "kg_std" ? setKgStdSubjects : setPlusOneSubjects;
    const currentList = formType === "kg_std" ? kgStdSubjects : plusOneSubjects;

    updateList(currentList.map(subject => 
      subject.id === id ? { ...subject, [field]: value } : subject
    ));
  };

  const removeSubject = (id: string, formType: "kg_std" | "plus_one") => {
    if (formType === "kg_std") {
      setKgStdSubjects(kgStdSubjects.filter(s => s.id !== id));
    } else {
      setPlusOneSubjects(plusOneSubjects.filter(s => s.id !== id));
    }
  };

  const saveSubjects = async () => {
    setIsSaving(true);
    
    try {
      // Check authentication status
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get existing templates to compare changes
      const { data: existingTemplates } = await supabase
        .from("interview_subject_templates")
        .select("*")
        .eq("is_active", true);

      // Delete all existing subjects
      const { error: deleteError } = await supabase
        .from("interview_subject_templates")
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
      if (deleteError) {
        throw deleteError;
      }

      // Insert new subjects with form_type
      const allSubjects = [
        ...kgStdSubjects.filter(s => s.subject_name.trim()).map((s, index) => ({
          subject_name: s.subject_name.trim(),
          max_marks: s.max_marks,
          display_order: index + 1,
          form_type: 'kg_std' as const,
        })),
        ...plusOneSubjects.filter(s => s.subject_name.trim()).map((s, index) => ({
          subject_name: s.subject_name.trim(),
          max_marks: s.max_marks,
          display_order: kgStdSubjects.length + index + 1,
          form_type: 'plus_one' as const,
        })),
      ];

      if (allSubjects.length > 0) {
        const { data: insertData, error: insertError } = await supabase
          .from("interview_subject_templates")
          .insert(allSubjects);

        if (insertError) {
          throw insertError;
        }
      }

      // Synchronize interview_subjects table with new templates
      // Update max_marks for existing subjects that match new templates
      for (const newSubject of allSubjects) {
        const { error: updateError } = await supabase
          .from("interview_subjects")
          .update({ 
            max_marks: newSubject.max_marks,
            subject_name: newSubject.subject_name 
          })
          .eq("subject_name", newSubject.subject_name);

        if (updateError) {
          console.warn(`Warning: Could not update existing marks for ${newSubject.subject_name}:`, updateError);
        }
      }

      // Remove interview_subjects records for subjects that no longer exist in templates
      if (existingTemplates && existingTemplates.length > 0) {
        const newSubjectNames = allSubjects.map(s => s.subject_name);
        const removedSubjects = existingTemplates.filter(existing => 
          !newSubjectNames.includes(existing.subject_name)
        );

        for (const removedSubject of removedSubjects) {
          const { error: deleteSubjectError } = await supabase
            .from("interview_subjects")
            .delete()
            .eq("subject_name", removedSubject.subject_name);

          if (deleteSubjectError) {
            console.warn(`Warning: Could not remove marks for deleted subject ${removedSubject.subject_name}:`, deleteSubjectError);
          }
        }
      }

      toast({
        title: "Success",
        description: "Interview subjects updated successfully! Existing marks have been synchronized with the new settings.",
      });

      fetchSubjects();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save interview subjects: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderSubjectList = (subjects: SubjectTemplate[], formType: "kg_std" | "plus_one", title: string) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Button onClick={() => addSubject(formType)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subjects.map((subject) => (
          <div key={subject.id} className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="flex-1">
              <Label htmlFor={`subject-${subject.id}`}>Subject Name</Label>
              <Input
                id={`subject-${subject.id}`}
                value={subject.subject_name}
                onChange={(e) => updateSubject(subject.id, "subject_name", e.target.value, formType)}
                placeholder="Enter subject name"
              />
            </div>
            <div className="w-24">
              <Label htmlFor={`marks-${subject.id}`}>Max Marks</Label>
              <Input
                id={`marks-${subject.id}`}
                type="number"
                value={subject.max_marks}
                onChange={(e) => updateSubject(subject.id, "max_marks", parseInt(e.target.value) || 0, formType)}
                min="1"
                max="100"
              />
            </div>
            <Button
              onClick={() => removeSubject(subject.id, formType)}
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {subjects.length === 0 && (
          <p className="text-muted-foreground text-center py-4">
            No subjects added yet. Click "Add Subject" to get started.
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading interview settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Interview Settings</h1>
        <p className="text-muted-foreground mb-4">
          Define standard interview subjects for each application type. These subjects will be automatically 
          applied to all applicants when adding their interview marks.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📋 How to use Interview Subjects:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Add or modify subjects below and click "Save All Changes"</li>
            <li>2. Go to <strong>Admission Applications</strong> and select any application</li>
            <li>3. Scroll down to the <strong>"Interview Mark List"</strong> section</li>
            <li>4. Your saved subjects will appear there for entering marks</li>
          </ol>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {renderSubjectList(kgStdSubjects, "kg_std", "KG & STD Subjects")}
        {renderSubjectList(plusOneSubjects, "plus_one", "+1 / HSS Subjects")}
      </div>

      <div className="mt-8 flex justify-end">
        <Button 
          onClick={saveSubjects} 
          disabled={isSaving}
          size="lg"
        >
          {isSaving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
};

export default InterviewSettings;