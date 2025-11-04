import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Testimonial {
  id: string;
  person_name: string;
  relation: string;
  quote: string;
  rating: number;
  photo?: string;
}

const AboutTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    relation: "",
    comment: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('is_active', true)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setTestimonials(data);
      }
    } catch (error) {
      console.error('Error loading testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.relation || !formData.comment.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('testimonials')
        .insert([
          {
            person_name: formData.name.trim(),
            relation: formData.relation,
            quote: formData.comment.trim(),
            rating: 5,
            status: 'pending',
            is_active: true,
            display_order: 0,
          }
        ]);

      if (error) throw error;

      toast({
        title: "Thank You!",
        description: "Your testimonial has been submitted and is pending review.",
      });

      setFormData({ name: "", relation: "", comment: "" });
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your testimonial. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold text-primary mb-4">
            What People Say About Us
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Hear from our community of students, parents, and alumni about their experience with our school
          </p>
        </div>

        {/* Testimonials Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : testimonials.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="p-6 shadow-card hover:shadow-elegant transition-smooth bg-card">
                <div className="flex items-center mb-4">
                  <Avatar className="w-12 h-12 mr-4">
                    <AvatarImage src={testimonial.photo} alt={testimonial.person_name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(testimonial.person_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-primary">{testimonial.person_name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.relation}</p>
                    <div className="flex mt-1">
                      {renderStars(testimonial.rating)}
                    </div>
                  </div>
                </div>
                <blockquote className="text-foreground/80 leading-relaxed italic">
                  "{testimonial.quote}"
                </blockquote>
              </Card>
            ))}
          </div>
        ) : null}

        {/* Testimonial Submission Form */}
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 shadow-card bg-card">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-heading font-bold text-primary mb-2">
                Share Your Experience
              </h3>
              <p className="text-foreground/70">
                We'd love to hear about your experience with our school
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relation">Your Relation</Label>
                  <Select 
                    value={formData.relation} 
                    onValueChange={(value) => setFormData({ ...formData, relation: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your relation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Alumni">Alumni</SelectItem>
                      <SelectItem value="Faculty">Faculty</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Your Testimonial</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="Share your experience with our school..."
                  rows={4}
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary-light text-primary-foreground font-semibold shadow-elegant"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Testimonial
                  </>
                )}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-4">
              Your testimonial will be reviewed before being published on our website.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AboutTestimonials;