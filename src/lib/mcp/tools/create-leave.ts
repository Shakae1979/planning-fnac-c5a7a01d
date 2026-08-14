import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_leave",
  title: "Créer un congé",
  description: "Create a leave/absence for an employee over a date range.",
  inputSchema: {
    employee_id: z.string().uuid().describe("Employee id."),
    type: z.string().trim().min(1).describe("Leave type code (e.g. CA, RC, MAL)."),
    date_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("First day, YYYY-MM-DD."),
    date_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Last day, YYYY-MM-DD."),
    notes: z.string().trim().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ employee_id, type, date_start, date_end, notes }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    if (date_end < date_start) {
      return { content: [{ type: "text", text: "date_end must be on or after date_start" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("conges")
      .insert({ employee_id, type, date_start, date_end, notes: notes ?? null })
      .select();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data?.[0] ?? null) }],
      structuredContent: { leave: data?.[0] ?? null },
    };
  },
});