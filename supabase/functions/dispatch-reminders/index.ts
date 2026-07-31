import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
const vapidSubject = 'mailto:hello@momentum.local' 

webpush.setVapidDetails(
  vapidSubject,
  vapidPublicKey,
  vapidPrivateKey
)

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, user_id, title, reminder_at')
      .eq('status', 'active')
      .not('reminder_at', 'is', null)
      .lte('reminder_at', new Date().toISOString());

    if (tasksError) throw tasksError;
    if (!tasks || tasks.length === 0) {
      return new Response(JSON.stringify({ message: "No reminders to send" }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const deliveryResults = [];

    for (const task of tasks) {
      const deliveryKey = `${task.id}_${task.reminder_at}`;
      const { data: existing } = await supabase
        .from('reminder_deliveries')
        .select('id')
        .eq('delivery_key', deliveryKey)
        .single();
        
      if (existing) continue; 

      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', task.user_id);
        
      if (!subscriptions || subscriptions.length === 0) continue;

      for (const sub of subscriptions) {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              auth: sub.auth_key,
              p256dh: sub.p256dh_key
            }
          };
          
          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify({
              title: "Task Reminder",
              body: task.title,
              url: "/",
            })
          );
          
          deliveryResults.push({ success: true, user: task.user_id });
        } catch (err: any) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
          console.error("Push error:", err);
        }
      }
      
      await supabase.from('reminder_deliveries').insert({
        user_id: task.user_id,
        task_id: task.id,
        reminder_type: 'push',
        delivery_key: deliveryKey
      });
    }

    return new Response(JSON.stringify({ processed: tasks.length, deliveryResults }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
