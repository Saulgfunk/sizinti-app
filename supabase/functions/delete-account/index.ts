// Flow G: "Hesabı Sil" (delete account). Deleting an auth.users row needs
// the admin API (service_role key) — no client-side Supabase method can
// delete a user's own account directly. Verifies the caller's own access
// token first and only ever deletes *that* user — never an arbitrary id
// passed from the client — since this runs with full admin privileges.
//
// profiles/subscriptions/checkin_events/categories all reference
// auth.users(id) with `on delete cascade` (see the Phase 1 migration and
// 20260903154543_categories_table.sql), so deleting the auth user cascades
// through everything automatically — no manual cleanup needed here.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
});
