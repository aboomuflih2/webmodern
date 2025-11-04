import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Check, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Testimonial {
  id: string;
  person_name: string;
  relation: string;
  quote: string;
  rating: number;
  status: string;
  photo?: string;
  created_at: string;
  is_active: boolean;
}

const TestimonialsManager = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTestimonials(data || []);
    } catch (error) {
      console.error('Error loading testimonials:', error);
      toast({
        title: "Error",
        description: "Failed to load testimonials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTestimonialStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setTestimonials(testimonials.map(t => 
        t.id === id ? { ...t, status } : t
      ));

      toast({
        title: "Success",
        description: `Testimonial ${status}`,
      });
    } catch (error) {
      console.error('Error updating testimonial:', error);
      toast({
        title: "Error",
        description: "Failed to update testimonial status",
        variant: "destructive",
      });
    }
  };

  const deleteTestimonial = async (id: string) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTestimonials(testimonials.filter(t => t.id !== id));

      toast({
        title: "Success",
        description: "Testimonial deleted",
      });
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast({
        title: "Error",
        description: "Failed to delete testimonial",
        variant: "destructive",
      });
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const pendingTestimonials = testimonials.filter(t => t.status === 'pending');
  const approvedTestimonials = testimonials.filter(t => t.status === 'approved');
  const rejectedTestimonials = testimonials.filter(t => t.status === 'rejected');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Testimonials Manager</h1>
        <p className="text-muted-foreground mt-2">
          Manage and moderate testimonials from your website visitors
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending Review
            {pendingTestimonials.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingTestimonials.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedTestimonials.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedTestimonials.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingTestimonials.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No testimonials pending review</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingTestimonials.map((testimonial) => (
                <Card key={testimonial.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={testimonial.photo} alt={testimonial.person_name} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(testimonial.person_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{testimonial.person_name}</CardTitle>
                          <CardDescription>{testimonial.relation}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {renderStars(testimonial.rating)}
                        </div>
                        {getStatusBadge(testimonial.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <blockquote className="text-foreground/80 leading-relaxed italic mb-4">
                      "{testimonial.quote}"
                    </blockquote>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Submitted: {new Date(testimonial.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => updateTestimonialStatus(testimonial.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateTestimonialStatus(testimonial.id, 'rejected')}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedTestimonials.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No approved testimonials</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {approvedTestimonials.map((testimonial) => (
                <Card key={testimonial.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={testimonial.photo} alt={testimonial.person_name} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(testimonial.person_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{testimonial.person_name}</CardTitle>
                          <CardDescription>{testimonial.relation}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {renderStars(testimonial.rating)}
                        </div>
                        {getStatusBadge(testimonial.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <blockquote className="text-foreground/80 leading-relaxed italic mb-4">
                      "{testimonial.quote}"
                    </blockquote>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Approved: {new Date(testimonial.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTestimonialStatus(testimonial.id, 'pending')}
                        >
                          Move to Pending
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteTestimonial(testimonial.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedTestimonials.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No rejected testimonials</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rejectedTestimonials.map((testimonial) => (
                <Card key={testimonial.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={testimonial.photo} alt={testimonial.person_name} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(testimonial.person_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{testimonial.person_name}</CardTitle>
                          <CardDescription>{testimonial.relation}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {renderStars(testimonial.rating)}
                        </div>
                        {getStatusBadge(testimonial.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <blockquote className="text-foreground/80 leading-relaxed italic mb-4">
                      "{testimonial.quote}"
                    </blockquote>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Rejected: {new Date(testimonial.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTestimonialStatus(testimonial.id, 'pending')}
                        >
                          Move to Pending
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteTestimonial(testimonial.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestimonialsManager;