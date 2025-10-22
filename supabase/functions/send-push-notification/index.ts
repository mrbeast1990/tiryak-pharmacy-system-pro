import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  tokens: string[];
}

async function sendFCMNotification(payload: NotificationPayload, fcmServerKey: string) {
  const fcmEndpoint = 'https://fcm.googleapis.com/fcm/send';
  
  const promises = payload.tokens.map(async (token) => {
    try {
      const response = await fetch(fcmEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${fcmServerKey}`,
        },
        body: JSON.stringify({
          to: token,
          notification: {
            title: payload.title,
            body: payload.body,
            sound: 'default',
            badge: '1',
          },
          data: payload.data || {},
          priority: 'high',
        }),
      });

      const result = await response.json();
      console.log('FCM Response:', result);
      return result;
    } catch (error) {
      console.error('Error sending to token:', token, error);
      return { error };
    }
  });

  return await Promise.all(promises);
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { title, body, recipient, data, notificationType = 'general' } = await req.json();

    // Get FCM server key from environment
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
    if (!fcmServerKey) {
      console.warn('FCM_SERVER_KEY not configured, skipping push notification');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Notification created but push notification not sent (FCM not configured)' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get tokens based on recipient (only for users with notifications enabled)
    let tokens: string[] = [];
    
    if (recipient === 'all') {
      const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('fcm_token')
        .not('fcm_token', 'is', null)
        .eq('notifications_enabled', true);
      
      tokens = profiles?.map(p => p.fcm_token).filter(Boolean) || [];
    } else {
      const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('fcm_token')
        .eq('role', recipient)
        .not('fcm_token', 'is', null)
        .eq('notifications_enabled', true);
      
      tokens = profiles?.map(p => p.fcm_token).filter(Boolean) || [];
    }

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No tokens found for recipients' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Log notification to database
    const { error: logError } = await supabaseClient
      .from('notifications_log')
      .insert({
        title,
        body,
        notification_type: notificationType,
        sent_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Error logging notification:', logError);
    }

    // Send push notifications
    const results = await sendFCMNotification(
      {
        title,
        body,
        data,
        tokens,
      },
      fcmServerKey
    );

    console.log(`Push notification sent: ${title} to ${tokens.length} devices`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Push notifications sent',
        results,
        tokenCount: tokens.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
