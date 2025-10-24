import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { icons, type LucideIcon } from "lucide-react";

interface SchoolStat {
  id: string;
  label: string;
  value: number;
  suffix: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
}

const LegacySection = () => {
  const [stats, setStats] = useState<SchoolStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('school_stats')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Fallback to default stats if database fails
      setStats([
        { id: '1', label: 'Students Enrolled', value: 500, suffix: '+', icon_name: 'Users', display_order: 1, is_active: true },
        { id: '2', label: 'Years of Excellence', value: 25, suffix: '+', icon_name: 'Award', display_order: 2, is_active: true },
        { id: '3', label: 'Pass Rate', value: 100, suffix: '%', icon_name: 'BookOpen', display_order: 3, is_active: true },
        { id: '4', label: 'Academic Awards', value: 50, suffix: '+', icon_name: 'Trophy', display_order: 4, is_active: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 lg:py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div>
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-primary mb-6">
              A Legacy of Educational Excellence
            </h2>
            <div className="space-y-4 text-foreground/80 text-lg leading-relaxed">
              <p>
                Modern Higher Secondary School, Pottur, stands as a beacon of quality education in Malappuram district. 
                Established under the Crescent Educational Trust, our institution has been nurturing young minds and 
                shaping future leaders for over two decades.
              </p>
              <p>
                Affiliated with the Kerala State Board (DHSE Code: 11181), we are committed to providing comprehensive 
                education that blends academic excellence with moral values, preparing our students for the challenges 
                of tomorrow.
              </p>
              <p>
                Located in the serene environment of Mudur P.O., Vattamkulam Via, our campus provides an ideal setting 
                for learning, growth, and character development.
              </p>
            </div>
            
            <div className="mt-8">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary-light text-primary-foreground font-semibold shadow-elegant"
              >
                Learn More About Us
              </Button>
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-2 gap-6">
            {loading ? (
              // Loading skeleton
              [...Array(4)].map((_, index) => (
                <Card key={index} className="p-6 text-center shadow-card bg-card animate-pulse">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-muted rounded-full mb-4">
                    <div className="w-6 h-6 bg-muted-foreground/20 rounded"></div>
                  </div>
                  <div className="h-8 bg-muted-foreground/20 rounded mb-2 mx-auto w-20"></div>
                  <div className="h-4 bg-muted-foreground/20 rounded mx-auto w-24"></div>
                </Card>
              ))
            ) : (
              stats.map((stat) => {
                const IconComponent = (icons as Record<string, LucideIcon>)[stat.icon_name] || icons.Trophy;
                return (
                  <Card key={stat.id} className="p-6 text-center shadow-card hover:shadow-elegant transition-smooth bg-card">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-primary mb-2">
                      {stat.value}{stat.suffix}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LegacySection;
