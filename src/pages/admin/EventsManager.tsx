import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Pencil, Trash2, Plus, Calendar, Clock } from "lucide-react";
import { format, isAfter } from "date-fns";
import { PhotoUpload } from "@/components/PhotoUpload";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location?: string;
  is_featured: boolean;
  is_published: boolean;
  image_url?: string;
  created_at: string;
}

const EventsManager = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    image_url: "",
    is_featured: false,
    is_published: true,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) {
      console.error("Error fetching events:", error);
      toast({ title: "Error fetching events", variant: "destructive" });
      return;
    }

    setEvents(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.event_date) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (!user?.id) {
      toast({ title: "You must be logged in to create events", variant: "destructive" });
      return;
    }

    let error;

    if (editingEvent) {
      ({ error } = await supabase
        .from("events")
        .update(formData)
        .eq("id", editingEvent.id));
    } else {
      ({ error } = await supabase
        .from("events")
        .insert(formData));
    }

    if (error) {
      console.error("Error saving event:", error);
      toast({ title: "Error saving event", variant: "destructive" });
      return;
    }

    toast({ title: `Event ${editingEvent ? 'updated' : 'created'} successfully!` });
    setIsDialogOpen(false);
    resetForm();
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting event:", error);
      toast({ title: "Error deleting event", variant: "destructive" });
      return;
    }

    toast({ title: "Event deleted successfully!" });
    fetchEvents();
  };

  const togglePublishedStatus = async (event: Event) => {
    const { error } = await supabase
      .from("events")
      .update({ is_published: !event.is_published })
      .eq("id", event.id);

    if (error) {
      console.error("Error updating event status:", error);
      toast({ title: "Error updating event status", variant: "destructive" });
      return;
    }

    toast({ title: `Event ${!event.is_published ? 'published' : 'unpublished'}!` });
    fetchEvents();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      event_date: "",
      location: "",
      image_url: "",
      is_featured: false,
      is_published: true,
    });
    setEditingEvent(null);
  };

  const openEditDialog = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        description: event.description,
        event_date: format(new Date(event.event_date), "yyyy-MM-dd'T'HH:mm"),
        location: event.location || "",
        image_url: event.image_url || "",
        is_featured: event.is_featured,
        is_published: event.is_published,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const upcomingEvents = events.filter(event => 
    event.is_published && isAfter(new Date(event.event_date), new Date())
  );
  const pastEvents = events.filter(event => 
    event.is_published && !isAfter(new Date(event.event_date), new Date())
  );
  const unpublishedEvents = events.filter(event => !event.is_published);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Events Manager</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openEditDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? "Edit Event" : "Add New Event"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Event Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Event title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Event Date & Time *</label>
                <Input
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Event location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Event Image</label>
                <PhotoUpload
                  currentPhotoUrl={formData.image_url}
                  onPhotoChange={(photoUrl) => setFormData(prev => ({ ...prev, image_url: photoUrl || "" }))}
                  bucket="event-photos"
                  folder="events"
                  maxSizeInMB={5}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                />
                <label htmlFor="featured" className="text-sm font-medium">
                  Featured Event
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Event description"
                  rows={4}
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                />
                <label htmlFor="published" className="text-sm font-medium">
                  Published (visible on website)
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEvent ? "Update" : "Create"} Event
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upcoming Events */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Events ({upcomingEvents.length})
          </h2>
          
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(event.event_date), "MMM dd, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(event.event_date), "h:mm a")}
                        </span>
                      </div>
                      {event.is_featured && <Badge variant="secondary">Featured</Badge>}
                      {event.location && (
                        <p className="text-sm text-muted-foreground mt-1">
                          📍 {event.location}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(event)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </CardContent>
              </Card>
            ))}

            {upcomingEvents.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No upcoming events.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Past Events */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Past Events ({pastEvents.length})
          </h2>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {pastEvents.slice(0, 20).map((event) => (
              <Card key={event.id} className="opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(event.event_date), "MMM dd, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(event.event_date), "h:mm a")}
                        </span>
                      </div>
                      {event.is_featured && <Badge variant="outline">Featured</Badge>}
                      {event.location && (
                        <p className="text-sm text-muted-foreground mt-1">
                          📍 {event.location}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(event)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                </CardContent>
              </Card>
            ))}

            {pastEvents.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No past events.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Unpublished Events */}
      {unpublishedEvents.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Unpublished Events ({unpublishedEvents.length})
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unpublishedEvents.map((event) => (
              <Card key={event.id} className="opacity-50 border-dashed">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{event.title}</CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(event.event_date), "MMM dd, yyyy")}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePublishedStatus(event)}
                        title="Publish event"
                      >
                        Publish
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
        <p><strong>Smart Auto-Sorting:</strong> Events are automatically categorized as "Upcoming" or "Past" based on their date and time. You can deactivate events to hide them from the website while keeping them in your records.</p>
      </div>
    </div>
  );
};

export default EventsManager;