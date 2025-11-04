import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Loader2,
  ExternalLink,
  Map,
  Navigation,
  Eye,
  GripVertical
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContactLocation {
  id: string;
  title: string;
  url: string;
  description?: string;
  location_type: 'map' | 'directions' | 'street_view' | 'other';
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface NewLocation {
  title: string;
  url: string;
  description: string;
  location_type: 'map' | 'directions' | 'street_view' | 'other';
}

const LocationLinksManager = () => {
  const [locations, setLocations] = useState<ContactLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocation, setNewLocation] = useState<NewLocation>({
    title: '',
    url: '',
    description: '',
    location_type: 'map'
  });
  const { toast } = useToast();

  const locationTypes = [
    { value: 'map', label: 'Map View', icon: Map },
    { value: 'directions', label: 'Directions', icon: Navigation },
    { value: 'street_view', label: 'Street View', icon: Eye },
    { value: 'other', label: 'Other', icon: ExternalLink }
  ] as const;

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_locations')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load location links',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newLocation.title.trim() || !newLocation.url.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in title and URL fields.',
        variant: 'destructive',
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(newLocation.url);
    } catch {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid URL.',
        variant: 'destructive',
      });
      return;
    }

    setSaving('new');
    try {
      const maxOrder = Math.max(...locations.map(l => l.display_order), 0);
      
      const { data, error } = await supabase
        .from('contact_locations')
        .insert([{
          ...newLocation,
          display_order: maxOrder + 1,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;

      setLocations(prev => [...prev, data]);
      setNewLocation({
        title: '',
        url: '',
        description: '',
        location_type: 'map'
      });
      setShowAddForm(false);

      toast({
        title: 'Success',
        description: 'Location link added successfully.',
      });
    } catch (error) {
      console.error('Error adding location:', error);
      toast({
        title: 'Error',
        description: 'Failed to add location link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleUpdate = async (location: ContactLocation) => {
    // Basic URL validation
    try {
      new URL(location.url);
    } catch {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid URL.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(location.id);
    try {
      const { error } = await supabase
        .from('contact_locations')
        .update({
          title: location.title,
          url: location.url,
          description: location.description,
          location_type: location.location_type,
        })
        .eq('id', location.id);

      if (error) throw error;

      setEditingId(null);
      toast({
        title: 'Success',
        description: 'Location link updated successfully.',
      });
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: 'Error',
        description: 'Failed to update location link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    setSaving(id);
    try {
      const { error } = await supabase
        .from('contact_locations')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      setLocations(prev => prev.map(l => 
        l.id === id ? { ...l, is_active: isActive } : l
      ));

      toast({
        title: 'Success',
        description: `Location link ${isActive ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      console.error('Error toggling active status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location link?')) return;

    setSaving(id);
    try {
      const { error } = await supabase
        .from('contact_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLocations(prev => prev.filter(l => l.id !== id));
      toast({
        title: 'Success',
        description: 'Location link deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete location link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const updateLocationField = (id: string, field: keyof ContactLocation, value: any) => {
    setLocations(prev => prev.map(location => 
      location.id === id ? { ...location, [field]: value } : location
    ));
  };

  const getTypeIcon = (type: ContactLocation['location_type']) => {
    const typeConfig = locationTypes.find(t => t.value === type);
    return typeConfig?.icon || ExternalLink;
  };

  const getTypeLabel = (type: ContactLocation['location_type']) => {
    const typeConfig = locationTypes.find(t => t.value === type);
    return typeConfig?.label || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ExternalLink className="h-6 w-6" />
            Location Links
          </h2>
          <p className="text-muted-foreground">Manage location links and maps displayed on the contact page</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location Link
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Location Link</CardTitle>
            <CardDescription>Create a new location link for the contact page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newLocation.title}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., View on Google Maps, Get Directions"
                />
              </div>
              <div>
                <Label htmlFor="location_type">Location Type</Label>
                <Select 
                  value={newLocation.location_type} 
                  onValueChange={(value: any) => setNewLocation(prev => ({ ...prev, location_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={newLocation.url}
                onChange={(e) => setNewLocation(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://maps.google.com/..."
                type="url"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={newLocation.description}
                onChange={(e) => setNewLocation(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this location link"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleAdd} 
                disabled={saving === 'new'}
              >
                {saving === 'new' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Add Location Link
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Links List */}
      <div className="space-y-4">
        {locations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No location links found. Add some location links to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          locations.map((location) => {
            const TypeIcon = getTypeIcon(location.location_type);
            const isEditing = editingId === location.id;
            
            return (
              <Card key={location.id} className={!location.is_active ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                      <TypeIcon className="h-5 w-5" />
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {isEditing ? (
                            <Input
                              value={location.title}
                              onChange={(e) => updateLocationField(location.id, 'title', e.target.value)}
                              className="font-semibold"
                            />
                          ) : (
                            location.title
                          )}
                          <Badge variant={location.is_active ? 'default' : 'secondary'}>
                            {getTypeLabel(location.location_type)}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Order: {location.display_order} | Created: {new Date(location.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`active-${location.id}`} className="text-sm">
                          Active
                        </Label>
                        <Switch
                          id={`active-${location.id}`}
                          checked={location.is_active}
                          onCheckedChange={(checked) => handleToggleActive(location.id, checked)}
                          disabled={saving === location.id}
                        />
                      </div>
                      {isEditing ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(location)}
                            disabled={saving === location.id}
                          >
                            {saving === location.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(location.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(location.id)}
                            disabled={saving === location.id}
                          >
                            {saving === location.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Location Type</Label>
                        <Select 
                          value={location.location_type} 
                          onValueChange={(value: any) => updateLocationField(location.id, 'location_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {locationTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>URL</Label>
                        <Input
                          value={location.url}
                          onChange={(e) => updateLocationField(location.id, 'url', e.target.value)}
                          placeholder="Enter URL"
                          type="url"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={location.description || ''}
                          onChange={(e) => updateLocationField(location.id, 'description', e.target.value)}
                          placeholder="Enter description"
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={location.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          {location.url}
                        </a>
                      </div>
                      {location.description && (
                        <p className="text-sm text-muted-foreground">
                          {location.description}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LocationLinksManager;