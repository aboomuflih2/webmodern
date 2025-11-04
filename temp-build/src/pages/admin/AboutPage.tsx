import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";


interface PageContent {
  about_legacy: string;
  about_mission: string;
  about_vision: string;
}

interface StaffCounts {
  teaching_staff: number;
  security_staff: number;
  professional_staff: number;
  guides_staff: number;
}

const AboutPageManager = () => {
  const [content, setContent] = useState<PageContent>({
    about_legacy: "",
    about_mission: "",
    about_vision: "",
  });
  const [staffCounts, setStaffCounts] = useState<StaffCounts>({
    teaching_staff: 0,
    security_staff: 0,
    professional_staff: 0,
    guides_staff: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load page content
      const { data: contentData, error: contentError } = await supabase
        .from('page_content')
        .select('page_key, content')
        .in('page_key', ['about_legacy', 'about_mission', 'about_vision']);

      if (contentError) throw contentError;

      // Load staff counts
      const { data: countsData, error: countsError } = await supabase
        .from('staff_counts')
        .select('*')
        .single();

      if (countsError) throw countsError;

      // Transform content data
      if (contentData) {
        const contentMap = contentData.reduce((acc, item) => {
          acc[item.page_key as keyof PageContent] = item.content;
          return acc;
        }, {} as PageContent);
        setContent(contentMap);
      }

      if (countsData) {
        setStaffCounts(countsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load page data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update page content using upsert
      const contentUpdates = Object.entries(content).map(([page_key, contentText]) => ({
        page_key,
        page_title: page_key.replace('about_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        content: contentText,
        meta_description: `${page_key.replace('about_', '').replace('_', ' ')} content for our school`
      }));

      for (const update of contentUpdates) {
        const { error } = await supabase
          .from('page_content')
          .upsert(update, { onConflict: 'page_key' });

        if (error) throw error;
      }

      // Get staff counts ID and update
      const { data: staffId, error: staffIdError } = await supabase
        .from('staff_counts')
        .select('id')
        .single();

      if (staffIdError) throw staffIdError;

      const { error: countsError } = await supabase
        .from('staff_counts')
        .update(staffCounts)
        .eq('id', staffId.id);

      if (countsError) throw countsError;

      toast({
        title: "Success",
        description: "About page content has been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">About Page Manager</h1>
          <p className="text-muted-foreground">Manage the content for the About Us page</p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary-light"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Page Content Sections */}
      <div className="grid gap-6">
        {/* Legacy Section */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Legacy Section</h3>
            <div className="space-y-2">
              <Label htmlFor="legacy">School History & Legacy</Label>
              <Textarea
                id="legacy"
                value={content.about_legacy}
                onChange={(e) => setContent({ ...content, about_legacy: e.target.value })}
                rows={6}
                placeholder="Enter the school's history and legacy content..."
              />
            </div>
          </div>
        </Card>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Mission Statement</h3>
              <div className="space-y-2">
                <Label htmlFor="mission">Our Mission</Label>
                <Textarea
                  id="mission"
                  value={content.about_mission}
                  onChange={(e) => setContent({ ...content, about_mission: e.target.value })}
                  rows={5}
                  placeholder="Enter the school's mission statement..."
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Vision Statement</h3>
              <div className="space-y-2">
                <Label htmlFor="vision">Our Vision</Label>
                <Textarea
                  id="vision"
                  value={content.about_vision}
                  onChange={(e) => setContent({ ...content, about_vision: e.target.value })}
                  rows={5}
                  placeholder="Enter the school's vision statement..."
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Staff Counts */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Staff Strength Counts</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teaching">Teaching Staff</Label>
                <Input
                  id="teaching"
                  type="number"
                  min="0"
                  value={staffCounts.teaching_staff}
                  onChange={(e) => setStaffCounts({ ...staffCounts, teaching_staff: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="security">Security Staff</Label>
                <Input
                  id="security"
                  type="number"
                  min="0"
                  value={staffCounts.security_staff}
                  onChange={(e) => setStaffCounts({ ...staffCounts, security_staff: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professional">Professional Staff</Label>
                <Input
                  id="professional"
                  type="number"
                  min="0"
                  value={staffCounts.professional_staff}
                  onChange={(e) => setStaffCounts({ ...staffCounts, professional_staff: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guides">Guides</Label>
                <Input
                  id="guides"
                  type="number"
                  min="0"
                  value={staffCounts.guides_staff}
                  onChange={(e) => setStaffCounts({ ...staffCounts, guides_staff: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AboutPageManager;