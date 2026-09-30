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
      const { data, error } = await supabase.functions.invoke("national-priority-report");
      if (error) throw error;
      setResult(data);
    } catch (e) {
      console.error("Failed to generate national priority report:", e);
      setResult({ error: "Failed to generate report. Check that GEMINI_API_KEY is configured." });
    } finally {
      setLoading(false);
    }
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
