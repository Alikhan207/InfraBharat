import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { translateText, detectLanguage } from "../_shared/google-cloud.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, target, source, detect_only } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (detect_only) {
      const languageCode = await detectLanguage(text);
      return new Response(JSON.stringify({ languageCode }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!target) {
      return new Response(
        JSON.stringify({ error: "target language is required unless detect_only is true" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await translateText(text, target, source);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("translate-text error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message ?? "Translation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
