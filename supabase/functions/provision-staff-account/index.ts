import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const generatePassword = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  let value = "";
  for (const byte of bytes) value += alphabet[byte % alphabet.length];
  return `WF@${value}!`;
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const { data: caller, error: callerError } = await admin.auth.getUser(authHeader.slice(7));
  if (callerError || !caller.user) return json({ error: "Unauthorized" }, 401);

  const { data: profile } = await admin
    .from("profiles")
    .select("role,status")
    .eq("id", caller.user.id)
    .single();

  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    return json({ error: "Only an active owner/admin can create staff accounts." }, 403);
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const assignedBranch = String(body.assigned_branch ?? "Main Branch").trim();

  if (!name || !email) return json({ error: "Name and email are required." }, 400);

  const password = generatePassword();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, role: "staff" },
  });

  if (createError || !created.user) {
    return json({ error: createError?.message ?? "Unable to create staff account." }, 400);
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    email,
    full_name: name,
    phone: phone || null,
    role: "staff",
    status: "active",
    can_manage_members: true,
    can_manage_memberships: true,
    can_record_payments: true,
    can_manage_attendance: true,
    can_view_reports: false,
    assigned_branch: assignedBranch || "Main Branch",
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: `Staff account created but profile setup failed: ${profileError.message}` }, 500);
  }

  return json({
    success: true,
    staff_id: created.user.id,
    email,
    password,
    message: "Staff account created. Save the password; it is shown only once.",
  });
});
