import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createOpenAI } from "npm:@ai-sdk/openai@2";
import { streamText, stepCountIs, tool } from "npm:ai@5";
import { z } from "npm:zod@3";
import {
  DAYS,
  ROLE_KEYS,
  computeNetHours,
  dayHours,
  dayIndexOf,
  mondayOf,
  timeToHours,
} from "./planning.ts";

const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json({ error: "Missing LOVABLE_API_KEY" }, 500);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);

  const { data: role } = await supabase.rpc("get_my_role");
  if (!["admin", "manager", "editor"].includes(String(role))) {
    return json({ error: "forbidden" }, 403);
  }

  const BodySchema = z.object({
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().min(1).max(6000),
        }),
      )
      .min(1)
      .max(40),
    store_id: z.string().uuid().nullable().optional(),
    lang: z.enum(["fr", "nl"]).nullable().optional(),
    today: DATE.nullable().optional(),
  });

  let parsed;
  try {
    parsed = BodySchema.safeParse(await req.json());
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const { messages, store_id, lang, today } = parsed.data;

  // ---------- Quota : 10 questions par utilisateur et par jour ----------
  const DAILY_LIMIT = 10;
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const dayKeyBrussels = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const { data: usage } = await admin
    .from("assistant_usage")
    .select("id, count")
    .eq("user_id", userData.user.id)
    .eq("day", dayKeyBrussels)
    .maybeSingle();

  const used = usage?.count ?? 0;
  if (used >= DAILY_LIMIT) {
    return json({ error: "quota_exceeded", limit: DAILY_LIMIT }, 429);
  }
  if (usage) {
    await admin.from("assistant_usage").update({ count: used + 1 }).eq("id", usage.id);
  } else {
    await admin
      .from("assistant_usage")
      .insert({ user_id: userData.user.id, day: dayKeyBrussels, count: 1 });
  }

  // ---------- Outils (lecture seule, RLS de l'utilisateur) ----------
  const fetchEmployees = async (storeId: string) => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, name, last_name, role, contract_hours, is_cadre, sort_order")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  };

  const fetchWeek = async (storeId: string, weekStart: string) => {
    const employees = await fetchEmployees(storeId);
    const ids = employees.map((e) => e.id);
    if (ids.length === 0) return { employees, schedules: [] as any[], ferie: [] as any[] };
    const [{ data: schedules }, { data: ferie }] = await Promise.all([
      supabase.from("weekly_schedules").select("*").eq("week_start", weekStart).in("employee_id", ids),
      supabase.from("day_comments").select("day_key, is_ferie, comment").eq("week_start", weekStart).eq("store_id", storeId),
    ]);
    return { employees, schedules: schedules ?? [], ferie: ferie ?? [] };
  };

  const fullName = (e: any) => [e.name, e.last_name].filter(Boolean).join(" ");

  const tools = {
    list_employees: tool({
      description:
        "Liste les collaborateurs actifs d'un magasin avec leur rôle, heures de contrat et statut cadre.",
      inputSchema: z.object({ store_id: z.string().uuid() }),
      execute: async ({ store_id }) => {
        const employees = await fetchEmployees(store_id);
        return employees.map((e) => ({
          id: e.id,
          nom: fullName(e),
          role: e.role,
          contrat_h: e.contract_hours,
          cadre: e.is_cadre,
        }));
      },
    }),

    get_week_schedule: tool({
      description:
        "Planning complet d'une semaine (lundi YYYY-MM-DD) : horaires par jour, heures de table, heures nettes par collaborateur, jours fériés.",
      inputSchema: z.object({ store_id: z.string().uuid(), week_start: DATE }),
      execute: async ({ store_id, week_start }) => {
        const monday = mondayOf(week_start);
        const { employees, schedules, ferie } = await fetchWeek(store_id, monday);
        const byEmp = new Map(schedules.map((s: any) => [s.employee_id, s]));
        return {
          semaine_du: monday,
          feries: ferie.filter((f: any) => f.is_ferie).map((f: any) => f.day_key),
          collaborateurs: employees.map((e) => {
            const s = byEmp.get(e.id);
            const jours: Record<string, unknown> = {};
            for (const d of DAYS) {
              const dh = dayHours(s, d);
              if (dh.start) jours[d] = dh;
            }
            return {
              nom: fullName(e),
              role: e.role,
              contrat_h: e.contract_hours,
              cadre: e.is_cadre,
              heures_nettes: Number(computeNetHours(s).net.toFixed(2)),
              jours,
            };
          }),
        };
      },
    }),

    list_leaves: tool({
      description:
        "Congés et absences chevauchant une période, pour les collaborateurs d'un magasin.",
      inputSchema: z.object({
        store_id: z.string().uuid(),
        date_start: DATE,
        date_end: DATE,
      }),
      execute: async ({ store_id, date_start, date_end }) => {
        const employees = await fetchEmployees(store_id);
        const ids = employees.map((e) => e.id);
        if (ids.length === 0) return [];
        const { data, error } = await supabase
          .from("conges")
          .select("employee_id, type, date_start, date_end, notes")
          .in("employee_id", ids)
          .lte("date_start", date_end)
          .gte("date_end", date_start)
          .order("date_start", { ascending: true });
        if (error) throw new Error(error.message);
        const byId = new Map(employees.map((e) => [e.id, e]));
        return (data ?? []).map((c) => ({
          nom: fullName(byId.get(c.employee_id) ?? {}),
          role: byId.get(c.employee_id)?.role ?? null,
          type: c.type,
          du: c.date_start,
          au: c.date_end,
          note: c.notes,
        }));
      },
    }),

    get_day_coverage: tool({
      description:
        "Analyse de couverture d'une journée : qui travaille, à quelle heure, et pour chaque heure d'ouverture les catégories de rôle sans personne présente.",
      inputSchema: z.object({ store_id: z.string().uuid(), date: DATE }),
      execute: async ({ store_id, date }) => {
        const monday = mondayOf(date);
        const dayKey = DAYS[dayIndexOf(date)];
        const { employees, schedules, ferie } = await fetchWeek(store_id, monday);
        const { data: settings } = await supabase
          .from("store_settings")
          .select("schedule_start_hour, schedule_end_hour")
          .eq("store_id", store_id)
          .maybeSingle();
        const open = settings?.schedule_start_hour ?? 9;
        const close = settings?.schedule_end_hour ?? 20;
        const byEmp = new Map(schedules.map((s: any) => [s.employee_id, s]));

        const presents = employees
          .map((e) => ({ e, d: dayHours(byEmp.get(e.id), dayKey) }))
          .filter((x) => x.d.start && x.d.end);

        const trous: { heure: string; roles_absents: string[] }[] = [];
        for (let h = open; h < close; h++) {
          const rolesPresent = new Set(
            presents
              .filter((p) => timeToHours(p.d.start) <= h && timeToHours(p.d.end) > h)
              .map((p) => String(p.e.role).toLowerCase()),
          );
          const manquants = ROLE_KEYS.filter(
            (r) => r !== "stagiaire" && !rolesPresent.has(r),
          );
          if (manquants.length) trous.push({ heure: `${String(h).padStart(2, "0")}h00`, roles_absents: manquants });
        }

        return {
          date,
          jour: dayKey,
          ferie: ferie.some((f: any) => f.day_key === dayKey && f.is_ferie),
          ouverture: `${open}h-${close}h`,
          presents: presents.map((p) => ({
            nom: fullName(p.e),
            role: p.e.role,
            de: p.d.start,
            a: p.d.end,
            heure_de_table:
              p.d.break_start && p.d.break_end ? `${p.d.break_start}-${p.d.break_end}` : null,
            heures_nettes: Number(p.d.net.toFixed(2)),
          })),
          trous_de_couverture: trous,
        };
      },
    }),

    get_hours_and_fte: tool({
      description:
        "Heures nettes planifiées vs contrat et calcul ETP (base 36h) pour une semaine. Les cadres sont plafonnés à leur contrat pour l'ETP planifié.",
      inputSchema: z.object({ store_id: z.string().uuid(), week_start: DATE }),
      execute: async ({ store_id, week_start }) => {
        const monday = mondayOf(week_start);
        const { employees, schedules } = await fetchWeek(store_id, monday);
        const byEmp = new Map(schedules.map((s: any) => [s.employee_id, s]));
        const BASE = 36;
        let contratTotal = 0;
        let planifieTotal = 0;
        const lignes = employees.map((e) => {
          const s: any = byEmp.get(e.id);
          const net = s?.hours_modified ?? s?.hours_base ?? computeNetHours(s).net;
          const planifieEtp = e.is_cadre ? Math.min(net, e.contract_hours) : net;
          contratTotal += e.contract_hours;
          planifieTotal += planifieEtp;
          return {
            nom: fullName(e),
            role: e.role,
            contrat_h: e.contract_hours,
            planifie_h: Number(Number(net).toFixed(2)),
            ecart_h: Number((Number(net) - e.contract_hours).toFixed(2)),
            cadre_plafonne: e.is_cadre && net > e.contract_hours,
          };
        });
        return {
          semaine_du: monday,
          base_etp_h: BASE,
          etp_contractuel: Number((contratTotal / BASE).toFixed(2)),
          etp_planifie: Number((planifieTotal / BASE).toFixed(2)),
          ecart_etp: Number(((planifieTotal - contratTotal) / BASE).toFixed(2)),
          lignes,
        };
      },
    }),
  };

  const langue = lang === "nl" ? "néerlandais" : "français";
  const system = `Tu es l'assistant du logiciel "Planning Fnac" (Fnac Belgique). Tu réponds en ${langue}, de manière brève et factuelle.

CONTEXTE
- Date du jour : ${today ?? new Date().toISOString().slice(0, 10)}.
- Magasin sélectionné (store_id) : ${store_id ?? "aucun — demande à l'utilisateur de sélectionner un magasin"}.
- Utilise TOUJOURS ce store_id sauf si l'utilisateur nomme explicitement un autre magasin.

RÈGLES MÉTIER (à respecter dans tes réponses)
- Pause d'1h déduite uniquement si la journée fait 6h ou plus, sauf si une heure de table est encodée (on déduit alors sa durée réelle).
- Les statuts "ROULEMENT" et "EXT" (Extérieur) comptent 0h.
- ETP : base 36h/semaine. Les collaborateurs "cadre" sont plafonnés à leurs heures de contrat dans le calcul ETP uniquement.
- Semaines ISO commençant le lundi. Formats belges : dates DD/MM/YYYY, heures HHhMM (ex. 9h30).
- Catégories de rôle : responsable, technique, editorial, stock, caisse, stagiaire.
- Couverture critique : au moins une personne par catégorie (hors stagiaires) pendant les heures d'ouverture.

COMPORTEMENT
- Utilise les outils pour obtenir les données réelles ; n'invente jamais un nom, une heure ou un chiffre.
- Les dates que tu passes aux outils sont au format YYYY-MM-DD ; pour une semaine, donne le lundi.
- Tu es en lecture seule : tu ne peux rien modifier. Si on te demande de changer le planning, explique poliment qu'il faut le faire dans l'écran Plannings.
- Réponses courtes, listes à puces, chiffres arrondis à 0,5h près quand c'est pertinent.`;

  const lovable = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });

  const result = streamText({
    model: lovable.responses("openai/gpt-5.6-terra"),
    system,
    messages,
    tools,
    stopWhen: stepCountIs(50),
    providerOptions: { openai: { store: false } },
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const delta of result.textStream) {
          controller.enqueue(encoder.encode(delta));
        }
      } catch (err) {
        const msg = String((err as Error)?.message ?? err);
        let friendly = "Une erreur est survenue. Réessaie dans un instant.";
        if (msg.includes("429")) friendly = "Trop de requêtes vers l'IA. Réessaie dans quelques instants.";
        if (msg.includes("402")) friendly = "Crédits IA épuisés. Contacte l'administrateur pour recharger.";
        console.error("assistant stream error", msg);
        controller.enqueue(encoder.encode(`\n\n⚠️ ${friendly}`));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
  });
});
