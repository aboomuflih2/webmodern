import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

interface HeaderProps {
  onAdmissionsClick?: () => void;
}

const Header = ({ onAdmissionsClick }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Academics", href: "/academics" },
    { name: "News & Events", href: "/news" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="bg-background shadow-card sticky top-0 z-50">
      {/* Top Contact Bar */}
      <div className="bg-primary text-primary-foreground py-2 px-4">
        <div className="container mx-auto flex flex-wrap justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>9645499929, 9745499928</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>modernpotur@gmail.com</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>Mudur P.O., Vattamkulam Via, Edappal, Malappuram</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-4">
            <img 
              src="/lovable-uploads/d6a40436-db2a-426b-8cac-f4b879c3f89a.png" 
              alt="Modern Higher Secondary School Logo" 
              className="w-12 h-12 object-contain"
              onError={(e) => {
                console.error('Logo failed to load:', e.currentTarget.src);
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <h1 className="text-xl font-heading font-bold text-primary">Modern HSS</h1>
              <p className="text-sm text-muted-foreground">Pottur</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}
            <Button 
              variant="default" 
              className="bg-gradient-primary hover:bg-primary-light"
              onClick={onAdmissionsClick}
            >
              Admissions Open
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-border">
            <div className="flex flex-col gap-4 pt-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-foreground hover:text-primary transition-colors font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Button 
                className="bg-gradient-primary hover:bg-primary-light mt-2"
                onClick={onAdmissionsClick}
              >
                Admissions Open
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;