import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationMessage {
  title: string;
  body: string;
}

const NOTIFICATION_MESSAGES: NotificationMessage[] = [
  {
    title: 'تذكير بتسجيل النواقص 💊',
    body: '⏰ النظام يذكّرك: حان وقت تسجيل النواقص... لا تقل "كنت ناوي" بعدين 😎',
  },
  {
    title: 'تذكير بتسجيل النواقص 💊',
    body: '💼 مرّ يومان كاملان! سجّل نواقص الصيدلية بسرعة قبل أن تسجّلك هي كنقص 😅',
  },
  {
    title: 'تذكير بتسجيل النواقص 💊',
    body: '🩺 تذكير هام: الأدوية تنتظرك لتسجّل نواقصها... لا تخيّب ظنها 😄',
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Starting periodic notification job...');

    // Get the current state
    const { data: stateData, error: stateError } = await supabase
      .from('periodic_notification_state')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (stateError) {
      console.error('❌ Error fetching state:', stateError);
      throw stateError;
    }

    // If no state exists, create initial state
    let currentIndex = 0;
    let stateId = null;

    if (!stateData) {
      console.log('📝 Creating initial state...');
      const { data: newState, error: createError } = await supabase
        .from('periodic_notification_state')
        .insert({ current_message_index: 0, last_sent_at: null })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating state:', createError);
        throw createError;
      }
      stateId = newState.id;
    } else {
      currentIndex = stateData.current_message_index;
      stateId = stateData.id;
    }

    console.log(`📊 Current message index: ${currentIndex}`);

    // Get the message to send
    const message = NOTIFICATION_MESSAGES[currentIndex];
    console.log(`📬 Sending message: ${message.title}`);

    // Call the send-notification function to send to all users
    const { data: notificationData, error: notificationError } = await supabase.functions.invoke(
      'send-notification',
      {
        body: {
          title: message.title,
          message: message.body,
          recipient: 'all',
        },
      }
    );

    if (notificationError) {
      console.error('❌ Error sending notification:', notificationError);
      throw notificationError;
    }

    console.log('✅ Notification sent successfully:', notificationData);

    // Update the state for next time
    const nextIndex = (currentIndex + 1) % NOTIFICATION_MESSAGES.length;
    const { error: updateError } = await supabase
      .from('periodic_notification_state')
      .update({
        current_message_index: nextIndex,
        last_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', stateId);

    if (updateError) {
      console.error('❌ Error updating state:', updateError);
      throw updateError;
    }

    console.log(`✅ State updated. Next message index: ${nextIndex}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Periodic notification sent successfully',
        currentMessage: message,
        nextIndex,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error in periodic notification function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
