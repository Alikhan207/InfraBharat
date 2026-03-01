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
    const { message, user_id, conversation_history } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch user's recent reports if user_id is provided
    let userReports: any[] = [];
    if (user_id) {
      const { data } = await supabase
        .from("reports")
        .select("id, title, status, category, created_at, address")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(5);

      userReports = data || [];
    }

    // Build context for AI
    const systemPrompt = `You are a helpful infrastructure assistant for InfraBharat, helping citizens with drainage and waterlogging issues.

Your capabilities:
1. Help citizens report infrastructure issues (waterlogging, drainage blockage, flooding, road damage)
2. Provide status updates on their existing reports
3. Answer common questions about infrastructure and drainage systems
4. Guide users on how to use the platform

${userReports.length > 0 ? `User's Recent Reports:
${userReports.map(r => `- Report #${r.id.slice(0, 8)}: ${r.title} (${r.status}) - ${r.category} at ${r.address || "Unknown location"}`).join("\n")}` : ""}

Guidelines:
- Be concise and helpful
- If user wants to report an issue, ask for: location, description, and severity
- For status updates, reference their recent reports
- Use simple language
- Be empathetic about infrastructure problems
- If asked about technical details, provide basic explanations

IMPORTANT: If the user wants to file a report, respond with JSON in this format:
{
  "type": "report_intent",
  "data": {
    "category": "waterlogging|drainage_blockage|flooding|road_damage|other",
    "location": "extracted location",
    "description": "extracted description",
    "severity": "low|medium|high"
  }
}
Otherwise, respond conversationally.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversation_history || []),
      { role: "user", content: message }
    ];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Provide a functional fallback response instead of crashing

      const lowerMsg = message.toLowerCase();
      let isReportIntent = false;
      let botResponse = "I'm currently running in offline demo mode. I can still help you! Please navigate to the 'Citizen Reporting' page to report any infrastructure issues.";

      if (lowerMsg.includes("report") || lowerMsg.includes("issue") || lowerMsg.includes("pothole") || lowerMsg.includes("water")) {
        isReportIntent = true;
      }

      if (isReportIntent) {
        return new Response(
          JSON.stringify({
            message: null,
            type: "report_intent",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          message: botResponse,
          type: "text",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
        temperature: 0.8,
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
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI request failed");
    }

    const aiData = await aiResponse.json();
    const botMessage = aiData.choices[0].message.content;

    // Check if bot wants to create a report
    let reportIntent = null;
    try {
      const jsonMatch = botMessage.match(/\{[\s\S]*"type":\s*"report_intent"[\s\S]*\}/);
      if (jsonMatch) {
        reportIntent = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Not a report intent, just regular conversation
    }

    return new Response(
      JSON.stringify({
        message: reportIntent ? reportIntent : botMessage,
        type: reportIntent ? "report_intent" : "text",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in citizen-chatbot:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
