import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Users, FileText, Image, MessageSquare, Calendar, BookOpen, Trophy } from 'lucide-react';

interface DashboardStats {
  heroSlides: number;
  breakingNews: number;
  pageContent: number;
  academicPrograms: number;
  newsPosts: number;
  testimonials: number;
  contactSubmissions: number;
  unreadContacts: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    heroSlides: 0,
    breakingNews: 0,
    pageContent: 0,
    academicPrograms: 0,
    newsPosts: 0,
    testimonials: 0,
    contactSubmissions: 0,
    unreadContacts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const [
        heroSlidesResult,
        breakingNewsResult,
        pageContentResult,
        academicProgramsResult,
        newsPostsResult,
        testimonialsResult,
        contactSubmissionsResult,
        unreadContactsResult,
      ] = await Promise.all([
        supabase.from('hero_slides').select('*', { count: 'exact', head: true }),
        supabase.from('breaking_news').select('*', { count: 'exact', head: true }),
        supabase.from('page_content').select('*', { count: 'exact', head: true }),
        supabase.from('academic_programs').select('*', { count: 'exact', head: true }),
        supabase.from('news_posts').select('*', { count: 'exact', head: true }),
        supabase.from('testimonials').select('*', { count: 'exact', head: true }),
        supabase.from('contact_submissions').select('*', { count: 'exact', head: true }),
        supabase.from('contact_submissions').select('*', { count: 'exact', head: true }).eq('is_read', false),
      ]);

      setStats({
        heroSlides: heroSlidesResult.count || 0,
        breakingNews: breakingNewsResult.count || 0,
        pageContent: pageContentResult.count || 0,
        academicPrograms: academicProgramsResult.count || 0,
        newsPosts: newsPostsResult.count || 0,
        testimonials: testimonialsResult.count || 0,
        contactSubmissions: contactSubmissionsResult.count || 0,
        unreadContacts: unreadContactsResult.count || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Create News Post',
      description: 'Write a new article or announcement',
      href: '/admin/news/create',
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      title: 'Add Hero Slide',
      description: 'Create a new homepage banner',
      href: '/admin/banners/create',
      icon: Image,
      color: 'bg-green-500',
    },
    {
      title: 'View Contacts',
      description: 'Check messages from visitors',
      href: '/admin/contacts',
      icon: MessageSquare,
      color: 'bg-purple-500',
      badge: stats.unreadContacts > 0 ? stats.unreadContacts : undefined,
    },
    {
      title: 'Manage Programs',
      description: 'Update academic programs',
      href: '/admin/academics',
      icon: BookOpen,
      color: 'bg-orange-500',
    },
  ];

  const statsCards = [
    {
      title: 'Hero Slides',
      count: stats.heroSlides,
      description: 'Homepage banners',
      icon: Image,
      href: '/admin/banners',
    },
    {
      title: 'News Posts',
      count: stats.newsPosts,
      description: 'Published articles',
      icon: FileText,
      href: '/admin/news',
    },
    {
      title: 'Academic Programs',
      count: stats.academicPrograms,
      description: 'Course offerings',
      icon: BookOpen,
      href: '/admin/academics',
    },
    {
      title: 'Testimonials',
      count: stats.testimonials,
      description: 'Student reviews',
      icon: Trophy,
      href: '/admin/testimonials',
    },
    {
      title: 'Contact Messages',
      count: stats.contactSubmissions,
      description: 'Visitor inquiries',
      icon: MessageSquare,
      href: '/admin/contacts',
      badge: stats.unreadContacts,
    },
    {
      title: 'Page Content',
      count: stats.pageContent,
      description: 'Static pages',
      icon: Users,
      href: '/admin/pages',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the Modern Higher Secondary School admin panel
        </p>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.title} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${action.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {action.badge && (
                      <Badge variant="destructive" className="h-6 w-6 p-0 flex items-center justify-center text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Statistics */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Content Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statsCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {card.badge && card.badge > 0 && (
                      <Badge variant="destructive" className="h-6 w-6 p-0 flex items-center justify-center text-xs">
                        {card.badge}
                      </Badge>
                    )}
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.count}</div>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Recent Activity - This would show recent changes */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardHeader>
            <CardTitle>Latest Updates</CardTitle>
            <CardDescription>
              Recent changes to your website content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Activity tracking will be displayed here as you make changes to your content.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default AdminDashboard;