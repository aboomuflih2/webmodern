import { useState, useEffect } from "react";
import { Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BreakingNewsData {
  content: string;
  is_active: boolean;
}

const BreakingNews = () => {
  const [newsText, setNewsText] = useState(
    "Admissions Open for Academic Year 2024-25 | Online Application Available | Contact: 0494-2699645 | Visit our campus for more details"
  );

  useEffect(() => {
    loadBreakingNews();
  }, []);

  const loadBreakingNews = async () => {
    try {
      const { data, error } = await supabase
        .from("breaking_news")
        .select("content, is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .returns<BreakingNewsData[]>();

      if (error) {
        console.error("Error fetching breaking news:", error);
        return;
      }

      if (data && data.length > 0 && data[0].content) {
        setNewsText(data[0].content);
      }
    } catch (error) {
      console.error("Error loading breaking news:", error);
      // Keep default message on error
    }
  };

  return (
    <div className="bg-accent text-accent-foreground py-3 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4">
          {/* Breaking News Label */}
          <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-1 rounded-full whitespace-nowrap">
            <Megaphone className="h-4 w-4" />
            <span className="font-semibold text-sm">Breaking News</span>
          </div>

          {/* Scrolling Text Container */}
          <div className="flex-1 overflow-hidden">
            <div className="scroll-text whitespace-nowrap">
              <span className="font-medium text-sm md:text-base">{newsText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakingNews;

