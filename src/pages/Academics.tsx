import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Database } from "@/integrations/supabase/types";
import { AdmissionsModal } from "@/components/admissions/AdmissionsModal";

type AcademicProgram = Database["public"]["Tables"]["academic_programs"]["Row"];

const Academics = () => {
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmissionsModalOpen, setIsAdmissionsModalOpen] = useState(false);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const { data, error } = await supabase
          .from("academic_programs")
          .select("*")
          .eq("is_active", true)
          .order("display_order");

        if (error) throw error;
        
        // Map database columns to frontend interface
        const mappedPrograms = (data || []).map(program => ({
          ...program,
          program_title: program.program_title || program.program_name,
          short_description: program.short_description || program.program_description,
          full_description: program.full_description || program.program_description,
          subjects: program.subjects || [],
          main_image: program.main_image
        }));
        
        setPrograms(mappedPrograms);
      } catch (error) {
        console.error("Error fetching academic programs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  const getMoralStudiesProgram = () => 
    programs.find(p => p.program_title?.includes("Moral Studies"));

  const getOtherPrograms = () =>
    programs.filter(p => p.program_title && !p.program_title.includes("Moral Studies"));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Academic Journey - Our Educational Programs</title>
        <meta 
          name="description" 
          content="Explore our comprehensive academic programs from Pre-School to Higher Secondary, designed to nurture students at every stage of their educational journey." 
        />
        <meta name="keywords" content="academics, education, curriculum, school programs, academic excellence" />
      </Helmet>

      <div className="min-h-screen">
        <Header onAdmissionsClick={() => setIsAdmissionsModalOpen(true)} />
        
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/src/assets/students-studying.jpg')] bg-cover bg-center opacity-10"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
                Our Academic Journey
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Discover our comprehensive educational approach that nurtures minds, builds character, 
                and prepares students for success at every stage of their academic journey.
              </p>
            </div>
          </div>
        </section>

        {/* Academic Programs Sections */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {getOtherPrograms().map((program, index) => (
              <div 
                key={program.id} 
                className={`mb-24 last:mb-0 animate-fade-in`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className={`grid lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
                }`}>
                  {/* Text Content */}
                  <div className={`${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                    <h2 className="text-4xl font-bold mb-4 text-foreground">
                      {program.program_title}
                    </h2>
                    <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary-glow mb-6"></div>
                    
                    {program.duration && (
                      <div className="mb-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                          Duration: {program.duration}
                        </span>
                      </div>
                    )}

                    <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                      {program.full_description || program.short_description}
                    </p>

                    {program.subjects && program.subjects.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-semibold mb-3 text-foreground">Core Subjects:</h3>
                        <div className="flex flex-wrap gap-2">
                          {program.subjects.map((subject, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground border"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Image */}
                  <div className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover-scale">
                      {program.main_image ? (
                        <img
                          src={program.main_image}
                          alt={program.program_title}
                          className="w-full h-80 object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <img
                        src="/src/assets/students-studying.jpg"
                        alt={program.program_title}
                        className={`w-full h-80 object-cover ${program.main_image ? 'hidden' : 'block'}`}
                        style={{ display: program.main_image ? 'none' : 'block' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Moral Studies - Special Highlighted Section */}
            {getMoralStudiesProgram() && (
              <div className="my-24">
                <div className="relative bg-gradient-to-br from-primary/5 via-background to-primary/5 rounded-3xl p-12 border border-primary/20 shadow-xl">
                  <div className="absolute top-4 right-4">
                    <span className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                      Core Value
                    </span>
                  </div>
                  
                  <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                      <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                        {getMoralStudiesProgram()?.program_title}
                      </h2>
                      <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary-glow mb-6"></div>
                      
                      <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                        {getMoralStudiesProgram()?.full_description || getMoralStudiesProgram()?.short_description}
                      </p>

                      {getMoralStudiesProgram()?.subjects && getMoralStudiesProgram()?.subjects.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3 text-foreground">Key Focus Areas:</h3>
                          <div className="flex flex-wrap gap-2">
                            {getMoralStudiesProgram()?.subjects.map((subject, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20"
                              >
                                {subject}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                        <img
                          src={getMoralStudiesProgram()?.main_image || "/src/assets/students-studying.jpg"}
                          alt={getMoralStudiesProgram()?.program_title}
                          className="w-full h-80 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/src/assets/students-studying.jpg";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <Footer />
        <AdmissionsModal 
          isOpen={isAdmissionsModalOpen} 
          onClose={() => setIsAdmissionsModalOpen(false)} 
        />
      </div>
    </>
  );
};

export default Academics;