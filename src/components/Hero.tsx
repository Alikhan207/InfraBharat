
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { User, Building, MapPin, Activity, Shield, TrendingUp, Zap } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("citizen");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      toast({
        title: "Input Required",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // 1. Attempt Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // 2. Handle specific errors
        if (error.message.includes("Invalid login credentials") || error.message.includes("Account not found")) {
          // 2a. Attempt Auto-Signup (Feature: Seamless Access)
          console.log("Account not found, attempting auto-signup...");

          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                role: userType,
                full_name: email.split("@")[0]
              }
            }
          });

          if (signUpError) {
            // If signup fails because user exists (wrong password case), throw original error
            if (signUpError.message.includes("already registered")) {
              throw new Error("Incorrect Password. Please try again.");
            }
            throw signUpError;
          }

          if (signUpData.user) {
            // Check if session exists (Auto-confirm might be off)
            if (!signUpData.session) {
              toast({
                title: "Account Created",
                description: "Please check your email to confirm your account.",
              });
              setLoading(false);
              return;
            }

            // Success - Auto-Signup Logged In
            toast({
              title: "Welcome to InfraBharat!",
              description: "New account created and logged in successfully.",
            });

            // Proceed to navigation logic
            const role = userType;
            if (role === "official") navigate("/official-dashboard");
            else if (role === "contractor") navigate("/contractor-dashboard");
            else navigate("/citizen-dashboard");
            return;
          }
        }

        // Check for Network Error
        if (error.message.includes("Failed to fetch") || error.message.includes("Load failed")) {
          throw new Error("NETWORK_ERROR"); // Trigger offline fallback catch block
        }

        throw error;
      };

      // 3. Normal Login Success
      if (data.user) {
        toast({
          title: "Login Successful",
          description: `Welcome back!`,
        });

        // Determine redirection based on role
        let role = userType; // Default to selected tab

        // Check Metadata
        if (data.user.user_metadata?.role) {
          role = data.user.user_metadata.role;
        }

        if (role === "official") navigate("/official-dashboard");
        else if (role === "contractor") navigate("/contractor-dashboard");
        else navigate("/citizen-dashboard");
      }
    } catch (error: any) {
      console.error("Login process error:", error);

      // 4. Offline / Backup Demo Mode
      if (error.message === "NETWORK_ERROR" || error.message?.includes("Failed to fetch") || error.message?.includes("Load failed")) {
        toast({
          title: "Offline Mode Activated",
          description: "Backend unreachable. Logging in with temporary demo access.",
        });

        const role = userType;
        localStorage.setItem("demo_role", role);
        localStorage.setItem("demo_user", JSON.stringify({ email, role }));

        if (role === "official") navigate("/official-dashboard");
        else if (role === "contractor") navigate("/contractor-dashboard");
        else navigate("/citizen-dashboard");
        return;
      }

      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden">
      {/* Enhanced Indian Map Background */}
      <div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.15]">
        <svg viewBox="0 0 1200 800" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
          {/* Main Indian subcontinent outline */}
          <path d="M300,150 Q350,120 420,140 Q480,130 550,150 Q620,140 690,160 Q760,150 820,180 Q880,170 920,200 L950,250 Q940,300 920,350 Q900,400 870,450 Q840,500 800,540 Q750,580 700,600 Q650,610 600,620 Q550,630 500,625 Q450,620 400,610 Q350,600 300,580 Q250,560 220,520 Q200,480 210,440 Q220,400 240,360 Q260,320 280,280 Q290,240 300,200 Z"
            fill="currentColor" className="text-emerald-600 dark:text-emerald-400" />

          {/* Kashmir region */}
          <path d="M380,120 Q400,110 420,115 Q440,120 460,130 Q470,140 465,150 Q460,160 450,165 Q430,170 410,165 Q390,160 385,150 Q380,140 380,130 Z"
            fill="currentColor" className="text-emerald-600 dark:text-emerald-400" />

          {/* Northeast states */}
          <path d="M850,200 Q870,190 890,195 Q910,200 925,215 Q935,230 930,245 Q925,260 915,270 Q900,275 885,270 Q870,265 860,250 Q855,235 855,220 Z"
            fill="currentColor" className="text-emerald-600 dark:text-emerald-400" />

          {/* Major cities markers */}
          <circle cx="350" cy="280" r="4" fill="currentColor" className="text-blue-600 dark:text-blue-400" opacity="0.8" />
          <circle cx="480" cy="320" r="4" fill="currentColor" className="text-blue-600 dark:text-blue-400" opacity="0.8" />
          <circle cx="620" cy="380" r="4" fill="currentColor" className="text-blue-600 dark:text-blue-400" opacity="0.8" />
          <circle cx="720" cy="450" r="4" fill="currentColor" className="text-blue-600 dark:text-blue-400" opacity="0.8" />
          <circle cx="550" cy="520" r="4" fill="currentColor" className="text-blue-600 dark:text-blue-400" opacity="0.8" />

          {/* River networks */}
          <path d="M400,200 Q450,220 500,240 Q550,260 600,280" stroke="currentColor" strokeWidth="2" fill="none" className="text-blue-400 dark:text-blue-300" opacity="0.6" />
          <path d="M500,300 Q520,340 540,380 Q560,420 580,460" stroke="currentColor" strokeWidth="2" fill="none" className="text-blue-400 dark:text-blue-300" opacity="0.6" />
        </svg>
      </div>

      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-50/90 via-transparent to-slate-50/90 dark:from-slate-900/90 dark:via-transparent dark:to-slate-900/90"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-screen">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                <Zap className="h-4 w-4 mr-2" />
                AI-Powered Infrastructure Platform
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="text-slate-900 dark:text-white">Infra</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">Bharat</span>
              </h1>

              <h2 className="text-2xl md:text-3xl font-semibold text-slate-700 dark:text-slate-300">
                Smart Infrastructure for New India
              </h2>

              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {t("hero.description")}
              </p>
            </div>

            {/* Enhanced Key Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group p-6 bg-white/70 dark:bg-slate-800/70 rounded-xl backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">500+</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Cities Covered</div>
                  </div>
                </div>
              </div>

              <div className="group p-6 bg-white/70 dark:bg-slate-800/70 rounded-xl backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">10K+</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Systems Analyzed</div>
                  </div>
                </div>
              </div>

              <div className="group p-6 bg-white/70 dark:bg-slate-800/70 rounded-xl backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">95%</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Accuracy Rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Government Badge */}
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg text-white font-medium shadow-lg">
              <Shield className="h-5 w-5 mr-2" />
              Government of India Initiative
            </div>
          </div>

          {/* Right Column - Login Card */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
              <CardHeader className="text-center pb-6 space-y-2">
                <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                  {t("login.welcome")}
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-base">
                  Access your infrastructure dashboard
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <Tabs value={userType} onValueChange={setUserType}>
                  <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-700">
                    <TabsTrigger value="citizen" className="text-sm flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600">
                      <User className="h-4 w-4" />
                      <span>{t("login.citizen")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="official" className="text-sm flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600">
                      <Building className="h-4 w-4" />
                      <span>{t("login.official")}</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="citizen" className="mt-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300 text-center font-medium">
                        Report issues and access route recommendations
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="official" className="mt-4">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <p className="text-sm text-emerald-700 dark:text-emerald-300 text-center font-medium">
                        AI-powered analytics and infrastructure insights
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-slate-700"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold text-base shadow-lg"
                    disabled={loading}
                  >
                    {loading ? "Signing In..." : "Sign In to Dashboard"}
                  </Button>
                </form>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-center text-slate-500 mb-3 font-medium uppercase tracking-wide">
                    Or Try Demo Access
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs border-blue-200 hover:bg-blue-50 text-blue-700"
                      onClick={() => {
                        localStorage.setItem("demo_role", "citizen");
                        localStorage.setItem("demo_user", JSON.stringify({ email: "demo_citizen@example.com", role: "citizen" }));
                        navigate("/citizen-dashboard");
                        toast({ title: "Welcome!", description: "Entered as Demo Citizen" });
                      }}
                    >
                      Citizen
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                      onClick={() => {
                        localStorage.setItem("demo_role", "official");
                        localStorage.setItem("demo_user", JSON.stringify({ email: "demo_official@example.com", role: "official" }));
                        navigate("/official-dashboard");
                        toast({ title: "Welcome!", description: "Entered as Demo Official" });
                      }}
                    >
                      Official
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs border-orange-200 hover:bg-orange-50 text-orange-700"
                      onClick={() => {
                        localStorage.setItem("demo_role", "contractor");
                        localStorage.setItem("demo_user", JSON.stringify({ email: "demo_contractor@example.com", role: "contractor" }));
                        navigate("/contractor-dashboard");
                        toast({ title: "Welcome!", description: "Entered as Demo Contractor" });
                      }}
                    >
                      Contractor
                    </Button>
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/auth?tab=signup")}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                    >
                      Sign Up
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
