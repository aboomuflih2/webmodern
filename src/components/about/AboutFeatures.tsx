import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { 
  GraduationCap, 
  Building2, 
  Users, 
  Eye, 
  Trophy, 
  Shield,
  BookOpen,
  Heart,
  Lightbulb,
  Target,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SchoolFeature {
  id: string;
  feature_title: string;
  feature_description: string;
  icon_name: string;
  display_order: number;
}

const AboutFeatures = () => {
  const [features, setFeatures] = useState<SchoolFeature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('school_features')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      if (data) {
        setFeatures(data);
      }
    } catch (error) {
      console.error('Error loading school features:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const iconMap: Record<string, LucideIcon> = {
      GraduationCap,
      Building2,
      Users,
      Eye,
      Trophy,
      Shield,
      BookOpen,
      Heart,
      Lightbulb,
      Target,
    };
    
    return iconMap[iconName] || GraduationCap;
  };

  if (loading) {
    return (
      <section className="py-16 lg:py-24 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (features.length === 0) {
    return null;
  }

  return (
    <section className="py-16 lg:py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold text-primary mb-4">
            Why Choose Us?
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Discover what makes Modern Higher Secondary School, Pottur the right choice for your child's future
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature) => {
            const Icon = getIcon(feature.icon_name);
            return (
              <Card key={feature.id} className="p-6 shadow-card hover:shadow-elegant transition-smooth bg-card group">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-heading font-bold text-primary mb-2">
                    {feature.feature_title}
                  </h3>
                </div>
                <p className="text-foreground/80 leading-relaxed text-center">
                  {feature.feature_description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AboutFeatures;
