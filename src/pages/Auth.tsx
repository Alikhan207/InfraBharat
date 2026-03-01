import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import { LanguageSelector } from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"citizen" | "official" | "contractor">("citizen");
  const [emailPlaceholder, setEmailPlaceholder] = useState("citizen@example.com");
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Check if user is already logged in
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        // 1. Check Demo Mode first
        const demoRole = localStorage.getItem("demo_role");
        if (demoRole) {
          if (demoRole === "official") navigate("/official-dashboard");
          else if (demoRole === "contractor") navigate("/contractor-dashboard");
          else navigate("/citizen-dashboard");
          return;
        }

        // 2. Check Supabase Session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
          // Check metadata first (fastest and most reliable if set during signup)
          const metadataRole = session.user.user_metadata?.role;

          if (metadataRole === "official") {
            navigate("/official-dashboard");
            return;
          } else if (metadataRole === "contractor") {
            navigate("/contractor-dashboard");
            return;
          } else if (metadataRole === "citizen") {
            navigate("/citizen-dashboard");
            return;
          }

          // Fallback to DB if metadata is missing
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (roleData?.role === "official") {
            navigate("/official-dashboard");
          } else if ((roleData?.role as string) === "contractor") {
            navigate("/contractor-dashboard");
          } else {
            navigate("/citizen-dashboard");
          }
        }
      } catch (error) {
        console.log("Session check failed (likely demo mode or network error):", error);
      }
    };

    checkExistingSession();
  }, [navigate]);

  // Update email placeholder when role changes
  useEffect(() => {
    switch (selectedRole) {
      case "official":
        setEmailPlaceholder("official@example.com");
        break;
      case "contractor":
        setEmailPlaceholder("contractor@example.com");
        break;
      case "citizen":
      default:
        setEmailPlaceholder("citizen@example.com");
        break;
    }
  }, [selectedRole]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user && data.session) {
        toast({
          title: t("loginSuccess"),
          description: t("welcomeBack"),
        });

        // 1. Try to get session details from new backend endpoint
        try {
          const sessionRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-session`, {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`
            }
          });

          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            if (sessionData.role === 'official') {
              navigate("/official-dashboard");
            } else if (sessionData.role === 'contractor') {
              navigate("/contractor-dashboard");
            } else {
              navigate("/citizen-dashboard");
            }
            return;
          }
        } catch (e) {
          console.warn("Auth session endpoint unreachable, falling back to client logic");
        }

        // 2. Fallback: Client-side Role Check
        let role = "citizen";

        // Check Metadata (Primary)
        if (data.user.user_metadata?.role) {
          role = data.user.user_metadata.role;
        }
        // Check DB (Secondary)
        else {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id)
            .maybeSingle();

          if (roleData) role = roleData.role;
        }

        // Hardcoded admin check for fallback
        if (email.toLowerCase().includes("official") || email.toLowerCase().includes("admin")) {
          role = "official";
        } else if (email.toLowerCase().includes("contractor")) {
          role = "contractor";
        }

        // Deterministic Redirect
        if (role === "official") {
          navigate("/official-dashboard");
        } else if (role === "contractor") {
          navigate("/contractor-dashboard");
        } else {
          navigate("/citizen-dashboard");
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);

      // Handle "Invalid login credentials" - Suggest Signup
      // CRITICAL: Do NOT allow fallback to offline mode for auth errors
      if (error.message === "Invalid login credentials" || error.message.includes("Invalid login credentials")) {
        toast({
          title: "Account not found or Incorrect Password",
          description: "Please check your credentials or sign up if you don't have an account.",
          variant: "destructive",
        });
        // Optional: Switch to signup if we are sure they don't exist, but for bad password we shouldn't.
        // For now, let's just show the error.
        setLoading(false);
        return;
      }

      // Handle "Email not confirmed"
      if (error.message?.includes("Email not confirmed")) {
        toast({
          title: "Email Not Confirmed",
          description: "Please check your inbox and confirm your email address.",
          variant: "default",

        });
        setLoading(false);
        return;
      }

      // Network Error -> Activate Demo Mode ONLY if it's actually a network error
      const isNetworkError = error.message?.includes("Failed to fetch") || error.message?.includes("Load failed") || !import.meta.env.VITE_SUPABASE_URL;

      if (isNetworkError) {
        let role = "citizen";
        if (email.toLowerCase().includes("official") || email.toLowerCase().includes("admin")) {
          role = "official";
        } else if (email.toLowerCase().includes("contractor")) {
          role = "contractor";
        }

        // Save demo session
        localStorage.setItem("demo_role", role);
        localStorage.setItem("demo_user", JSON.stringify({ email, role }));

        toast({
          title: "Login Successful (Offline Mode)",
          description: "Backend unreachable. Logging in with simulated access.",
        });

        if (role === "official") {
          navigate("/official-dashboard");
        } else if (role === "contractor") {
          navigate("/contractor-dashboard");
        } else {
          navigate("/citizen-dashboard");
        }
        return;
      }

      // For all other errors (e.g. rate limit, server error), show the error message
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            role: selectedRole,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Manual Insert Fallback (since triggers might be missing)
        try {
          await supabase.from("profiles").insert({
            id: data.user.id,
            full_name: fullName,
          });

          await supabase.from("user_roles").insert({
            user_id: data.user.id,
            role: selectedRole as any,
          });
        } catch (dbError) {
          console.warn("Manual DB insert failed (likely RLS or trigger already handled it):", dbError);
        }

        toast({
          title: t("signupSuccess"),
          description: t("accountCreated"),
        });

        // Redirect based on role (role is automatically set via trigger)
        if (selectedRole === "official") {
          navigate("/official-dashboard");
        } else if (selectedRole === "contractor") {
          navigate("/contractor-dashboard");
        } else {
          navigate("/citizen-dashboard");
        }
      }
    } catch (error: any) {
      console.error("Signup error:", error);

      // Handle "User already registered"
      if (error.message?.includes("already registered")) {
        toast({
          title: "Account exists",
          description: "Used this email before? Please log in.",
        });
        setActiveTab("login");
        setLoading(false);
        return;
      }

      // Handle Network/Fetch Errors by falling back to Demo Mode
      if (error.message?.includes("Failed to fetch") || error.message?.includes("Load failed")) {

        // Simulate successful signup/login
        localStorage.setItem("demo_role", selectedRole);
        localStorage.setItem("demo_user", JSON.stringify({
          email,
          fullName,
          role: selectedRole
        }));

        toast({
          title: "Account Created",
          description: "Welcome! Operating in offline mode.",
        });

        // Redirect immediately
        if (selectedRole === "official") {
          navigate("/official-dashboard");
        } else if (selectedRole === "contractor") {
          navigate("/contractor-dashboard");
        } else {
          navigate("/citizen-dashboard");
        }
        return;
      }

      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="absolute top-4 right-4 flex gap-2">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">InfraBharat</CardTitle>
          <CardDescription className="text-center">
            {t("authSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t("login")}</TabsTrigger>
              <TabsTrigger value="signup">{t("signup")}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t("email")}</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="citizen@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">{t("password")}</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("loading") : t("signIn")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t("fullName")}</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder={t("enterFullName")}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t("email")}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder={emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t("password")}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("accountType")}</Label>
                  <RadioGroup value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="citizen" id="citizen" />
                      <Label htmlFor="citizen" className="font-normal">{t("citizen")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="official" id="official" />
                      <Label htmlFor="official" className="font-normal">{t("official")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="contractor" id="contractor" />
                      <Label htmlFor="contractor" className="font-normal">Contractor</Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("loading") : t("createAccount")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => navigate("/")}
          >
            {t("backToHome")}
          </Button>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-muted-foreground mb-3">Demo Access (No Login Required)</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="w-full border-blue-200 hover:bg-blue-50 text-blue-700 text-xs px-2"
                onClick={() => {
                  localStorage.setItem("demo_role", "citizen");
                  navigate("/citizen-dashboard");
                }}
              >
                Demo Citizen
              </Button>
              <Button
                variant="outline"
                className="w-full border-purple-200 hover:bg-purple-50 text-purple-700 text-xs px-2"
                onClick={() => {
                  localStorage.setItem("demo_role", "official");
                  navigate("/official-dashboard");
                }}
              >
                Demo Official
              </Button>
              <Button
                variant="outline"
                className="w-full border-orange-200 hover:bg-orange-50 text-orange-700 text-xs px-2"
                onClick={() => {
                  localStorage.setItem("demo_role", "contractor");
                  navigate("/contractor-dashboard");
                }}
              >
                Demo Contractor
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
