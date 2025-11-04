import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import BreakingNews from "@/components/BreakingNews";
import LegacySection from "@/components/LegacySection";
import AcademicPrograms from "@/components/AcademicPrograms";
import CampusNews from "@/components/CampusNews";
import ContactForm from "@/components/ContactForm";
import Testimonials from "@/components/Testimonials";
import JoinOurTeam from "@/components/JoinOurTeam";
import Footer from "@/components/Footer";
import { AdmissionsModal } from "@/components/admissions/AdmissionsModal";

const Index = () => {
  const [isAdmissionsModalOpen, setIsAdmissionsModalOpen] = useState(false);
  return (
    <div className="min-h-screen">
      <Header onAdmissionsClick={() => setIsAdmissionsModalOpen(true)} />
      <HeroSection />
      <BreakingNews />
      <LegacySection />
      <AcademicPrograms />
      <CampusNews />
      <ContactForm />
      <Testimonials />
      <JoinOurTeam />
      <Footer />
      <AdmissionsModal 
        isOpen={isAdmissionsModalOpen} 
        onClose={() => setIsAdmissionsModalOpen(false)} 
      />
    </div>
  );
};

export default Index;
