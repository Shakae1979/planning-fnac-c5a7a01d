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
    question: "Comment modifier le planning d'un employé ?",
    answer: "Rendez-vous sur la page 'Planning semaine', sélectionnez la semaine souhaitée et cliquez sur les cases de l'employé pour saisir ses heures de début et de fin.",
  },
  {
    question: "Comment utiliser la grille planning du jour ?",
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
    answer: "Dans la grille planning, un champ 'Note...' apparaît sous le nom de chaque employé. Saisissez votre commentaire et sauvegardez la grille.",
  },
  {
    question: "Les modifications sont-elles sauvegardées automatiquement ?",
    answer: "Non, vous devez cliquer sur le bouton 'Sauvegarder' pour enregistrer vos modifications sur la grille et les plannings.",
  },
  {
    question: "Comment voir le récapitulatif des heures de l'équipe ?",
    answer: "Depuis le tableau de bord (accessible aux admins), cliquez sur 'Récap équipe' dans le menu latéral pour voir un résumé des heures par employé.",
  },
  {
    question: "Comment partager le planning d'un employé ?",
    answer: "Depuis le tableau de bord, allez dans 'Liens de partage'. Vous y trouverez un lien unique pour chaque employé que vous pouvez copier et envoyer. L'employé pourra consulter son planning personnel sans avoir besoin de se connecter.",
  },
  {
    question: "Comment marquer un jour comme férié ?",
    answer: "Sur la page 'Équipe du jour', cliquez sur l'icône drapeau à côté de la date pour marquer le jour comme férié. Vous pouvez aussi ajouter un commentaire général pour la journée.",
  },
  {
    question: "Comment utiliser les indicateurs SAV et Socloz ?",
    answer: "Sur la page 'Équipe du jour', chaque employé dispose de cases SAV et Socloz cochables. Ces indicateurs permettent de signaler rapidement les missions spéciales assignées à un employé pour la journée.",
  },
  {
    question: "Comment consulter la fiche individuelle d'un employé ?",
    answer: "Cliquez sur le nom d'un employé depuis la vue 'Équipe du jour' ou les liens de partage. Vous verrez son planning de la semaine, ses heures travaillées et ses congés à venir.",
  },
  {
    question: "Comment changer la langue de l'application ?",
    answer: "Utilisez le sélecteur de langue (FR/NL) situé dans la barre de navigation en haut de page pour basculer entre le français et le néerlandais.",
  },
  {
    question: "Comment imprimer la grille du jour ?",
    answer: "Sur la page 'Équipe du jour', cliquez sur l'icône d'impression en haut à droite. La grille sera mise en forme automatiquement pour l'impression.",
  },
  {
    question: "Comment modifier les informations d'un employé ?",
    answer: "Depuis le tableau de bord, allez dans 'Équipe & Comptes' et cliquez sur un employé. Vous pourrez modifier son nom, prénom, email, rôle par défaut et heures contractuelles.",
  },
  {
    question: "Comment ajouter un raccourci sur mon téléphone ou ma tablette ?",
    answer: "Sur iPhone/iPad (Safari) : appuyez sur l'icône de partage (carré avec flèche) puis 'Sur l'écran d'accueil'. Sur Android (Chrome) : appuyez sur les 3 points en haut à droite puis 'Ajouter à l'écran d'accueil'. L'application s'ouvrira ensuite comme une app native depuis votre écran d'accueil.",
  },
  {
    question: "Comment fonctionnent les suggestions intelligentes d'horaires ?",
    answer: "Sur la page 'Planning semaine', cliquez sur 'Suggérer'. L'application remplit uniquement les cases vides en consultant dans l'ordre : la semaine précédente, la semaine -2, la semaine type (A ou B selon la parité de la semaine ISO), puis la même semaine de l'année précédente (N-1). Un ⚠️ signale les horaires hors heures d'ouverture du magasin.",
  },
  {
    question: "Comment copier les horaires N-1 d'un seul employé ?",
    answer: "Dans le planning de la semaine, un bouton 'Copier N-1' est disponible à côté de chaque employé. Il importe uniquement les horaires de cet employé pour la même semaine ISO de l'année précédente, sans toucher au reste de l'équipe.",
  },
  {
    question: "À quoi servent la semaine type et les semaines A/B ?",
    answer: "Vous pouvez sauvegarder une semaine comme modèle de référence (semaine type). Pour gérer les rotations, deux modèles alternés A et B peuvent être enregistrés : l'application choisit automatiquement A ou B selon la parité de la semaine ISO en cours.",
  },
  {
    question: "Comment afficher la semaine en vue Gantt ?",
    answer: "Depuis 'Planning semaine', basculez vers la vue Gantt pour visualiser les horaires sous forme de barres horizontales par employé sur l'ensemble de la semaine. Pratique pour repérer rapidement les chevauchements et les trous de couverture.",
  },
  {
    question: "Qu'est-ce que la vue Direction Fnac ?",
    answer: "Direction Fnac est un magasin virtuel regroupant les managers, accessible aux personnes explicitement assignées. Les libellés de congés y sont raccourcis à 3 caractères et un mode déplacement (icône MapPin, sans heure de fin) permet d'indiquer rapidement les déplacements en magasin.",
  },
  {
    question: "Les congés apparaissent-ils automatiquement dans le planning ?",
    answer: "Oui. Dès qu'une absence est saisie dans l'onglet 'Congés', elle remplace automatiquement les heures de travail de cet employé pour les jours concernés dans le planning, sans double saisie.",
  },
  {
    question: "Comment fonctionnent les alertes de couverture ?",
    answer: "L'application surveille la présence entre 09h et 20h. Une alerte s'affiche dès qu'il y a moins d'un employé présent par catégorie (Technique, Éditorial, Stock, Caisse, etc.) sur un créneau, pour éviter les trous de couverture.",
  },
  {
    question: "Où voir le compteur d'heures d'un employé ?",
    answer: "Le compteur des heures réalisées vs les heures contractuelles s'affiche directement dans la barre latérale, à côté du nom de chaque employé, pour un suivi en un coup d'œil.",
  },
  {
    question: "Comment fonctionne la navigation par semaines ISO ?",
    answer: "Les semaines sont numérotées selon la norme ISO (S01 à S52 ou S53). Le passage d'année est géré automatiquement, y compris pour les années comportant 53 semaines, et la fonction N-1 retombe toujours sur la bonne semaine équivalente.",
  },
  {
    question: "Comment partager la vue des congés sans donner d'accès ?",
    answer: "Une vue publique en lecture seule est disponible à l'adresse /conges. Vous pouvez partager ce lien : le calendrier annuel des congés est consultable sans connexion ni compte.",
  },
  {
    question: "Les jours fériés et vacances scolaires sont-ils signalés ?",
    answer: "Oui. Dans la vue trimestrielle des congés, les jours fériés belges sont surlignés en vert et les vacances scolaires sont colorées selon la communauté (FR, NL ou commune aux deux).",
  },
  {
    question: "Peut-on personnaliser les heures d'ouverture du magasin ?",
    answer: "Oui. Depuis l'administration, chaque magasin peut configurer ses propres heures d'ouverture entre 06h et 22h. Ces réglages influencent la grille du jour et les alertes de suggestions hors horaires.",
  },
  {
    question: "Peut-on définir des horaires d'ouverture différents selon le jour ?",
    answer: "Oui. Dans 'Paramètres magasin', chaque jour de la semaine peut avoir ses propres heures d'ouverture et de fermeture, réglables par tranche de 30 minutes. La grille du jour et les alertes de couverture s'y adaptent automatiquement.",
  },
  {
    question: "Comment activer l'heure de table (pause) pour mon magasin ?",
    answer: "Dans 'Paramètres magasin', activez l'option 'Heure de table'. Des champs de pause apparaissent alors dans l'encodage du planning et la pause est déduite du total au lieu de la déduction automatique d'1h.",
  },
  {
    question: "Comment sont calculées les heures nettes ?",
    answer: "Une pause d'1h est déduite uniquement si le service dure 6h ou plus (sauf si l'heure de table manuelle est activée). Les statuts 'Roulement' et 'Extérieur' comptent pour 0h.",
  },
  {
    question: "Qu'est-ce que le multi-métiers ?",
    answer: "Activable par magasin dans 'Paramètres magasin'. Une fois activé, chaque collaborateur peut recevoir des rôles secondaires dans sa fiche, et un rôle du jour différent de son rôle habituel peut être choisi dans le planning.",
  },
  {
    question: "Peut-on changer de métier en cours de journée ?",
    answer: "Oui, si le multi-métiers est actif. Dans le planning, utilisez 'Autre rôle' pour ajouter une plage horaire avec un rôle différent (ex. 2h en Caisse puis Technique). Les couleurs correspondantes s'affichent dans le planning semaine et l'équipe du jour.",
  },
  {
    question: "À quoi sert l'option 'Magasin à 2 étages' ?",
    answer: "Elle apparaît sous le multi-métiers dans les paramètres du magasin. Si elle est cochée, les rôles PT bas, PT haut, PE bas et PE haut deviennent disponibles avec leurs couleurs dédiées. Trésorerie reste disponible dès que le multi-métiers est actif.",
  },
  {
    question: "La semaine type conserve-t-elle le multi-métiers ?",
    answer: "Oui. Les rôles du jour et les plages de changement de métier sont enregistrés avec la semaine type et réappliqués lors de son application.",
  },
  {
    question: "Comment réorganiser l'ordre des collaborateurs dans le planning ?",
    answer: "Dans l'encodage du planning, glissez-déposez la poignée à gauche du nom d'un collaborateur. L'ordre est mémorisé par magasin, à l'intérieur de chaque catégorie de rôle.",
  },
  {
    question: "À quoi sert le statut 'Cadre' d'un collaborateur ?",
    answer: "Un cadre dépasse souvent 36h/semaine. En cochant 'Cadre' dans sa fiche, ses heures sont plafonnées à ses heures contractuelles uniquement pour le calcul de l'ETP, sans modifier son planning réel.",
  },
  {
    question: "Comment lire le compteur ETP ?",
    answer: "L'ETP (équivalent temps plein) est calculé sur une base de 36h/semaine et affiché dans la vue d'ensemble. Il utilise les mêmes heures que le compteur d'heures de l'équipe.",
  },
  {
    question: "Quels sont les niveaux d'accès ?",
    answer: "Utilisateur (lecture), Éditeur (encodage du planning), Responsable (en plus : paramètres de son magasin, gestion des comptes, Direction Fnac) et Admin (accès complet, tous les magasins).",
  },
  {
    question: "Comment fonctionne l'assistant IA ?",
    answer: "L'assistant répond aux questions sur les données de votre magasin (plannings, congés, heures). Il est réservé aux éditeurs, responsables et admins, et limité à 10 questions par jour et par compte.",
  },
  {
    question: "J'ai oublié mon mot de passe, que faire ?",
    answer: "Sur la page de connexion, cliquez sur 'Mot de passe oublié'. Un email pré-rempli s'ouvre vers l'administrateur, qui réinitialisera votre accès.",
  },
  {
    question: "Peut-on réduire les tuiles magasin en mode admin ?",
    answer: "Oui. Dans 'Paramètres magasin', chaque tuile dispose d'une flèche pour la réduire ou la développer. L'état est mémorisé et un résumé des options actives reste visible.",
  },
  {
    question: "Quels types d'absences sont disponibles ?",
    answer: "Neuf types sont proposés, dont la journée Syndicat (SYN). En cas de chevauchement, une boîte de dialogue vous propose la marche à suivre. La légende est accessible via l'icône d'information.",
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
  {
    question: "Hoe deel ik het rooster van een medewerker?",
    answer: "Ga in het dashboard naar 'Deellinks'. Daar vindt u een unieke link per medewerker die u kunt kopiëren en versturen. De medewerker kan zijn persoonlijk rooster bekijken zonder in te loggen.",
  },
  {
    question: "Hoe markeer ik een dag als feestdag?",
    answer: "Op de pagina 'Team van de dag', klik op het vlagicoon naast de datum om de dag als feestdag te markeren. U kunt ook een algemene opmerking voor de dag toevoegen.",
  },
  {
    question: "Hoe gebruik ik de SAV- en Socloz-indicatoren?",
    answer: "Op de pagina 'Team van de dag' heeft elke medewerker aankruisvakjes voor SAV en Socloz. Deze indicatoren signaleren snel de speciale taken die aan een medewerker zijn toegewezen voor die dag.",
  },
  {
    question: "Hoe bekijk ik de individuele fiche van een medewerker?",
    answer: "Klik op de naam van een medewerker vanuit 'Team van de dag' of de deellinks. U ziet dan het weekrooster, gewerkte uren en komend verlof.",
  },
  {
    question: "Hoe wijzig ik de taal van de applicatie?",
    answer: "Gebruik de taalkiezer (FR/NL) in de navigatiebalk bovenaan om te schakelen tussen Frans en Nederlands.",
  },
  {
    question: "Hoe print ik het dagrooster?",
    answer: "Op de pagina 'Team van de dag', klik op het printpictogram rechtsboven. Het rooster wordt automatisch opgemaakt voor afdrukken.",
  },
  {
    question: "Hoe wijzig ik de gegevens van een medewerker?",
    answer: "Ga in het dashboard naar 'Team & Accounts' en klik op een medewerker. U kunt dan naam, achternaam, e-mail, standaardrol en contracturen aanpassen.",
  },
  {
    question: "Hoe voeg ik een snelkoppeling toe op mijn telefoon of tablet?",
    answer: "Op iPhone/iPad (Safari): tik op het deelicoon (vierkant met pijl) en kies 'Zet op beginscherm'. Op Android (Chrome): tik op de 3 puntjes rechtsboven en kies 'Toevoegen aan startscherm'. De app opent dan als een native app vanaf uw startscherm.",
  },
  {
    question: "Hoe werken de slimme roostervoorstellen?",
    answer: "Klik op 'Voorstellen' op de pagina 'Weekplanning'. De app vult enkel lege cellen in, in deze volgorde: vorige week, week -2, modelweek (A of B volgens de pariteit van de ISO-week), en dezelfde week vorig jaar (N-1). Een ⚠️ markeert uren buiten de openingstijden van de winkel.",
  },
  {
    question: "Hoe kopieer ik de N-1 uren van één medewerker?",
    answer: "In de weekplanning staat naast elke medewerker een knop 'N-1 kopiëren'. Die importeert enkel de uren van die medewerker voor dezelfde ISO-week van vorig jaar, zonder de rest van het team te wijzigen.",
  },
  {
    question: "Waarvoor dienen de modelweek en de A/B-weken?",
    answer: "U kunt een week opslaan als referentiemodel (modelweek). Voor afwisselende roosters kunt u twee modellen A en B bewaren: de app kiest automatisch A of B op basis van de pariteit van de huidige ISO-week.",
  },
  {
    question: "Hoe toon ik de week in Gantt-weergave?",
    answer: "Schakel vanuit 'Weekplanning' over naar de Gantt-weergave om de uren als horizontale balken per medewerker over de hele week te zien. Handig om overlappingen en gaten snel te herkennen.",
  },
  {
    question: "Wat is de weergave Direction Fnac?",
    answer: "Direction Fnac is een virtuele winkel voor managers, enkel toegankelijk voor uitdrukkelijk toegewezen personen. Verloflabels zijn er ingekort tot 3 tekens en een verplaatsingsmodus (MapPin-icoon, zonder einduur) laat toe winkelverplaatsingen snel aan te duiden.",
  },
  {
    question: "Verschijnt verlof automatisch in het rooster?",
    answer: "Ja. Zodra een afwezigheid in het tabblad 'Verlof' wordt ingevoerd, vervangt het automatisch de werkuren van die medewerker voor de betrokken dagen in de planning. Geen dubbele invoer nodig.",
  },
  {
    question: "Hoe werken de dekkingswaarschuwingen?",
    answer: "De app bewaakt de aanwezigheid tussen 09u en 20u. Een waarschuwing verschijnt zodra er minder dan één medewerker per categorie (Technique, Éditorial, Stock, Caisse, ...) aanwezig is op een tijdslot, om dekkingsgaten te vermijden.",
  },
  {
    question: "Waar zie ik de urenteller van een medewerker?",
    answer: "De teller van gepresteerde versus contracturen wordt rechtstreeks in de zijbalk weergegeven, naast de naam van elke medewerker, voor een opvolging in één oogopslag.",
  },
  {
    question: "Hoe werkt de navigatie op ISO-weken?",
    answer: "Weken worden genummerd volgens de ISO-norm (W01 tot W52 of W53). De jaarwissel wordt automatisch beheerd, ook voor jaren met 53 weken, en de N-1 functie valt altijd op de juiste overeenkomstige week.",
  },
  {
    question: "Hoe deel ik het verlofoverzicht zonder toegang te geven?",
    answer: "Een publieke alleen-lezen weergave is beschikbaar op /conges. U kunt deze link delen: de jaarlijkse verlofkalender is raadpleegbaar zonder login of account.",
  },
  {
    question: "Worden feestdagen en schoolvakanties aangeduid?",
    answer: "Ja. In de kwartaalweergave van het verlof worden Belgische feestdagen groen gemarkeerd en schoolvakanties gekleurd volgens de gemeenschap (FR, NL of gemeenschappelijk).",
  },
  {
    question: "Kunnen de openingstijden van de winkel worden aangepast?",
    answer: "Ja. Via het beheer kan elke winkel eigen openingstijden tussen 06u en 22u instellen. Deze instellingen bepalen het dagrooster en de waarschuwingen bij voorstellen buiten de openingstijden.",
  },
  {
    question: "Kunnen de openingstijden per dag verschillen?",
    answer: "Ja. In 'Winkelinstellingen' kan elke dag van de week eigen openings- en sluitingsuren hebben, instelbaar per 30 minuten. Het dagrooster en de dekkingswaarschuwingen passen zich automatisch aan.",
  },
  {
    question: "Hoe activeer ik de middagpauze voor mijn winkel?",
    answer: "Activeer in 'Winkelinstellingen' de optie 'Middagpauze'. Er verschijnen dan pauzevelden bij het invoeren van de planning en de pauze wordt afgetrokken in plaats van de automatische aftrek van 1u.",
  },
  {
    question: "Hoe worden de netto-uren berekend?",
    answer: "Er wordt 1u pauze afgetrokken enkel als de dienst 6u of langer duurt (tenzij de manuele middagpauze actief is). De statussen 'Roulement' en 'Extérieur' tellen voor 0u.",
  },
  {
    question: "Wat is multi-functies (multi-métiers)?",
    answer: "Per winkel activeerbaar in 'Winkelinstellingen'. Eenmaal actief kan elke medewerker secundaire rollen krijgen in zijn fiche, en kan in de planning een dagrol worden gekozen die afwijkt van zijn gewone rol.",
  },
  {
    question: "Kan iemand van functie wisselen tijdens de dag?",
    answer: "Ja, als multi-functies actief is. Gebruik in de planning 'Andere rol' om een tijdsblok met een andere rol toe te voegen (bv. 2u Kassa, daarna Techniek). De kleuren verschijnen in de weekplanning en het team van de dag.",
  },
  {
    question: "Waarvoor dient de optie 'Winkel met 2 verdiepingen'?",
    answer: "Ze verschijnt onder multi-functies in de winkelinstellingen. Indien aangevinkt worden de rollen PT beneden, PT boven, PE beneden en PE boven beschikbaar met hun eigen kleuren. Trésorerie blijft beschikbaar zodra multi-functies actief is.",
  },
  {
    question: "Bewaart de modelweek ook de multi-functies?",
    answer: "Ja. De dagrollen en de tijdsblokken met functiewissel worden mee opgeslagen in de modelweek en opnieuw toegepast.",
  },
  {
    question: "Hoe wijzig ik de volgorde van de medewerkers in de planning?",
    answer: "Sleep in de planning het handvat links van de naam van een medewerker. De volgorde wordt per winkel bewaard, binnen elke rolcategorie.",
  },
  {
    question: "Waarvoor dient de status 'Kaderlid' (Cadre)?",
    answer: "Een kaderlid overschrijdt vaak 36u/week. Door 'Cadre' aan te vinken in de fiche worden zijn uren enkel voor de VTE-berekening geplafonneerd op de contracturen, zonder de echte planning te wijzigen.",
  },
  {
    question: "Hoe lees ik de VTE-teller?",
    answer: "De VTE (voltijds equivalent) wordt berekend op basis van 36u/week en getoond in het overzicht. Ze gebruikt dezelfde uren als de urenteller van het team.",
  },
  {
    question: "Welke toegangsniveaus bestaan er?",
    answer: "Gebruiker (lezen), Editor (planning invoeren), Verantwoordelijke (bijkomend: instellingen van zijn winkel, accountbeheer, Direction Fnac) en Admin (volledige toegang, alle winkels).",
  },
  {
    question: "Hoe werkt de AI-assistent?",
    answer: "De assistent beantwoordt vragen over de gegevens van uw winkel (planning, verlof, uren). Hij is voorbehouden aan editors, verantwoordelijken en admins, en beperkt tot 10 vragen per dag per account.",
  },
  {
    question: "Ik ben mijn wachtwoord vergeten, wat nu?",
    answer: "Klik op de inlogpagina op 'Wachtwoord vergeten'. Er opent een vooraf ingevulde e-mail naar de beheerder, die uw toegang opnieuw instelt.",
  },
  {
    question: "Kan ik de winkeltegels inklappen als admin?",
    answer: "Ja. In 'Winkelinstellingen' heeft elke tegel een pijltje om in of uit te klappen. De staat wordt onthouden en een samenvatting van de actieve opties blijft zichtbaar.",
  },
  {
    question: "Welke afwezigheidstypes zijn beschikbaar?",
    answer: "Er zijn negen types, waaronder de vakbondsdag (VAK). Bij overlapping toont een dialoogvenster de mogelijke keuzes. De legende is bereikbaar via het infopictogram.",
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
        <span className="hidden sm:inline">{lang === "nl" ? "Hulp" : "Aide"}</span>
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
