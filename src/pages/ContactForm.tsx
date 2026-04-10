import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send, Paperclip, X, CheckCircle2, ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const SUBJECT_OPTIONS = [
  "Demande générale",
  "Réclamation / plainte",
  "Suggestion",
];

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function generateTicketNumber(): string {
  const num = Math.floor(Math.random() * 1000000);
  return `TICKET-${String(num).padStart(6, "0")}`;
}

export default function ContactForm() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast.error("Format non supporté. Utilisez JPG, PNG, GIF, WebP ou PDF.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error("Le fichier ne doit pas dépasser 5 Mo.");
      return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject || !message.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setSending(true);
    try {
      const ticket = generateTicketNumber();
      let attachmentUrl: string | null = null;

      // Upload file if present
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${ticket}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("contact-attachments")
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("contact-attachments")
          .getPublicUrl(path);
        attachmentUrl = urlData.publicUrl;
      }

      // Insert message
      const { error: insertError } = await supabase
        .from("contact_messages")
        .insert({
          ticket_number: ticket,
          name: name.trim(),
          email: email.trim(),
          subject,
          message: message.trim(),
          attachment_url: attachmentUrl,
        });
      if (insertError) throw insertError;

      // Send email notification via edge function
      try {
        await supabase.functions.invoke("send-contact-email", {
          body: {
            ticket_number: ticket,
            name: name.trim(),
            email: email.trim(),
            subject,
            message: message.trim(),
            attachment_url: attachmentUrl,
          },
        });
      } catch {
        // Email failure shouldn't block the form submission
        console.warn("Email notification failed, but message was saved.");
      }

      setTicketNumber(ticket);
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setSending(false);
    }
  };

  if (ticketNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "hsl(var(--background))" }}>
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto" style={{ color: "hsl(var(--success))" }} />
            <h2 className="text-xl font-bold text-foreground">Message envoyé !</h2>
            <p className="text-muted-foreground text-sm">
              Votre message a bien été envoyé.<br />
              Référence : <span className="font-mono font-bold text-foreground">{ticketNumber}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Conservez cette référence pour le suivi de votre demande.
            </p>
            <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "hsl(var(--background))" }}>
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <img src="/favicon.png" alt="Logo" className="h-10 w-10" />
          </div>
          <CardTitle className="text-xl">Nous contacter</CardTitle>
          <CardDescription>Envoyez-nous un message, nous vous répondrons dans les plus brefs délais.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Sujet *</Label>
              <Select value={subject} onValueChange={setSubject} required>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un sujet" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECT_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Décrivez votre demande..." rows={5} required />
            </div>

            <div className="space-y-2">
              <Label>Joindre une capture d'écran (optionnel)</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4 mr-1" />
                  {file ? "Changer" : "Choisir un fichier"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {file && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {file.name}
                    <button type="button" onClick={removeFile} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP ou PDF — Max 5 Mo</p>
              {filePreview && (
                <div className="mt-2">
                  <img src={filePreview} alt="Aperçu" className="max-h-32 rounded-md border object-contain" />
                </div>
              )}
              {file && !filePreview && (
                <div className="mt-2 p-3 rounded-md border bg-muted/50 text-xs text-muted-foreground flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  {file.name} ({(file.size / 1024).toFixed(0)} Ko)
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={sending || !subject}>
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {sending ? "Envoi en cours..." : "Envoyer le message"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
