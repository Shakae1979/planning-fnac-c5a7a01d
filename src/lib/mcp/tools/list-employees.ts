import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_employees",
  title: "Lister les collaborateurs",
  description: "List employees of a store (name, role, contract hours, active status).",
  inputSchema: {
    store_id: z.string().uuid().optional().describe("Store id; omit to list all accessible employees."),
    include_inactive: z.boolean().optional().describe("Include inactive employees (default false)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ store_id, include_inactive }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("employees")
      .select("id, name, last_name, role, contract_hours, is_active, is_cadre, sort_order, store_id")
      .order("sort_order", { ascending: true });
    if (store_id) query = query.eq("store_id", store_id);
    if (!include_inactive) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { employees: data ?? [] },
    };
  },
});