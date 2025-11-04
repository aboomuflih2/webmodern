import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Target, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ContentData {
  mission: string;
  vision: string;
}

const AboutMissionVision = () => {
  const [content, setContent] = useState<ContentData>({ mission: "", vision: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from('page_content')
        .select('page_key, content')
        .in('page_key', ['about_mission', 'about_vision']);

      if (error) throw error;

      if (data) {
        const contentMap = data.reduce((acc, item) => {
          if (item.page_key === 'about_mission') {
            acc.mission = item.content;
          } else if (item.page_key === 'about_vision') {
            acc.vision = item.content;
          }
          return acc;
        }, { mission: "", vision: "" });

        setContent(contentMap);
      }
    } catch (error) {
      console.error('Error loading mission/vision content:', error);
      // Fallback content
      setContent({
        mission: `To provide quality education that empowers students with knowledge, skills, and values necessary for their personal growth and success in life. We are committed to fostering a learning environment that encourages critical thinking, creativity, and character development while maintaining the highest standards of academic excellence.`,
        vision: `To be recognized as a leading educational institution that produces confident, competent, and compassionate individuals who contribute positively to society. We envision a future where our students become lifelong learners and responsible citizens who make meaningful contributions to their communities and the world at large.`
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Mission */}
          <Card className="p-8 shadow-card hover:shadow-elegant transition-smooth bg-card">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-primary">
                Our Mission
              </h3>
            </div>
            <p className="text-foreground/80 leading-relaxed text-center">
              {content.mission}
            </p>
          </Card>

          {/* Vision */}
          <Card className="p-8 shadow-card hover:shadow-elegant transition-smooth bg-card">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Eye className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-primary">
                Our Vision
              </h3>
            </div>
            <p className="text-foreground/80 leading-relaxed text-center">
              {content.vision}
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AboutMissionVision;