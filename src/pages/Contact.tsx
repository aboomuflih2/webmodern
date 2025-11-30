import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Phone, Mail, MapPin, Clock, Users, GraduationCap, ExternalLink, Home } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdmissionsModal } from "@/components/admissions/AdmissionsModal";

interface ContactPageContent {
  id: string;
  content_type: string;
  title: string;
  content: string;
  additional_data?: unknown;
  display_order: number;
  is_active: boolean;
}

interface ContactAddress {
  id: string;
  title: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_active: boolean;
  display_order: number;
}

interface ContactLocation {
  id: string;
  title: string;
  url: string;
  description?: string;
  is_active: boolean;
  display_order: number;
}

const Contact = () => {
  const [contactContent, setContactContent] = useState<ContactPageContent[]>([]);
  const [contactAddresses, setContactAddresses] = useState<ContactAddress[]>([]);
  const [contactLocations, setContactLocations] = useState<ContactLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmissionsModalOpen, setIsAdmissionsModalOpen] = useState(false);

  useEffect(() => {
    loadContactContent();
  }, []);

  const loadContactContent = async () => {
    try {
      // Load contact page content
      const { data: contentData, error: contentError } = await supabase
        .from('contact_page_content')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (contentError) {
        console.error('Error loading contact content:', contentError);
        toast.error('Failed to load contact information');
        return;
      }

      setContactContent(contentData || []);

      // Load contact addresses
      const { data: addressData, error: addressError } = await supabase
        .from('contact_addresses')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (addressError) {
        console.error('Error loading contact addresses:', addressError);
        // Don't show error toast for addresses as they might not exist yet
      } else {
        setContactAddresses(addressData || []);
      }

      // Load contact locations
      const { data: locationData, error: locationError } = await supabase
        .from('contact_locations')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (locationError) {
        console.error('Error loading contact locations:', locationError);
        // Don't show error toast for locations as they might not exist yet
      } else {
        setContactLocations(locationData || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load contact information');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get content by type
  const getContentByType = (type: string) => {
    return contactContent.find(item => item.content_type === type);
  };

  // Helper function to parse contact details
  const parseContactDetails = (content: string) => {
    try {
      return JSON.parse(content);
    } catch {
      return content.split('\n').filter(line => line.trim());
    }
  };

  // Get dynamic content or fallback to defaults
  const phoneContent = getContentByType('phone');
  const emailContent = getContentByType('email');
  const addressContent = getContentByType('address');
  const hoursContent = getContentByType('office_hours');
  const mapContent = getContentByType('map_embed');
  const heroContent = getContentByType('hero_section');
  const departmentContent = getContentByType('departments');

  const contactInfo = [
    {
      icon: Phone,
      title: phoneContent?.title || "Call Us",
      details: phoneContent ? parseContactDetails(phoneContent.content) : ["9645499929, 9745499928"],
      primary: ((phoneContent?.additional_data as { primary?: string } | undefined)?.primary) || "9645499929, 9745499928"
    },
    {
      icon: Mail,
      title: emailContent?.title || "Email Us",
      details: emailContent ? parseContactDetails(emailContent.content) : ["modernpotur@gmail.com"],
      primary: ((emailContent?.additional_data as { primary?: string } | undefined)?.primary) || "modernpotur@gmail.com"
    },
    {
      icon: MapPin,
      title: addressContent?.title || "Visit Us",
      details: addressContent ? parseContactDetails(addressContent.content) : ["Mudur P.O., Vattamkulam Via", "Edappal, Malappuram", "Kerala - 679578"],
      primary: ((addressContent?.additional_data as { primary?: string } | undefined)?.primary) || "Mudur P.O., Vattamkulam Via"
    },
    {
      icon: Clock,
      title: hoursContent?.title || "Office Hours",
      details: hoursContent ? parseContactDetails(hoursContent.content) : ["Monday - Friday: 9:00 AM - 4:00 PM", "Saturday: 9:00 AM - 1:00 PM", "Sunday: Closed"],
      primary: ((hoursContent?.additional_data as { primary?: string } | undefined)?.primary) || "Mon-Fri: 9:00 AM - 4:00 PM"
    }
  ];

  const departments = (((departmentContent?.additional_data as { departments?: Array<{ icon: typeof GraduationCap; title: string; description?: string; contact?: string; email?: string }> } | undefined)?.departments)) || [
    {
      icon: GraduationCap,
      title: "Admissions Office",
      description: "For admission inquiries and application support",
      contact: "9645499929",
      email: "admissions@modernpotur.edu"
    },
    {
      icon: Users,
      title: "Principal's Office",
      description: "For academic and administrative matters",
      contact: "9645499929, 9745499928",
      email: "principal@modernpotur.edu"
    }
  ];

  if (loading) {
    return (
      <>
        <Header onAdmissionsClick={() => setIsAdmissionsModalOpen(true)} />
        <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading contact information...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Contact Us - Modern Higher Secondary School Pottur</title>
        <meta name="description" content="Get in touch with Modern Higher Secondary School Pottur. Find our contact information, office hours, location, and send us a message through our contact form." />
        <meta name="keywords" content="contact, Modern HSS Pottur, school contact, admission inquiry, Kerala school contact" />
        <meta property="og:title" content="Contact Us - Modern Higher Secondary School Pottur" />
        <meta property="og:description" content="Contact Modern Higher Secondary School Pottur for admissions, academic inquiries, and general information." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://modernpotur.edu/contact" />
      </Helmet>

      <Header onAdmissionsClick={() => setIsAdmissionsModalOpen(true)} />
      
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-r from-primary to-primary-light text-primary-foreground">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                {heroContent?.title || "Contact Us"}
              </h1>
              <p className="text-xl md:text-2xl mb-8 opacity-90">
                {heroContent?.content || "We're here to help you with any questions about our school, admissions, or academic programs."}
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="text-center">
                  <Phone className="h-8 w-8 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">{contactInfo[0].title}</h3>
                  <p className="text-sm opacity-90">{contactInfo[0].primary}</p>
                </div>
                <div className="text-center">
                  <Mail className="h-8 w-8 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">{contactInfo[1].title}</h3>
                  <p className="text-sm opacity-90">{contactInfo[1].primary}</p>
                </div>
                <div className="text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">{contactInfo[2].title}</h3>
                  <p className="text-sm opacity-90">{contactInfo[2].primary}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Information & Form Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-heading font-bold text-primary mb-6">
                    Get In Touch
                  </h2>
                  <p className="text-muted-foreground text-lg mb-8">
                    We welcome your questions and look forward to hearing from you. Our dedicated team is ready to assist you with any inquiries.
                  </p>
                </div>

                {/* Contact Details */}
                <div className="grid gap-6">
                  {contactInfo.map((info, index) => {
                    const Icon = info.icon;
                    return (
                      <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-2">
                              {info.title}
                            </h3>
                            <div className="space-y-1">
                              {info.details.map((detail, idx) => (
                                <p key={idx} className="text-muted-foreground text-sm">
                                  {detail}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Department Contacts */}
                <div>
                  <h3 className="text-xl font-heading font-semibold text-primary mb-4">
                    Department Contacts
                  </h3>
                  <div className="space-y-4">
                    {departments.map((dept, index) => {
                      const Icon = dept.icon;
                      return (
                        <Card key={index} className="p-4">
                          <div className="flex items-start gap-3">
                            <Icon className="h-5 w-5 text-primary mt-1" />
                            <div>
                              <h4 className="font-semibold text-foreground">{dept.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{dept.description}</p>
                              <div className="flex flex-col gap-1 text-sm">
                                <span className="text-primary font-medium">{dept.contact}</span>
                                <span className="text-muted-foreground">{dept.email}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Address Cards */}
                {contactAddresses.length > 0 && (
                  <div>
                    <h3 className="text-xl font-heading font-semibold text-primary mb-4">
                      Our Addresses
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {contactAddresses.map((address) => (
                        <Card key={address.id} className="p-4 hover:shadow-lg transition-shadow">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <Home className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground mb-2">{address.title}</h4>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p>{address.address_line_1}</p>
                                {address.address_line_2 && <p>{address.address_line_2}</p>}
                                <p>{address.city}, {address.state}</p>
                                <p>{address.postal_code}, {address.country}</p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location Links */}
                {contactLocations.length > 0 && (
                  <div>
                    <h3 className="text-xl font-heading font-semibold text-primary mb-4">
                      Useful Links
                    </h3>
                    <div className="grid gap-4">
                      {contactLocations.map((location) => (
                        <Card key={location.id} className="p-4 hover:shadow-lg transition-shadow">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <ExternalLink className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground mb-2">{location.title}</h4>
                              {location.description && (
                                <p className="text-sm text-muted-foreground mb-3">{location.description}</p>
                              )}
                              <a 
                                href={location.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Open Link
                              </a>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Form */}
              <div>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading font-bold text-primary mb-4">
                Find Us
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Located in the heart of Malappuram district, our campus is easily accessible and provides a conducive environment for learning.
              </p>
            </div>
            
            {/* Google Maps Embed */}
            <Card className="overflow-hidden">
              <div className="aspect-video w-full">
                <iframe
                  src={mapContent?.content || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3913.0!2d75.9!3d11.1!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba65e1234567890%3A0x1234567890abcdef!2sEdappal%2C%20Kerala%20679578!5e0!3m2!1sen!2sin!4v1640000000000!5m2!1sen!2sin"}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Modern Higher Secondary School Pottur Location"
                ></iframe>
              </div>
            </Card>
            
            {/* Directions */}
            <div className="mt-8 text-center">
              <Card className="p-6 max-w-2xl mx-auto">
                <h3 className="text-xl font-semibold text-primary mb-4">Directions</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>By Bus:</strong> Take any bus to Edappal and get down at Vattamkulam. The school is a short walk from there.</p>
                  <p><strong>By Car:</strong> From Malappuram town, take the Edappal road and follow signs to Vattamkulam. The school is well-signposted.</p>
                  <p><strong>Nearest Railway Station:</strong> Tirur Railway Station (15 km)</p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Quick Contact CTA */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-heading font-bold mb-4">
              Ready to Join Our School Community?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Contact us today to learn more about our admission process and how we can help your child achieve academic excellence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="tel:9645499929" 
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Phone className="h-5 w-5 mr-2" />
                Call Now
              </a>
              <a 
                href="mailto:modernpotur@gmail.com" 
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-primary transition-colors"
              >
                <Mail className="h-5 w-5 mr-2" />
                Send Email
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <AdmissionsModal 
        isOpen={isAdmissionsModalOpen} 
        onClose={() => setIsAdmissionsModalOpen(false)} 
      />
    </>
  );
};

export default Contact;
