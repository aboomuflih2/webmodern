import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AdmissionsModal } from "@/components/admissions/AdmissionsModal";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Album {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  display_mode: "grid" | "slider" | "grid_slider";
  type: string | null;
  published_at: string | null;
  is_active: boolean;
  display_order: number;
}

interface PhotoCountMap {
  [albumId: string]: number;
}

const PAGE_SIZE = 12;

const GalleryIndex = () => {
  const [isAdmissionsModalOpen, setIsAdmissionsModalOpen] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photoCounts, setPhotoCounts] = useState<PhotoCountMap>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchAlbums(1);
  }, []);

  const fetchAlbums = async (pageNum: number) => {
    const from = (pageNum - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = await supabase
      .from("gallery_albums")
      .select("*")
      .eq("is_active", true)
      .eq("status", "published")
      .order("display_order", { ascending: true })
      .range(from, to);

    const list = (data ?? []) as Album[];
    setAlbums(prev => (pageNum === 1 ? list : [...prev, ...list]));
    setPage(pageNum);
    setHasMore(list.length === PAGE_SIZE);

    if (list.length > 0) {
      const ids = list.map(a => a.id);
      const { data: photos } = await supabase
        .from("gallery_photos")
        .select("album_id")
        .in("album_id", ids)
        .eq("is_active", true);
      const counts: PhotoCountMap = {};
      ((photos ?? []) as Array<{ album_id: string | null }>).forEach((p) => {
        const id = p.album_id;
        if (id) counts[id] = (counts[id] ?? 0) + 1;
      });
      setPhotoCounts(counts);
    }
  };

  const loadMore = () => fetchAlbums(page + 1);

  const empty = useMemo(() => albums.length === 0, [albums]);

  return (
    <>
      <Helmet>
        <title>Gallery</title>
        <meta name="description" content="Explore albums from events and campus life." />
      </Helmet>
      <div className="min-h-screen">
        <Header onAdmissionsClick={() => setIsAdmissionsModalOpen(true)} />

        <section className="relative h-[300px] bg-gradient-to-r from-primary to-primary-foreground flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-4">Gallery</h1>
            <p className="text-xl opacity-90">Albums and event photos</p>
          </div>
        </section>

        <section className="py-16 px-4 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Albums</h2>

          {empty ? (
            <p className="text-center text-muted-foreground">No albums published yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {albums.map(album => (
                  <Link key={album.id} to={`/gallery/${album.slug}`}>
                    <Card className="hover:shadow-lg transition-shadow">
                      {album.cover_image && (
                        <img src={album.cover_image} alt={album.title} loading="lazy" className="w-full h-48 object-cover rounded-t-lg" />
                      )}
                      <CardHeader>
                        <CardTitle className="line-clamp-2">{album.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {album.description && <p className="text-muted-foreground line-clamp-3 mb-2">{album.description}</p>}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{album.type || "Album"}</span>
                          <span>{photoCounts[album.id] ? `${photoCounts[album.id]} photos` : ""}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-8">
                  <Button onClick={loadMore}>Load More</Button>
                </div>
              )}
            </>
          )}
        </section>

        <Footer />
        <AdmissionsModal isOpen={isAdmissionsModalOpen} onClose={() => setIsAdmissionsModalOpen(false)} />
      </div>
    </>
  );
};

export default GalleryIndex;
