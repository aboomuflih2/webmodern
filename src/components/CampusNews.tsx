import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, User, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface NewsPost {
  id: string;
  title: string;
  excerpt: string;
  featured_image: string | null;
  created_at: string;
  slug?: string;
}

const CampusNews = () => {
  const [newsItems, setNewsItems] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchLatestNews = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('news_posts')
        .select('id, title, excerpt, featured_image, created_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (fetchError) {
        console.error('Error fetching news:', fetchError);
        setError('Failed to load news articles');
        return;
      }

      setNewsItems(data || []);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestNews();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleReadMore = (news: NewsPost) => {
    // Generate slug from title if not available
    const slug = news.slug || news.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || news.id;
    navigate(`/news-events#${slug}`);
  };

  const handleViewAllNews = () => {
    navigate('/news-events');
  };

  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold text-primary mb-4">
            Campus News & Updates
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay updated with the latest happenings, achievements, and events at Modern Higher Secondary School, Pottur.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video" />
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-4 mb-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent className="pt-0">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchLatestNews} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && newsItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No news articles published yet.</p>
            <Button onClick={handleViewAllNews} variant="outline">
              Visit News Page
            </Button>
          </div>
        )}

        {/* News Grid */}
        {!loading && !error && newsItems.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {newsItems.map((news) => (
                <Card key={news.id} className="overflow-hidden hover:shadow-elegant transition-smooth group bg-card">
                  {/* News Image */}
                  <div className="aspect-video bg-gradient-subtle relative overflow-hidden">
                    {news.featured_image ? (
                      <img 
                        src={news.featured_image} 
                        alt={news.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">News Image</span>
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-3">
                    {/* Date and Author */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(news.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Admin</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-heading font-semibold text-primary line-clamp-2 group-hover:text-primary-light transition-colors">
                      {news.title}
                    </h3>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Excerpt */}
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                      {news.excerpt}
                    </p>

                    {/* Read More Link */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleReadMore(news)}
                      className="text-primary hover:text-primary-light p-0 h-auto font-medium group/btn"
                    >
                      Read More
                      <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* View All News Button */}
            <div className="text-center">
              <Button 
                size="lg"
                onClick={handleViewAllNews}
                className="bg-primary hover:bg-primary-light text-primary-foreground font-semibold shadow-elegant"
              >
                View All News & Events
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default CampusNews;
