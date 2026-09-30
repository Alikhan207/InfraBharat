import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callGemini } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This is the function that actually answers the hackathon brief:
// "analyse large datasets combining citizen feedback with national
// demographic data, infrastructure indices, and public investment
// plans, surfacing demand hotspots and recommending high-priority
// development projects to national policymakers."
//
// It pulls citizen reports + zone risk scores (demand signal) and joins
// them against national_indicators (demographic + investment data),
// then asks Gemini to produce a ranked, cross-city priority list.

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const [{ data: zones }, { data: reports }, { data: nationalIndicators }] =
      await Promise.all([
        supabase
          .from("zones")
          .select("id, name, ward_number, flood_risk_score, heat_risk_score, population, metadata"),
        supabase
          .from("reports")
          .select("id, zone_id, category, status, severity, created_at")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("national_indicators").select("*"),
      ]);

    if (!zones || zones.length === 0) {
      return new Response(
        JSON.stringify({ error: "No zone data available to analyze" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Roll up citizen demand per zone
    const zoneSummaries = zones.map((zone) => {
      const zoneReports = (reports || []).filter((r) => r.zone_id === zone.id);
      const city = (zone.metadata as any)?.city ?? "Bengaluru";
      const indicator = (nationalIndicators || []).find((n) => n.city === city);

      return {
        zone_name: zone.name,
        ward: zone.ward_number,
        city,
        flood_risk_score: zone.flood_risk_score,
        heat_risk_score: zone.heat_risk_score,
        population: zone.population,
        open_citizen_reports: zoneReports.filter((r) => r.status !== "resolved").length,
        total_citizen_reports: zoneReports.length,
        national_context: indicator
          ? {
              state: indicator.state,
              literacy_rate: indicator.literacy_rate,
              urban_infra_index: indicator.urban_infra_index,
              annual_infra_investment_inr_cr: indicator.annual_infra_investment_inr_cr,
            }
          : null,
      };
    });

    const prompt = `You are advising national infrastructure policymakers in India. Below is aggregated data per zone: citizen-reported demand (open complaints), risk scores, and national demographic/investment context (state literacy rate, an urban infrastructure index where lower means worse existing infrastructure, and current annual public investment in INR crore for that city).

Zone data:
${JSON.stringify(zoneSummaries, null, 2)}

Task: identify demand hotspots and recommend the top priority development projects across these cities/states. Weigh: (1) volume and severity of citizen demand, (2) risk scores, (3) gap between urban_infra_index and current investment (underinvested + high-risk zones should rank higher), (4) population impact.

Return ONLY valid JSON in this structure, ranked highest priority first:
{
  "hotspots": [
    {
      "zone_name": "string",
      "city": "string",
      "state": "string",
      "priority_rank": <number>,
      "priority_score": <0-100>,
      "reasoning": "one or two sentences citing the specific data points used",
      "recommended_project": "specific, actionable infrastructure recommendation",
      "estimated_population_impact": <number>
    }
  ],
  "national_summary": "2-3 sentence summary of cross-state patterns for a policymaker briefing"
}`;

    const aiData = await callGemini(
      [
        {
          role: "system",
          content:
            "You are a national infrastructure policy analyst. Be specific and data-driven; do not invent numbers not present in the input.",
        },
        { role: "user", content: prompt },
      ],
      { temperature: 0.4 }
    );

    const content = aiData.choices[0].message.content;
    let result;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : content);
    } catch {
      result = { raw_response: content };
    }

    return new Response(
      JSON.stringify({ ...result, zones_analyzed: zoneSummaries.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("national-priority-report error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message ?? "Report generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
