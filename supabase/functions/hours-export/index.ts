import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const expected = Deno.env.get("HOURS_EXPORT_API_KEY");
    if (!expected) return json({ error: "Export not configured" }, 500);

    const provided =
      req.headers.get("x-api-key") ??
      (req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "");

    if (provided !== expected) return json({ error: "Unauthorized" }, 401);

    const url = new URL(req.url);
    const p = url.searchParams;

    const granularity = (p.get("granularity") ?? "week").toLowerCase();
    if (granularity !== "week" && granularity !== "month") {
      return json({ error: "granularity must be 'week' or 'month'" }, 400);
    }

    let from = p.get("from") ?? "";
    let to = p.get("to") ?? "";

    if (granularity === "month") {
      if (!MONTH_RE.test(from) || !MONTH_RE.test(to)) {
        return json({ error: "from/to must be YYYY-MM for granularity=month" }, 400);
      }
      from = `${from}-01`;
      to = `${to}-01`;
    } else {
      if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
        return json({ error: "from/to must be YYYY-MM-DD for granularity=week" }, 400);
      }
    }
    if (from > to) return json({ error: "'from' must be before 'to'" }, 400);

    const UUID_RE = /^[0-9a-f-]{36}$/i;

    const storeId = p.get("store_id");
    if (storeId && !UUID_RE.test(storeId)) {
      return json({ error: "store_id must be a UUID" }, 400);
    }

    const employeeId = p.get("employee_id");
    if (employeeId && !UUID_RE.test(employeeId)) {
      return json({ error: "employee_id must be a UUID" }, 400);
    }

    const includeInactive = p.get("include_inactive") === "1";
    const format = (p.get("format") ?? "json").toLowerCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const fn = granularity === "week" ? "export_hours_weekly" : "export_hours_monthly";
    const { data, error } = await supabase.rpc(fn, {
      _from: from,
      _to: to,
      _store_code: storeCode,
      _employee_id: employeeId,
      _include_inactive: includeInactive,
    });

    if (error) {
      console.error("hours-export rpc failed", error);
      return json({ error: "Query failed", details: error.message }, 500);
    }

    const rows = (data ?? []) as Record<string, unknown>[];

    if (format === "csv") {
      return new Response(toCsv(rows), {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="hours-${granularity}-${from}_${to}.csv"`,
        },
      });
    }

    return json({ granularity, from, to, count: rows.length, rows });
  } catch (e) {
    console.error("hours-export error", e);
    return json({ error: "Unexpected error", details: String(e) }, 500);
  }
});
