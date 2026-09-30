import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { transcribeAudio } from "../_shared/google-cloud.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      audio_base64,
      encoding = "WEBM_OPUS",
      sample_rate_hertz = 48000,
      candidate_languages,
    } = await req.json();

    if (!audio_base64) {
      return new Response(
        JSON.stringify({ error: "audio_base64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await transcribeAudio(
      audio_base64,
      encoding,
      sample_rate_hertz,
      candidate_languages
    );

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("speech-to-text error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message ?? "Transcription failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
