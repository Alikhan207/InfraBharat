import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector } from "@/components/language-selector";
import { NotificationBell } from "@/components/NotificationBell";
import { DrainageAnalysisForm } from "@/components/DrainageAnalysisForm";
import { WeatherRiskAlert } from "@/components/WeatherRiskAlert";
import { useLanguage } from "@/components/language-provider";
import MapView from "@/components/MapView";
import { DrainageVisualization3D } from "@/components/DrainageVisualization3D";
import { LogOut, TrendingUp, AlertTriangle, MapPin, IndianRupee, Clock, CheckCircle } from "lucide-react";

export default function OfficialDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [zones, setZones] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("weather");
  const [active3DModelUrl, setActive3DModelUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const applyMockData = () => {
      setZones([
        { id: '1', name: 'Zone 1 (Indiranagar)', flood_risk_score: 0.2, ward_number: 112, metadata: { description: 'Residential heavy', centroid: { lat: 12.9716, lng: 77.6412 }, last_inspection: '2024-03-01' }, population: 45000, area_sqkm: 4.2 },
        { id: '2', name: 'Zone 2 (Koramangala)', flood_risk_score: 0.8, ward_number: 151, metadata: { description: 'Low lying area', centroid: { lat: 12.9352, lng: 77.6245 }, last_inspection: '2024-02-28' }, population: 52000, area_sqkm: 3.8 },
        { id: '3', name: 'Zone 3 (Whitefield)', flood_risk_score: 0.4, ward_number: 85, metadata: { description: 'IT Corridor', centroid: { lat: 12.9698, lng: 77.7500 }, last_inspection: '2024-03-05' }, population: 68000, area_sqkm: 6.5 },
        { id: '4', name: 'Zone 4 (MG Road)', flood_risk_score: 0.85, ward_number: 111, metadata: { description: 'Central Business District', centroid: { lat: 12.9756, lng: 77.6097 }, last_inspection: '2024-03-10' }, population: 25000, area_sqkm: 2.1 },
        { id: '5', name: 'Zone 5 (Jayanagar)', flood_risk_score: 0.3, ward_number: 168, metadata: { description: 'Planned residential', centroid: { lat: 12.9250, lng: 77.5938 }, last_inspection: '2024-03-12' }, population: 58000, area_sqkm: 5.1 },
        { id: '6', name: 'Zone 6 (HSR Layout)', flood_risk_score: 0.6, ward_number: 174, metadata: { description: 'Reclaimed lake bed sectors', centroid: { lat: 12.9121, lng: 77.6446 }, last_inspection: '2024-03-08' }, population: 49000, area_sqkm: 4.5 },
        { id: '7', name: 'Zone 7 (Electronic City)', flood_risk_score: 0.75, ward_number: 192, metadata: { description: 'Industrial & Residential', centroid: { lat: 12.8452, lng: 77.6602 }, last_inspection: '2024-03-15' }, population: 75000, area_sqkm: 8.2 },
        { id: '8', name: 'Zone 8 (Malleshwaram)', flood_risk_score: 0.25, ward_number: 45, metadata: { description: 'Old Bengaluru', centroid: { lat: 13.0031, lng: 77.5643 }, last_inspection: '2024-03-18' }, population: 42000, area_sqkm: 3.5 },
      ]);

      setReports([
        { id: '101', title: 'Severe Waterlogging', description: 'Main road blocked due to heavy rain', status: 'pending', priority: 'high', created_at: new Date().toISOString() },
        { id: '102', title: 'Blocked Drain', description: 'Plastic waste clogging the drainage', status: 'in_progress', priority: 'medium', created_at: new Date().toISOString() },
        { id: '103', title: 'Manhole Overflow', description: 'Sewage overflow near market', status: 'resolved', priority: 'high', created_at: new Date().toISOString() },
        { id: '104', title: 'Pothole Detection', description: 'AI detected multiple potholes', status: 'pending', priority: 'medium', created_at: new Date().toISOString() },
        {
          id: '105',
          title: 'Drainage Analysis: Sector 4',
          description: 'Automated analysis from uploaded blueprint.',
          summary: 'Complex drainage network with potential bottlenecks. Flow capacity sufficient for average rainfall but risky during monsoon.',
          model_url: 'https://github.com/KhronosGroup/glTF-Sample-Models/raw/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
          status: 'pending',
          priority: 'medium',
          created_at: new Date().toISOString()
        },
      ]);

      setRecommendations([
        {
          id: '201',
          title: 'Upgrade Main Drainage Pipeline',
          description: 'AI recommends upgrading to 5200mm HDPE pipe at Zone 4 junction to mitigate predicted flash flood cascade.',
          priority: 'high',
          estimated_cost: 450000,
          estimated_timeline_days: 5,
          zones: { name: 'Zone 4 (MG Road)' },
          type: 'pipe_upgrade',
          equation_data: { n: 0.013, A: 21.2, R: 1.3, S: 0.005, Q_calculated: 125.4 }
        },
        {
          id: '202',
          title: 'Install Green Infrastructure Buffer',
          description: 'Plant 150 Neem trees and create bio-swales in Sector 2 to absorb surface runoff naturally and reduce load on sewer lines.',
          priority: 'medium',
          estimated_cost: 120000,
          estimated_timeline_days: 12,
          zones: { name: 'Zone 2 (Koramangala)' },
          type: 'green_infra',
          green_score: { co2_absorption_kg: 3200, runoff_reduction_l: 15000, permeability_improvement: 25, climate_score: 92 }
        },
        {
          id: '203',
          title: 'Sensor & Grating Upgrade',
          description: 'Replace aging flow sensors and clear silt around Zone 1.',
          priority: 'low',
          estimated_cost: 85000,
          estimated_timeline_days: 7,
          zones: { name: 'Zone 1 (Indiranagar)' }
        },
      ]);


      setLoading(false);
    };

    // Check for Demo Mode first - Skip Backend if active
    if (localStorage.getItem("demo_role")) {
      console.log("Demo mode active, loading mock data directly.");
      applyMockData();
      return;
    }

    try {
      const [zonesResult, reportsResult, recommendationsResult] = await Promise.all([
        supabase.from("zones").select("*"),
        supabase.from("reports").select("*").order("created_at", { ascending: false }),
        supabase.from("ai_recommendations").select("*, zones(name)").order("priority", { ascending: false }),
      ]);

      if (zonesResult.data && zonesResult.data.length > 0) setZones(zonesResult.data);
      else throw new Error("No data"); // Trigger mock fallback

      if (reportsResult.data) setReports(reportsResult.data);
      if (recommendationsResult.data) setRecommendations(recommendationsResult.data);
    } catch (error: any) {
      console.log("Using mock data due to error:", error.message);

      applyMockData();

      if (error.message !== "No data") {
        toast({
          title: "Demo Mode Active",
          description: "Using simulated data for demonstration.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("demo_role");
    navigate("/");
  };

  const handleZoneClick = (zone: any) => {
    setSelectedZone(zone);
  };

  const handleView3DModel = (url: string) => {
    setActive3DModelUrl(url);
    setActiveTab("3d");
  };

  const handleApproveRecommendation = async (recId: string) => {
    try {
      // In a real app, we would update Supabase here
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ status: 'open_for_bidding' })
        .eq('id', recId);

      // For demo/mock, we just update local state
      setRecommendations(prev => prev.map(r => r.id === recId ? { ...r, status: 'open_for_bidding' } : r));

      toast({
        title: "Approved for Bidding",
        description: "Recommendation has been sent to the Contractor Dashboard."
      });
    } catch (error) {
      console.error("Error approving recommendation:", error);
      toast({ title: "Error", description: "Failed to approve recommendation", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }


  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">InfraBharat - Officer Dashboard</h1>
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

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* AI Daily Briefing */}
        <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-2xl border border-gray-800 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -ml-10 -mb-10 animate-pulse delay-700" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-xs font-semibold text-blue-100 tracking-wide uppercase">AI Live Insights</span>
              </div>
              <span className="text-slate-400 text-sm font-medium">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>

            <h2 className="text-4xl font-extrabold mb-4 tracking-tight text-white leading-tight">
              Good Morning, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">Officer.</span>
            </h2>

            <p className="text-slate-300 max-w-3xl text-lg leading-relaxed mb-6">
              AI has analyzed <span className="text-white font-semibold border-b border-blue-500/50">124 new data points</span> today.
              Critical attention is needed in <span className="bg-red-500/10 text-red-200 px-1 rounded font-semibold border border-red-500/20">Zone 4 (MG Road)</span> due to
              potential waterlogging risk (85% probability).
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3 shadow-sm hover:bg-orange-500/20 transition-colors cursor-default">
                <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-orange-200 block text-sm tracking-wide uppercase mb-1 drop-shadow-sm">Cross-Zone Cascade Prediction</strong>
                  <span className="text-orange-300/80 text-sm leading-relaxed">If Zone 4 outfalls overflow, <span className="font-semibold text-orange-200">Graph Neural Network</span> simulation predicts cascading failure into Zone 2 within 45 mins based on topological elevation and pipe connectivity.</span>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3 shadow-sm hover:bg-emerald-500/20 transition-colors cursor-default">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-satellite h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5"><path d="M13 7 9 3 5 7l4 4" /><path d="m17 11 4 4-4 4-4-4" /><path d="m8 12 4 4 6-6-4-4Z" /><path d="m16 8 3-3" /><path d="m9 21 10-10" /></svg>
                <div>
                  <strong className="text-emerald-200 block text-sm tracking-wide uppercase mb-1 drop-shadow-sm">Satellite Change Detection</strong>
                  <span className="text-emerald-300/80 text-sm leading-relaxed">Multispectral imagery detected <span className="font-semibold text-emerald-200">newly paved road surface</span> (+12% runoff coefficient) in Sector 5. Digital Twin hydrological models automatically updated.</span>
                </div>
              </div>

              <div className="col-span-1 lg:col-span-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-start gap-3 shadow-sm hover:bg-indigo-500/20 transition-colors cursor-default">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-network h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5"><rect x="16" y="16" width="6" height="6" rx="1" /><rect x="2" y="16" width="6" height="6" rx="1" /><rect x="9" y="2" width="6" height="6" rx="1" /><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" /><path d="M12 12V8" /></svg>
                <div>
                  <strong className="text-indigo-200 block text-sm tracking-wide uppercase mb-1 drop-shadow-sm">Federated City Learning Network</strong>
                  <span className="text-indigo-300/80 text-sm leading-relaxed">
                    Model weights updated via <span className="font-semibold text-indigo-200">Surat Municipal Corporation</span> data sharing. Green infrastructure performance accuracy improved by 14% citywide. Cross-learning intelligence synchronized.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5"
                onClick={() => {
                  setActiveTab("reports");
                  toast({ title: "Filtered to Critical Alerts", description: "Showing high priority issues in Zone 4." });
                }}
              >
                View Critical Alerts
              </Button>
              <Button
                size="lg"
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5"
                onClick={() => toast({ title: "Downloading Report...", description: "AI Analysis Report (PDF) will be ready in seconds." })}
              >
                Download AI Report
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 transition-transform group-hover:scale-110 duration-500">
              <MapPin className="h-32 w-32" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-blue-100">Total Zones</CardTitle>
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <MapPin className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold tracking-tight">{zones.length}</div>
              <p className="text-xs text-blue-100 mt-2 flex items-center font-medium opacity-80">
                <TrendingUp className="h-3 w-3 mr-1" /> All systems active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 transition-transform group-hover:scale-110 duration-500">
              <AlertTriangle className="h-32 w-32" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-orange-100">Active Reports</CardTitle>
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold tracking-tight">
                {reports.filter((r) => r.status !== "resolved").length}
              </div>
              <p className="text-xs text-orange-100 mt-2 font-medium opacity-80">
                +5 new since yesterday
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-0 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 transition-transform group-hover:scale-110 duration-500">
              <TrendingUp className="h-32 w-32" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-purple-100">AI Recommendations</CardTitle>
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold tracking-tight">{recommendations.length}</div>
              <p className="text-xs text-purple-100 mt-2 font-medium opacity-80">
                12 pending review
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 transition-transform group-hover:scale-110 duration-500">
              <CheckCircle className="h-32 w-32" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-emerald-100">Resolution Rate</CardTitle>
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold tracking-tight">
                {reports.length > 0
                  ? Math.round((reports.filter(r => r.status === "resolved").length / reports.length) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-emerald-100 mt-2 font-medium opacity-80">
                +2.4% this week
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-center md:justify-start overflow-x-auto pb-2">
            <TabsList className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg p-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm inline-flex h-auto w-auto gap-2">
              <TabsTrigger value="weather" className="rounded-full px-4 py-2 hover:text-blue-600 transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">Weather</TabsTrigger>
              <TabsTrigger value="analysis" className="rounded-full px-4 py-2 hover:text-blue-600 transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">AI Analysis</TabsTrigger>
              <TabsTrigger value="map" className="rounded-full px-4 py-2 hover:text-blue-600 transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">Map View</TabsTrigger>
              <TabsTrigger value="3d" className="rounded-full px-4 py-2 hover:text-blue-600 transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">3D View</TabsTrigger>
              <TabsTrigger value="reports" id="reports-tab" className="rounded-full px-4 py-2 hover:text-blue-600 transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">Reports</TabsTrigger>
              <TabsTrigger value="recommendations" className="rounded-full px-4 py-2 hover:text-blue-600 transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">Actions</TabsTrigger>
              <TabsTrigger value="training" className="rounded-full px-4 py-2 hover:text-blue-600 transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">Training Data</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="weather" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <WeatherRiskAlert />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <DrainageAnalysisForm zones={zones} onRecommendationSaved={fetchDashboardData} onView3DModel={handleView3DModel} />
          </TabsContent>

          <TabsContent value="map" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="h-[600px] rounded-xl overflow-hidden shadow-lg border">
              <MapView
                zones={zones}
                reports={reports}
                onZoneClick={handleZoneClick}
              />
            </div>
            {selectedZone && (
              <Card className="animate-in slide-in-from-bottom-4">
                <CardHeader>
                  <CardTitle>{selectedZone.name}</CardTitle>
                  <CardDescription>Zone Details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Flood Risk:</span>
                    <Badge variant={selectedZone.flood_risk_score > 0.7 ? "destructive" : "secondary"}>
                      {(selectedZone.flood_risk_score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="3d" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="overflow-hidden border-0 shadow-xl">
              <CardHeader className="bg-slate-950 text-white border-b border-slate-800">
                <CardTitle>3D Drainage Infrastructure</CardTitle>
                <CardDescription className="text-slate-400">
                  Interactive digital twin of the underground drainage network
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <DrainageVisualization3D modelUrl={active3DModelUrl} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pending Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-red-50 p-3 rounded-lg border border-red-100">
                  <h3 className="font-semibold text-red-900">Pending Review</h3>
                  <Badge variant="destructive" className="rounded-full">{reports.filter(r => r.status === 'pending').length}</Badge>
                </div>
                {reports.filter(r => r.status === 'pending').map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base font-semibold line-clamp-1">{report.title}</CardTitle>
                      </div>
                      <CardDescription className="text-xs line-clamp-2 mt-1">
                        {report.summary || report.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{report.address || "Location on map"}</span>
                      </div>

                      {report.model_url && (
                        <Button size="sm" variant="secondary" className="w-full mb-3 h-8 text-xs" onClick={() => handleView3DModel(report.model_url)}>
                          View 3D Model
                        </Button>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 h-8 text-xs" onClick={() => toast({ title: "Approved", description: "Report moved to In Progress" })}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="w-full h-8 text-xs text-red-600 hover:bg-red-50" onClick={() => toast({ title: "Rejected", description: "Report marked as invalid" })}>
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* In Progress Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <h3 className="font-semibold text-orange-900">In Progress</h3>
                  <Badge variant="secondary" className="bg-orange-200 text-orange-800 rounded-full">{reports.filter(r => r.status === 'in_progress').length}</Badge>
                </div>
                {reports.filter(r => r.status === 'in_progress').map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base font-semibold line-clamp-1">{report.title}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2 mt-1">{report.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Clock className="h-3 w-3" />
                        <span>Started 2 days ago</span>
                      </div>
                      <Button size="sm" variant="outline" className="w-full h-8 text-xs border-orange-200 text-orange-700 hover:bg-orange-50" onClick={() => toast({ title: "Status Updated", description: "Team notified for update" })}>
                        Request Update
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Resolved Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-100">
                  <h3 className="font-semibold text-green-900">Resolved</h3>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 rounded-full">{reports.filter(r => r.status === 'resolved').length}</Badge>
                </div>
                {reports.filter(r => r.status === 'resolved').map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow border-l-4 border-l-green-500 opacity-75 hover:opacity-100">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base font-semibold line-clamp-1 decoration-slate-400">{report.title}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2 mt-1">Resolved on {new Date().toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                        <CheckCircle className="h-3 w-3" />
                        <span>Verified by AI</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* AI Budget Optimizer Feature */}
            <Card className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-0 shadow-xl mb-6 overflow-hidden relative">
              <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              <CardHeader className="relative z-10 pb-2">
                <CardTitle className="flex items-center gap-2 text-indigo-300 text-xl">
                  <span className="bg-indigo-500/20 p-2 rounded-lg"><IndianRupee className="h-5 w-5 text-indigo-400" /></span>
                  AI Budget Optimization Engine
                </CardTitle>
                <CardDescription className="text-slate-400 max-w-2xl text-sm mt-2">
                  Multi-objective optimization: Given a fixed municipal budget of ₹50 Lakh, the AI recommends the following exact allocation across zones to globally minimize flood risk.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 pt-4">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-1 w-full bg-white/5 p-5 rounded-xl border border-white/10 shadow-inner">
                    <div className="flex justify-between mb-1.5"><span className="text-sm font-medium text-slate-300">Zone 4: Infrastructure Upgrades</span><span className="font-bold text-white">₹25L</span></div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 mb-5 overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full w-[50%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div></div>

                    <div className="flex justify-between mb-1.5"><span className="text-sm font-medium text-slate-300">Zone 2: Green Buffers</span><span className="font-bold text-white">₹15L</span></div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 mb-5 overflow-hidden"><div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full w-[30%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div></div>

                    <div className="flex justify-between mb-1.5"><span className="text-sm font-medium text-slate-300">Zone 1: Smart Sensors</span><span className="font-bold text-white">₹10L</span></div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden"><div className="bg-gradient-to-r from-blue-500 to-blue-400 h-full w-[20%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div></div>
                  </div>
                  <div className="w-full md:w-auto md:min-w-[200px] flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-xl">
                    <div className="text-center">
                      <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-sm">-42%</div>
                      <div className="text-xs text-indigo-200 mt-2 uppercase tracking-wider font-semibold">Citywide Flood<br />Volume Reduction</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {recommendations.map((rec) => (
                <Card key={rec.id} className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg group-hover:text-purple-700 transition-colors">{rec.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" /> {rec.zones?.name}
                        </CardDescription>
                      </div>
                      <Badge className={rec.priority === 'high' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-blue-100 text-blue-800'}>
                        Priority {rec.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                      <div className="space-y-4 flex-1">
                        <p className="text-sm text-gray-600 leading-relaxed">{rec.description}</p>

                        {rec.type === 'pipe_upgrade' && rec.equation_data && (
                          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg my-3 shadow-sm">
                            <h4 className="text-xs font-bold text-blue-900 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                              <TrendingUp className="h-3 w-3" />
                              Hydrological Equation: Manning's Formula
                            </h4>
                            <div className="font-mono text-xs text-blue-800 bg-blue-100/50 p-2 rounded border border-blue-200 mb-2 overflow-x-auto">
                              Q = (1 / n) · A · R^(2/3) · S^(1/2)
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-slate-600">
                              <div className="bg-white p-1.5 rounded shadow-sm border border-slate-100"><span className="font-semibold">n</span> (roughness): {rec.equation_data.n}</div>
                              <div className="bg-white p-1.5 rounded shadow-sm border border-slate-100"><span className="font-semibold">A</span> (area): {rec.equation_data.A}m²</div>
                              <div className="bg-white p-1.5 rounded shadow-sm border border-slate-100"><span className="font-semibold">R</span> (radius): {rec.equation_data.R}m</div>
                              <div className="bg-white p-1.5 rounded shadow-sm border border-slate-100"><span className="font-semibold">S</span> (slope): {rec.equation_data.S}</div>
                              <div className="bg-blue-700 text-white p-1.5 rounded shadow-sm font-bold">Q = {rec.equation_data.Q_calculated} m³/s</div>
                            </div>
                          </div>
                        )}

                        {rec.type === 'green_infra' && rec.green_score && (
                          <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-lg my-3 shadow-sm">
                            <h4 className="text-xs font-bold text-emerald-900 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                              <CheckCircle className="h-3 w-3" />
                              Carbon & Green Infrastructure Score
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="space-y-1">
                                <span className="text-[10px] text-emerald-600 font-bold uppercase block">Estimated CO₂ Abs.</span>
                                <div className="text-sm font-semibold text-emerald-900 bg-emerald-100 px-2 py-1 rounded inline-block">{rec.green_score.co2_absorption_kg} kg/yr</div>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] text-emerald-600 font-bold uppercase block">Runoff Reduct.</span>
                                <div className="text-sm font-semibold text-emerald-900 bg-emerald-100 px-2 py-1 rounded inline-block">{(rec.green_score.runoff_reduction_l / 1000).toFixed(1)}k L/storm</div>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] text-emerald-600 font-bold uppercase block">Permeability</span>
                                <div className="text-sm font-semibold text-emerald-900 bg-emerald-100 px-2 py-1 rounded inline-block">+{rec.green_score.permeability_improvement}%</div>
                              </div>
                              <div className="space-y-1 border-l border-emerald-200 pl-3">
                                <span className="text-[10px] text-emerald-600 font-bold uppercase block">Climate Score</span>
                                <div className="text-2xl font-extrabold text-emerald-700">{rec.green_score.climate_score}<span className="text-sm font-normal text-emerald-500">/100</span></div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-6 text-sm">
                          {rec.estimated_cost && (
                            <div className="flex items-center gap-2 font-medium text-slate-700">
                              <div className="p-1.5 bg-green-100 rounded-full">
                                <IndianRupee className="h-4 w-4 text-green-700" />
                              </div>
                              ₹{rec.estimated_cost.toLocaleString("en-IN")}
                            </div>
                          )}
                          {rec.estimated_timeline_days && (
                            <div className="flex items-center gap-2 font-medium text-slate-700">
                              <div className="p-1.5 bg-blue-100 rounded-full">
                                <Clock className="h-4 w-4 text-blue-700" />
                              </div>
                              {rec.estimated_timeline_days} days est.
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-900/20"
                        onClick={() => handleApproveRecommendation(rec.id)}
                        disabled={rec.status === 'open_for_bidding'}
                      >
                        {rec.status === 'open_for_bidding' ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approved for Bidding
                          </>
                        ) : (
                          "Approve & Execute"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="training" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
              <CardHeader>
                <CardTitle>AI Model Training Dataset</CardTitle>
                <CardDescription>Reference dataset used for training the drainage risk prediction model.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="p-3 font-medium">Blueprint ID</th>
                        <th className="p-3 font-medium">Pipe Count</th>
                        <th className="p-3 font-medium">Avg Dia (mm)</th>
                        <th className="p-3 font-medium">Slope %</th>
                        <th className="p-3 font-medium">Manholes</th>
                        <th className="p-3 font-medium">Blockages</th>
                        <th className="p-3 font-medium">Lat / Lng</th>
                        <th className="p-3 font-medium">Risk Score</th>
                        <th className="p-3 font-medium">Label</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        { id: "BP001", pipes: 12, dia: 450, slope: 0.8, manholes: 4, blockages: 2, loc: "12.9412, 77.6102", score: 0.67, label: "Medium" },
                        { id: "BP002", pipes: 7, dia: 300, slope: 0.4, manholes: 2, blockages: 4, loc: "12.9766, 77.5994", score: 0.82, label: "High" },
                        { id: "BP003", pipes: 15, dia: 600, slope: 1.2, manholes: 6, blockages: 0, loc: "12.9501, 77.5809", score: 0.21, label: "Low" },
                        { id: "BP004", pipes: 9, dia: 350, slope: 0.5, manholes: 3, blockages: 3, loc: "12.9650, 77.6050", score: 0.73, label: "High" },
                        { id: "BP005", pipes: 11, dia: 500, slope: 0.9, manholes: 5, blockages: 1, loc: "12.9594, 77.6345", score: 0.44, label: "Medium" },
                        { id: "BP006", pipes: 6, dia: 250, slope: 0.3, manholes: 1, blockages: 5, loc: "12.9312, 77.6223", score: 0.91, label: "High" },
                        { id: "BP007", pipes: 14, dia: 550, slope: 1.0, manholes: 4, blockages: 1, loc: "12.9485, 77.5991", score: 0.39, label: "Medium" },
                        { id: "BP008", pipes: 10, dia: 400, slope: 0.7, manholes: 3, blockages: 2, loc: "12.9701, 77.6188", score: 0.59, label: "Medium" },
                        { id: "BP009", pipes: 5, dia: 200, slope: 0.2, manholes: 1, blockages: 6, loc: "12.9451, 77.5852", score: 0.95, label: "High" },
                        { id: "BP010", pipes: 16, dia: 650, slope: 1.3, manholes: 7, blockages: 0, loc: "12.9812, 77.6200", score: 0.15, label: "Low" },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-muted/50">
                          <td className="p-3 font-medium">{row.id}</td>
                          <td className="p-3">{row.pipes}</td>
                          <td className="p-3">{row.dia}</td>
                          <td className="p-3">{row.slope}</td>
                          <td className="p-3">{row.manholes}</td>
                          <td className="p-3">{row.blockages}</td>
                          <td className="p-3 text-xs text-muted-foreground">{row.loc}</td>
                          <td className="p-3">{row.score}</td>
                          <td className="p-3">
                            <Badge variant={row.label === "High" ? "destructive" : row.label === "Medium" ? "secondary" : "outline"} className={row.label === "Low" ? "bg-green-100 text-green-800 border-green-200" : ""}>
                              {row.label}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
