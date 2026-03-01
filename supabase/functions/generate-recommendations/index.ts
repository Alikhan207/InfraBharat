import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { zone_id } = await req.json();

    if (!zone_id) {
      return new Response(
        JSON.stringify({ error: "zone_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch zone data
    const { data: zone, error: zoneError } = await supabase
      .from("zones")
      .select("*")
      .eq("id", zone_id)
      .single();

    if (zoneError || !zone) {
      return new Response(
        JSON.stringify({ error: "Zone not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch recent reports for this zone
    const { data: reports } = await supabase
      .from("reports")
      .select("*")
      .eq("zone_id", zone_id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Generate AI recommendation using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `You are an expert civil engineer analyzing urban drainage infrastructure. 
    
Zone Data:
- Name: ${zone.name}
- Flood Risk Score: ${zone.flood_risk_score}
- Heat Risk Score: ${zone.heat_risk_score}
- Population: ${zone.population || "N/A"}
- Area: ${zone.area_sqkm || "N/A"} sq km

Recent Reports: ${reports?.length || 0} complaints including waterlogging and drainage issues.

Current Infrastructure Issues:
- High waterlogging during monsoon
- Inadequate drainage capacity
- Poor stormwater management

Please provide:
1. A comprehensive analysis of the current situation
2. Prescriptive recommendations with specific engineering solutions
3. Current drainage specifications (estimated)
4. Proposed improved specifications (pipe diameter, slope, materials)
5. Estimated cost in INR
6. Timeline in days
7. Expected improvement metrics

Format as JSON with keys: title, description, current_specs (object), proposed_specs (object), estimated_cost (number), estimated_timeline_days (number), priority (1-5).`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert civil engineer specializing in urban infrastructure and drainage systems." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;

    // Try to parse JSON from the response
    let recommendation;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      recommendation = JSON.parse(jsonStr);
    } catch (e) {
      // Fallback if JSON parsing fails
      recommendation = {
        title: "Infrastructure Improvement Recommendation",
        description: content,
        current_specs: { note: "See description for details" },
        proposed_specs: { note: "See description for details" },
        estimated_cost: 5000000,
        estimated_timeline_days: 90,
        priority: 3,
      };
    }

    // Insert recommendation into database
    const { data: newRec, error: insertError } = await supabase
      .from("ai_recommendations")
      .insert({
        zone_id: zone_id,
        recommendation_type: "drainage_improvement",
        title: recommendation.title,
        description: recommendation.description,
        current_specs: recommendation.current_specs,
        proposed_specs: recommendation.proposed_specs,
        estimated_cost: recommendation.estimated_cost,
        estimated_timeline_days: recommendation.estimated_timeline_days,
        priority: recommendation.priority || 3,
        status: "proposed",
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, recommendation: newRec }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-recommendations:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
