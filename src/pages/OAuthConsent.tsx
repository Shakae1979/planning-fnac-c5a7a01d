import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Paramètre authorization_id manquant.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Aucune redirection renvoyée par le serveur d'autorisation.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "cette application";

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "hsl(var(--sidebar-bg))" }}>
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" style={{ color: "hsl(var(--sidebar-active))" }} />
            <span className="text-xl font-extrabold tracking-tight">Planning Fnac</span>
          </div>
          <CardTitle className="text-base font-semibold">Autorisation d'accès</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {error && <p className="text-destructive">Impossible de traiter cette demande : {error}</p>}
          {!error && !details && (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {!error && details && (
            <>
              <p className="text-muted-foreground">
                Connecter <span className="font-semibold text-foreground">{clientName}</span> à votre compte&nbsp;?
                L'application pourra consulter vos plannings et congés en votre nom, selon vos droits.
              </p>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" disabled={busy} onClick={() => decide(false)}>
                  Refuser
                </Button>
                <Button disabled={busy} onClick={() => decide(true)}>
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Autoriser
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}