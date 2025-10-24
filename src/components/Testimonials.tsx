import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  quote: string;
  rating: number;
  person_name: string;
  relation: string;
}

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load testimonials from database
  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('is_active', true)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) {
          console.error('Error loading testimonials:', error);
          return;
        }

        setTestimonials(data || []);
      } catch (error) {
        console.error('Error loading testimonials:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTestimonials();
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    if (testimonials.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [testimonials.length]);

  const nextTestimonial = () => {
    if (testimonials.length === 0) return;
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    if (testimonials.length === 0) return;
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? "fill-accent text-accent" : "fill-muted text-muted"
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-primary mb-4">
              What Our Community Says
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hear from our students, parents, and alumni about their experiences at Modern Higher Secondary School, Pottur.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 lg:p-12 animate-pulse">
              <div className="h-6 bg-muted rounded mb-4"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded mb-8"></div>
              <div className="h-4 bg-muted rounded mx-auto w-1/3"></div>
            </Card>
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return (
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-primary mb-4">
              What Our Community Says
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hear from our students, parents, and alumni about their experiences at Modern Higher Secondary School, Pottur.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 lg:p-12 text-center">
              <p className="text-muted-foreground">No testimonials available at this time.</p>
            </Card>
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
            What Our Community Says
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hear from our students, parents, and alumni about their experiences at Modern Higher Secondary School, Pottur.
          </p>
        </div>

        {/* Main Testimonial Display */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="relative overflow-hidden shadow-elegant bg-gradient-subtle p-8 lg:p-12">
            {/* Quote Icon */}
            <div className="absolute top-6 right-6 text-primary/20">
              <Quote className="h-16 w-16" />
            </div>

            {/* Testimonial Content */}
            <div className="relative z-10">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className={`transition-opacity duration-500 ${
                    index === currentTestimonial ? "opacity-100" : "opacity-0 absolute inset-0"
                  }`}
                >
                  {/* Stars */}
                  <div className="flex justify-center mb-6">
                    <div className="flex gap-1">
                      {renderStars(testimonial.rating)}
                    </div>
                  </div>

                  {/* Quote */}
                  <blockquote className="text-lg lg:text-xl leading-relaxed text-center text-foreground mb-8 italic">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Person Info */}
                  <div className="flex flex-col items-center gap-4">
                    {/* Avatar Placeholder */}
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold text-lg">
                        {testimonial.person_name.charAt(0)}
                      </span>
                    </div>

                    {/* Name and Relation */}
                    <div className="text-center">
                      <h4 className="font-semibold text-primary text-lg">
                        {testimonial.person_name}
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        {testimonial.relation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary hover:bg-primary/10"
              onClick={prevTestimonial}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-primary hover:bg-primary/10"
              onClick={nextTestimonial}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </Card>

          {/* Testimonial Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-smooth ${
                  index === currentTestimonial ? "bg-primary w-8" : "bg-primary/30"
                }`}
                onClick={() => setCurrentTestimonial(index)}
              />
            ))}
          </div>
        </div>

        {/* Additional Testimonials Preview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <Card key={testimonial.id} className="p-6 bg-card hover:shadow-card transition-smooth">
              <div className="flex gap-1 mb-3">
                {renderStars(testimonial.rating)}
              </div>
              <p className="text-sm text-foreground mb-4 line-clamp-3">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold text-xs">
                    {testimonial.person_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm text-primary">
                    {testimonial.person_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.relation}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* View All Testimonials */}
        <div className="text-center">
          <Button 
            variant="outline" 
            size="lg"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold"
          >
            View All Testimonials
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;