import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import { LanguageSelector } from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/NotificationBell";
import { LogOut, MapPin, Camera, Send } from "lucide-react";
import MapView from "@/components/MapView";

export default function CitizenReporting() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("waterlogging");
  const [severity, setSeverity] = useState("3");
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState("");

  useEffect(() => {
    checkAuth();
    getCurrentLocation();
    fetchUserReports();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Error",
            description: "Could not get your current location. Please enter address manually.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const fetchUserReports = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setReports(data);
  };

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{ confidence: number; detected: string } | null>(null);

  const simulateAIAnalysis = async (file: File) => {
    setIsAnalyzing(true);
    setAiAnalysis(null);

    // Simulate network delay for AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock AI results based on file name or random for demo
    // In a real app, this would call a Vision API
    const mockCategories = ["waterlogging", "road_damage", "garbage", "street_light"];
    const detectedCategory = mockCategories[Math.floor(Math.random() * mockCategories.length)];

    setIsAnalyzing(false);
    setAiAnalysis({
      confidence: 85 + Math.floor(Math.random() * 10),
      detected: detectedCategory.replace("_", " ")
    });

    // Auto-fill form based on "AI" findings
    setTitle(`Reported ${detectedCategory.replace("_", " ")} Issue`);
    setCategory(detectedCategory);
    setSeverity(Math.floor(Math.random() * 3 + 3).toString()); // 3-5 severity
    setDescription(`Automated Report: Detected severe ${detectedCategory.replace("_", " ")} in the uploaded image. Immediate attention recommended.`);

    toast({
      title: "AI Analysis Complete",
      description: "We've auto-filled the details based on your photo.",
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    // Trigger AI Analysis on the first file
    if (files.length > 0) {
      simulateAIAnalysis(files[0]);
    }

    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('report-photos')
        .upload(fileName, file);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('report-photos')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!user || !location) {
      toast({
        title: "Error",
        description: "User location not available",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Upload photos if any
    const fileInput = document.getElementById('photoUpload') as HTMLInputElement;
    let photoUrls: string[] = [];
    if (fileInput?.files && fileInput.files.length > 0) {
      photoUrls = await handleFileUpload({ target: fileInput } as any) || [];
    }

    const { error } = await supabase.from("reports").insert([{
      user_id: user.id,
      title,
      description,
      category: category as any,
      severity: parseInt(severity),
      address,
      location: `POINT(${location[0]} ${location[1]})`,
      photo_urls: photoUrls.length > 0 ? photoUrls : null,
    }]);

    if (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Success! +50 Points",
      description: "Report submitted successfully. You've earned 50 citizen points!",
      className: "bg-green-50 border-green-200",
    });

    // Reset form
    setTitle("");
    setDescription("");
    setCategory("waterlogging");
    setSeverity("3");
    setAddress("");
    setAiAnalysis(null);
    if (fileInput) fileInput.value = '';

    fetchUserReports();
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">InfraBharat - Citizen Reporting</h1>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <LanguageSelector />
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              {t("logout")}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report Form */}
          <Card>
            <CardHeader>
              <CardTitle>Report an Issue</CardTitle>
              <CardDescription>Help improve your city by reporting infrastructure issues</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="photoUpload">Upload Photo (AI Auto-Detection)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="photoUpload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="cursor-pointer"
                      onChange={(e) => {
                        // The actual upload happens on submit, but we trigger analysis here
                        if (e.target.files && e.target.files.length > 0) {
                          simulateAIAnalysis(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Analyzing image structure and severity...
                    </div>
                  )}
                  {aiAnalysis && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Camera className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">AI Analysis Complete</p>
                        <p className="text-xs text-muted-foreground">
                          Detected <span className="font-semibold">{aiAnalysis.detected}</span> with {aiAnalysis.confidence}% confidence.
                          Form details have been auto-filled.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Issue Title</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the issue"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="waterlogging">Waterlogging</SelectItem>
                      <SelectItem value="drainage_blockage">Drainage Blockage</SelectItem>
                      <SelectItem value="flooding">Flooding</SelectItem>
                      <SelectItem value="road_damage">Road Damage</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">Severity (1-5)</Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Minor</SelectItem>
                      <SelectItem value="2">2 - Low</SelectItem>
                      <SelectItem value="3">3 - Moderate</SelectItem>
                      <SelectItem value="4">4 - High</SelectItem>
                      <SelectItem value="5">5 - Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide details about the issue"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address / Landmark</Label>
                  <Input
                    id="address"
                    placeholder="Enter nearby landmark or address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {location ? "Location captured" : "Getting location..."}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? "Submitting..." : "Submit Report"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Map and Reports */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {location && (
                    <MapView
                      center={location}
                      zoom={15}
                      reports={reports}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Reports</CardTitle>
                <CardDescription>Track your submitted reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No reports yet. Submit your first report above.
                    </p>
                  ) : (
                    reports.slice(0, 5).map((report) => (
                      <div key={report.id} className="border-b pb-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">{report.title}</h4>
                          <span className="text-xs px-2 py-1 rounded bg-secondary">
                            {report.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
