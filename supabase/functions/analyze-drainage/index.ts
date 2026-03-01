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
    const { zone_id, photo_urls, current_specs, save_recommendation } = await req.json();

    if (!zone_id || !current_specs) {
      return new Response(
        JSON.stringify({ error: "zone_id and current_specs are required" }),
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

    // Fetch recent reports
    const { data: reports } = await supabase
      .from("reports")
      .select("*")
      .eq("zone_id", zone_id)
      .eq("category", "drainage_blockage")
      .order("created_at", { ascending: false })
      .limit(5);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `You are an expert civil engineer analyzing drainage infrastructure for ${zone.name}.

Current Drainage Specifications:
- Pipe Width/Diameter: ${current_specs.width || "N/A"} mm
- Pipe Length: ${current_specs.length || "N/A"} meters
- Gradient/Slope: ${current_specs.gradient || "N/A"}%
- Material: ${current_specs.material || "Concrete"}
- Condition: ${current_specs.condition || "Unknown"}

Zone Context:
- Flood Risk Score: ${zone.flood_risk_score || 0}/1.0
- Population: ${zone.population || "N/A"}
- Area: ${zone.area_sqkm || "N/A"} sq km
- Recent Drainage Issues: ${reports?.length || 0}

${photo_urls && photo_urls.length > 0 ? `Drainage Photos Available: ${photo_urls.length} images uploaded for analysis` : ""}

Task: Analyze the current drainage system and provide improved specifications.

Return JSON with this exact structure:
{
  "title": "Brief recommendation title",
  "description": "Detailed analysis and reasoning (2-3 paragraphs)",
  "current_specs": {
    "pipe_diameter_mm": <current width in mm>,
    "length_m": <current length>,
    "gradient_percent": <current gradient>,
    "material": "<current material>",
    "flow_capacity_lps": <calculated current flow in liters per second>,
    "condition_rating": "<poor/fair/good>"
  },
  "proposed_specs": {
    "pipe_diameter_mm": <recommended width in mm>,
    "length_m": <recommended length>,
    "gradient_percent": <recommended gradient>,
    "material": "<recommended material like HDPE/RCC>",
    "flow_capacity_lps": <calculated improved flow in liters per second>,
    "additional_features": ["<feature 1>", "<feature 2>"]
  },
  "improvements": {
    "capacity_increase_percent": <percentage increase>,
    "flow_rate_increase_percent": <percentage increase>,
    "flood_risk_reduction": "<high/medium/low>"
  },
  "estimated_cost": <cost in INR>,
  "estimated_timeline_days": <days>,
  "priority": <1-5 where 5 is highest>
}

Be specific with calculations. Ensure proposed specs show measurable improvements.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are an expert civil engineer specializing in urban drainage systems. Provide precise, data-driven recommendations with accurate flow calculations." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;

    let recommendation;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      recommendation = JSON.parse(jsonStr);
    } catch (e) {
      console.error("JSON parse error:", e);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If save_recommendation is true, insert into database
    if (save_recommendation) {
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
        console.error("Insert error:", insertError);
        throw insertError;
      }

      return new Response(
        JSON.stringify({ success: true, recommendation: newRec, saved: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return recommendation without saving
    return new Response(
      JSON.stringify({ success: true, recommendation, saved: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-drainage:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
