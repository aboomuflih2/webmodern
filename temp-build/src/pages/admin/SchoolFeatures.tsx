import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Loader2,
  GraduationCap,
  Building2,
  Users,
  Eye,
  Trophy,
  Shield,
  BookOpen,
  Heart,
  Lightbulb,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";


interface SchoolFeature {
  id: string;
  feature_title: string;
  feature_description: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
}

const SchoolFeaturesManager = () => {
  const [features, setFeatures] = useState<SchoolFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFeature, setNewFeature] = useState({
    feature_title: "",
    feature_description: "",
    icon_name: "GraduationCap",
  });
  const { toast } = useToast();

  const iconOptions = [
    { value: "GraduationCap", label: "Graduation Cap", icon: GraduationCap },
    { value: "Building2", label: "Building", icon: Building2 },
    { value: "Users", label: "Users", icon: Users },
    { value: "Eye", label: "Eye", icon: Eye },
    { value: "Trophy", label: "Trophy", icon: Trophy },
    { value: "Shield", label: "Shield", icon: Shield },
    { value: "BookOpen", label: "Book", icon: BookOpen },
    { value: "Heart", label: "Heart", icon: Heart },
    { value: "Lightbulb", label: "Lightbulb", icon: Lightbulb },
    { value: "Target", label: "Target", icon: Target },
  ];

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('school_features')
        .select('*')
        .order('display_order');

      if (error) throw error;

      if (data) {
        setFeatures(data);
      }
    } catch (error) {
      console.error('Error loading features:', error);
      toast({
        title: "Error",
        description: "Failed to load school features. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newFeature.feature_title.trim() || !newFeature.feature_description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setSaving('new');
    try {
      const maxOrder = Math.max(...features.map(f => f.display_order), 0);
      
      const { data, error } = await supabase
        .from('school_features')
        .insert([{
          ...newFeature,
          display_order: maxOrder + 1,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;

      setFeatures(prev => [...prev, data]);
      setNewFeature({
        feature_title: "",
        feature_description: "",
        icon_name: "GraduationCap",
      });
      setShowAddForm(false);

      toast({
        title: "Success",
        description: "Feature added successfully.",
      });
    } catch (error) {
      console.error('Error adding feature:', error);
      toast({
        title: "Error",
        description: "Failed to add feature. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const handleUpdate = async (feature: SchoolFeature) => {
    setSaving(feature.id);
    try {
      const { error } = await supabase
        .from('school_features')
        .update({
          feature_title: feature.feature_title,
          feature_description: feature.feature_description,
          icon_name: feature.icon_name,
        })
        .eq('id', feature.id);

      if (error) throw error;

      setEditingId(null);
      toast({
        title: "Success",
        description: "Feature updated successfully.",
      });
    } catch (error) {
      console.error('Error updating feature:', error);
      toast({
        title: "Error",
        description: "Failed to update feature. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature?')) return;

    setSaving(id);
    try {
      const { error } = await supabase
        .from('school_features')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFeatures(prev => prev.filter(f => f.id !== id));
      toast({
        title: "Success",
        description: "Feature deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting feature:', error);
      toast({
        title: "Error",
        description: "Failed to delete feature. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    setSaving(id);
    try {
      const { error } = await supabase
        .from('school_features')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;

      setFeatures(prev => prev.map(f => 
        f.id === id ? { ...f, is_active } : f
      ));

      toast({
        title: "Success",
        description: `Feature ${is_active ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      console.error('Error toggling feature:', error);
      toast({
        title: "Error",
        description: "Failed to update feature status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const getIcon = (iconName: string) => {
    const iconOption = iconOptions.find(opt => opt.value === iconName);
    return iconOption ? iconOption.icon : GraduationCap;
  };

  const handleFeatureChange = (id: string, field: keyof SchoolFeature, value: string) => {
    setFeatures(prev => prev.map(feature => 
      feature.id === id ? { ...feature, [field]: value } : feature
    ));
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
          <h1 className="text-3xl font-bold">School Features Manager</h1>
          <p className="text-muted-foreground">Manage the "Why Choose Us" features</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-primary hover:bg-primary-light"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Feature
        </Button>
      </div>

      {/* Add New Feature Form */}
      {showAddForm && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Add New Feature</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-title">Feature Title</Label>
                <Input
                  id="new-title"
                  value={newFeature.feature_title}
                  onChange={(e) => setNewFeature({ ...newFeature, feature_title: e.target.value })}
                  placeholder="Enter feature title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-icon">Icon</Label>
                <Select 
                  value={newFeature.icon_name}
                  onValueChange={(value) => setNewFeature({ ...newFeature, icon_name: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center">
                            <Icon className="h-4 w-4 mr-2" />
                            {option.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-description">Description</Label>
              <Textarea
                id="new-description"
                value={newFeature.feature_description}
                onChange={(e) => setNewFeature({ ...newFeature, feature_description: e.target.value })}
                rows={3}
                placeholder="Enter feature description"
              />
            </div>

            <Button 
              onClick={handleAdd}
              disabled={saving === 'new'}
              className="bg-primary hover:bg-primary-light"
            >
              {saving === 'new' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Features List */}
      <div className="grid gap-4">
        {features.map((feature) => {
          const Icon = getIcon(feature.icon_name);
          const isEditing = editingId === feature.id;
          
          return (
            <Card key={feature.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      {isEditing ? (
                        <div className="grid md:grid-cols-2 gap-4">
                          <Input
                            value={feature.feature_title}
                            onChange={(e) => handleFeatureChange(feature.id, 'feature_title', e.target.value)}
                            placeholder="Feature title"
                          />
                          <Select 
                            value={feature.icon_name}
                            onValueChange={(value) => handleFeatureChange(feature.id, 'icon_name', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {iconOptions.map((option) => {
                                const OptionIcon = option.icon;
                                return (
                                  <SelectItem key={option.value} value={option.value}>
                                    <div className="flex items-center">
                                      <OptionIcon className="h-4 w-4 mr-2" />
                                      {option.label}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold">{feature.feature_title}</h3>
                          <Badge variant={feature.is_active ? "default" : "secondary"}>
                            {feature.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <Textarea
                      value={feature.feature_description}
                      onChange={(e) => handleFeatureChange(feature.id, 'feature_description', e.target.value)}
                      rows={3}
                      placeholder="Feature description"
                    />
                  ) : (
                    <p className="text-muted-foreground ml-16">{feature.feature_description}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={() => handleUpdate(feature)}
                        disabled={saving === feature.id}
                        size="sm"
                        className="bg-primary hover:bg-primary-light"
                      >
                        {saving === feature.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        onClick={() => setEditingId(null)}
                        variant="ghost"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => setEditingId(feature.id)}
                        variant="ghost"
                        size="sm"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => toggleActive(feature.id, !feature.is_active)}
                        variant="ghost"
                        size="sm"
                        disabled={saving === feature.id}
                      >
                        {saving === feature.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Badge variant={feature.is_active ? "default" : "secondary"}>
                            {feature.is_active ? "Active" : "Inactive"}
                          </Badge>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleDelete(feature.id)}
                        variant="ghost"
                        size="sm"
                        disabled={saving === feature.id}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {features.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No features found. Add your first feature to get started.</p>
        </Card>
      )}
    </div>
  );
};

export default SchoolFeaturesManager;
