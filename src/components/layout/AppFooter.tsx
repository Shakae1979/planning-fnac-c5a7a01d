import { APP_VERSION } from "@/lib/version";

export function AppFooter() {
  return (
    <footer className="no-print border-t bg-card px-4 py-2 text-center text-[11px] text-muted-foreground">
      Planning Fnac — <span className="font-mono">{APP_VERSION}</span>
    </footer>
  );
}