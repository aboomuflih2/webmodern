import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Save, X, MessageSquare, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PhotoUpload } from '@/components/PhotoUpload';
import { toast } from 'sonner';

interface LeadershipMessage {
  id: string;
  person_name: string;
  person_title: string;
  position: string;
  message_content: string;
  photo_url?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const LeadershipMessagesManager = () => {
  const [messages, setMessages] = useState<LeadershipMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    person_name: '',
    person_title: '',
    position: '',
    message_content: '',
    photo_url: '',
    is_active: true,
    display_order: 0
  });
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      console.log('Loading leadership messages from admin panel...');
      const { data, error } = await supabase
        .from('leadership_messages')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Supabase error in admin panel:', error);
        throw error;
      }
      
      console.log('Admin panel loaded:', data?.length || 0, 'messages');
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading leadership messages:', error);
      toast.error('Failed to load leadership messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const messageData = {
        person_name: formData.person_name,
        person_title: formData.person_title,
        position: formData.position,
        message_content: formData.message_content,
        photo_url: currentPhotoUrl || '',
        is_active: formData.is_active,
        display_order: formData.display_order
      };

      console.log('Saving leadership message:', messageData);

      if (editingId) {
        const { data, error } = await supabase
          .from('leadership_messages')
          .update(messageData)
          .eq('id', editingId)
          .select();

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        console.log('Message updated:', data);
        toast.success('Message updated successfully');
      } else {
        const { data, error } = await supabase
          .from('leadership_messages')
          .insert([messageData])
          .select();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        console.log('Message added:', data);
        toast.success('Message added successfully');
      }

      resetForm();
      
      // Force reload messages to ensure sync
      await loadMessages();
      console.log('Messages reloaded after save');
    } catch (error) {
      console.error('Error saving leadership message:', error);
      toast.error('Failed to save leadership message');
    }
  };

  const handleEdit = (message: LeadershipMessage) => {
    setFormData({
      person_name: message.person_name,
      person_title: message.person_title,
      position: message.position,
      message_content: message.message_content,
      photo_url: message.photo_url || '',
      is_active: message.is_active,
      display_order: message.display_order
    });
    setCurrentPhotoUrl(message.photo_url || null);
    setEditingId(message.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this leadership message?')) return;

    try {
      console.log('Deleting leadership message:', id);
      const { error } = await supabase
        .from('leadership_messages')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
      console.log('Message deleted successfully');
      toast.success('Leadership message deleted successfully');
      await loadMessages();
    } catch (error) {
      console.error('Error deleting leadership message:', error);
      toast.error('Failed to delete leadership message');
    }
  };

  const resetForm = () => {
    setFormData({
      person_name: '',
      person_title: '',
      position: '',
      message_content: '',
      photo_url: '',
      is_active: true,
      display_order: 0
    });
    setCurrentPhotoUrl(null);
    setEditingId(null);
    setShowAddForm(false);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      console.log('Toggling active status for message:', id, 'from', currentStatus, 'to', !currentStatus);
      const { data, error } = await supabase
        .from('leadership_messages')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Toggle error:', error);
        throw error;
      }
      console.log('Status toggled:', data);
      toast.success('Status updated successfully');
      await loadMessages();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading leadership messages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Leadership Messages Management</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadMessages}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Message
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Edit Leadership Message' : 'Add New Leadership Message'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="person_name">Person Name</Label>
                  <Input
                    id="person_name"
                    value={formData.person_name}
                    onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="person_title">Person Title</Label>
                  <Input
                    id="person_title"
                    value={formData.person_title}
                    onChange={(e) => setFormData({ ...formData, person_title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="photo_url">Photo</Label>
                  <PhotoUpload
                    currentPhotoUrl={currentPhotoUrl}
                    onPhotoChange={setCurrentPhotoUrl}
                    bucket="testimonial-photos"
                    folder="leadership"
                    maxSizeInMB={5}
                  />
                </div>
                <div>
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="message_content">Message Content</Label>
                <Textarea
                  id="message_content"
                  value={formData.message_content}
                  onChange={(e) => setFormData({ ...formData, message_content: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {editingId ? 'Update' : 'Save'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {messages.map((message) => (
          <Card key={message.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {message.photo_url && (
                    <div className="flex-shrink-0">
                      <img
                        src={message.photo_url}
                        alt={message.person_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{message.person_name}</h3>
                      <Badge variant={message.is_active ? 'default' : 'secondary'}>
                        {message.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{message.person_title}</p>
                    <p className="text-sm font-medium text-blue-600 mb-2">{message.position}</p>
                    <p className="text-gray-700 mb-2">{message.message_content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Order: {message.display_order}</span>
                      <span>Created: {new Date(message.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Switch
                    checked={message.is_active}
                    onCheckedChange={() => toggleActive(message.id, message.is_active)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(message)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(message.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {messages.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Leadership Messages</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first leadership message.</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Message
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeadershipMessagesManager;