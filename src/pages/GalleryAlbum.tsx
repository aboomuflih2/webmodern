import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AdmissionsModal } from "@/components/admissions/AdmissionsModal";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Album {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  display_mode: "grid" | "slider" | "grid_slider";
  type: string | null;
  related_event_id: string | null;
  published_at: string | null;
}

interface Photo {
  id: string;
  album_id: string | null;
  image_url: string;
  caption: string | null;
  sort_order: number;
  is_active: boolean;
}

const GalleryAlbum = () => {
  const { albumSlug } = useParams();
  const [isAdmissionsModalOpen, setIsAdmissionsModalOpen] = useState(false);
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!albumSlug) return;
    fetchAlbum(albumSlug);
  }, [albumSlug]);

  useEffect(() => {
    if (!album) return;
    fetchPhotos(album.id);
  }, [album]);

  useEffect(() => {
    let timer: number | null = null;
    if (album?.display_mode !== "slider") return;
    if (autoplay && photos.length > 0) {
      timer = window.setInterval(() => setCurrentIndex(i => (i + 1) % photos.length), 4000);
    }
    return () => {
      if (timer !== null) window.clearInterval(timer);
    };
  }, [autoplay, album, photos]);

  const fetchAlbum = async (slug: string) => {
    const { data } = await supabase
      .from("gallery_albums")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .eq("is_active", true)
      .limit(1)
      .single();
    if (data) setAlbum(data as Album);
  };

  const fetchPhotos = async (albumId: string) => {
    const { data } = await supabase
      .from("gallery_photos")
      .select("*")
      .eq("album_id", albumId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("display_order", { ascending: true });
    setPhotos((data ?? []) as Photo[]);
  };

  const openModal = (index: number) => {
    setCurrentIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const next = () => setCurrentIndex(i => (i + 1) % Math.max(photos.length, 1));
  const prev = () => setCurrentIndex(i => (i - 1 + Math.max(photos.length, 1)) % Math.max(photos.length, 1));

  const currentPhoto = useMemo(() => photos[currentIndex], [photos, currentIndex]);

  return (
    <>
      <Helmet>
        <title>{album ? album.title : "Album"}</title>
        <meta name="description" content={album?.description || "Album photos"} />
      </Helmet>
      <div className="min-h-screen">
        <Header onAdmissionsClick={() => setIsAdmissionsModalOpen(true)} />

        <section className="py-8 px-4 max-w-7xl mx-auto">
          <div className="mb-6">
            <Link to="/gallery" className="text-sm text-muted-foreground">← Back to Gallery</Link>
          </div>
          {album && (
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">{album.title}</h1>
              {album.description && <p className="text-muted-foreground mb-2">{album.description}</p>}
              {album.published_at && <p className="text-sm text-muted-foreground">Published {new Date(album.published_at).toLocaleDateString()}</p>}
            </div>
          )}

          {album?.display_mode === "slider" && photos.length > 0 && (
            <div className="relative mb-10">
              <div className="relative h-[450px] rounded-lg overflow-hidden">
                <img src={photos[currentIndex]?.image_url} alt={photos[currentIndex]?.caption || album?.title || ""} className="w-full h-full object-cover" />
                {photos[currentIndex]?.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                    <div className="text-xl font-bold">{photos[currentIndex]?.caption}</div>
                  </div>
                )}
              </div>
              <Button variant="outline" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white" onClick={prev}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white" onClick={next}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <div className="flex justify-center mt-4 gap-2">
                {photos.map((_, idx) => (
                  <button key={idx} className={`w-3 h-3 rounded-full transition-colors ${idx === currentIndex ? "bg-primary" : "bg-muted"}`} onClick={() => setCurrentIndex(idx)} />
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4">
                <Button variant="outline" onClick={() => setAutoplay(a => !a)}>{autoplay ? "Pause" : "Play"}</Button>
              </div>
            </div>
          )}

          {(album?.display_mode === "grid" || album?.display_mode === "grid_slider") && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {photos.map((p, i) => (
                <Card key={p.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => openModal(i)}>
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img src={p.image_url} alt={p.caption || album?.title || ""} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="p-4">
                    {p.caption && <CardTitle className="text-base line-clamp-2">{p.caption}</CardTitle>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
            <DialogHeader>
              <DialogTitle className="sr-only">Photo Viewer</DialogTitle>
            </DialogHeader>
            {currentPhoto && (
              <div>
                <div className="relative">
                  <img src={currentPhoto.image_url} alt={currentPhoto.caption || album?.title || ""} className="w-full h-auto max-h-[70vh] object-contain" />
                </div>
                <div className="p-6 bg-white">
                  {currentPhoto.caption && <div className="text-gray-900 font-bold mb-2">{currentPhoto.caption}</div>}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={prev}>Prev</Button>
                    <Button variant="outline" onClick={next}>Next</Button>
                    <Button onClick={() => setIsModalOpen(false)}>Close</Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Footer />
        <AdmissionsModal isOpen={isAdmissionsModalOpen} onClose={() => setIsAdmissionsModalOpen(false)} />
      </div>
    </>
  );
};

export default GalleryAlbum;
