import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Inbox, Plus, Users, UserRound } from "lucide-react";
import { ShiftSwapPanel } from "./ShiftSwapPanel";
import { HourRequestPanel } from "./HourRequests";

const T = {
  title: { fr: "Mes demandes", nl: "Mijn aanvragen" },
  new: { fr: "Faire une demande", nl: "Een aanvraag indienen" },
  choose: { fr: "Que souhaitez-vous faire ?", nl: "Wat wil je doen?" },
  swap: { fr: "Échanger avec un collègue", nl: "Ruilen met een collega" },
  swapDesc: { fr: "Vous permutez une journée avec un collègue. Il donne son accord, puis le responsable valide.", nl: "Je ruilt een dag met een collega. Hij gaat akkoord, daarna keurt de verantwoordelijke goed." },
  hours: { fr: "Aménager mes horaires", nl: "Mijn uren aanpassen" },
  hoursDesc: { fr: "Demande directe au responsable : décaler vos heures ou poser un repos (RDV, imprévu).", nl: "Rechtstreekse aanvraag aan de verantwoordelijke: uren verschuiven of rust vragen (afspraak, onvoorzien)." },
};

interface Emp { id: string; name: string; last_name?: string | null; email?: string | null; store_id?: string | null }

export function RequestsHub({ employee }: { employee: Emp }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const tx = (k: keyof typeof T) => T[k][lang === "nl" ? "nl" : "fr"];
  const [choose, setChoose] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [hourOpen, setHourOpen] = useState(false);
  const isOwner = !!user?.email && !!employee.email && user.email.toLowerCase() === employee.email.toLowerCase();

  const { data: enabled } = useQuery({
    queryKey: ["store-swaps-enabled", employee.store_id],
    enabled: isOwner && !!employee.store_id,
    queryFn: async () => {
      const { data } = await (supabase as any).from("stores").select("has_shift_swaps").eq("id", employee.store_id).maybeSingle();
      return !!data?.has_shift_swaps;
    },
  });
  if (!isOwner || !enabled) return null;

  const pick = (which: "swap" | "hours") => { setChoose(false); which === "swap" ? setSwapOpen(true) : setHourOpen(true); };

  return (
    <div className="print:hidden mb-4 rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold"><Inbox className="h-4 w-4 text-accent" /> {tx("title")}</div>
        <Button size="sm" onClick={() => setChoose(true)}><Plus className="h-4 w-4 mr-1" />{tx("new")}</Button>
      </div>
      <ShiftSwapPanel employee={employee} embedded open={swapOpen} onOpenChange={setSwapOpen} />
      <HourRequestPanel employee={employee} embedded open={hourOpen} onOpenChange={setHourOpen} />

      <Dialog open={choose} onOpenChange={setChoose}>
        <DialogContent>
          <DialogHeader><DialogTitle>{tx("choose")}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={() => pick("swap")} className="text-left rounded-xl border-2 border-border hover:border-accent p-4 space-y-2 transition-colors">
              <Users className="h-8 w-8 text-accent" />
              <div className="font-semibold">👥 {tx("swap")}</div>
              <p className="text-xs text-muted-foreground">{tx("swapDesc")}</p>
            </button>
            <button onClick={() => pick("hours")} className="text-left rounded-xl border-2 border-border hover:border-primary p-4 space-y-2 transition-colors">
              <UserRound className="h-8 w-8 text-primary" />
              <div className="font-semibold">🙋 {tx("hours")}</div>
              <p className="text-xs text-muted-foreground">{tx("hoursDesc")}</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
