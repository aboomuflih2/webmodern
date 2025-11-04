import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Search, Mail, Phone, Calendar, MessageSquare, Check, Trash2 } from 'lucide-react';

interface ContactSubmission {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const ContactsManager = () => {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load contact submissions',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ is_read: true })
        .eq('id', contactId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Message marked as read',
      });

      loadContacts();
    } catch (error) {
      console.error('Error marking as read:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update message',
      });
    }
  };

  const deleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Message deleted successfully',
      });

      setSelectedContact(null);
      loadContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete message',
      });
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadCount = contacts.filter(contact => !contact.is_read).length;

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
            <MessageSquare className="h-8 w-8" />
            Contact Messages
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Manage visitor inquiries and messages</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by name, email, or subject..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Messages ({filteredContacts.length})
          </h2>
          
          {filteredContacts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No messages match your search.' : 'No contact messages found.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredContacts.map((contact) => (
                <Card
                  key={contact.id}
                  className={`cursor-pointer transition-colors ${
                    selectedContact?.id === contact.id
                      ? 'ring-2 ring-primary'
                      : 'hover:bg-accent'
                  } ${!contact.is_read ? 'border-l-4 border-l-primary' : ''}`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{contact.full_name}</h3>
                          {!contact.is_read && (
                            <Badge variant="default" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {contact.email}
                        </p>
                        <p className="text-sm font-medium mb-2">{contact.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(contact.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Message Detail */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Message Details</h2>
          
          {selectedContact ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedContact.full_name}
                      {!selectedContact.is_read && (
                        <Badge variant="default">Unread</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{selectedContact.subject}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {!selectedContact.is_read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(selectedContact.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Mark Read
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteContact(selectedContact.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedContact.email}</span>
                  </div>
                  {selectedContact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedContact.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(selectedContact.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Message:</h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap text-sm">
                      {selectedContact.message}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="default"
                    onClick={() => window.open(`mailto:${selectedContact.email}?subject=Re: ${selectedContact.subject}`, '_blank')}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Reply via Email
                  </Button>
                  {selectedContact.phone && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(`tel:${selectedContact.phone}`, '_blank')}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Select a message to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactsManager;