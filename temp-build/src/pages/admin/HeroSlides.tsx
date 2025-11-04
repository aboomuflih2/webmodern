import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, Upload, X } from 'lucide-react';

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  button_text: string;
  button_url: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const HeroSlidesManager = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    slide_title: '',
    slide_subtitle: '',
    button_text: '',
    button_link: '',
    display_order: 0,
    is_active: true,
    background_image: null as string | null,
  });
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    console.log('📥 Loading slides from database...');
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('order_index');

      if (error) {
        console.error('❌ Error loading slides:', error);
        throw error;
      }
      
      console.log('✅ Slides loaded successfully:', data);
      console.log('📊 Number of slides:', data?.length || 0);
      setSlides(data || []);
    } catch (error) {
      console.error('💥 Error loading slides:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load hero slides',
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!uploadedImage) return null;

    setUploading(true);
    try {
      const fileExt = uploadedImage.name.split('.').pop();
      const fileName = `hero-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('hero-images')
        .upload(fileName, uploadedImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('hero-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Error',
        description: 'Failed to upload image',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Form submission started');
    console.log('📝 Form data:', formData);
    console.log('🖼️ Uploaded image:', uploadedImage);
    console.log('✏️ Editing slide:', editingSlide);
    
    try {
      let slideData = { ...formData };
      console.log('📋 Initial slide data:', slideData);

      if (uploadedImage) {
        console.log('📤 Uploading image...');
        const imageUrl = await uploadImage();
        console.log('🔗 Image URL received:', imageUrl);
        if (imageUrl) {
          slideData = { ...slideData, background_image: imageUrl };
          console.log('✅ Image URL added to slide data');
        } else {
          console.log('❌ Image upload failed, continuing without image');
        }
      } else if (editingSlide && !uploadedImage && !imagePreview) {
        // If editing and no new image and no preview, clear the background_image
        slideData = { ...slideData, background_image: null };
        console.log('🗑️ Cleared background image for edit');
      }

      // Map new column names to old column names for database compatibility
      const dbData = {
        title: slideData.slide_title,
        subtitle: slideData.slide_subtitle,
        image_url: slideData.background_image,
        button_text: slideData.button_text,
        button_url: slideData.button_link,
        order_index: slideData.display_order,
        is_active: slideData.is_active
      };
      
      console.log('💾 Database data to be saved:', dbData);

      if (editingSlide) {
        console.log('✏️ Updating existing slide with ID:', editingSlide.id);
        // Update existing slide
        const { data, error } = await supabase
          .from('hero_slides')
          .update(dbData)
          .eq('id', editingSlide.id)
          .select();

        if (error) {
          console.error('❌ Update error:', error);
          throw error;
        }
        
        console.log('✅ Update successful, returned data:', data);

        toast({
          title: 'Success',
          description: 'Hero slide updated successfully',
        });
      } else {
        console.log('➕ Creating new slide...');
        // Create new slide
        console.log('🔄 Attempting database insert with data:', dbData);
        console.log('🔑 Using Supabase client with URL:', supabase.supabaseUrl);
        const { data, error } = await supabase
          .from('hero_slides')
          .insert([dbData])
          .select();
        console.log('📊 Insert result - data:', data, 'error:', error);
        
        if (error) {
          console.error('❌ Database insert failed:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          console.error('❌ Insert error:', error);
          throw error;
        }
        
        console.log('✅ Insert successful, returned data:', data);

        toast({
          title: 'Success',
          description: 'Hero slide created successfully',
        });
      }

      console.log('🔄 Refreshing form and reloading slides...');
      setShowForm(false);
      setEditingSlide(null);
      resetForm();
      
      console.log('📥 Calling loadSlides()...');
      await loadSlides();
      console.log('✅ Form submission completed successfully');
    } catch (error) {
      console.error('💥 Error saving slide:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save hero slide',
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please select an image smaller than 5MB',
        });
        return;
      }

      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setFormData({
      slide_title: slide.title,
      slide_subtitle: slide.subtitle,
      button_text: slide.button_text,
      button_link: slide.button_url,
      display_order: slide.order_index,
      is_active: slide.is_active,
      background_image: slide.image_url,
    });
    setImagePreview(slide.image_url);
    setUploadedImage(null);
    setShowForm(true);
  };

  const handleDelete = async (slideId: string) => {
    if (!confirm('Are you sure you want to delete this hero slide?')) return;

    try {
      const { error } = await supabase
        .from('hero_slides')
        .delete()
        .eq('id', slideId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Hero slide deleted successfully',
      });

      loadSlides();
    } catch (error) {
      console.error('Error deleting slide:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete hero slide',
      });
    }
  };

  const toggleActive = async (slideId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('hero_slides')
        .update({ is_active: !currentActive })
        .eq('id', slideId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Hero slide ${!currentActive ? 'activated' : 'deactivated'}`,
      });

      loadSlides();
    } catch (error) {
      console.error('Error toggling slide status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update slide status',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      slide_title: '',
      slide_subtitle: '',
      button_text: '',
      button_link: '',
      display_order: slides.length,
      is_active: true,
      background_image: null,
    });
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          <h1 className="text-3xl font-bold">Hero Slides Manager</h1>
          <p className="text-muted-foreground">Manage homepage banner slides</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Slide
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSlide ? 'Edit Hero Slide' : 'Create New Hero Slide'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slide_title">Slide Title</Label>
                  <Input
                    id="slide_title"
                    value={formData.slide_title}
                    onChange={(e) => setFormData({ ...formData, slide_title: e.target.value })}
                    placeholder="Enter slide title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button_text">Button Text</Label>
                  <Input
                    id="button_text"
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    placeholder="Enter button text"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slide_subtitle">Slide Subtitle</Label>
                <Textarea
                  id="slide_subtitle"
                  value={formData.slide_subtitle}
                  onChange={(e) => setFormData({ ...formData, slide_subtitle: e.target.value })}
                  placeholder="Enter slide subtitle/description"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="button_link">Button Link</Label>
                  <Input
                    id="button_link"
                    value={formData.button_link}
                    onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                    placeholder="/academics, /admissions, etc."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Background Image Upload */}
              <div className="space-y-2">
                <Label>Background Image (Optional)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? 'Uploading...' : 'Choose Image'}
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit">
                  {editingSlide ? 'Update Slide' : 'Create Slide'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSlide(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {slides.map((slide) => (
          <Card key={slide.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{slide.slide_title}</h3>
                      <Badge variant={slide.is_active ? 'default' : 'secondary'}>
                        {slide.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">Order: {slide.display_order}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{slide.slide_subtitle}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span><strong>Button:</strong> {slide.button_text}</span>
                      <span><strong>Link:</strong> {slide.button_link}</span>
                      {slide.background_image && (
                        <span><strong>Image:</strong> ✅ Custom background</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(slide.id, slide.is_active)}
                  >
                    {slide.is_active ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(slide)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(slide.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {slides.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No hero slides found. Create your first slide to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HeroSlidesManager;