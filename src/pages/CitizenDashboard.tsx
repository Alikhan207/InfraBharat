
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LanguageSelector } from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/NotificationBell";
import { CitizenChatbot } from "@/components/CitizenChatbot";
import { AlertCircle, CheckCircle, Clock, FileText, LogOut, MapPin, Camera, Navigation } from "lucide-react";

const CitizenDashboard = () => {
  const [complaint, setComplaint] = useState("");
  const [location, setLocation] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [points, setPoints] = useState(150);
  const [complaints, setComplaints] = useState([
    { id: "#IB2024001", status: "In Progress", location: "MG Road, Bangalore", date: "2024-01-15" },
    { id: "#IB2024002", status: "Resolved", location: "CP Metro Station, Delhi", date: "2024-01-10" },
    { id: "#IB2024003", status: "Under Review", location: "Bandra West, Mumbai", date: "2024-01-12" },
  ]);

  // Route Finding State
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [safeRouteResult, setSafeRouteResult] = useState<{
    route: string;
    eta: string;
    status: string;
    warning?: string;
  } | null>(null);

  const [routes, setRoutes] = useState([
    { from: "Connaught Place", to: "India Gate", status: "Clear", eta: "25 mins" },
    { from: "Karol Bagh", to: "Rajouri Garden", status: "Moderate Risk", eta: "35 mins" },
    { from: "Dwarka", to: "Gurgaon", status: "High Risk", eta: "Avoid" },
  ]);

  // Real-time route updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setRoutes(prevRoutes => prevRoutes.map(route => {
        // Randomly update status and ETA for a "live" feel
        if (Math.random() > 0.7) {
          const statuses = ["Clear", "Moderate Risk", "High Risk"];
          const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
          const baseEta = parseInt(route.eta);
          const newEta = newStatus === "Avoid" ? "Avoid" : `${Math.max(15, baseEta + Math.floor(Math.random() * 10 - 5))} mins`;
          return { ...route, status: newStatus, eta: newEta };
        }
        return route;
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{ confidence: number; detected: string } | null>(null);

  const simulateAIAnalysis = async (file: File) => {
    setIsAnalyzing(true);
    setAiAnalysis(null);

    // Simulate network delay for AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock AI results
    const mockCategories = ["Water Logging", "Pothole", "Garbage Dump", "Broken Street Light"];
    const detectedCategory = mockCategories[Math.floor(Math.random() * mockCategories.length)];

    setIsAnalyzing(false);
    setAiAnalysis({
      confidence: 85 + Math.floor(Math.random() * 10),
      detected: detectedCategory
    });

    // Auto-fill form
    setComplaint(`Automated Report: Detected severe ${detectedCategory} in the uploaded image. Immediate attention recommended.`);

    toast({
      title: "AI Analysis Complete",
      description: "We've auto-filled the details based on your photo.",
    });
  };

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (complaint && location) {
      // Add new complaint
      const newComplaint = {
        id: `#IB${Math.floor(Math.random() * 10000)}`,
        status: "Under Review",
        location: location,
        date: new Date().toISOString().split('T')[0]
      };
      setComplaints([newComplaint, ...complaints]);

      // Update points
      setPoints(prev => prev + 50);

      toast({
        title: "Complaint Submitted! +50 Points",
        description: "Your complaint has been registered. Complaint ID: " + newComplaint.id,
        className: "bg-green-50 border-green-200",
      });
      setComplaint("");
      setLocation("");
      setAiAnalysis(null);
    }
  };

  const handleFindSafeRoute = async () => {
    if (!fromLocation || !toLocation) {
      toast({
        title: "Missing Locations",
        description: "Please enter both From and To locations.",
        variant: "destructive"
      });
      return;
    }

    setIsCalculatingRoute(true);
    setSafeRouteResult(null);

    // Simulate calculation delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsCalculatingRoute(false);
    setSafeRouteResult({
      route: `Via Outer Ring Road (Avoiding ${toLocation} Main Rd)`,
      eta: "42 mins",
      status: "Safe",
      warning: "Traffic is slightly heavier, but this route avoids severe waterlogging detected on the main highway."
    });

    toast({
      title: "Safe Route Found",
      description: "We found a route avoiding waterlogged areas.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-infra-green-500 to-infra-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">IB</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Citizen Dashboard</h1>
            </div>
            <div className="flex items-center space-x-3">
              <NotificationBell />
              <LanguageSelector />
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem("demo_role");
                  navigate("/");
                }}
                className="border-gray-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome, Citizen!</h2>
          <p className="text-gray-600">Report issues and access safe route recommendations</p>

          {/* Gamification Summary */}
          <div className="mt-6 bg-gradient-to-r from-infra-blue-600 to-infra-blue-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16" />
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Your Impact Score</p>
                <h3 className="text-4xl font-bold">{points} <span className="text-lg font-normal text-blue-200">pts</span></h3>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-400/20 text-white hover:bg-blue-400/30 border-0">
                    Level 2: Active Citizen
                  </Badge>
                  <span className="text-xs text-blue-200">Next: Guardian (350 pts)</span>
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm text-blue-100 mb-1">Reports Verified</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-6 h-2 bg-blue-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 w-[42%]" style={{ width: `${(points / 350) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Report Complaint */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📝</span>
                <span>Report Water Logging Issue</span>
              </CardTitle>
              <CardDescription>
                Help us identify and resolve drainage problems in your area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleComplaintSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="photo-upload">Upload Photo (AI Auto-Detect)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="cursor-pointer"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          simulateAIAnalysis(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 text-sm text-infra-blue-600 animate-pulse">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-infra-blue-600 border-t-transparent" />
                      Analyzing image structure and severity...
                    </div>
                  )}
                  {aiAnalysis && (
                    <div className="bg-infra-blue-50 border border-infra-blue-200 rounded-lg p-3 flex items-start gap-3">
                      <div className="p-2 bg-infra-blue-100 rounded-full">
                        <Camera className="h-4 w-4 text-infra-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-infra-blue-800">AI Analysis Complete</p>
                        <p className="text-xs text-infra-blue-600">
                          Detected <span className="font-semibold">{aiAnalysis.detected}</span> with {aiAnalysis.confidence}% confidence.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Enter specific location (e.g., MG Road, Bangalore)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complaint">Issue Description</Label>
                  <Textarea
                    id="complaint"
                    placeholder="Describe the water logging issue, severity, and any other relevant details..."
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-infra-green-600 hover:bg-infra-green-700"
                >
                  Submit Complaint
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Safe Routes */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>🗺️</span>
                    <span>Safe Route Finder</span>
                  </CardTitle>
                  <CardDescription>
                    Find the fastest route avoiding waterlogged areas
                  </CardDescription>
                </div>
                <Badge variant="outline" className="animate-pulse text-green-600 border-green-600">
                  <span className="w-2 h-2 rounded-full bg-green-600 mr-1"></span>
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Route Finder Form */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from">From</Label>
                    <Input
                      id="from"
                      placeholder="Current Location"
                      value={fromLocation}
                      onChange={(e) => setFromLocation(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="to">To</Label>
                    <Input
                      id="to"
                      placeholder="Destination"
                      value={toLocation}
                      onChange={(e) => setToLocation(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleFindSafeRoute}
                  disabled={isCalculatingRoute}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isCalculatingRoute ? (
                    <>
                      <Navigation className="mr-2 h-4 w-4 animate-spin" />
                      Calculating Safe Route...
                    </>
                  ) : (
                    <>
                      <Navigation className="mr-2 h-4 w-4" />
                      Find Safe Route
                    </>
                  )}
                </Button>

                {safeRouteResult && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-green-900">Recommended Route</h4>
                      <Badge className="bg-green-600">{safeRouteResult.eta}</Badge>
                    </div>
                    <p className="text-sm font-medium text-green-800 mb-1">{safeRouteResult.route}</p>
                    <p className="text-xs text-green-700">{safeRouteResult.warning}</p>
                  </div>
                )}
              </div>

              {/* Popular Routes Status */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Popular Routes Status</h4>
                <div className="space-y-3">
                  {routes.map((route, index) => (
                    <div key={index} className="p-3 border rounded-lg transition-all duration-500 hover:shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium">
                          {route.from} → {route.to}
                        </div>
                        <Badge
                          variant={route.status === "Clear" ? "default" :
                            route.status === "Moderate Risk" ? "secondary" : "destructive"}
                          className={route.status === "Clear" ? "bg-green-100 text-green-800" : ""}
                        >
                          {route.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">ETA: {route.eta}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Complaints */}
          <Card className="shadow-lg border-0 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📋</span>
                <span>My Complaints Status</span>
              </CardTitle>
              <CardDescription>
                Track the progress of your submitted complaints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complaints.map((complaint, index) => (
                  <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{complaint.id}</div>
                      <div className="text-sm text-gray-600">{complaint.location}</div>
                      <div className="text-xs text-gray-500">Submitted: {complaint.date}</div>
                    </div>
                    <Badge
                      variant={complaint.status === "Resolved" ? "default" : "secondary"}
                      className={complaint.status === "Resolved" ? "bg-green-100 text-green-800" : ""}
                    >
                      {complaint.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <CitizenChatbot />
    </div>
  );
};

export default CitizenDashboard;
