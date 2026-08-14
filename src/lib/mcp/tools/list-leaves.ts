import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_leaves",
  title: "Lister les congés",
  description: "List leaves/absences overlapping a date range, optionally filtered by store.",
  inputSchema: {
    date_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Range start, YYYY-MM-DD."),
    date_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Range end, YYYY-MM-DD."),
    store_id: z.string().uuid().optional().describe("Limit to employees of this store."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ date_start, date_end, store_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("conges")
      .select("id, employee_id, type, date_start, date_end, notes, employees(name, last_name, role, store_id)")
      .lte("date_start", date_end)
      .gte("date_end", date_start)
      .order("date_start", { ascending: true });
    if (store_id) query = query.eq("employees.store_id", store_id);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = store_id ? (data ?? []).filter((r) => r.employees) : (data ?? []);
    return {
      content: [{ type: "text", text: JSON.stringify(rows) }],
      structuredContent: { leaves: rows },
    };
  },
});