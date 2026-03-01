import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LanguageSelector } from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { Download, TrendingUp, MapPin, AlertTriangle, CheckCircle } from "lucide-react";

export default function TransparencyDashboard() {
  const [stats, setStats] = useState<any>({});
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicData();
  }, []);

  const fetchPublicData = async () => {
    setLoading(true);

    // Fetch aggregated statistics
    const { data: reports } = await supabase
      .from("reports")
      .select("id, status, severity, category, created_at");

    const { data: zones } = await supabase
      .from("zones")
      .select("id, name");

    const { data: recs } = await supabase
      .from("ai_recommendations")
      .select(`
        *,
        zones(name, ward_number)
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    // Calculate statistics
    const totalReports = reports?.length || 0;
    const resolvedReports = reports?.filter(r => r.status === 'resolved').length || 0;
    const pendingReports = reports?.filter(r => r.status === 'pending').length || 0;
    const avgSeverity = reports?.reduce((acc, r) => acc + (r.severity || 0), 0) / totalReports || 0;

    setStats({
      totalReports,
      resolvedReports,
      pendingReports,
      totalZones: zones?.length || 0,
      avgSeverity: avgSeverity.toFixed(1),
      resolutionRate: ((resolvedReports / totalReports) * 100).toFixed(1),
    });

    setRecentReports(reports?.slice(0, 10) || []);
    setRecommendations(recs || []);
    setLoading(false);
  };

  const downloadOpenData = () => {
    // Create CSV of public data
    const csv = [
      ['Date', 'Category', 'Status', 'Severity'].join(','),
      ...recentReports.map(r => 
        [
          new Date(r.created_at).toLocaleDateString(),
          r.category,
          r.status,
          r.severity
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `infra-bharat-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Public Transparency Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Real-time infrastructure data and city interventions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={downloadOpenData} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Open Data
              </Button>
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReports}</div>
              <p className="text-xs text-muted-foreground">Citizen submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolutionRate}%</div>
              <p className="text-xs text-muted-foreground">{stats.resolvedReports} resolved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingReports}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Zones Covered</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalZones}</div>
              <p className="text-xs text-muted-foreground">City areas</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="interventions">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="interventions">AI Interventions</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="interventions" className="space-y-4">
            <div className="grid grid-cols-1 gap-6">
              {recommendations.map((rec) => (
                <Card key={rec.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{rec.title}</CardTitle>
                        <CardDescription>
                          {rec.zones?.name} - Ward {rec.zones?.ward_number}
                        </CardDescription>
                      </div>
                      <Badge variant={rec.status === 'completed' ? 'default' : 'secondary'}>
                        {rec.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{rec.description}</p>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Cost</div>
                        <div className="text-lg font-bold text-green-600">
                          ₹{rec.estimated_cost?.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Timeline</div>
                        <div className="text-lg font-bold text-blue-600">
                          {rec.estimated_timeline_days} days
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Priority</div>
                        <div className="text-lg font-bold text-orange-600">
                          {rec.priority}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentReports.slice(0, 5).map((report, idx) => (
                    <div key={report.id} className="flex items-center gap-4 pb-4 border-b last:border-0">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{report.category}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="outline">{report.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle>City Infrastructure Insights</CardTitle>
                <CardDescription>Data-driven analysis of infrastructure health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Average Severity</span>
                    <span className="text-sm text-muted-foreground">{stats.avgSeverity}/5</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${(parseFloat(stats.avgSeverity) / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Resolution Progress</span>
                    <span className="text-sm text-muted-foreground">{stats.resolutionRate}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${stats.resolutionRate}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Report Distribution</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <span className="text-sm">Pending</span>
                      <span className="font-bold text-yellow-600">{stats.pendingReports}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <span className="text-sm">Resolved</span>
                      <span className="font-bold text-green-600">{stats.resolvedReports}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
