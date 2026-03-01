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
    const { zone_id, photos, current_specs, description } = await req.json();

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

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Generate AI recommendation using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const drainageAssets = zone.metadata?.drainage_assets || [];
    const prompt = `You are an expert civil engineer analyzing drainage infrastructure based on field inspection data.

Zone Information:
- Name: ${zone.name}
- Flood Risk Score: ${zone.flood_risk_score}
- Population: ${zone.population}
- Area: ${zone.area_sqkm} sq km
- Description: ${zone.metadata?.description || "N/A"}

Current Drainage Assets:
${drainageAssets.map((asset: any) => `- ${asset.type}: ${asset.diameter_mm}mm ${asset.material}, Age: ${asset.age_years} years`).join("\n")}

Field Inspection Data:
- Photos: ${photos?.length || 0} images uploaded
- Current Issues: ${description || "Not specified"}
- Current Specifications: ${JSON.stringify(current_specs || {})}

Based on this data, provide:
1. Severity assessment (0-100 scale)
2. Detailed action items needed
3. Estimated cost in INR
4. Suggested pipe diameter upgrades
5. Urgency level (low/medium/high/critical)
6. Expected timeline in days

Format as JSON with keys: severity, actions (array of strings), estimated_cost (number), suggested_pipe_mm (number), urgency (string), timeline_days (number), analysis (detailed text).`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert civil engineer specializing in urban drainage systems." },
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

    // Parse AI response
    let recommendation;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      recommendation = JSON.parse(jsonStr);
    } catch (e) {
      // Fallback if JSON parsing fails
      recommendation = {
        severity: 65,
        actions: ["Inspect drainage pipes", "Clear blockages", "Consider pipe replacement"],
        estimated_cost: 500000,
        suggested_pipe_mm: 750,
        urgency: "medium",
        timeline_days: 45,
        analysis: content,
      };
    }

    // Save recommendation to database
    const { data: newRec, error: insertError } = await supabase
      .from("ai_recommendations")
      .insert({
        zone_id: zone_id,
        recommendation_type: "drainage_improvement",
        title: `AI Drainage Assessment - ${zone.name}`,
        description: recommendation.analysis || "AI-generated drainage improvement recommendation",
        current_specs: current_specs || { note: "Field inspection data" },
        proposed_specs: {
          pipe_diameter_mm: recommendation.suggested_pipe_mm,
          urgency: recommendation.urgency,
          actions: recommendation.actions,
        },
        estimated_cost: recommendation.estimated_cost,
        estimated_timeline_days: recommendation.timeline_days,
        priority: recommendation.urgency === "critical" ? 5 : recommendation.urgency === "high" ? 4 : 3,
        status: "proposed",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        recommendation: newRec,
        ai_analysis: recommendation 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-ai-recommendation:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});