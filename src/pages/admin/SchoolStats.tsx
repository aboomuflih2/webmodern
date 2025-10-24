import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, MoveUp, MoveDown, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SchoolStat {
  id: string;
  label: string;
  value: number;
  suffix: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
}

const iconOptions = [
  'Users', 'Award', 'BookOpen', 'Trophy', 'GraduationCap', 'Star', 
  'Medal', 'Target', 'TrendingUp', 'Calendar', 'MapPin', 'Heart'
];

const SchoolStats = () => {
  const [stats, setStats] = useState<SchoolStat[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('school_stats')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: "Error",
        description: "Failed to load school stats",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveStat = async (stat: SchoolStat) => {
    try {
      const { error } = await supabase
        .from('school_stats')
        .update({
          label: stat.label,
          value: stat.value,
          suffix: stat.suffix,
          icon_name: stat.icon_name,
          is_active: stat.is_active
        })
        .eq('id', stat.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stat updated successfully",
      });
    } catch (error) {
      console.error('Error saving stat:', error);
      toast({
        title: "Error",
        description: "Failed to update stat",
        variant: "destructive",
      });
    }
  };

  const addStat = async () => {
    try {
      const maxOrder = Math.max(...stats.map(s => s.display_order), 0);
      const { data, error } = await supabase
        .from('school_stats')
        .insert({
          label: 'New Stat',
          value: 0,
          suffix: '',
          icon_name: 'Trophy',
          display_order: maxOrder + 1,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      setStats([...stats, data]);

      toast({
        title: "Success",
        description: "New stat added successfully",
      });
    } catch (error) {
      console.error('Error adding stat:', error);
      toast({
        title: "Error",
        description: "Failed to add stat",
        variant: "destructive",
      });
    }
  };

  const deleteStat = async (id: string) => {
    try {
      const { error } = await supabase
        .from('school_stats')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setStats(stats.filter(s => s.id !== id));

      toast({
        title: "Success",
        description: "Stat deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting stat:', error);
      toast({
        title: "Error",
        description: "Failed to delete stat",
        variant: "destructive",
      });
    }
  };

  const moveStatOrder = async (id: string, direction: 'up' | 'down') => {
    const statIndex = stats.findIndex(s => s.id === id);
    if (statIndex === -1) return;

    const newStats = [...stats];
    const targetIndex = direction === 'up' ? statIndex - 1 : statIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= newStats.length) return;

    // Swap positions
    [newStats[statIndex], newStats[targetIndex]] = [newStats[targetIndex], newStats[statIndex]];

    // Update display_order values
    newStats.forEach((stat, index) => {
      stat.display_order = index + 1;
    });

    try {
      // Update display_order for each stat individually
      for (const stat of newStats) {
        const { error } = await supabase
          .from('school_stats')
          .update({ display_order: stat.display_order })
          .eq('id', stat.id);
        
        if (error) throw error;
      }
      
      setStats(newStats);

      toast({
        title: "Success",
        description: "Order updated successfully",
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  const updateStat = <K extends keyof SchoolStat>(id: string, field: K, value: SchoolStat[K]) => {
    setStats(stats.map((stat) =>
      stat.id === id ? { ...stat, [field]: value } : stat
    ));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">School Stats Manager</h1>
          <p className="text-muted-foreground">
            Manage the statistics displayed in the "Legacy of Excellence" section
          </p>
        </div>
        <Button onClick={addStat} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Stat
        </Button>
      </div>

      <div className="grid gap-4">
        {stats.map((stat, index) => (
          <Card key={stat.id} className="p-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Stat #{index + 1}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveStatOrder(stat.id, 'up')}
                    disabled={index === 0}
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveStatOrder(stat.id, 'down')}
                    disabled={index === stats.length - 1}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => saveStat(stat)}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteStat(stat.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`label-${stat.id}`}>Label</Label>
                  <Input
                    id={`label-${stat.id}`}
                    placeholder="e.g., Students Enrolled"
                    value={stat.label}
                    onChange={(e) => updateStat(stat.id, 'label', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`value-${stat.id}`}>Value</Label>
                  <Input
                    id={`value-${stat.id}`}
                    type="number"
                    placeholder="e.g., 500"
                    value={stat.value}
                    onChange={(e) => updateStat(stat.id, 'value', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`suffix-${stat.id}`}>Suffix</Label>
                  <Input
                    id={`suffix-${stat.id}`}
                    placeholder="e.g., +, %, or leave empty"
                    value={stat.suffix}
                    onChange={(e) => updateStat(stat.id, 'suffix', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`icon-${stat.id}`}>Icon</Label>
                  <Select
                    value={stat.icon_name}
                    onValueChange={(value) => updateStat(stat.id, 'icon_name', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id={`active-${stat.id}`}
                  checked={stat.is_active}
                  onCheckedChange={(checked) => updateStat(stat.id, 'is_active', checked)}
                />
                <Label htmlFor={`active-${stat.id}`}>Active (visible on website)</Label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No stats configured yet</p>
          <Button onClick={addStat}>Add Your First Stat</Button>
        </Card>
      )}
    </div>
  );
};

export default SchoolStats;
