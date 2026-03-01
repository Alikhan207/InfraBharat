import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import { LanguageSelector } from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/NotificationBell";
import MapView from "@/components/MapView";
import { DrainageVisualization3D } from "@/components/DrainageVisualization3D";
import { DrainageAnalysisForm } from "@/components/DrainageAnalysisForm";
import { LogOut, TrendingUp, AlertTriangle, MapPin, IndianRupee, FileText } from "lucide-react";

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [mapCenter, setMapCenter] = useState<[number, number]>([77.5946, 12.9716]);
  const [loading, setLoading] = useState(true);
  const [active3DModel, setActive3DModel] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("map");
  const mapRef = useRef<any>(null);

  useEffect(() => {
    checkAuth();
    fetchDashboardData();
  }, []);

  const checkAuth = async () => {
    // Check for demo mode
    const demoRole = localStorage.getItem("demo_role");
    if (demoRole === "official") {
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user has officer or admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role !== "official") {
      navigate("/citizen-dashboard");
      return;
    }

    setUser(user);
  };

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
      ]);

      setRecommendations([
        { id: '201', title: 'Install High-Capacity Pump', description: 'Deploy 5000L/min pump at Zone 4 junction to mitigate flash flood risk.', priority: 'high', estimated_cost: 450000, estimated_timeline_days: 5, zones: { name: 'Zone 4 (MG Road)' } },
        { id: '202', title: 'Clear Drainage Blockage', description: 'Automated desilting required for Sector 2 main line.', priority: 'medium', estimated_cost: 120000, estimated_timeline_days: 2, zones: { name: 'Zone 2 (Koramangala)' } },
        { id: '203', title: 'Sensor Upgrade', description: 'Replace aging flow sensors in Zone 1.', priority: 'low', estimated_cost: 85000, estimated_timeline_days: 7, zones: { name: 'Zone 1 (Indiranagar)' } },
      ]);

      setLoading(false);
    };

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

      if (zonesResult.data) setZones(zonesResult.data);
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
    navigate("/");
  };

  const handleZoneSelect = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    if (zone) {
      setSelectedZoneId(zoneId);
      setSelectedZone(zone);

      // Extract centroid from metadata
      const centroid = zone.metadata?.centroid;
      if (centroid) {
        setMapCenter([centroid.lng, centroid.lat]);
      }
    }
  };

  const handleZoneClick = (zoneProps: any) => {
    // Find zone by id from properties
    const zone = zones.find(z => z.id === zoneProps.id);
    if (zone) {
      setSelectedZoneId(zone.id);
      setSelectedZone(zone);
    }
  };

  const handleView3DModel = (url: string) => {
    setActive3DModel(url);
    setActiveTab("3d");
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

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Zones</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{zones.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Reports</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reports.filter((r) => r.status !== "resolved").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Recommendations</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recommendations.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Zone Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Zone Selection</CardTitle>
            <CardDescription>Select a zone to view on map and populate analysis form</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="zone-select">Select Zone</Label>
              <select
                id="zone-select"
                className="w-full p-2 border rounded-md bg-background"
                value={selectedZoneId}
                onChange={(e) => handleZoneSelect(e.target.value)}
              >
                <option value="">Choose a zone...</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} - Ward {zone.ward_number} (Flood Risk: {((zone.flood_risk_score || 0) * 100).toFixed(0)}%)
                  </option>
                ))}
              </select>
            </div>
            {selectedZone && (
              <div className="mt-4 p-4 border rounded-lg space-y-2">
                <h4 className="font-semibold">{selectedZone.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedZone.metadata?.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Population:</span>
                    <span className="ml-2 font-medium">{selectedZone.population?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Area:</span>
                    <span className="ml-2 font-medium">{selectedZone.area_sqkm} sq km</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Flood Risk:</span>
                    <Badge variant={selectedZone.flood_risk_score > 0.7 ? "destructive" : "secondary"}>
                      {((selectedZone.flood_risk_score || 0) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Inspection:</span>
                    <span className="ml-2 font-medium">{selectedZone.metadata?.last_inspection || "N/A"}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="analysis">AI Drainage Analysis</TabsTrigger>
            <TabsTrigger value="3d">3D Drainage</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            <div className="h-[600px]">
              <MapView
                zones={zones}
                reports={reports}
                onZoneClick={handleZoneClick}
                center={mapCenter}
                zoom={selectedZoneId ? 14 : 11}
              />
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {!selectedZoneId && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Please select a zone above to populate the drainage analysis form
                  </p>
                </CardContent>
              </Card>
            )}
            <DrainageAnalysisForm
              zones={zones}
              onRecommendationSaved={fetchDashboardData}
              onView3DModel={handleView3DModel}
            />
          </TabsContent>

          <TabsContent value="3d" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>3D Drainage Infrastructure Visualization</CardTitle>
                <CardDescription>
                  Interactive 3D view of drainage network and proposed improvements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DrainageVisualization3D modelUrl={active3DModel} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid gap-4">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <Badge
                        variant={
                          report.status === "resolved"
                            ? "default"
                            : report.status === "in_progress"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {report.address || "Location available on map"}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  AI Recommendations
                </CardTitle>
                <CardDescription>
                  View all AI-generated drainage improvement recommendations. Only officials can access these.
                </CardDescription>
              </CardHeader>
            </Card>
            <div className="grid gap-4">
              {recommendations.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No recommendations yet. Generate recommendations from the AI Drainage Analysis tab.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                recommendations.map((rec) => (
                  <Card key={rec.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{rec.title}</CardTitle>
                        <Badge variant={rec.priority >= 4 ? "destructive" : "secondary"}>
                          Priority {rec.priority}/5
                        </Badge>
                      </div>
                      <CardDescription>{rec.zones?.name || "Zone N/A"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm">{rec.description}</p>
                      <div className="grid grid-cols-2 gap-4">
                        {rec.estimated_cost && (
                          <div className="flex items-center gap-2">
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Estimated Cost</p>
                              <p className="font-semibold">
                                ₹{rec.estimated_cost.toLocaleString("en-IN")}
                              </p>
                            </div>
                          </div>
                        )}
                        {rec.estimated_timeline_days && (
                          <div>
                            <p className="text-xs text-muted-foreground">Timeline</p>
                            <p className="font-semibold">{rec.estimated_timeline_days} days</p>
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="mt-2">
                        Status: {rec.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
