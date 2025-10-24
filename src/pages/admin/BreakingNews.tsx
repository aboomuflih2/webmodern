import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { adminSupabase as supabase } from '@/integrations/supabase/admin-client';
import { toast } from '@/hooks/use-toast';
import { Radio, Save } from 'lucide-react';

interface BreakingNews {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const BreakingNewsManager = () => {
  const [breakingNews, setBreakingNews] = useState<BreakingNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [currentActive, setCurrentActive] = useState<BreakingNews | null>(null);

  useEffect(() => {
    loadBreakingNews();
  }, []);

  const loadBreakingNews = async () => {
    try {
      const { data, error } = await supabase
        .from('breaking_news')
        .select('id, title, content, is_active, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setBreakingNews(data || []);
      
      // Find the currently active news
      const active = data?.find(item => item.is_active);
      if (active) {
        setCurrentActive(active);
        setMessage(active.content || active.title);
        setIsActive(active.is_active);
      }
    } catch (error) {
      console.error('Error loading breaking news:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load breaking news',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // If we have a currently active item and we're making a new one active,
      // or if we're updating the current active item
      if (isActive && currentActive) {
        // Deactivate current active news
        await supabase
          .from('breaking_news')
          .update({ is_active: false })
          .eq('id', currentActive.id);
      }

      if (currentActive && currentActive.content === message) {
        // Just update the active status of current item
        const { error } = await supabase
          .from('breaking_news')
          .update({ 
            title: message.trim(),
            content: message.trim(),
            is_active: isActive 
          })
          .eq('id', currentActive.id);

        if (error) throw error;
      } else {
        // Create new breaking news entry
        const { error } = await supabase
          .from('breaking_news')
          .insert([{ 
            title: message.trim(),
            content: message.trim(),
            is_active: isActive
          }]);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Breaking news updated successfully',
      });

      loadBreakingNews();
    } catch (error) {
      console.error('Error saving breaking news:', error);
      const message = (error as any)?.message || 'Failed to save breaking news';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    } finally {
      setSaving(false);
    }
  };

  const activateNews = async (newsId: string) => {
    try {
      // Deactivate all breaking news
      await supabase
        .from('breaking_news')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

      // Activate the selected one
      const { error } = await supabase
        .from('breaking_news')
        .update({ is_active: true })
        .eq('id', newsId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Breaking news activated successfully',
      });

      loadBreakingNews();
    } catch (error) {
      console.error('Error activating breaking news:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to activate breaking news',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Radio className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Breaking News Manager</h1>
          <p className="text-muted-foreground">Manage the scrolling news ticker</p>
        </div>
      </div>

      {/* Current Active News Display */}
      {currentActive && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-primary animate-pulse" />
                Currently Live
              </CardTitle>
              <Badge>Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm bg-muted p-3 rounded-lg">
                {currentActive.content}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {new Date(currentActive.updated_at).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Update/Create Form */}
      <Card>
        <CardHeader>
          <CardTitle>Update Breaking News</CardTitle>
          <CardDescription>
            Enter the message that will scroll across the top of your website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Breaking News Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your breaking news message..."
                className="min-h-[100px]"
                maxLength={500}
                required
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Keep it concise for better readability</span>
                <span>{message.length}/500 characters</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="is_active">Make this news active</Label>
            </div>

            <Button type="submit" disabled={saving || !message.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Breaking News'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Previous Breaking News */}
      {breakingNews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Breaking News</CardTitle>
            <CardDescription>
              History of your breaking news messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {breakingNews.map((news) => (
                <div
                  key={news.id}
                  className={`p-4 rounded-lg border ${
                    news.is_active ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{news.content}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted-foreground">
                          Created: {new Date(news.created_at).toLocaleDateString()}
                        </span>
                        {news.updated_at !== news.created_at && (
                          <span className="text-xs text-muted-foreground">
                            Updated: {new Date(news.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {news.is_active ? (
                        <Badge>Active</Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => activateNews(news.id)}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BreakingNewsManager;