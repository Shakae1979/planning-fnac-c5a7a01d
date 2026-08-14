import { defineTool } from "@lovable.dev/mcp-js";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "whoami",
  title: "Mon compte",
  description: "Return the signed-in user's email and application role (admin, manager, editor, user).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.rpc("get_my_role");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const profile = { user_id: ctx.getUserId(), email: ctx.getUserEmail(), role: data ?? "user" };
    return {
      content: [{ type: "text", text: JSON.stringify(profile) }],
      structuredContent: profile,
    };
  },
});