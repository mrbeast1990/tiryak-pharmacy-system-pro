import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // احسب التاريخ قبل أسبوع
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    console.log('Deleting notifications older than:', oneWeekAgo.toISOString())

    // احذف حالات قراءة الإشعارات القديمة أولاً
    const { error: deleteReadStatusError } = await supabase
      .from('notification_read_status')
      .delete()
      .in('notification_id', 
        supabase
          .from('notifications')
          .select('id')
          .lt('created_at', oneWeekAgo.toISOString())
      )

    if (deleteReadStatusError) {
      console.error('Error deleting notification read statuses:', deleteReadStatusError)
      throw deleteReadStatusError
    }

    // احذف الإشعارات القديمة
    const { data: deletedNotifications, error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', oneWeekAgo.toISOString())
      .select('id')

    if (deleteError) {
      console.error('Error deleting old notifications:', deleteError)
      throw deleteError
    }

    const deletedCount = deletedNotifications?.length || 0
    console.log(`Successfully deleted ${deletedCount} old notifications`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedCount,
        message: `تم حذف ${deletedCount} إشعار قديم بنجاح`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in delete-old-notifications function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'فشل في حذف الإشعارات القديمة', 
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})