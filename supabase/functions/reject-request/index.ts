
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
    )
    
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }
    
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('name, role')
        .eq('id', user.id)
        .single()

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'ahmad_rajili')) {
         return new Response(JSON.stringify({ error: 'Forbidden: Admin access required.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }
    
    const { requestId } = await req.json()
    if (!requestId) {
      return new Response(JSON.stringify({ error: 'Request ID is required.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    const { error: updateError } = await supabaseAdmin
      .from('account_requests')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by_id: user.id,
        reviewed_by_name: profile.name,
      })
      .eq('id', requestId)
      .eq('status', 'pending')
    
    if (updateError) {
      console.error('Error updating request status to rejected:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to reject request.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    return new Response(JSON.stringify({ message: 'Request rejected successfully.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }
})
