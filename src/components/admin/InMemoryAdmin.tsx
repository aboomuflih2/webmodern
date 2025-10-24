import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import PhotoUpload from '../PhotoUpload';
import { Plus, Edit, Trash2, Save, X, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface InMemoryEntry {
  id: string;
  photo_url: string | null;
  name: string;
  designation: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface InMemoryFormData {
  name: string;
  designation: string;
  description: string;
  photo_url: string | null;
  display_order: number;
}

const InMemoryAdmin: React.FC = () => {
  const [entries, setEntries] = useState<InMemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<InMemoryEntry | null>(null);
  const [formData, setFormData] = useState<InMemoryFormData>({
    name: '',
    designation: '',
    description: '',
    photo_url: null,
    display_order: 0
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('in_memory')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching entries:', error);
        toast.error('Failed to load memorial entries');
        return;
      }

      setEntries(data || []);
    } catch (err) {
      console.error('Error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      designation: '',
      description: '',
      photo_url: null,
      display_order: entries.length
    });
    setEditingEntry(null);
    setShowForm(false);
  };

  const handleEdit = (entry: InMemoryEntry) => {
    setFormData({
      name: entry.name,
      designation: entry.designation,
      description: entry.description || '',
      photo_url: entry.photo_url,
      display_order: entry.display_order
    });
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.designation.trim()) {
      toast.error('Name and designation are required');
      return;
    }

    setSubmitting(true);

    try {
      if (editingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('in_memory')
          .update({
            name: formData.name.trim(),
            designation: formData.designation.trim(),
            description: formData.description.trim() || null,
            photo_url: formData.photo_url,
            display_order: formData.display_order
          })
          .eq('id', editingEntry.id);

        if (error) {
          console.error('Error updating entry:', error);
          toast.error('Failed to update memorial entry');
          return;
        }

        toast.success('Memorial entry updated successfully');
      } else {
        // Create new entry
        const { error } = await supabase
          .from('in_memory')
          .insert({
            name: formData.name.trim(),
            designation: formData.designation.trim(),
            description: formData.description.trim() || null,
            photo_url: formData.photo_url,
            display_order: formData.display_order
          });

        if (error) {
          console.error('Error creating entry:', error);
          toast.error('Failed to create memorial entry');
          return;
        }

        toast.success('Memorial entry created successfully');
      }

      resetForm();
      fetchEntries();
    } catch (err) {
      console.error('Error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the memorial entry for ${name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('in_memory')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting entry:', error);
        toast.error('Failed to delete memorial entry');
        return;
      }

      toast.success('Memorial entry deleted successfully');
      fetchEntries();
    } catch (err) {
      console.error('Error:', err);
      toast.error('An unexpected error occurred');
    }
  };

  const handlePhotoUpload = (photoUrl: string) => {
    setFormData(prev => ({ ...prev, photo_url: photoUrl }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading memorial entries...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Heart className="h-8 w-8 text-red-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">In Memory Management</h1>
            <p className="text-gray-600">Manage memorial entries for deceased management members</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Memorial Entry</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingEntry ? 'Edit Memorial Entry' : 'Add Memorial Entry'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo
                  </label>
                  <PhotoUpload
                    onPhotoChange={handlePhotoUpload}
                    currentPhotoUrl={formData.photo_url}
                    bucket="staff-photos"
                    folder="memorial"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designation *
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter designation/position"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter a brief description or tribute"
                  />
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{submitting ? 'Saving...' : (editingEntry ? 'Update Entry' : 'Create Entry')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Memorial Entries ({entries.length})</h2>
        </div>
        
        {entries.length === 0 ? (
          <div className="p-12 text-center">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No memorial entries yet</h3>
            <p className="text-gray-500 mb-4">Start by adding the first memorial entry.</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Entry
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {entries.map((entry) => (
              <div key={entry.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  {/* Photo */}
                  <div className="flex-shrink-0">
                    {entry.photo_url ? (
                      <img
                        src={entry.photo_url}
                        alt={entry.name}
                        className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <Heart className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{entry.name}</h3>
                        <p className="text-sm text-gray-600 font-medium">{entry.designation}</p>
                        {entry.description && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{entry.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">Display Order: {entry.display_order}</p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit entry"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id, entry.name)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InMemoryAdmin;