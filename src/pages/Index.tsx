import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import About from "@/components/About";
import Footer from "@/components/Footer";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      // 1. Check Demo Mode
      const demoRole = localStorage.getItem("demo_role");
      if (demoRole) {
        if (demoRole === "official") navigate("/official-dashboard");
        else if (demoRole === "contractor") navigate("/contractor-dashboard");
        else navigate("/citizen-dashboard");
        return;
      }

      // 2. Check Supabase Session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Check metadata first
          let role = session.user.user_metadata?.role;

          // If not in metadata, try to fetch from DB (fallback)
          if (!role) {
            const { data: roleData } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .maybeSingle();
            if (roleData) role = roleData.role;
          }

          if (role === "official") navigate("/official-dashboard");
          else if (role === "contractor") navigate("/contractor-dashboard");
          else navigate("/citizen-dashboard");
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };

    checkSession();
  }, [navigate]);

  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <About />
      <Testimonials />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
