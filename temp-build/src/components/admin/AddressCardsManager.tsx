import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Loader2,
  MapPin,
  GripVertical
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContactAddress {
  id: string;
  title: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface NewAddress {
  title: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

const AddressCardsManager = () => {
  const [addresses, setAddresses] = useState<ContactAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState<NewAddress>({
    title: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_addresses')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load address cards',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newAddress.title.trim() || !newAddress.address_line_1.trim() || !newAddress.city.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in title, address line 1, and city fields.',
        variant: 'destructive',
      });
      return;
    }

    setSaving('new');
    try {
      const maxOrder = Math.max(...addresses.map(a => a.display_order), 0);
      
      const { data, error } = await supabase
        .from('contact_addresses')
        .insert([{
          ...newAddress,
          display_order: maxOrder + 1,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;

      setAddresses(prev => [...prev, data]);
      setNewAddress({
        title: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India'
      });
      setShowAddForm(false);

      toast({
        title: 'Success',
        description: 'Address card added successfully.',
      });
    } catch (error) {
      console.error('Error adding address:', error);
      toast({
        title: 'Error',
        description: 'Failed to add address card. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleUpdate = async (address: ContactAddress) => {
    setSaving(address.id);
    try {
      const { error } = await supabase
        .from('contact_addresses')
        .update({
          title: address.title,
          address_line_1: address.address_line_1,
          address_line_2: address.address_line_2,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country,
        })
        .eq('id', address.id);

      if (error) throw error;

      setEditingId(null);
      toast({
        title: 'Success',
        description: 'Address card updated successfully.',
      });
    } catch (error) {
      console.error('Error updating address:', error);
      toast({
        title: 'Error',
        description: 'Failed to update address card. Please try again.',
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
        .from('contact_addresses')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      setAddresses(prev => prev.map(a => 
        a.id === id ? { ...a, is_active: isActive } : a
      ));

      toast({
        title: 'Success',
        description: `Address card ${isActive ? 'activated' : 'deactivated'} successfully.`,
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
    if (!confirm('Are you sure you want to delete this address card?')) return;

    setSaving(id);
    try {
      const { error } = await supabase
        .from('contact_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAddresses(prev => prev.filter(a => a.id !== id));
      toast({
        title: 'Success',
        description: 'Address card deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting address:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete address card. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const updateAddressField = (id: string, field: keyof ContactAddress, value: any) => {
    setAddresses(prev => prev.map(address => 
      address.id === id ? { ...address, [field]: value } : address
    ));
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
            <MapPin className="h-6 w-6" />
            Address Cards
          </h2>
          <p className="text-muted-foreground">Manage address cards displayed on the contact page</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Address Card</CardTitle>
            <CardDescription>Create a new address card for the contact page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newAddress.title}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Main Campus, Administrative Office"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={newAddress.country}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Enter country"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="address_line_1">Address Line 1</Label>
              <Input
                id="address_line_1"
                value={newAddress.address_line_1}
                onChange={(e) => setNewAddress(prev => ({ ...prev, address_line_1: e.target.value }))}
                placeholder="Enter primary address"
              />
            </div>

            <div>
              <Label htmlFor="address_line_2">Address Line 2 (Optional)</Label>
              <Input
                id="address_line_2"
                value={newAddress.address_line_2}
                onChange={(e) => setNewAddress(prev => ({ ...prev, address_line_2: e.target.value }))}
                placeholder="Enter secondary address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="Enter state"
                />
              </div>
              <div>
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={newAddress.postal_code}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                  placeholder="Enter postal code"
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
                Add Address
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

      {/* Address Cards List */}
      <div className="space-y-4">
        {addresses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No address cards found. Add some addresses to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          addresses.map((address) => {
            const isEditing = editingId === address.id;
            
            return (
              <Card key={address.id} className={!address.is_active ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {isEditing ? (
                            <Input
                              value={address.title}
                              onChange={(e) => updateAddressField(address.id, 'title', e.target.value)}
                              className="font-semibold"
                            />
                          ) : (
                            address.title
                          )}
                          <Badge variant={address.is_active ? 'default' : 'secondary'}>
                            Address Card
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Order: {address.display_order} | Created: {new Date(address.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`active-${address.id}`} className="text-sm">
                          Active
                        </Label>
                        <Switch
                          id={`active-${address.id}`}
                          checked={address.is_active}
                          onCheckedChange={(checked) => handleToggleActive(address.id, checked)}
                          disabled={saving === address.id}
                        />
                      </div>
                      {isEditing ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(address)}
                            disabled={saving === address.id}
                          >
                            {saving === address.id ? (
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
                            onClick={() => setEditingId(address.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(address.id)}
                            disabled={saving === address.id}
                          >
                            {saving === address.id ? (
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
                        <Label>Address Line 1</Label>
                        <Input
                          value={address.address_line_1}
                          onChange={(e) => updateAddressField(address.id, 'address_line_1', e.target.value)}
                          placeholder="Enter primary address"
                        />
                      </div>
                      <div>
                        <Label>Address Line 2</Label>
                        <Input
                          value={address.address_line_2 || ''}
                          onChange={(e) => updateAddressField(address.id, 'address_line_2', e.target.value)}
                          placeholder="Enter secondary address"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>City</Label>
                          <Input
                            value={address.city}
                            onChange={(e) => updateAddressField(address.id, 'city', e.target.value)}
                            placeholder="Enter city"
                          />
                        </div>
                        <div>
                          <Label>State</Label>
                          <Input
                            value={address.state}
                            onChange={(e) => updateAddressField(address.id, 'state', e.target.value)}
                            placeholder="Enter state"
                          />
                        </div>
                        <div>
                          <Label>Postal Code</Label>
                          <Input
                            value={address.postal_code}
                            onChange={(e) => updateAddressField(address.id, 'postal_code', e.target.value)}
                            placeholder="Enter postal code"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Country</Label>
                        <Input
                          value={address.country}
                          onChange={(e) => updateAddressField(address.id, 'country', e.target.value)}
                          placeholder="Enter country"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div className="text-sm">
                          <div>{address.address_line_1}</div>
                          {address.address_line_2 && <div>{address.address_line_2}</div>}
                          <div>{address.city}, {address.state} {address.postal_code}</div>
                          <div>{address.country}</div>
                        </div>
                      </div>
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

export default AddressCardsManager;