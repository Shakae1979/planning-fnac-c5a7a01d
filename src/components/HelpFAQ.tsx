import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_FR: FAQItem[] = [
  {
    question: "Comment modifier les horaires d'un employé ?",
    answer: "Rendez-vous sur la page 'Planning semaine', sélectionnez la semaine souhaitée et cliquez sur les cases horaires de l'employé pour saisir ses heures de début et de fin.",
  },
  {
    question: "Comment utiliser la grille horaire du jour ?",
    answer: "Sur la page 'Équipe du jour', la grille affiche les créneaux de 30 minutes. Cliquez sur plusieurs cases pour les sélectionner, puis utilisez le bouton 'Appliquer' pour attribuer un rôle à toute la sélection. N'oubliez pas de sauvegarder.",
  },
  {
    question: "Comment ajouter un congé ?",
    answer: "Allez dans l'onglet 'Congés', cliquez sur 'Ajouter un congé', sélectionnez l'employé, les dates et le type de congé, puis validez.",
  },
  {
    question: "Comment changer de magasin ?",
    answer: "Si vous avez accès à plusieurs magasins, utilisez le sélecteur de magasin dans la barre de navigation en haut de page.",
  },
  {
    question: "Comment ajouter une note sur un employé dans la grille du jour ?",
    answer: "Dans la grille horaire, un champ 'Note...' apparaît sous le nom de chaque employé. Saisissez votre commentaire et sauvegardez la grille.",
  },
  {
    question: "Les modifications sont-elles sauvegardées automatiquement ?",
    answer: "Non, vous devez cliquer sur le bouton 'Sauvegarder' pour enregistrer vos modifications sur la grille horaire et les plannings.",
  },
  {
    question: "Comment voir le récapitulatif des heures de l'équipe ?",
    answer: "Depuis le tableau de bord (accessible aux admins), cliquez sur 'Récap équipe' dans le menu latéral pour voir un résumé des heures par employé.",
  },
];

const FAQ_NL: FAQItem[] = [
  {
    question: "Hoe wijzig ik het rooster van een medewerker?",
    answer: "Ga naar 'Weekplanning', selecteer de gewenste week en klik op de roostervelden van de medewerker om begin- en eindtijden in te voeren.",
  },
  {
    question: "Hoe gebruik ik het uurrooster van de dag?",
    answer: "Op de pagina 'Team van de dag' toont het rooster slots van 30 minuten. Klik op meerdere cellen om ze te selecteren, gebruik dan 'Toepassen' om een rol toe te wijzen. Vergeet niet op te slaan.",
  },
  {
    question: "Hoe voeg ik verlof toe?",
    answer: "Ga naar 'Verlof', klik op 'Verlof toevoegen', selecteer de medewerker, data en type, en bevestig.",
  },
  {
    question: "Hoe wissel ik van winkel?",
    answer: "Als u toegang heeft tot meerdere winkels, gebruik dan de winkelselector in de navigatiebalk bovenaan.",
  },
  {
    question: "Hoe voeg ik een notitie toe bij een medewerker in het dagrooster?",
    answer: "In het uurrooster verschijnt een 'Note...' veld onder de naam van elke medewerker. Typ uw opmerking en sla het rooster op.",
  },
  {
    question: "Worden wijzigingen automatisch opgeslagen?",
    answer: "Nee, u moet op 'Opslaan' klikken om uw wijzigingen in het uurrooster en de planningen op te slaan.",
  },
  {
    question: "Hoe bekijk ik het uren-overzicht van het team?",
    answer: "Vanuit het dashboard (voor admins), klik op 'Teamoverzicht' in het zijmenu voor een samenvatting van uren per medewerker.",
  },
];

export function HelpFAQ() {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faq = lang === "nl" ? FAQ_NL : FAQ_FR;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors hover:opacity-80"
        style={{
          background: "hsl(var(--sidebar-hover))",
          color: "hsl(var(--sidebar-fg))",
        }}
        title={lang === "nl" ? "Hulp" : "Aide"}
      >
        <HelpCircle className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{lang === "nl" ? "Aide" : "Aide"}</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="bg-card border rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold">{lang === "nl" ? "Veelgestelde vragen" : "Foire aux questions"}</h2>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-1">
              {faq.map((item, i) => (
                <div key={i} className="border rounded-lg">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/50 transition-colors rounded-lg"
                    onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                  >
                    <span className="pr-2">{item.question}</span>
                    {expandedIndex === i ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  {expandedIndex === i && (
                    <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
