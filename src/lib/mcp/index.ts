import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listStoresTool from "./tools/list-stores";
import listEmployeesTool from "./tools/list-employees";
import getWeekScheduleTool from "./tools/get-week-schedule";
import listLeavesTool from "./tools/list-leaves";
import createLeaveTool from "./tools/create-leave";
import whoamiTool from "./tools/whoami";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "planning-fnac",
  title: "Planning Fnac",
  version: "1.0.0",
  instructions:
    "Tools for Planning Fnac (Fnac Belgium store scheduling). Use `whoami` and `list_stores` first to know the user's role and accessible stores, then `list_employees`, `get_week_schedule` (week_start = Monday, local YYYY-MM-DD) and `list_leaves`. `create_leave` adds an absence. All data is scoped by store and by the signed-in user's permissions.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listStoresTool, listEmployeesTool, getWeekScheduleTool, listLeavesTool, createLeaveTool],
});