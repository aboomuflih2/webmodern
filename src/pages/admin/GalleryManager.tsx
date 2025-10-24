import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Pencil, Trash2, Plus, Upload, Image, GripVertical } from "lucide-react";

interface GalleryPhoto {
  id: string;
  image_url: string;
  title: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const GalleryManager = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    image_url: "",
    title: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from("gallery_photos")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching photos:", error);
      toast({ title: "Error fetching photos", variant: "destructive" });
      return;
    }

    const normalized = (data ?? []).map((row) => ({
      id: row.id,
      image_url: row.image_url,
      title: row.title,
      description: row.description ?? null,
      display_order: typeof row.display_order === 'number' ? row.display_order : 0,
      is_active: (row.is_active ?? row.is_featured ?? true) as boolean,
      created_at: row.created_at ?? new Date().toISOString(),
    })) as GalleryPhoto[];

    setPhotos(normalized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.image_url || !formData.title) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }

    if (!user?.id) {
      toast({ title: "You must be logged in to manage gallery", variant: "destructive" });
      return;
    }

    const photoData = {
      ...formData,
      display_order: editingPhoto?.display_order ?? photos.length + 1,
    };

    let error;

    if (editingPhoto) {
      ({ error } = await supabase
        .from("gallery_photos")
        .update(photoData)
        .eq("id", editingPhoto.id));
      // Fallback to legacy schema name is_featured
      const errorMessage = error instanceof Error ? error.message : "";
      if (error && errorMessage.toLowerCase().includes("is_active")) {
        const legacy: Record<string, unknown> = { ...photoData, is_featured: photoData.is_active };
        delete legacy.is_active;
        ({ error } = await supabase
          .from("gallery_photos")
          .update(legacy)
          .eq("id", editingPhoto.id));
      }
    } else {
      ({ error } = await supabase
        .from("gallery_photos")
        .insert(photoData)
        .select()
        .single());
      const errorMessage = error instanceof Error ? error.message : "";
      if (error && errorMessage.toLowerCase().includes("is_active")) {
        const legacy: Record<string, unknown> = { ...photoData, is_featured: photoData.is_active };
        delete legacy.is_active;
        ({ error } = await supabase
          .from("gallery_photos")
          .insert(legacy)
          .select()
          .single());
      }
    }

    if (error) {
      console.error("Error saving photo:", error);
      const msg = error instanceof Error ? error.message : "";
      const help = msg.toLowerCase().includes("row level security") || msg.toLowerCase().includes("policy")
        ? "Check gallery_photos RLS policies and that your user has admin role."
        : undefined;
      toast({ title: "Error saving photo", description: help ? `${msg} - ${help}` : msg || undefined, variant: "destructive" });
      return;
    }

    toast({ title: `Photo ${editingPhoto ? 'updated' : 'added'} successfully!` });
    setIsDialogOpen(false);
    resetForm();
    fetchPhotos();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    const { error } = await supabase
      .from("gallery_photos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting photo:", error);
      toast({ title: "Error deleting photo", variant: "destructive" });
      return;
    }

    toast({ title: "Photo deleted successfully!" });
    fetchPhotos();
  };

  const toggleActiveStatus = async (photo: GalleryPhoto) => {
    let { error } = await supabase
      .from("gallery_photos")
      .update({ is_active: !photo.is_active })
      .eq("id", photo.id);

    const errorMessage = error instanceof Error ? error.message : "";
    if (error && errorMessage.toLowerCase().includes("is_active")) {
      const retry = await supabase
        .from("gallery_photos")
        .update({ is_featured: !photo.is_active })
        .eq("id", photo.id);
      error = retry.error;
    }

    if (error) {
      console.error("Error updating photo status:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      toast({ title: "Error updating photo status", description: errorMsg, variant: "destructive" });
      return;
    }

    toast({ title: `Photo ${!photo.is_active ? 'activated' : 'deactivated'}!` });
    fetchPhotos();
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const reorderedPhotos = [...photos];
    const [movedPhoto] = reorderedPhotos.splice(fromIndex, 1);
    reorderedPhotos.splice(toIndex, 0, movedPhoto);

    // Update display_order for all affected photos
    const updates = reorderedPhotos.map((photo, index) => ({
      id: photo.id,
      display_order: index,
    }));

    // Update in database
    for (const update of updates) {
      await supabase
        .from("gallery_photos")
        .update({ display_order: update.display_order })
        .eq("id", update.id);
    }

    fetchPhotos();
    toast({ title: "Photo order updated!" });
  };

  const handleDragStart = (e: React.DragEvent, photoId: string) => {
    setDraggedItem(photoId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPhotoId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetPhotoId) return;

    const fromIndex = photos.findIndex(p => p.id === draggedItem);
    const toIndex = photos.findIndex(p => p.id === targetPhotoId);

    handleReorder(fromIndex, toIndex);
    setDraggedItem(null);
  };

  const resetForm = () => {
    setFormData({
      image_url: "",
      title: "",
      description: "",
      is_active: true,
    });
    setEditingPhoto(null);
  };

  const openEditDialog = (photo?: GalleryPhoto) => {
    if (photo) {
      setEditingPhoto(photo);
      setFormData({
        image_url: photo.image_url,
        title: photo.title,
        description: photo.description || "",
        is_active: photo.is_active,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Upload to Supabase Storage: gallery-images bucket
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filename = `${crypto.randomUUID()}.${ext}`;
      const filePath = `gallery/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        console.error('Upload failed:', uploadError);
        toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
        return;
      }

      const { data: publicData } = supabase.storage
        .from('gallery-images')
        .getPublicUrl(filePath);

      const publicUrl = publicData.publicUrl;
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast({ title: 'File uploaded', description: 'Image uploaded to gallery storage.' });
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Please try again.';
      toast({ title: 'Upload error', description: errorMessage, variant: 'destructive' });
    } finally {
      // reset input so same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const activePhotos = photos.filter(p => p.is_active);
  const inactivePhotos = photos.filter(p => !p.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gallery Manager</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openEditDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Photo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingPhoto ? "Edit Photo" : "Add New Photo"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Image *</label>
                <div className="space-y-2">
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="Image URL or upload file below"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload File
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Or paste image URL above
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                
                {formData.image_url && (
                  <div className="mt-2">
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Photo Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Photo title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Short description of the photo"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <label htmlFor="active" className="text-sm font-medium">
                  Active (visible in gallery)
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPhoto ? "Update" : "Add"} Photo
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Image className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Gallery Management Tips</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Drag and drop photos to reorder them in the gallery slider</li>
              <li>• Use high-quality images for best display (recommended: 1200px+ width)</li>
              <li>• Photos are shown in the order you set here</li>
              <li>• Inactive photos are hidden from visitors but kept in your library</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Active Photos */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Gallery Photos ({activePhotos.length})</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activePhotos.map((photo, index) => (
            <Card 
              key={photo.id}
              className={`cursor-move transition-all ${
                draggedItem === photo.id ? 'opacity-50 scale-95' : ''
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, photo.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, photo.id)}
            >
              <CardHeader className="p-0">
                <div className="relative">
                  <img 
                    src={photo.image_url} 
                    alt={photo.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditDialog(photo)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(photo.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <GripVertical className="w-3 h-3" />
                    Drag to reorder
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-base mb-1">{photo.title}</CardTitle>
                {photo.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {photo.description}
                  </p>
                )}
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActiveStatus(photo)}
                  >
                    Deactivate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {activePhotos.length === 0 && (
            <div className="col-span-full">
              <Card>
                <CardContent className="text-center py-12">
                  <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No photos in gallery yet</p>
                  <Button onClick={() => openEditDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Photo
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Inactive Photos */}
      {inactivePhotos.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Inactive Photos ({inactivePhotos.length})
          </h2>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {inactivePhotos.map((photo) => (
              <Card key={photo.id} className="opacity-50 border-dashed">
                <CardHeader className="p-0">
                  <div className="relative">
                    <img 
                      src={photo.image_url} 
                      alt={photo.title}
                      className="w-full h-32 object-cover rounded-t-lg grayscale"
                    />
                    <div className="absolute top-1 right-1 flex gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditDialog(photo)}
                        className="h-6 w-6 p-0"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(photo.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <CardTitle className="text-sm mb-1">{photo.title}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActiveStatus(photo)}
                    className="w-full"
                  >
                    Activate
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryManager;
