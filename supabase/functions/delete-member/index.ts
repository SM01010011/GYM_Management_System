import \"jsr:@supabase/functions-js/edge-runtime.d.ts\";
import { createClient } from \"jsr:@supabase/supabase-js@2\";

const url = Deno.env.get(\"SUPABASE_URL\")!;
const serviceRoleKey = Deno.env.get(\"SUPABASE_SERVICE_ROLE_KEY\")!;
const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { \"Content-Type\": \"application/json\" } });

Deno.serve(async (req) => {
  if (req.method !== \"POST\") return json({ error: \"Method not allowed\" }, 405);
  const header = req.headers.get(\"Authorization\");
  if (!header?.startsWith(\"Bearer \")) return json({ error: \"Unauthorized\" }, 401);
  const { data: caller, error: callerError } = await admin.auth.getUser(header.slice(7));
  if (callerError || !caller.user) return json({ error: \"Unauthorized\" }, 401);
  const { data: profile } = await admin.from(\"profiles\").select(\"role,status\").eq(\"id\", caller.user.id).single();
  if (!profile || profile.role !== \"admin\" || profile.status !== \"active\") return json({ error: \"Only an active owner/admin can delete members.\" }, 403);

  const body = await req.json().catch(() => ({}));
  const memberId = String(body.member_id ?? \"\").trim();
  if (!memberId) return json({ error: \"member_id is required.\" }, 400);
  const { data: member, error: memberError } = await admin.from(\"members\").select(\"id,user_id\").eq(\"id\", memberId).single();
  if (memberError || !member) return json({ error: \"Member not found.\" }, 404);

  for (const table of [\"attendance\", \"trainer_assignments\", \"workout_plans\", \"payments\"]) {
    const { error } = await admin.from(table).delete().eq(\"member_id\", memberId);
    if (error) return json({ error: `Unable to delete dependent ${table}: ${error.message}` }, 500);
  }
  const { data: memberships, error: membershipsReadError } = await admin.from(\"memberships\").select(\"id\").eq(\"member_id\", memberId);
  if (membershipsReadError) return json({ error: `Unable to read memberships: ${membershipsReadError.message}` }, 500);
  const membershipIds = (memberships ?? []).map(row => row.id);
  if (membershipIds.length) {
    const { error } = await admin.from(\"payments\").delete().in(\"membership_id\", membershipIds);
    if (error) return json({ error: `Unable to delete membership payments: ${error.message}` }, 500);
  }
  const { error: membershipDeleteError } = await admin.from(\"memberships\").delete().eq(\"member_id\", memberId);
  if (membershipDeleteError) return json({ error: `Unable to delete memberships: ${membershipDeleteError.message}` }, 500);
  const { error: memberDeleteError } = await admin.from(\"members\").delete().eq(\"id\", memberId);
  if (memberDeleteError) return json({ error: `Unable to delete member: ${memberDeleteError.message}` }, 500);
  if (member.user_id) await admin.auth.admin.deleteUser(member.user_id);
  return json({ success: true });
});
