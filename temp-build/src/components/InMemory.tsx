import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Heart } from 'lucide-react';

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

const InMemory: React.FC = () => {
  const [memorialEntries, setMemorialEntries] = useState<InMemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMemorialEntries();
  }, []);

  const fetchMemorialEntries = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('in_memory')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching memorial entries:', error);
        setError(`Failed to load memorial entries: ${error.message}`);
        return;
      }

      setMemorialEntries(data || []);
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading memorial entries...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (memorialEntries.length === 0) {
    return null; // Don't show the section if no entries
  }

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-red-500 mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">In Memory</h2>
            <Heart className="h-8 w-8 text-red-500 ml-3" />
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Honoring the memory of our beloved management members who have left an indelible mark on our institution.
            Their dedication, vision, and contributions continue to inspire us.
          </p>
        </div>

        {/* Memorial Entries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {memorialEntries.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-600">No memorial entries found. Please add entries through the admin panel.</p>
            </div>
          ) : (
            memorialEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200"
            >
              {/* Photo */}
              <div className="relative h-64 bg-gray-200">
                {entry.photo_url ? (
                  <img
                    src={entry.photo_url}
                    alt={entry.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/api/placeholder/300/300';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <div className="text-center">
                      <Heart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">In Loving Memory</p>
                    </div>
                  </div>
                )}
                {/* Memorial Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white bg-opacity-90 rounded-lg p-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{entry.name}</h3>
                    <p className="text-sm text-gray-700 font-medium">{entry.designation}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {entry.description && (
                <div className="p-6">
                  <p className="text-gray-600 text-sm leading-relaxed">{entry.description}</p>
                </div>
              )}

              {/* Memorial Footer */}
              <div className="px-6 pb-6">
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-500 text-center italic">
                    "Forever in our hearts and memories"
                  </p>
                </div>
              </div>
            </div>
          ))
          )}
        </div>

        {/* Memorial Message */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto border border-gray-200">
            <Heart className="h-6 w-6 text-red-500 mx-auto mb-4" />
            <p className="text-gray-700 italic text-lg leading-relaxed">
              "Though they may be gone from our sight, they will never be gone from our hearts. 
              Their legacy lives on in the values they instilled, the lives they touched, 
              and the institution they helped build."
            </p>
            <p className="text-gray-500 text-sm mt-4">- Pottur School Connect Family</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InMemory;