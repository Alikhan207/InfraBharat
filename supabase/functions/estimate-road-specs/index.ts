import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { photo_urls } = await req.json();

        if (!photo_urls || !Array.isArray(photo_urls) || photo_urls.length === 0) {
            return new Response(
                JSON.stringify({ error: "photo_urls array is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) {
            throw new Error("LOVABLE_API_KEY is not configured");
        }

        const prompt = `You are an expert civil engineer and computer vision specialist.
Analyze the provided street photos to estimate the road dimensions.

Task:
1. Identify scale references in the image (e.g., Standard Car width ~1.8m, Lane width ~3.5m, Footpath tiles).
2. Estimate the Road Width (Breadth) in meters:
   - Identify the carriageway (drivable area).
   - Exclude footpaths/sidewalks from the main road width, or measure them separately if possible, but primarily we need the clear road width.
3. Estimate the Approximate Visible Road Length in meters:
   - How far down the road can be clearly seen?
   - Connect estimations from multiple photos if they appear to be of the same stretch.

Return JSON with this exact structure:
{
  "width_meters": <number, e.g., 7.5>,
  "length_meters": <number, e.g., 120>,
  "confidence": "<High/Medium/Low>",
  "reasoning": "<Explanation of what reference objects were used and how the calculation was derived.>",
  "details": {
    "references_detected": ["<ref1>", "<ref2>"],
    "carriageway_width": <number>,
    "sidewalk_width": <number or null>
  }
}

Be realistic. If the image is unclear, set confidence to Low.`;

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
                        content: "You are an expert civil engineer specializing in infrastructure analysis from visual data."
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            ...photo_urls.map((url: string) => ({
                                type: "image_url",
                                image_url: { url }
                            }))
                        ]
                    }
                ],
                temperature: 0.2,
            }),
        });

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error("AI Gateway error:", aiResponse.status, errorText);
            throw new Error(`AI Gateway failed: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices[0].message.content;

        let result;
        try {
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
            result = JSON.parse(jsonStr);
        } catch (e) {
            console.error("JSON parse error from AI:", e);
            throw new Error("Failed to parse AI response");
        }

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Error in estimate-road-specs:", error);
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
