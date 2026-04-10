import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, MailOpen, Paperclip, Eye, Loader2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ContactMessage {
  id: string;
  ticket_number: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
}

export function ContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setMessages(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const markAsRead = async (msg: ContactMessage) => {
    if (!msg.is_read) {
      await supabase
        .from("contact_messages")
        .update({ is_read: true })
        .eq("id", msg.id);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m))
      );
    }
    setSelected(msg);
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Messages reçus
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">{unreadCount} non lu{unreadCount > 1 ? "s" : ""}</Badge>
          )}
        </h2>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucun message reçu pour le moment.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <Card
              key={msg.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                !msg.is_read ? "border-l-4 border-l-primary bg-primary/5" : ""
              }`}
              onClick={() => markAsRead(msg)}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {msg.is_read ? (
                      <MailOpen className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    ) : (
                      <Mail className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">{msg.ticket_number}</span>
                        <span className="font-semibold text-sm truncate">{msg.name}</span>
                        <Badge variant="outline" className="text-xs">{msg.subject}</Badge>
                        {msg.attachment_url && (
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.message}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(msg.created_at), "dd MMM HH:mm", { locale: fr })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <span className="font-mono text-sm text-muted-foreground">{selected.ticket_number}</span>
                  <Badge variant="outline">{selected.subject}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground text-xs">Nom</span>
                    <p className="font-medium">{selected.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Email</span>
                    <p className="font-medium">{selected.email}</p>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Date</span>
                  <p>{format(new Date(selected.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Message</span>
                  <p className="whitespace-pre-wrap bg-muted/50 rounded-md p-3 mt-1">{selected.message}</p>
                </div>
                {selected.attachment_url && (
                  <div>
                    <span className="text-muted-foreground text-xs">Pièce jointe</span>
                    <div className="mt-1">
                      {isImage(selected.attachment_url) ? (
                        <a href={selected.attachment_url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={selected.attachment_url}
                            alt="Pièce jointe"
                            className="max-h-48 rounded-md border object-contain hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ) : (
                        <a
                          href={selected.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm"
                        >
                          <Paperclip className="h-4 w-4" />
                          Voir la pièce jointe
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
