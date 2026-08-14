import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_week_schedule",
  title: "Planning d'une semaine",
  description:
    "Get the weekly schedule (start/end and lunch breaks per day) for a store and a week starting on Monday (YYYY-MM-DD).",
  inputSchema: {
    store_id: z.string().uuid().describe("Store id."),
    week_start: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe("Monday of the week, local date YYYY-MM-DD."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ store_id, week_start }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, name, last_name, role, contract_hours, sort_order")
      .eq("store_id", store_id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (empError) return { content: [{ type: "text", text: empError.message }], isError: true };

    const ids = (employees ?? []).map((e) => e.id);
    if (ids.length === 0) {
      return { content: [{ type: "text", text: "[]" }], structuredContent: { rows: [] } };
    }
    const { data: schedules, error } = await supabase
      .from("weekly_schedules")
      .select("*")
      .eq("week_start", week_start)
      .in("employee_id", ids);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const byEmployee = new Map((schedules ?? []).map((s) => [s.employee_id, s]));
    const rows = (employees ?? []).map((e) => ({ employee: e, schedule: byEmployee.get(e.id) ?? null }));
    return {
      content: [{ type: "text", text: JSON.stringify(rows) }],
      structuredContent: { week_start, rows },
    };
  },
});