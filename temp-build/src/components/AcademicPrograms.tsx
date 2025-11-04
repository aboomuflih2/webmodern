import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, Users, Award, Target, Lightbulb, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type AcademicProgram = Database["public"]["Tables"]["academic_programs"]["Row"];

const AcademicPrograms = () => {
  const [selectedProgram, setSelectedProgram] = useState<AcademicProgram | null>(null);
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [loading, setLoading] = useState(true);

  // Icon mapping for each program type
  const getIcon = (title: string) => {
    if (title.includes("Pre-School")) return BookOpen;
    if (title.includes("Primary")) return Users;
    if (title.includes("Upper Primary")) return Target;
    if (title.includes("Moral Studies")) return Lightbulb;
    if (title.includes("High School")) return Award;
    if (title.includes("Higher Secondary")) return GraduationCap;
    return BookOpen;
  };

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const { data, error } = await supabase
          .from("academic_programs")
          .select("*")
          .eq("is_active", true)
          .order("display_order");

        if (error) throw error;
        
        setPrograms(data || []);
      } catch (error) {
        console.error("Error fetching academic programs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Academic Programs</h2>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold text-primary mb-4">
            Academic Programs
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our comprehensive academic journey from Pre-School to Higher Secondary, 
            designed to nurture minds and build character at every stage.
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program) => {
            const IconComponent = getIcon(program.program_title);
            return (
              <div
                key={program.id}
                className="bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border hover:border-primary/20 group cursor-pointer"
                onClick={() => setSelectedProgram(program)}
              >
                {/* Program Image */}
                <div className="relative h-48 overflow-hidden">
                  {program.main_image ? (
                    <img
                      src={program.main_image}
                      alt={program.program_title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                        (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`${program.main_image ? 'hidden' : 'flex'} absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 items-center justify-center`}>
                    <IconComponent className="w-16 h-16 text-primary" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                
                {/* Card Content */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                    {program.program_title}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {program.short_description}
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProgram(program);
                    }}
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link to="/academics">
            <Button size="lg" className="px-8 py-3">
              Explore Our Complete Academic Journey
            </Button>
          </Link>
        </div>

        {/* Program Details Modal */}
        <Dialog open={!!selectedProgram} onOpenChange={() => setSelectedProgram(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {selectedProgram?.program_title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Program Image */}
              {selectedProgram?.main_image && (
                <div className="relative h-64 rounded-lg overflow-hidden">
                  <img
                    src={selectedProgram.main_image}
                    alt={selectedProgram.program_title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              )}
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                  {selectedProgram && (
                    (() => {
                      const IconComponent = getIcon(selectedProgram.program_title);
                      return <IconComponent className="w-6 h-6 text-primary" />;
                    })()
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">{selectedProgram?.duration}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Program Overview</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedProgram?.short_description}
                </p>
              </div>

              {selectedProgram?.subjects && selectedProgram.subjects.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Core Subjects</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProgram.subjects.map((subject, index) => (
                      <div
                        key={index}
                        className="bg-muted px-3 py-2 rounded-lg text-sm"
                      >
                        {subject}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedProgram(null)}>
                  Close
                </Button>
                <Link to="/academics">
                  <Button>
                    View Full Details
                  </Button>
                </Link>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default AcademicPrograms;
