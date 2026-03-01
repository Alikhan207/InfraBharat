import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/components/language-provider";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Check Demo Mode
      const demoRole = localStorage.getItem("demo_role");
      if (demoRole) {
        setIsAuthenticated(true);
        setUserRole(demoRole);
        return;
      }

      // 2. Check Supabase Session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        setUserRole(session.user.user_metadata?.role || "citizen");
      }
    };
    checkAuth();
  }, []);

  const handleAction = () => {
    if (isAuthenticated) {
      if (userRole === "official") navigate("/official-dashboard");
      else if (userRole === "contractor") navigate("/contractor-dashboard");
      else navigate("/citizen-dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <header className="bg-background shadow-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-infra-green-500 to-infra-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">IB</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{t("app.title")}</h1>
              <p className="text-xs text-muted-foreground">{t("app.subtitle")}</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <a href="#features" className="text-muted-foreground hover:text-infra-green-600 transition-colors">
              {t("nav.features")}
            </a>
            <a href="#about" className="text-muted-foreground hover:text-infra-green-600 transition-colors">
              {t("nav.about")}
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-infra-green-600 transition-colors">
              {t("nav.contact")}
            </a>
            <Button onClick={() => navigate("/transparency")} variant="ghost" size="sm">
              Public Data
            </Button>
            <LanguageSelector />
            <ThemeToggle />
            <Button
              onClick={handleAction}
              className="bg-infra-green-600 hover:bg-infra-green-700 text-white"
            >
              {isAuthenticated ? "Dashboard" : t("nav.login")}
            </Button>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <LanguageSelector />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden animate-slide-in">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-t border-border">
              <a href="#features" className="block px-3 py-2 text-muted-foreground hover:text-infra-green-600">
                {t("nav.features")}
              </a>
              <a href="#about" className="block px-3 py-2 text-muted-foreground hover:text-infra-green-600">
                {t("nav.about")}
              </a>
              <a href="#contact" className="block px-3 py-2 text-muted-foreground hover:text-infra-green-600">
                {t("nav.contact")}
              </a>
              <Button
                onClick={handleAction}
                className="w-full mt-2 bg-infra-green-600 hover:bg-infra-green-700 text-white"
              >
                {isAuthenticated ? "Dashboard" : t("nav.login")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
