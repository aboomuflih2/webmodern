import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Careers from "./pages/Careers";
import Academics from "./pages/Academics";
import NewsEvents from "./pages/NewsEvents";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import HeroSlidesManager from "./pages/admin/HeroSlides";
import BreakingNewsManager from "./pages/admin/BreakingNews";
import ContactsManager from "./pages/admin/Contacts";
import ContactPageManager from "./pages/admin/ContactPageManager";
import AboutPageManager from "./pages/admin/AboutPage";
import LeadershipManager from "./pages/admin/Leadership";
import LeadershipMessagesManager from "./pages/admin/LeadershipMessages";
import SchoolFeaturesManager from "./pages/admin/SchoolFeatures";
import SchoolStats from "./pages/admin/SchoolStats";
import TestimonialsManager from "./pages/admin/Testimonials";
import AdminAcademics from "./pages/admin/Academics";
import AcademicProgramNew from "./pages/admin/AcademicProgramNew";
import AcademicProgramEdit from "./pages/admin/AcademicProgramEdit";
import NewsManager from "./pages/admin/NewsManager";
import EventsManager from "./pages/admin/EventsManager";
import GalleryManager from "./pages/admin/GalleryManager";
import SocialLinksManager from "./pages/admin/SocialLinksManager";
import AdmissionForms from "./pages/admin/AdmissionForms";
import AdmissionApplications from "./pages/admin/AdmissionApplications";
import JobApplications from "./pages/admin/JobApplications";
import InterviewSettings from "./pages/admin/InterviewSettings";
import ApplicationDetail from "./pages/admin/ApplicationDetail";
import { KGStdApplicationForm } from "./components/admissions/KGStdApplicationForm";
import { PlusOneApplicationForm } from "./components/admissions/PlusOneApplicationForm";
import { ApplicationSuccess } from "./pages/ApplicationSuccess";
import ApplicationTracking from "./pages/ApplicationTracking";
import InMemoryAdmin from "./components/admin/InMemoryAdmin";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/academics" element={<Academics />} />
            <Route path="/news-events" element={<NewsEvents />} />
            <Route path="/news" element={<NewsEvents />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Admission Routes */}
            <Route path="/admissions/apply/kg-std" element={<KGStdApplicationForm />} />
            <Route path="/admissions/apply/plus-one" element={<PlusOneApplicationForm />} />
            <Route path="/admissions/success" element={<ApplicationSuccess />} />
            <Route path="/admissions/track" element={<ApplicationTracking />} />
          
          {/* Admin Routes */}
          <Route path="/admin/*" element={
            <AdminRoute>
              <AdminLayout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="hero-slides" element={<HeroSlidesManager />} />
                  <Route path="breaking-news" element={<BreakingNewsManager />} />
                  <Route path="contacts" element={<ContactsManager />} />
                  <Route path="contact-page" element={<ContactPageManager />} />
                  <Route path="about" element={<AboutPageManager />} />
                  <Route path="leadership-messages" element={<LeadershipMessagesManager />} />
                  <Route path="director-board" element={<LeadershipManager />} />
                  <Route path="in-memory" element={<InMemoryAdmin />} />
                  <Route path="school-features" element={<SchoolFeaturesManager />} />
                  <Route path="school-stats" element={<SchoolStats />} />
                  <Route path="testimonials" element={<TestimonialsManager />} />
                  <Route path="academics" element={<AdminAcademics />} />
                  <Route path="academics/new" element={<AcademicProgramNew />} />
                  <Route path="academics/:id/edit" element={<AcademicProgramEdit />} />
                  <Route path="news" element={<NewsManager />} />
                  <Route path="events" element={<EventsManager />} />
                  <Route path="gallery" element={<GalleryManager />} />
                  <Route path="social-links" element={<SocialLinksManager />} />
                  <Route path="admission-forms" element={<AdmissionForms />} />
                  <Route path="admission-applications" element={<AdmissionApplications />} />
                  <Route path="job-applications" element={<JobApplications />} />
                  <Route path="interview-settings" element={<InterviewSettings />} />
                  <Route path="applications/:type/:id" element={<ApplicationDetail />} />
                  <Route index element={<AdminDashboard />} />
                </Routes>
              </AdminLayout>
            </AdminRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
</HelmetProvider>
);

export default App;
