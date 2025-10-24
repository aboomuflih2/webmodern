import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AboutLegacySection = () => {
  const [legacyContent, setLegacyContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLegacyContent();
  }, []);

  const loadLegacyContent = async () => {
    try {
      const { data, error } = await supabase
        .from('page_content')
        .select('content')
        .eq('page_key', 'about_legacy')
        .single();

      if (error) throw error;
      
      if (data) {
        setLegacyContent(data.content);
      }
    } catch (error) {
      console.error('Error loading legacy content:', error);
      // Fallback content
      setLegacyContent(`Modern Higher Secondary School, Pottur, stands as a beacon of quality education in Malappuram district. 
        Established under the Crescent Educational Trust, our institution has been nurturing young minds and shaping future leaders 
        for over two decades. Our journey began with a vision to provide comprehensive education that blends academic excellence 
        with moral values, preparing our students for the challenges of tomorrow.`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-4 bg-muted rounded w-4/6"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold text-primary mb-8">
            Our Legacy
          </h2>
          <div className="prose prose-lg mx-auto text-foreground/80 leading-relaxed">
            {legacyContent.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-6">
                {paragraph.trim()}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutLegacySection;