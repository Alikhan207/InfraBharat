import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('Unauthorized')
        }

        const formData = await req.formData()
        const file = formData.get('blueprint')

        if (!file) {
            throw new Error('No file uploaded')
        }

        // 1. Upload file to Storage
        const fileName = `${user.id}/${Date.now()}_blueprint.png`
        const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from('blueprints')
            .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl: blueprintUrl } } = supabaseClient
            .storage
            .from('blueprints')
            .getPublicUrl(fileName)

        // 2. Mock 3D Model Generation (In a real app, this would call a 3D AI service)
        // We'll return a placeholder GLB URL for now
        const modelUrl = "https://github.com/KhronosGroup/glTF-Sample-Models/raw/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb"

        // 3. Create Report Entry
        const { data: report, error: reportError } = await supabaseClient
            .from('reports')
            .insert({
                user_id: user.id,
                title: 'Drainage Analysis Report',
                description: 'Automated analysis from uploaded blueprint.',
                blueprint_url: blueprintUrl,
                model_url: modelUrl,
                summary: 'The blueprint indicates a complex drainage network with potential bottlenecks in the northern sector. The flow capacity appears sufficient for average rainfall but may struggle during peak monsoon events.',
                recommendations: [
                    'Increase pipe diameter in Sector 4 to 600mm.',
                    'Add a catch basin at the intersection of Main St and 5th Ave.',
                    'Regular desilting recommended for the primary outflow channel.'
                ],
                status: 'pending',
                priority: 'medium',
                location: 'Uploaded Blueprint Location'
            })
            .select()
            .single()

        if (reportError) throw reportError

        return new Response(
            JSON.stringify({
                success: true,
                report,
                modelUrl
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
