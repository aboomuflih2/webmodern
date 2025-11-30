import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AdmissionsModal } from "@/components/admissions/AdmissionsModal";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface GalleryPhoto {
  id: string;
  image_url: string;
  title: string;
  description: string | null;
  display_order: number;
  album_id?: string | null;
}

interface GalleryAlbum {
  id: string;
  name: string;
  cover_image_url: string | null;
  description: string | null;
  view_type: "banner" | "full";
  is_active: boolean;
  display_order: number;
}

const Gallery = () => {
  const [isAdmissionsModalOpen, setIsAdmissionsModalOpen] = useState(false);
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<GalleryAlbum | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    fetchAlbumsAndPhotos();
  }, []);

  const fetchAlbumsAndPhotos = async () => {
    const { data: photoData, error: photoError } = await supabase
      .from("gallery_photos")
      .select("*")
      .order("display_order", { ascending: true });

    if (!photoError) setPhotos((photoData ?? []) as GalleryPhoto[]);

    setAlbums([
      {
        id: "all",
        name: "Photo Gallery",
        cover_image_url: (photoData && photoData[0]?.image_url) ?? null,
        description: null,
        view_type: "full",
        is_active: true,
        display_order: 0,
      },
    ]);
    setActiveAlbum({
      id: "all",
      name: "Photo Gallery",
      cover_image_url: (photoData && photoData[0]?.image_url) ?? null,
      description: null,
      view_type: "full",
      is_active: true,
      display_order: 0,
    });
  };

  const albumPhotos = (album: GalleryAlbum | null) => {
    if (!album) return [] as GalleryPhoto[];
    if (album.id === "all") return photos;
    return photos.filter(p => p.album_id === album.id);
  };

  const openPhotoModal = (index: number) => {
    setSelectedPhotoIndex(index);
    setIsPhotoModalOpen(true);
  };

  const closePhotoModal = () => {
    setIsPhotoModalOpen(false);
  };

  const nextPhoto = () => {
    const list = albumPhotos(activeAlbum);
    setSelectedPhotoIndex((prev) => (prev + 1) % Math.max(list.length, 1));
  };

  const prevPhoto = () => {
    const list = albumPhotos(activeAlbum);
    setSelectedPhotoIndex((prev) => (prev - 1 + Math.max(list.length, 1)) % Math.max(list.length, 1));
  };

  const currentList = albumPhotos(activeAlbum);
  const currentPhoto = currentList[selectedPhotoIndex];

  return (
    <>
      <Helmet>
        <title>Gallery - Photo Albums</title>
        <meta name="description" content="Browse photo albums from events and school activities." />
      </Helmet>

      <div className="min-h-screen">
        <Header onAdmissionsClick={() => setIsAdmissionsModalOpen(true)} />

        <section className="relative h-[300px] bg-gradient-to-r from-primary to-primary-foreground flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-4">Gallery</h1>
            <p className="text-xl opacity-90">Explore our albums and photos</p>
          </div>
        </section>

        <section className="py-16 px-4 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Albums</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {albums.map((album) => (
              <Card key={album.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveAlbum(album)}>
                {album.cover_image_url && (
                  <img src={album.cover_image_url} alt={album.name} className="w-full h-48 object-cover rounded-t-lg" />
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{album.name}</CardTitle>
                </CardHeader>
                {album.description && (
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3">{album.description}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </section>

        {activeAlbum && currentList.length > 0 && (
          <section className="py-10 px-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">{activeAlbum.name}</h3>
              <div className="text-sm text-muted-foreground">{currentList.length} photos</div>
            </div>

            {activeAlbum.view_type === "banner" && (
              <div className="relative mb-10">
                <div className="relative h-[450px] rounded-lg overflow-hidden">
                  <img src={currentList[selectedPhotoIndex]?.image_url} alt={currentList[selectedPhotoIndex]?.title} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <h4 className="text-white text-xl font-bold mb-2">{currentList[selectedPhotoIndex]?.title}</h4>
                    {currentList[selectedPhotoIndex]?.description && <p className="text-white/90">{currentList[selectedPhotoIndex]?.description}</p>}
                  </div>
                </div>
                <Button variant="outline" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white" onClick={prevPhoto}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white" onClick={nextPhoto}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="flex justify-center mt-4 gap-2">
                  {currentList.map((_, idx) => (
                    <button key={idx} className={`w-3 h-3 rounded-full transition-colors ${idx === selectedPhotoIndex ? "bg-primary" : "bg-muted"}`} onClick={() => setSelectedPhotoIndex(idx)} />
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentList.map((photo, index) => (
                <Card key={photo.id} className="cursor-pointer hover:shadow-lg transition-shadow duration-300 group" onClick={() => openPhotoModal(index)}>
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img src={photo.image_url} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg font-semibold mb-2 line-clamp-2">{photo.title}</CardTitle>
                    {photo.description && <p className="text-muted-foreground text-sm line-clamp-3">{photo.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
          <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
            <DialogHeader>
              <DialogTitle className="sr-only">Photo</DialogTitle>
            </DialogHeader>
            {currentPhoto && (
              <div className="relative">
                <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white" onClick={closePhotoModal}>
                  <X className="w-4 h-4" />
                </Button>
                <div className="relative">
                  <img src={currentPhoto.image_url} alt={currentPhoto.title} className="w-full h-auto max-h-[70vh] object-contain" />
                </div>
                <div className="p-6 bg-white">
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">{currentPhoto.title}</h3>
                  {currentPhoto.description && <p className="text-gray-700 leading-relaxed text-base">{currentPhoto.description}</p>}
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

export default Gallery;
