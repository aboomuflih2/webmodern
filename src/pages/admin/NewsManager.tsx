import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Pencil, Trash2, Plus, Eye, MessageCircle, Heart, FileText } from "lucide-react";
import { format } from "date-fns";
import { PhotoUpload } from "@/components/PhotoUpload";

interface NewsPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  publication_date: string;
  author_id: string;
  is_published: boolean;
  like_count: number;
}

interface Comment {
  id: string;
  author_name: string;
  author_email: string;
  comment_text: string;
  is_approved: boolean;
  created_at: string;
  article_id: string;
  article_title?: string;
}

const NewsManager = () => {
  const [newsArticles, setNewsArticles] = useState<NewsPost[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [editingArticle, setEditingArticle] = useState<NewsPost | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'articles' | 'comments'>('articles');
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    featured_image: "",
    is_published: false,
  });

  useEffect(() => {
    fetchNewsArticles();
    fetchComments();
  }, []);

  const fetchNewsArticles = async () => {
    const { data, error } = await supabase
      .from("news_posts")
      .select("*")
      .order("publication_date", { ascending: false });

    if (error) {
      console.error("Error fetching news:", error);
      toast({ title: "Error fetching articles", variant: "destructive" });
      return;
    }

    setNewsArticles(data || []);
  };

  const fetchComments = async () => {
    type CommentJoinRow = Database["public"]["Tables"]["article_comments"]["Row"] & {
      news_posts?: { title: string } | null;
    };

    const { data, error } = await supabase
      .from("article_comments")
      .select(`
        *,
        news_posts!fk_article_comments_news_posts(title)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }

    const typed = (data ?? []) as CommentJoinRow[];
    const commentsWithTitles: Comment[] = typed.map((row: CommentJoinRow) => ({
      id: row.id,
      author_name: row.author_name,
      author_email: row.author_email,
      comment_text: row.comment_text ?? row.comment_content,
      is_approved: row.is_approved,
      created_at: row.created_at,
      article_id: row.article_id,
      article_title: row.news_posts?.title,
    }));

    setComments(commentsWithTitles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.excerpt) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (!user?.id) {
      toast({ title: "You must be logged in to create articles", variant: "destructive" });
      return;
    }

    const articleData = {
      title: formData.title,
      content: formData.content,
      excerpt: formData.excerpt,
      featured_image: formData.featured_image || null,
      author_id: user.id,
      category: null, // Optional field
      tags: [], // Optional field
      is_published: formData.is_published,
      publication_date: formData.is_published ? new Date().toISOString() : null,
      slug: formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    };

    let error;

    if (editingArticle) {
      ({ error } = await supabase
        .from("news_posts")
        .update(articleData)
        .eq("id", editingArticle.id));
    } else {
      ({ error } = await supabase
        .from("news_posts")
        .insert(articleData));
    }

    if (error) {
      console.error("Error saving article:", error);
      toast({ title: "Error saving article", variant: "destructive" });
      return;
    }

    toast({ title: `Article ${editingArticle ? 'updated' : 'created'} successfully!` });
    setIsDialogOpen(false);
    resetForm();
    fetchNewsArticles();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    const { error } = await supabase
      .from("news_posts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting article:", error);
      toast({ title: "Error deleting article", variant: "destructive" });
      return;
    }

    toast({ title: "Article deleted successfully!" });
    fetchNewsArticles();
  };

  const togglePublishStatus = async (article: NewsPost) => {
    const { error } = await supabase
      .from("news_posts")
      .update({ is_published: !article.is_published })
      .eq("id", article.id);

    if (error) {
      console.error("Error updating publish status:", error);
      toast({ title: "Error updating article status", variant: "destructive" });
      return;
    }

    toast({ title: `Article ${!article.is_published ? 'published' : 'unpublished'}!` });
    fetchNewsArticles();
  };

  const handleCommentApproval = async (commentId: string, approved: boolean) => {
    const { error } = await supabase
      .from("article_comments")
      .update({ is_approved: approved })
      .eq("id", commentId);

    if (error) {
      console.error("Error updating comment:", error);
      toast({ title: "Error updating comment", variant: "destructive" });
      return;
    }

    toast({ title: `Comment ${approved ? 'approved' : 'rejected'}!` });
    fetchComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    const { error } = await supabase
      .from("article_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      toast({ title: "Error deleting comment", variant: "destructive" });
      return;
    }

    toast({ title: "Comment deleted successfully!" });
    fetchComments();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      excerpt: "",
      featured_image: "",
      is_published: false,
    });
    setEditingArticle(null);
  };

  const openEditDialog = (article?: NewsPost) => {
    if (article) {
      setEditingArticle(article);
      setFormData({
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        featured_image: article.featured_image || "",
        is_published: article.is_published,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const pendingComments = comments.filter(c => !c.is_approved);
  const approvedComments = comments.filter(c => c.is_approved);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">News & Blog Manager</h1>
        
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'articles' ? 'default' : 'outline'}
            onClick={() => setActiveTab('articles')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Articles
          </Button>
          <Button
            variant={activeTab === 'comments' ? 'default' : 'outline'}
            onClick={() => setActiveTab('comments')}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Comments ({pendingComments.length} pending)
          </Button>
        </div>
      </div>

      {activeTab === 'articles' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Articles ({newsArticles.length})</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openEditDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Article
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <DialogHeader>
                  <DialogTitle>
                    {editingArticle ? "Edit Article" : "Add New Article"}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Article title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Excerpt *</label>
                    <Textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Short description of the article"
                      rows={2}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Featured Image</label>
                    <PhotoUpload
                      currentPhotoUrl={formData.featured_image}
                      onPhotoChange={(photoUrl) => setFormData(prev => ({ ...prev, featured_image: photoUrl || "" }))}
                      bucket="news-photos"
                      folder="articles"
                      maxSizeInMB={5}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Content *</label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Full article content (HTML supported)"
                      rows={8}
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="published"
                      checked={formData.is_published}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                    />
                    <label htmlFor="published" className="text-sm font-medium">
                      Publish immediately
                    </label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingArticle ? "Update" : "Create"} Article
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {newsArticles.map((article) => (
              <Card key={article.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-2">
                        {article.title}
                        <Badge variant={article.is_published ? "default" : "secondary"}>
                          {article.is_published ? "Published" : "Draft"}
                        </Badge>
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">
                        By {article.author_id} • {format(new Date(article.publication_date), "MMM dd, yyyy")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Heart className="w-4 h-4" />
                        {article.like_count}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePublishStatus(article)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {article.is_published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(article)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(article.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2">{article.excerpt}</p>
                </CardContent>
              </Card>
            ))}

            {newsArticles.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No articles found. Create your first article!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Pending Comments ({pendingComments.length})</h2>
            <div className="space-y-4">
              {pendingComments.map((comment) => (
                <Card key={comment.id} className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{comment.author_name}</p>
                        <p className="text-sm text-muted-foreground">{comment.author_email}</p>
                        <p className="text-sm text-muted-foreground">
                          On: {comment.article_title}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(comment.created_at), "MMM dd, yyyy HH:mm")}
                      </div>
                    </div>
                    <p className="mb-4">{comment.comment_text}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCommentApproval(comment.id, true)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCommentApproval(comment.id, false)}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {pendingComments.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No pending comments.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Approved Comments ({approvedComments.length})</h2>
            <div className="space-y-4">
              {approvedComments.slice(0, 10).map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{comment.author_name}</p>
                        <p className="text-sm text-muted-foreground">
                          On: {comment.article_title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(comment.created_at), "MMM dd, yyyy")}
                        </span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p>{comment.comment_text}</p>
                  </CardContent>
                </Card>
              ))}

              {approvedComments.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No approved comments yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsManager;

