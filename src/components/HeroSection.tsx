import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-school-building.jpg";
import studentsImage from "@/assets/students-studying.jpg";

import type { Database } from "@/integrations/supabase/types";
type DBHeroSlide = Database["public"]["Tables"]["hero_slides"]["Row"];

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<DBHeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      
      setSlides(data || []);
    } catch (error) {
      console.error('Error loading slides:', error);
      // Fallback to default slides
      setSlides([
        {
          id: '1',
          title: "Excellence in Education",
          subtitle: "Shaping Future Leaders at Modern Higher Secondary School, Pottur",
          image_url: null,
          button_text: "Explore Academics",
          button_url: "/academics",
          order_index: 1,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: "Admissions Open 2024-25",
          subtitle: "Join Kerala's Premier Educational Institution - DHSE Code: 11181",
          image_url: null,
          button_text: "Apply Now",
          button_url: "/admissions",
          order_index: 2,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getSlideImage = (slide: DBHeroSlide, index: number) => {
    if (slide.image_url) {
      return slide.image_url;
    }
    // Fallback to default images
    return index % 2 === 0 ? heroImage : studentsImage;
  };

  // Auto-play functionality
  useEffect(() => {
    if (slides.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);

      return () => clearInterval(timer);
    }
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (loading) {
    return (
      <section className="relative h-[70vh] lg:h-[80vh] overflow-hidden bg-muted flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className="relative h-[70vh] lg:h-[80vh] overflow-hidden bg-muted flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">Welcome to Modern Higher Secondary School</h1>
          <p className="text-xl text-muted-foreground">Excellence in Education</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[70vh] lg:h-[80vh] overflow-hidden">
      {/* Slides Container */}
      <div className="relative h-full w-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
              <img
                src={getSlideImage(slide, index)}
                alt={slide.title}
                className="w-full h-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-gradient-hero"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex items-center">
              <div className="container mx-auto px-4">
                <div className="max-w-3xl">
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 leading-tight">
                    {slide.title}
                  </h1>
                  <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-8 leading-relaxed">
                    {slide.subtitle}
                  </p>
                  <Button
                    size="lg"
                    className="bg-accent hover:bg-accent-light text-accent-foreground font-semibold px-8 py-4 text-lg shadow-glow transition-smooth"
                  >
                    {slide.button_text}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-20"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-20"
        onClick={nextSlide}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-smooth ${
              index === currentSlide ? "bg-accent" : "bg-white/40"
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
