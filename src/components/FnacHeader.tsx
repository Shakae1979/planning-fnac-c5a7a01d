import { Calendar } from "lucide-react";
import { ReactNode } from "react";

interface FnacHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  children?: ReactNode;
}

export function FnacHeader({ title, subtitle, icon: Icon, children }: FnacHeaderProps) {
  return (
    <header className="border-b" style={{ background: "hsl(var(--sidebar-bg))" }}>
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" style={{ color: "hsl(var(--sidebar-active))" }} />
            <span className="text-base font-extrabold tracking-tight" style={{ color: "hsl(var(--sidebar-active))" }}>
              fnac
            </span>
          </div>
          <div className="h-5 w-px" style={{ background: "hsl(var(--sidebar-fg) / 0.2)" }} />
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5" style={{ color: "hsl(var(--sidebar-fg))" }} />}
            <div>
              <h1 className="text-sm font-bold" style={{ color: "hsl(var(--sidebar-fg))" }}>{title}</h1>
              {subtitle && (
                <p className="text-[10px]" style={{ color: "hsl(var(--sidebar-fg) / 0.6)" }}>{subtitle}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {children}
        </div>
      </div>
    </header>
  );
}
