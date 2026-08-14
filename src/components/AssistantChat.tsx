import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, Square, RotateCcw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";
import { useI18n } from "@/lib/i18n";
import { formatLocalDate } from "@/lib/format";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "planning-fnac-assistant";

/** Rendu léger : **gras** uniquement, le reste en texte brut. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export function AssistantChat() {
  const { role } = useAuth();
  const { currentStore } = useStore();
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const allowed = role === "admin" || role === "manager" || role === "editor";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      /* ignore */
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open, busy]);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy) return;
      const next: Msg[] = [...messages, { role: "user", content: question }];
      setMessages([...next, { role: "assistant", content: "" }]);
      setInput("");
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assistant`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            messages: next,
            store_id: currentStore?.id ?? null,
            lang,
            today: formatLocalDate(new Date()),
          }),
        });

        if (!res.ok || !res.body) {
          const msg =
            res.status === 403
              ? t("assistant.forbidden")
              : res.status === 429
                ? t("assistant.quota")
                : t("assistant.error");
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: msg };
            return copy;
          });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: acc };
            return copy;
          });
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: t("assistant.error") };
            return copy;
          });
        }
      } finally {
        abortRef.current = null;
        setBusy(false);
      }
    },
    [busy, messages, currentStore?.id, lang, t],
  );

  if (!allowed) return null;

  const suggestions = [t("assistant.s1"), t("assistant.s2"), t("assistant.s3")];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 h-8 px-2 lg:px-2.5 rounded-md text-xs font-medium transition-colors hover:opacity-80"
        style={{ background: "hsl(var(--sidebar-active))", color: "hsl(var(--accent-foreground))" }}
        title={t("assistant.title")}
        aria-label={t("assistant.title")}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span className="hidden xl:inline">{t("assistant.title")}</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="flex items-center gap-2 text-base pr-8">
              <Bot className="h-4 w-4 text-primary" />
              {t("assistant.title")}
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 text-xs"
                  onClick={() => setMessages([])}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  {t("assistant.new")}
                </Button>
              )}
            </SheetTitle>
            <p className="text-[11px] text-muted-foreground text-left">
              {t("assistant.subtitle")}
              {currentStore ? ` — ${currentStore.name}` : ""}
              {` · ${t("assistant.quotaHint")}`}
            </p>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t("assistant.empty")}</p>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="w-full text-left text-xs rounded-md border px-3 py-2 hover:bg-accent/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary/10 ml-6"
                    : "bg-muted mr-2"
                }`}
              >
                {m.content ? (
                  <RichText text={m.content} />
                ) : busy && i === messages.length - 1 ? (
                    <span className="inline-flex gap-1 items-center text-muted-foreground text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:240ms]" />
                    </span>
                ) : null}
              </div>
            ))}
          </div>

          <div className="border-t p-3 flex gap-2 items-end">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={2}
              placeholder={t("assistant.placeholder")}
              className="resize-none text-sm min-h-[44px]"
            />
            {busy ? (
              <Button size="icon" variant="secondary" onClick={() => abortRef.current?.abort()}>
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="icon" onClick={() => send(input)} disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
