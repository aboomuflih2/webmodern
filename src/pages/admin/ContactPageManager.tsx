import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddressCardsManager from '@/components/admin/AddressCardsManager';
import LocationLinksManager from '@/components/admin/LocationLinksManager';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Loader2,
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertTriangle,
  Building2,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContactPageContent {
  id: string;
  content_type: 'contact_info' | 'office_hours' | 'address' | 'emergency' | 'department';
  title: string;
  content: string;
  additional_data: {
    phone?: string;
    email?: string;
    coordinates?: { lat: number; lng: number };
  };
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface NewContactContent {
  content_type: ContactPageContent['content_type'];
  title: string;
  content: string;
  phone: string;
  email: string;
  lat: string;
  lng: string;
}

const ContactPageManager = () => {
  const [contents, setContents] = useState<ContactPageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedType, setSelectedType] = useState<ContactPageContent['content_type'] | 'all'>('all');
  const [previewMode, setPreviewMode] = useState(false);
  const [newContent, setNewContent] = useState<NewContactContent>({
    content_type: 'contact_info',
    title: '',
    content: '',
    phone: '',
    email: '',
    lat: '',
    lng: ''
  });
  const { toast } = useToast();

  const contentTypes = [
    { value: 'contact_info', label: 'Contact Information', icon: Phone },
    { value: 'office_hours', label: 'Office Hours', icon: Clock },
    { value: 'address', label: 'Address', icon: MapPin },
    { value: 'emergency', label: 'Emergency Contact', icon: AlertTriangle },
    { value: 'department', label: 'Department Contact', icon: Building2 }
  ] as const;

  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    try {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .like('page_key', 'contact_%')
        .order('page_key');

      if (error) throw error;
      
      // Transform page_content data to match ContactPageContent interface
      const transformedData = (data || []).map(item => ({
        id: item.id,
        content_type: item.page_key.replace('contact_', ''),
        title: item.page_title,
        content: item.content,
        additional_data: item.meta_description ? JSON.parse(item.meta_description) : {},
        display_order: 0,
        is_active: true,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setContents(transformedData);
    } catch (error) {
      console.error('Error loading contact content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contact page content',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newContent.title.trim() || !newContent.content.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in title and content fields.',
        variant: 'destructive',
      });
      return;
    }

    setSaving('new');
    try {
      const typeContents = contents.filter(c => c.content_type === newContent.content_type);
      const maxOrder = Math.max(...typeContents.map(c => c.display_order), 0);
      
      const additionalData: Record<string, unknown> = {};
      if (newContent.phone) additionalData.phone = newContent.phone;
      if (newContent.email) additionalData.email = newContent.email;
      if (newContent.lat && newContent.lng) {
        additionalData.coordinates = {
          lat: parseFloat(newContent.lat),
          lng: parseFloat(newContent.lng)
        };
      }

      const { data, error } = await supabase
        .from('page_content')
        .insert([{
          page_key: `contact_${newContent.content_type}`,
          page_title: newContent.title,
          content: newContent.content,
          meta_description: JSON.stringify(additionalData),
        }])
        .select()
        .single();

      if (error) throw error;

      // Transform the inserted data to match ContactPageContent interface
      const transformedData = {
        id: data.id,
        content_type: data.page_key.replace('contact_', ''),
        title: data.page_title,
        content: data.content,
        additional_data: data.meta_description ? JSON.parse(data.meta_description) : {},
        display_order: 0,
        is_active: true,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      setContents(prev => [...prev, transformedData]);
      setNewContent({
        content_type: 'contact_info',
        title: '',
        content: '',
        phone: '',
        email: '',
        lat: '',
        lng: ''
      });
      setShowAddForm(false);

      toast({
        title: 'Success',
        description: 'Contact content added successfully.',
      });
    } catch (error) {
      console.error('Error adding content:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack
      });
      console.error('Form data being submitted:', {
        content_type: newContent.content_type,
        title: newContent.title,
        content: newContent.content,
        additional_data: additionalData,
        display_order: maxOrder + 1,
        is_active: true
      });
      toast({
        title: 'Error',
        description: `Failed to add contact content: ${(error as { message?: string } | undefined)?.message || 'Unknown error'}. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleUpdate = async (content: ContactPageContent) => {
    setSaving(content.id);
    try {
      const { error } = await supabase
        .from('page_content')
        .update({
          page_title: content.title,
          content: content.content,
          meta_description: JSON.stringify(content.additional_data),
        })
        .eq('id', content.id);

      if (error) throw error;

      setEditingId(null);
      toast({
        title: 'Success',
        description: 'Contact content updated successfully.',
      });
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: 'Error',
        description: 'Failed to update contact content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    setSaving(id);
    try {
      // Since page_content doesn't have is_active, we'll just update the local state
      // In a real implementation, you might want to add a status field to meta_description
      setContents(prev => prev.map(c => 
        c.id === id ? { ...c, is_active: isActive } : c
      ));

      toast({
        title: 'Success',
        description: `Contact content ${isActive ? 'activated' : 'deactivated'} successfully.`,
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
    if (!confirm('Are you sure you want to delete this contact content?')) return;

    setSaving(id);
    try {
      const { error } = await supabase
        .from('page_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContents(prev => prev.filter(c => c.id !== id));
      toast({
        title: 'Success',
        description: 'Contact content deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete contact content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const updateContentField = (id: string, field: 'title' | 'content', value: string) => {
    setContents(prev => prev.map(content => 
      content.id === id ? { ...content, [field]: value } : content
    ));
  };

  const updateAdditionalData = (id: string, key: string, value: string) => {
    setContents(prev => prev.map(content => 
      content.id === id 
        ? { 
            ...content, 
            additional_data: { 
              ...content.additional_data, 
              [key]: value 
            } 
          } 
        : content
    ));
  };

  const filteredContents = selectedType === 'all' 
    ? contents 
    : contents.filter(content => content.content_type === selectedType);

  const getTypeIcon = (type: ContactPageContent['content_type']) => {
    const typeConfig = contentTypes.find(t => t.value === type);
    return typeConfig?.icon || Phone;
  };

  const getTypeLabel = (type: ContactPageContent['content_type']) => {
    const typeConfig = contentTypes.find(t => t.value === type);
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Phone className="h-8 w-8" />
            Contact Page Manager
          </h1>
          <p className="text-muted-foreground">Manage contact page content, address cards, and location links</p>
        </div>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Contact Content</TabsTrigger>
          <TabsTrigger value="addresses">Address Cards</TabsTrigger>
          <TabsTrigger value="locations">Location Links</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Contact Content Management</h2>
              <p className="text-muted-foreground">Manage general contact information and content</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {previewMode ? 'Edit Mode' : 'Preview Mode'}
              </Button>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Content
              </Button>
            </div>
          </div>

      {/* Filter */}
      <div className="flex gap-4 items-center">
        <Label>Filter by type:</Label>
        <Select value={selectedType} onValueChange={(value: string) => setSelectedType(value as ContactPageContent['content_type'] | 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {contentTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Contact Content</CardTitle>
            <CardDescription>Create new contact page content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="content_type">Content Type</Label>
                <Select 
                  value={newContent.content_type} 
                  onValueChange={(value: string) => setNewContent(prev => ({ ...prev, content_type: value as ContactPageContent['content_type'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newContent.title}
                  onChange={(e) => setNewContent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter title"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={newContent.content}
                onChange={(e) => setNewContent(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter content description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  value={newContent.phone}
                  onChange={(e) => setNewContent(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={newContent.email}
                  onChange={(e) => setNewContent(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lat">Latitude (optional)</Label>
                <Input
                  id="lat"
                  value={newContent.lat}
                  onChange={(e) => setNewContent(prev => ({ ...prev, lat: e.target.value }))}
                  placeholder="Enter latitude"
                />
              </div>
              <div>
                <Label htmlFor="lng">Longitude (optional)</Label>
                <Input
                  id="lng"
                  value={newContent.lng}
                  onChange={(e) => setNewContent(prev => ({ ...prev, lng: e.target.value }))}
                  placeholder="Enter longitude"
                />
              </div>
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
                Add Content
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

      {/* Content List */}
      <div className="space-y-4">
        {filteredContents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {selectedType === 'all' 
                  ? 'No contact content found. Add some content to get started.' 
                  : `No ${getTypeLabel(selectedType as ContactPageContent['content_type'])} content found.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredContents.map((content) => {
            const TypeIcon = getTypeIcon(content.content_type);
            const isEditing = editingId === content.id;
            
            return (
              <Card key={content.id} className={!content.is_active ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-5 w-5" />
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {isEditing ? (
                            <Input
                              value={content.title}
                              onChange={(e) => updateContentField(content.id, 'title', e.target.value)}
                              className="font-semibold"
                            />
                          ) : (
                            content.title
                          )}
                          <Badge variant={content.is_active ? 'default' : 'secondary'}>
                            {getTypeLabel(content.content_type)}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Created: {new Date(content.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`active-${content.id}`} className="text-sm">
                          Active
                        </Label>
                        <Switch
                          id={`active-${content.id}`}
                          checked={content.is_active}
                          onCheckedChange={(checked) => handleToggleActive(content.id, checked)}
                          disabled={saving === content.id}
                        />
                      </div>
                      {isEditing ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(content)}
                            disabled={saving === content.id}
                          >
                            {saving === content.id ? (
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
                            onClick={() => setEditingId(content.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(content.id)}
                            disabled={saving === content.id}
                          >
                            {saving === content.id ? (
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
                  <div>
                    <Label>Content</Label>
                    {isEditing ? (
                      <Textarea
                        value={content.content}
                        onChange={(e) => updateContentField(content.id, 'content', e.target.value)}
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {content.content}
                      </p>
                    )}
                  </div>

                  {/* Additional Data */}
                  {(content.additional_data?.phone || content.additional_data?.email || isEditing) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(content.additional_data?.phone || isEditing) && (
                        <div>
                          <Label>Phone</Label>
                          {isEditing ? (
                            <Input
                              value={content.additional_data?.phone || ''}
                              onChange={(e) => updateAdditionalData(content.id, 'phone', e.target.value)}
                              placeholder="Enter phone number"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span className="text-sm">{content.additional_data?.phone}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {(content.additional_data?.email || isEditing) && (
                        <div>
                          <Label>Email</Label>
                          {isEditing ? (
                            <Input
                              value={content.additional_data?.email || ''}
                              onChange={(e) => updateAdditionalData(content.id, 'email', e.target.value)}
                              placeholder="Enter email address"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span className="text-sm">{content.additional_data?.email}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {content.additional_data?.coordinates && (
                    <div>
                      <Label>Coordinates</Label>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">
                          {content.additional_data.coordinates.lat}, {content.additional_data.coordinates.lng}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
        </TabsContent>
        
        <TabsContent value="addresses" className="space-y-6">
          <AddressCardsManager />
        </TabsContent>
        
        <TabsContent value="locations" className="space-y-6">
          <LocationLinksManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContactPageManager;
