import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPERVISOR_ROLES = ["supervisor_manutencao", "supervisor_operacoes", "supervisor_logistica"];
const SUBORDINATE_ROLES = ["operator", "mechanic", "logistica"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if bootstrap mode (no admin exists)
    const { data: anyAdmin } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("role", "admin")
      .limit(1);
    const noAdminExists = !anyAdmin || anyAdmin.length === 0;

    const body = await req.json();

    // Bootstrap: allow creating first admin without auth
    if (noAdminExists && body.action === "create" && body.role === "admin") {
      const { email, password } = body;
      if (!email) {
        return new Response(JSON.stringify({ error: "email is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const finalPassword = password || "watbrazil123";
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true,
      });
      if (createError) throw createError;
      const { error: roleError } = await adminClient.from("user_roles").insert({
        user_id: newUser.user.id,
        role: "admin",
        must_change_password: false,
      });
      if (roleError) throw roleError;
      return new Response(JSON.stringify({ userId: newUser.user.id, email, role: "admin" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normal auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader ? authHeader.replace("Bearer ", "") : "";
    let isAdmin = false;
    let isSupervisor = false;

    // Check if caller is using the service_role key (trusted server-side call)
    if (token === serviceRoleKey) {
      isAdmin = true;
    } else {
      const callerClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user: callerUser }, error: userError } = await callerClient.auth.getUser();
      if (userError || !callerUser) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const callerId = callerUser.id;

      // Check caller role
      const { data: callerRole } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", callerId)
        .maybeSingle();

      const callerRoleValue = callerRole?.role;
      isAdmin = callerRoleValue === "admin";
      isSupervisor = SUPERVISOR_ROLES.includes(callerRoleValue);
    }

    if (!isAdmin && !isSupervisor) {
      return new Response(JSON.stringify({ error: "Forbidden: insufficient permissions" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action } = body;

    if (action === "list") {
      const { data: roles, error: listError } = await adminClient
        .from("user_roles")
        .select("user_id, role, must_change_password");

      if (listError) throw listError;

      const users = [];
      for (const r of roles || []) {
        const { data: userData } = await adminClient.auth.admin.getUserById(r.user_id);
        if (userData?.user) {
          users.push({
            id: r.user_id,
            email: userData.user.email,
            role: r.role,
            must_change_password: r.must_change_password,
          });
        }
      }

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      const { email, password, role } = body;

      if (!email || !role) {
        return new Response(JSON.stringify({ error: "email and role are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Supervisors can only create operator/mechanic
      if (isSupervisor && !isAdmin && !SUBORDINATE_ROLES.includes(role)) {
        return new Response(JSON.stringify({ error: "Supervisors can only create operator or mechanic users" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const finalPassword = password || "watbrazil123";

      let userId: string;

      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true,
      });

      if (createError) {
        if (createError.message?.includes("already been registered")) {
          const { data: listData, error: listErr } = await adminClient.auth.admin.listUsers();
          if (listErr) throw listErr;
          const existing = listData.users.find((u) => u.email === email);
          if (!existing) throw new Error("User exists but could not be found");
          userId = existing.id;
        } else {
          throw createError;
        }
      } else {
        userId = newUser.user.id;
      }

      const { error: roleError } = await adminClient.from("user_roles").upsert({
        user_id: userId,
        role,
        must_change_password: true,
      }, { onConflict: "user_id,role" });

      if (roleError) throw roleError;

      return new Response(
        JSON.stringify({ userId, email, role }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reset-password") {
      const { userId } = body;

      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: resetError } = await adminClient.auth.admin.updateUserById(userId, {
        password: "watbrazil123",
      });

      if (resetError) throw resetError;

      await adminClient
        .from("user_roles")
        .update({ must_change_password: true })
        .eq("user_id", userId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
