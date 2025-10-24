import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Image, 
  Radio, 
  FileText, 
  BookOpen, 
  MessageSquare, 
  Trophy, 
  Users,
  Star,
  Mail,
  ChevronDown,
  Heart,
  LogOut,
  Newspaper,
  Calendar,
  Images,
  Settings,
  GraduationCap,
  Share2,
  ClipboardList,
  BarChart3,
  Phone,
  ExternalLink,
  UserPlus,
  Briefcase,
  Clock,
  ChevronRight,
  Shield
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [pageManagementOpen, setPageManagementOpen] = useState(true);
  const [contentModulesOpen, setContentModulesOpen] = useState(true);
  const [newsEventsOpen, setNewsEventsOpen] = useState(true);
  const [admissionsOpen, setAdmissionsOpen] = useState(true);
  const [siteSettingsOpen, setSiteSettingsOpen] = useState(true);
  const [submissionsOpen, setSubmissionsOpen] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const dashboardItem = { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard };
  
  const pageManagementItems = [
    { href: '/admin/hero-slides', label: 'Hero Slides', icon: Image },
    { href: '/admin/about', label: 'About Page', icon: FileText },
    { href: '/admin/academics', label: 'Academics', icon: BookOpen },
    { href: '/admin/contact-page', label: 'Contact Page', icon: Phone },
  ];

  const contentModuleItems = [
    { href: '/admin/breaking-news', label: 'Breaking News', icon: Radio },
    { href: '/admin/leadership-messages', label: 'Leadership Messages', icon: MessageSquare },
    { href: '/admin/director-board', label: 'Director Board', icon: Users },
    { href: '/admin/in-memory', label: 'In Memory', icon: Heart },
    { href: '/admin/school-features', label: 'School Features', icon: Star },
    { href: '/admin/school-stats', label: 'School Stats', icon: BarChart3 },
    { href: '/admin/testimonials', label: 'Testimonials', icon: Trophy },
  ];

  const newsEventsItems = [
    { href: '/admin/news', label: 'News & Blog', icon: Newspaper },
    { href: '/admin/events', label: 'Events', icon: Calendar },
    { href: '/admin/gallery', label: 'Gallery', icon: Images },
  ];

  const admissionsItems = [
    { href: '/admin/admission-forms', label: 'Form Management', icon: Settings },
    { href: '/admin/admission-applications', label: 'Applications', icon: Users },
    { href: '/admin/interview-settings', label: 'Interview Settings', icon: ClipboardList },
  ];

  const siteSettingsItems = [
    { href: '/admin/social-links', label: 'Social Media Links', icon: Share2 },
  ];

  const submissionItems = [
    { href: '/admin/contacts', label: 'Contact Messages', icon: Mail },
    { href: '/admin/job-applications', label: 'Job Applications', icon: ClipboardList },
    { href: '/admin/gate-pass', label: 'Gate Pass Requests', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r">
        <div className="p-6">
          <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Modern HSS Pottur</p>
        </div>
        
        <nav className="px-4 pb-4">
          <div className="space-y-2">
            {/* Dashboard */}
            <NavLink
              to={dashboardItem.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`
              }
            >
              <dashboardItem.icon className="h-4 w-4" />
              {dashboardItem.label}
            </NavLink>

            {/* Page Management */}
            <Collapsible open={pageManagementOpen} onOpenChange={setPageManagementOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4" />
                  Page Management
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${pageManagementOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 ml-4 mt-1">
                {pageManagementItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>

            {/* Content Modules */}
            <Collapsible open={contentModulesOpen} onOpenChange={setContentModulesOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4" />
                  Content Modules
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${contentModulesOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 ml-4 mt-1">
                {contentModuleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>

            {/* News & Events Management */}
            <Collapsible open={newsEventsOpen} onOpenChange={setNewsEventsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Newspaper className="h-4 w-4" />
                  News & Events Management
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${newsEventsOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 ml-4 mt-1">
                {newsEventsItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>

            {/* Admissions */}
            <Collapsible open={admissionsOpen} onOpenChange={setAdmissionsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-4 w-4" />
                  Admissions
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${admissionsOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 ml-4 mt-1">
                {admissionsItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>

            {/* Site Settings */}
            <Collapsible open={siteSettingsOpen} onOpenChange={setSiteSettingsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4" />
                  Site Settings
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${siteSettingsOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 ml-4 mt-1">
                {siteSettingsItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>

            {/* Submissions */}
            <Collapsible open={submissionsOpen} onOpenChange={setSubmissionsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4" />
                  Submissions
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${submissionsOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 ml-4 mt-1">
                {submissionItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          </div>
          
          <div className="mt-8 pt-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;