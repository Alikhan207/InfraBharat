
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CitizenDashboard from "./pages/CitizenDashboard";
import CitizenReporting from "./pages/CitizenReporting";
import OfficerDashboard from "./pages/OfficerDashboard";
import OfficialDashboard from "./pages/OfficialDashboard";
import ContractorDashboard from "./pages/ContractorDashboard";
import TransparencyDashboard from "./pages/TransparencyDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="infra-bharat-theme">
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Auth />} />
              <Route
                path="/citizen-dashboard"
                element={
                  <ProtectedRoute requiredRole="citizen">
                    <CitizenDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen-reporting"
                element={
                  <ProtectedRoute requiredRole="citizen">
                    <CitizenReporting />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/officer-dashboard"
                element={
                  <ProtectedRoute requiredRole="official">
                    <OfficerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/official-dashboard"
                element={
                  <ProtectedRoute requiredRole="official">
                    <OfficialDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contractor-dashboard"
                element={
                  <ProtectedRoute requiredRole="contractor">
                    <ContractorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/transparency" element={<TransparencyDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
