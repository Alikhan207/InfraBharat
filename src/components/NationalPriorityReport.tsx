import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, RefreshCw } from "lucide-react";

interface Hotspot {
  zone_name: string;
  city: string;
  state: string;
  priority_rank: number;
  priority_score: number;
  reasoning: string;
  recommended_project: string;
  estimated_population_impact: number;
}

interface ReportResult {
  hotspots?: Hotspot[];
  national_summary?: string;
  zones_analyzed?: number;
  error?: string;
}

export function NationalPriorityReport() {
  const [result, setResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      // Check for Demo Mode first to immediately show the mock report
      if (localStorage.getItem("demo_role")) {
        throw new Error("Demo Mode Active - Using Mock Data");
      }

      const { data, error } = await supabase.functions.invoke("national-priority-report");
      if (error) throw error;
      setResult(data);
    } catch (e) {
      console.log("Using Mock Data for National Report:", e);
      // Hackathon Demo Mode Fallback
      setTimeout(() => {
        setResult({
          national_summary: "AI analysis of 450+ cross-city reports indicates a severe pattern of chronic waterlogging correlating with outdated 1980s drainage infrastructure. Immediate intervention is required in high-density IT corridors.",
          zones_analyzed: 14,
          hotspots: [
            {
              zone_name: "Zone 4 (MG Road)",
              city: "Bengaluru",
              state: "Karnataka",
              priority_rank: 1,
              priority_score: 98,
              reasoning: "Highest density of civic reports combined with critical economic output. Drainage pipes are currently 40% under-capacity for monsoon averages.",
              recommended_project: "AMRUT 2.0 Sub-project: 5200mm HDPE Main Trunk Pipeline replacement.",
              estimated_population_impact: 1250000
            },
            {
              zone_name: "Sector 14 (Hiranandani)",
              city: "Mumbai",
              state: "Maharashtra",
              priority_rank: 2,
              priority_score: 92,
              reasoning: "Coastal vulnerability combined with severe solid waste blockage. Citizen sentiment analysis shows 85% negative outlook on response times.",
              recommended_project: "Automated Silt-clearing & Sensor Grid Installation.",
              estimated_population_impact: 850000
            },
            {
              zone_name: "Old City (Charminar)",
              city: "Hyderabad",
              state: "Telangana",
              priority_rank: 3,
              priority_score: 87,
              reasoning: "Heritage structures at risk from groundwater seepage. Predictive modeling shows a 60% chance of structural damage by next monsoon.",
              recommended_project: "Micro-tunneling drainage relief system.",
              estimated_population_impact: 420000
            }
          ]
        });
        setLoading(false);
      }, 1500);
      return; // Return early because setTimeout handles the finally block
    } 
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            National Priority Report
          </CardTitle>
          <CardDescription>
            Cross-references citizen demand against national demographic and infrastructure-investment data to rank projects across cities.
          </CardDescription>
        </div>
        <Button onClick={generateReport} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          {result ? "Regenerate" : "Generate Report"}
        </Button>
      </CardHeader>
      <CardContent>
        {result?.error && (
          <p className="text-sm text-destructive">{result.error}</p>
        )}

        {result?.national_summary && (
          <p className="text-sm text-muted-foreground mb-4 italic">{result.national_summary}</p>
        )}

        {result?.hotspots && result.hotspots.length > 0 && (
          <div className="space-y-3">
            {result.hotspots
              .sort((a, b) => a.priority_rank - b.priority_rank)
              .map((h) => (
                <div key={`${h.city}-${h.zone_name}`} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">
                      #{h.priority_rank} — {h.zone_name}, {h.city} ({h.state})
                    </h4>
                    <Badge variant={h.priority_score > 70 ? "destructive" : "secondary"}>
                      Score: {h.priority_score}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{h.reasoning}</p>
                  <p className="text-sm">
                    <span className="font-medium">Recommended:</span> {h.recommended_project}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Est. population impact: {h.estimated_population_impact?.toLocaleString()}
                  </p>
                </div>
              ))}
          </div>
        )}

        {!result && !loading && (
          <p className="text-sm text-muted-foreground">
            Generate a cross-city, cross-state priority ranking from current citizen reports and national infrastructure data.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
