import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading, checkAdminRole } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const verifyAdmin = async () => {
      // Double-check session state
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (user && session) {
        const adminStatus = await checkAdminRole(user.id);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    };

    if (!loading) {
      verifyAdmin();
    }
  }, [user, loading, checkAdminRole]);
  
  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;