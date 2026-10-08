import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

// Números de destino dos avisos (somente dígitos, com DDI). Ajustar quando houver os números definitivos.
const DEFAULT_RECIPIENTS = ["5541987858228", "5511981553151", "5511999109227"];
// Grupos de WhatsApp que recebem os avisos (IDs terminando em @g.us).
const GROUP_IDS: string[] = ["120363412440040092@g.us"]; // Will-GroupTest

// Cabeçalho fixo no início de toda mensagem enviada.
const MSG_HEADER = "WAT Brazil - Gerenciamento de Manutenção";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);

    const body = await req.json().catch(() => null);

    let host = (Deno.env.get("MEGA_API_HOST") || "").trim().replace(/\/+$/, "");
    if (host && !/^https?:\/\//.test(host)) host = `https://${host}`;
    const instance = Deno.env.get("MEGA_API_INSTANCE");
    const token = Deno.env.get("MEGA_API_TOKEN");
    if (!host || !instance || !token) return json({ error: "MEGA API não configurada" }, 500);

    if (body?.action === "list-groups") {
      const r = await fetch(`${host}/rest/group/list/${instance}`, { headers: { Authorization: `Bearer ${token}` } });
      const t = await r.text();
      return new Response(t, { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const raw = typeof body?.text === "string" ? body.text.trim() : "";
    if (!raw) return json({ error: "Texto obrigatório" }, 400);
    const text = (raw.startsWith(MSG_HEADER) ? raw : `${MSG_HEADER}\n\n${raw}`).slice(0, 3000);

    const results = [];
    for (const num of [...DEFAULT_RECIPIENTS, ...GROUP_IDS]) {
      const to = num.includes("@") ? num : `${num}@s.whatsapp.net`;
      const r = await fetch(`${host}/rest/sendMessage/${instance}/text`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messageData: { to, text } }),
      });
      const resText = await r.text();
      if (!r.ok) console.error(`MEGA API falhou [${r.status}]: ${resText}`);
      results.push({ to: num, status: r.status, ok: r.ok, details: r.ok ? undefined : resText });
    }
    const allOk = results.every((r) => r.ok);
    return json({ ok: allOk, results }, allOk ? 200 : 502);
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
