import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "citizen" | "official" | "contractor";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAndRoute = async (userId: string) => {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (roleData?.role === "official") {
        navigate("/official-dashboard");
      } else if ((roleData?.role as string) === "contractor") {
        navigate("/contractor-dashboard");
      } else {
        navigate("/citizen-dashboard");
      }
    };

    const checkAuth = async () => {
      try {
        // Check for demo mode first
        const demoRole = localStorage.getItem("demo_role");
        if (demoRole) {
          if (requiredRole && demoRole !== requiredRole) {
            // Redirect to correct dashboard based on demo role
            if (demoRole === "official") {
              navigate("/official-dashboard");
            } else if (demoRole === "contractor") {
              navigate("/contractor-dashboard");
            } else {
              navigate("/citizen-dashboard");
            }
            return;
          }
          setIsChecking(false);
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          navigate("/auth");
          return;
        }

        if (requiredRole) {
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single();

          if (roleError) throw roleError;

          if (roleData?.role !== requiredRole) {
            // Redirect to correct dashboard
            if (roleData?.role === "official") {
              navigate("/official-dashboard");
            } else if ((roleData?.role as string) === "contractor") {
              navigate("/contractor-dashboard");
            } else {
              navigate("/citizen-dashboard");
            }
            return;
          }
        }

        setIsChecking(false);
      } catch (error: any) {
        console.error("Auth check failed:", error);
        // Fallback for network errors - if we can't verify, send to auth where offline mode can be triggered
        if (error.message?.includes("Failed to fetch") || error.message?.includes("network")) {
          // Maybe we don't want to redirect to auth if we are already logged in? 
          // But if we can't verify role, it's safer to go to auth or show error.
          // For now, let's stop loading so the user at least sees something or gets redirected.
          navigate("/auth");
        } else {
          navigate("/auth");
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      } else if (event === 'SIGNED_IN' && session) {
        // Route to correct dashboard based on role
        checkAndRoute(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, requiredRole]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
