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
    const { latitude, longitude } = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "latitude and longitude are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Using Open-Meteo API (free, no API key needed)
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code&daily=precipitation_sum,rain_sum,precipitation_probability_max&timezone=Asia/Kolkata&forecast_days=7`
    );

    if (!weatherResponse.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const weatherData = await weatherResponse.json();
    
    // Analyze waterlogging risk
    const currentPrecipitation = weatherData.current.precipitation || 0;
    const dailyPrecipitation = weatherData.daily.precipitation_sum || [];
    const precipitationProb = weatherData.daily.precipitation_probability_max || [];
    
    // Calculate risk score (0-1)
    const avgDailyRainfall = dailyPrecipitation.slice(0, 3).reduce((a: number, b: number) => a + b, 0) / 3;
    const maxProbability = Math.max(...precipitationProb.slice(0, 3));
    
    let riskScore = 0;
    if (avgDailyRainfall > 50) riskScore += 0.4;
    else if (avgDailyRainfall > 25) riskScore += 0.2;
    
    if (maxProbability > 70) riskScore += 0.4;
    else if (maxProbability > 50) riskScore += 0.2;
    
    if (currentPrecipitation > 10) riskScore += 0.2;
    
    const riskLevel = riskScore > 0.6 ? "high" : riskScore > 0.3 ? "medium" : "low";
    
    // Get high-risk zones from database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: highRiskZones } = await supabase
      .from("zones")
      .select("id, name, flood_risk_score")
      .gt("flood_risk_score", 0.6)
      .order("flood_risk_score", { ascending: false })
      .limit(5);

    // Generate AI recommendations for high-risk zones if risk is high
    const recommendations = [];
    if (riskLevel === "high" && highRiskZones && highRiskZones.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      
      if (LOVABLE_API_KEY) {
        for (const zone of highRiskZones.slice(0, 2)) {
          const prompt = `Generate a brief preventive recommendation for ${zone.name} zone with flood risk score ${zone.flood_risk_score}. Expected rainfall: ${avgDailyRainfall.toFixed(1)}mm over next 3 days. Keep it under 100 words, focus on immediate preventive actions.`;

          try {
            const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: "You are a flood prevention expert. Provide concise, actionable recommendations." },
                  { role: "user", content: prompt }
                ],
                temperature: 0.7,
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              recommendations.push({
                zone_id: zone.id,
                zone_name: zone.name,
                recommendation: aiData.choices[0].message.content,
              });
            }
          } catch (error) {
            console.error(`Failed to generate recommendation for zone ${zone.id}:`, error);
          }
        }
      }
    }

    const response = {
      current: {
        temperature: weatherData.current.temperature_2m,
        precipitation: currentPrecipitation,
        humidity: weatherData.current.relative_humidity_2m,
      },
      forecast: {
        next_3_days_rainfall: avgDailyRainfall,
        max_probability: maxProbability,
        daily: weatherData.daily,
      },
      waterlogging_risk: {
        score: riskScore,
        level: riskLevel,
        message: riskScore > 0.6 
          ? "High risk of waterlogging expected. Take preventive measures." 
          : riskScore > 0.3 
          ? "Moderate waterlogging risk. Monitor conditions closely."
          : "Low waterlogging risk. Normal drainage operations recommended.",
      },
      high_risk_zones: highRiskZones || [],
      preventive_recommendations: recommendations,
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in weather-forecast:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
