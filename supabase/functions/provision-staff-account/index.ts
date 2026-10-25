import { withSupabase } from "npm:@supabase/server@^1";

const json = (body: unknown, status = 200) => Response.json(body, { status });

const generatePassword = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  let value = "";
  for (const byte of bytes) value += alphabet[byte % alphabet.length];
  return `WF@${value}!`;
};

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const callerId = ctx.userClaims?.sub;
    if (!callerId) return json({ error: "Unauthorized" }, 401);

    const { data: profile, error: profileReadError } = await ctx.supabaseAdmin
      .from("profiles")
      .select("role,status")
      .eq("id", callerId)
      .single();

    if (profileReadError || !profile || profile.role !== "admin" || profile.status !== "active") {
      return json({ error: "Only an active owner/admin can create staff accounts." }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const assignedBranch = String(body.assigned_branch ?? "Main Branch").trim();

    if (!name || !email) return json({ error: "Name and email are required." }, 400);

    const password = generatePassword();
    const { data: created, error: createError } =
      await ctx.supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name, role: "staff" },
      });

    if (createError || !created.user) {
      return json({ error: createError?.message ?? "Unable to create staff account." }, 400);
    }

    const { error: profileError } = await ctx.supabaseAdmin.from("profiles").insert({
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
      await ctx.supabaseAdmin.auth.admin.deleteUser(created.user.id);
      return json(
        { error: `Staff account created but profile setup failed: ${profileError.message}` },
        500
      );
    }

    return json({
      success: true,
      staff_id: created.user.id,
      email,
      password,
      message: "Staff account created. Save the password; it is shown only once.",
    });
  }),
};
