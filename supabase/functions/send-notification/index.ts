
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Function to get user profile and check role
async function checkUserRole(supabaseClient: SupabaseClient, userId: string): Promise<boolean> {
  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    console.error('Error fetching profile or profile not found:', error);
    return false;
  }

  return ['admin', 'ahmad_rajili'].includes(profile.role);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    // Create a client with the user's token to get their ID
    const authHeader = req.headers.get('Authorization')!;
    const supabaseUserClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseUserClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user has permission using the admin client
    const hasPermission = await checkUserRole(supabaseAdminClient, user.id);
    if (!hasPermission) {
      return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { title, message, recipient } = await req.json();
    if (!title || !message || !recipient) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call the PostgreSQL function to send the notification
    const { data, error: rpcError } = await supabaseAdminClient.rpc('send_notification_to_role', {
      p_title: title,
      p_message: message,
      p_recipient_role: recipient,
      p_sender_id: user.id,
    });

    if (rpcError) throw rpcError;

    // Send push notification via FCM
    try {
      const pushResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          title,
          body: message,
          recipient,
          notificationType: 'general',
        }),
      });

      const pushResult = await pushResponse.json();
      console.log('Push notification result:', pushResult);
    } catch (pushError) {
      console.error('Error sending push notification:', pushError);
      // Don't fail the request if push notification fails
    }

    return new Response(JSON.stringify({ message: 'Notification sent successfully', notification_id: data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-notification function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
