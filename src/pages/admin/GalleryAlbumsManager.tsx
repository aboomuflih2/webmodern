import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table } from "@/components/ui/table";

interface Album {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  display_mode: "grid" | "slider" | "grid_slider";
  type: string | null;
  related_event_id: string | null;
  status: string;
  is_active: boolean;
  display_order: number;
  published_at?: string | null;
}

interface Photo {
  id: string;
  album_id: string | null;
  image_url: string;
  caption: string | null;
  sort_order: number;
  is_active: boolean;
}

const modes = ["grid", "slider", "grid_slider"] as const;
const types = ["event", "campus", "staff", "students", "other"];
const statuses = ["draft", "published"];

const GalleryAlbumsManager = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [editing, setEditing] = useState<Album | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Album>>({ display_mode: "grid", status: "draft", is_active: true, display_order: 0 });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [draggedAlbum, setDraggedAlbum] = useState<string | null>(null);
  const [draggedPhoto, setDraggedPhoto] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAlbums();
  }, []);

  useEffect(() => {
    if (editing?.id) fetchPhotos(editing.id);
  }, [editing]);

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const fetchAlbums = async () => {
    const { data } = await supabase.from("gallery_albums").select("*").order("display_order", { ascending: true });
    setAlbums((data ?? []) as Album[]);
  };

  const fetchPhotos = async (albumId: string) => {
    const { data } = await supabase
      .from("gallery_photos")
      .select("*")
      .eq("album_id", albumId)
      .order("sort_order", { ascending: true })
      .order("display_order", { ascending: true });
    setPhotos((data ?? []) as Photo[]);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", slug: "", description: "", cover_image: "", display_mode: "grid", type: "event", status: "draft", is_active: true, display_order: 0 });
    setShowForm(true);
  };

  const openEdit = (album: Album) => {
    setEditing(album);
    setForm(album);
    setShowForm(true);
  };

  const saveAlbum = async () => {
    const payload = { ...form } as Partial<Album>;
    if (!payload.title) return;
    if (!payload.slug) payload.slug = slugify(payload.title);
    const { data: existing } = await supabase
      .from("gallery_albums")
      .select("id")
      .eq("slug", payload.slug)
      .limit(1);
    if ((existing ?? []).length && (!editing || existing![0].id !== editing.id)) {
      toast({ title: "Slug already exists", variant: "destructive" });
      return;
    }
    if (editing) {
      await supabase.from("gallery_albums").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("gallery_albums").insert(payload);
    }
    setShowForm(false);
    await fetchAlbums();
    toast({ title: editing ? "Album updated" : "Album created" });
  };

  const removeAlbum = async (id: string) => {
    await supabase.from("gallery_albums").delete().eq("id", id);
    await fetchAlbums();
    toast({ title: "Album deleted" });
  };

  const uploadCover = async (file: File) => {
    setUploading(true);
    const path = `covers/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from("gallery-images").upload(path, file, { upsert: false });
    if (!error) {
      const { data: publicUrl } = supabase.storage.from("gallery-images").getPublicUrl(data.path);
      setForm(prev => ({ ...prev, cover_image: publicUrl.publicUrl }));
      toast({ title: "Cover image uploaded" });
    }
    setUploading(false);
  };

  const uploadPhotos = async (files: FileList) => {
    if (!editing) return;
    setUploading(true);
    for (const f of Array.from(files)) {
      const path = `albums/${editing.id}/${Date.now()}-${f.name}`;
      const { data, error } = await supabase.storage.from("gallery-images").upload(path, f, { upsert: false });
      if (!error) {
        const { data: publicUrl } = supabase.storage.from("gallery-images").getPublicUrl(data.path);
        await supabase.from("gallery_photos").insert({ album_id: editing.id, image_url: publicUrl.publicUrl, caption: null, sort_order: photos.length + 1, is_active: true });
      }
    }
    setUploading(false);
    await fetchPhotos(editing.id);
    toast({ title: "Photos uploaded" });
  };

  const updatePhoto = async (id: string, changes: Partial<Photo>) => {
    await supabase.from("gallery_photos").update(changes).eq("id", id);
    if (editing?.id) await fetchPhotos(editing.id);
  };

  const deletePhoto = async (id: string) => {
    await supabase.from("gallery_photos").delete().eq("id", id);
    if (editing?.id) await fetchPhotos(editing.id);
    toast({ title: "Photo deleted" });
  };

  const toggleAlbumActive = async (album: Album) => {
    await supabase.from("gallery_albums").update({ is_active: !album.is_active }).eq("id", album.id);
    await fetchAlbums();
    toast({ title: album.is_active ? "Album deactivated" : "Album activated" });
  };

  const toggleAlbumStatus = async (album: Album) => {
    const next = album.status === "published" ? "draft" : "published";
    const changes: Partial<Album> = { status: next };
    if (next === "published" && !album.published_at) changes.published_at = new Date().toISOString();
    await supabase.from("gallery_albums").update(changes).eq("id", album.id);
    await fetchAlbums();
    toast({ title: next === "published" ? "Album published" : "Album set to draft" });
  };

  const setCoverFromPhoto = async (imageUrl: string) => {
    if (!editing?.id) return;
    await supabase.from("gallery_albums").update({ cover_image: imageUrl }).eq("id", editing.id);
    setForm(prev => ({ ...prev, cover_image: imageUrl }));
    toast({ title: "Cover image set" });
  };

  const handleAlbumReorder = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const reordered = [...albums];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    for (let i = 0; i < reordered.length; i++) {
      await supabase.from("gallery_albums").update({ display_order: i }).eq("id", reordered[i].id);
    }
    await fetchAlbums();
    toast({ title: "Album order updated" });
  };

  const handleAlbumDragStart = (e: React.DragEvent, id: string) => {
    setDraggedAlbum(id);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleAlbumDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleAlbumDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedAlbum || draggedAlbum === targetId) return;
    const fromIndex = albums.findIndex(a => a.id === draggedAlbum);
    const toIndex = albums.findIndex(a => a.id === targetId);
    handleAlbumReorder(fromIndex, toIndex);
    setDraggedAlbum(null);
  };

  const handlePhotoReorder = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const reordered = [...photos];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    for (let i = 0; i < reordered.length; i++) {
      await supabase.from("gallery_photos").update({ sort_order: i }).eq("id", reordered[i].id);
    }
    if (editing?.id) await fetchPhotos(editing.id);
    toast({ title: "Photo order updated" });
  };
  const handlePhotoDragStart = (e: React.DragEvent, id: string) => {
    setDraggedPhoto(id);
    e.dataTransfer.effectAllowed = "move";
  };
  const handlePhotoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handlePhotoDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedPhoto || draggedPhoto === targetId) return;
    const fromIndex = photos.findIndex(p => p.id === draggedPhoto);
    const toIndex = photos.findIndex(p => p.id === targetId);
    handlePhotoReorder(fromIndex, toIndex);
    setDraggedPhoto(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gallery Albums</h1>
        <Button onClick={openCreate}>New Album</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Albums</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Display</th>
                <th>Status</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {albums.map(a => (
                <tr key={a.id} draggable onDragStart={(e) => handleAlbumDragStart(e, a.id)} onDragOver={handleAlbumDragOver} onDrop={(e) => handleAlbumDrop(e, a.id)}>
                  <td>{a.title}</td>
                  <td>{a.type}</td>
                  <td>{a.display_mode}</td>
                  <td>{a.status}</td>
                  <td>{a.is_active ? "Yes" : "No"}</td>
                  <td className="space-x-2">
                    <Button variant="outline" onClick={() => openEdit(a)}>Edit</Button>
                    <Button variant="outline" onClick={() => toggleAlbumActive(a)}>{a.is_active ? "Deactivate" : "Activate"}</Button>
                    <Button variant="outline" onClick={() => toggleAlbumStatus(a)}>{a.status === "published" ? "Unpublish" : "Publish"}</Button>
                    <Button variant="destructive" onClick={() => removeAlbum(a.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Album" : "New Album"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Input placeholder="Title" value={form.title || ""} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} />
              <Input placeholder="Slug" value={form.slug || ""} onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))} />
              <Textarea placeholder="Description" value={form.description || ""} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} />
              <Select value={form.display_mode as string} onValueChange={v => setForm(prev => ({ ...prev, display_mode: v as Album["display_mode"] }))}>
                <option value="grid">Grid</option>
                <option value="slider">Banner Slider</option>
                <option value="grid_slider">Grid + Slider</option>
              </Select>
              <Select value={(form.type as string) || "event"} onValueChange={v => setForm(prev => ({ ...prev, type: v }))}>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
              <Select value={(form.status as string) || "draft"} onValueChange={v => setForm(prev => ({ ...prev, status: v }))}>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
              <div className="flex items-center gap-2">
                <Input type="checkbox" checked={!!form.is_active} onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))} />
                <span>Active</span>
              </div>
              <Input type="number" placeholder="Display order" value={Number(form.display_order || 0)} onChange={e => setForm(prev => ({ ...prev, display_order: Number(e.target.value) }))} />
              <div className="space-y-2">
                <Input type="file" accept="image/*" onChange={e => e.target.files && uploadCover(e.target.files[0])} />
                {form.cover_image && <img src={form.cover_image} alt="Cover" className="w-full h-40 object-cover rounded" />}
              </div>
              <div className="flex gap-2">
                <Button onClick={saveAlbum} disabled={uploading}>Save</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Close</Button>
              </div>
            </div>
            <div className="space-y-3">
              {editing && (
                <>
                  <div className="font-medium">Manage Photos</div>
                  <Input type="file" multiple accept="image/*" onChange={e => e.target.files && uploadPhotos(e.target.files)} />
                  <div className="grid grid-cols-2 gap-3 max-h-[480px] overflow-auto">
                    {photos.map(p => (
                      <Card key={p.id} className={draggedPhoto === p.id ? "opacity-50" : ""} draggable onDragStart={(e) => handlePhotoDragStart(e, p.id)} onDragOver={handlePhotoDragOver} onDrop={(e) => handlePhotoDrop(e, p.id)}>
                        <CardContent className="p-2 space-y-2">
                          <img src={p.image_url} alt={p.caption || ""} className="w-full h-24 object-cover rounded" />
                          <Input placeholder="Caption" value={p.caption || ""} onChange={e => updatePhoto(p.id, { caption: e.target.value })} />
                          <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => updatePhoto(p.id, { is_active: !p.is_active })}>{p.is_active ? "Deactivate" : "Activate"}</Button>
                            <Button variant="outline" onClick={() => setCoverFromPhoto(p.image_url)}>Set Cover</Button>
                            <Button variant="destructive" onClick={() => deletePhoto(p.id)}>Delete</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryAlbumsManager;
