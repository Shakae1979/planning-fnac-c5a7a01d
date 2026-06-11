import { APP_VERSION } from "@/lib/version";

/**
 * Footer global discret affichant la version de l'application.
 * Positionné en bas à droite, fixed, non intrusif et masqué à l'impression.
 */
export function AppFooter() {
  return (
    <div
      className="no-print fixed bottom-1.5 right-2 z-50 pointer-events-none select-none rounded-md bg-card/70 px-2 py-0.5 text-[10px] font-mono text-muted-foreground backdrop-blur-sm border border-border/40 shadow-sm"
      aria-label="Application version"
    >
      Planning Fnac · {APP_VERSION}
    </div>
  );
}