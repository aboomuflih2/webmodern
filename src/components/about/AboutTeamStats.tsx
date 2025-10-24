import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { GraduationCap, Shield, Briefcase, Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StaffCounts {
  teaching_staff: number;
  security_staff: number;
  professional_staff: number;
  guides_staff: number;
}

const AboutTeamStats = () => {
  const [counts, setCounts] = useState<StaffCounts>({
    teaching_staff: 0,
    security_staff: 0,
    professional_staff: 0,
    guides_staff: 0,
  });
  const [displayCounts, setDisplayCounts] = useState<StaffCounts>({
    teaching_staff: 0,
    security_staff: 0,
    professional_staff: 0,
    guides_staff: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    loadStaffCounts();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          animateCounts();
        }
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [counts, isVisible]);

  const loadStaffCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_counts')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setCounts(data);
      }
    } catch (error) {
      console.error('Error loading staff counts:', error);
      // Fallback counts
      setCounts({
        teaching_staff: 25,
        security_staff: 8,
        professional_staff: 12,
        guides_staff: 6,
      });
    } finally {
      setLoading(false);
    }
  };

  const animateCounts = () => {
    const duration = 2000; // 2 seconds
    const steps = 60; // 60 steps for smooth animation
    const interval = duration / steps;

    const stepValues = {
      teaching_staff: counts.teaching_staff / steps,
      security_staff: counts.security_staff / steps,
      professional_staff: counts.professional_staff / steps,
      guides_staff: counts.guides_staff / steps,
    };

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      
      setDisplayCounts({
        teaching_staff: Math.min(Math.round(stepValues.teaching_staff * currentStep), counts.teaching_staff),
        security_staff: Math.min(Math.round(stepValues.security_staff * currentStep), counts.security_staff),
        professional_staff: Math.min(Math.round(stepValues.professional_staff * currentStep), counts.professional_staff),
        guides_staff: Math.min(Math.round(stepValues.guides_staff * currentStep), counts.guides_staff),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayCounts(counts); // Ensure final values are exact
      }
    }, interval);
  };

  const stats = [
    {
      icon: GraduationCap,
      count: displayCounts.teaching_staff,
      label: "Teaching Staff",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Shield,
      count: displayCounts.security_staff,
      label: "Security Staff",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: Briefcase,
      count: displayCounts.professional_staff,
      label: "Professional Staff",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Compass,
      count: displayCounts.guides_staff,
      label: "Guides",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  if (loading) {
    return (
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold text-primary mb-4">
            Our Dedicated Team
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Our committed staff members work together to create an exceptional learning environment
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-6 text-center shadow-card hover:shadow-elegant transition-smooth bg-card">
                <div className={`inline-flex items-center justify-center w-16 h-16 ${stat.bgColor} rounded-full mb-4`}>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="text-4xl font-bold text-primary mb-2">
                  {stat.count}+
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AboutTeamStats;