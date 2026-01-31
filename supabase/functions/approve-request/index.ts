
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create an admin client to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create a client with the user's auth token to check their permissions
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
    
    const { requestId, role } = await req.json()
    if (!requestId) {
      return new Response(JSON.stringify({ error: 'Request ID is required.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    // Validate role
    const validRoles = ['admin', 'ahmad_rajili', 'morning_shift', 'evening_shift', 'night_shift', 'member']
    if (!role || !validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: 'يجب تحديد دور صالح للمستخدم.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    // Fetch the request details using admin client
    const { data: request, error: requestError } = await supabaseAdmin
      .from('account_requests')
      .select('email, full_name')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single()

    if (requestError) {
      console.error("Error fetching request:", requestError.message);
      return new Response(JSON.stringify({ error: 'Pending request not found or could not be fetched.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }
    
    // Invite the user by email using admin client with assigned role
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      request.email,
      {
        data: { 
          full_name: request.full_name,
          assigned_role: role 
        },
        redirectTo: req.headers.get('origin') || Deno.env.get('SITE_URL'),
      }
    )

    if (inviteError) {
      console.error('Error inviting user:', inviteError.message)
      // Check for common errors
      if (inviteError.message.includes('User already exists')) {
        return new Response(JSON.stringify({ error: 'المستخدم موجود بالفعل في النظام.' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
      }
      return new Response(JSON.stringify({ error: `فشل في دعوة المستخدم: ${inviteError.message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    // Update the account request status using admin client
    const { error: updateError } = await supabaseAdmin
      .from('account_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by_id: user.id,
        reviewed_by_name: profile.name,
      })
      .eq('id', requestId)
    
    if (updateError) {
      console.error('Error updating request status after invite:', updateError)
      // Even if this fails, the invite was sent. We return a partial success message.
      return new Response(JSON.stringify({ message: 'تمت دعوة المستخدم، لكن فشل تحديث حالة الطلب.' }), { status: 207, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    return new Response(JSON.stringify({ message: 'تمت دعوة المستخدم بنجاح.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }
})
