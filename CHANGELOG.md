# Changelog — Planning Fnac

Toutes les évolutions notables de l'application, de la plus récente à la plus ancienne.
Format des dates : `DD/MM/YYYY` (belge). Seules les **fonctionnalités majeures** sont listées.

## v5.11 — 25/08/2026

- **Magasin à 2 étages** : nouveau réglage magasin. Une fois activé, chaque vendeur PT (Technique) et PE (Éditorial) reçoit un étage (1 ou 2) dans sa fiche, et le planning (encodage, planning semaine, équipe du jour) affiche une nuance plus foncée de la même teinte pour l'étage 2.

## v5.10 — 24/08/2026

- **Export heures — identifiant magasin brut** : l'export renvoie désormais l'identifiant unique du magasin (UUID) au lieu du code interne, et le filtre magasin se fait sur ce même identifiant. Les outils externes gèrent eux-mêmes leur correspondance de codes.

## v5.09 — 24/08/2026

- **Export heures pour outils externes** : nouvel endpoint sécurisé (clé d'API dédiée) exposant, en lecture seule, les heures prestées vs contrat par collaborateur — au choix par semaine ou par mois planning — avec le code magasin interne (Liège 1, Gand 2, LLN 7, TDO 9, Aalst 10, Charleroi 11, Luxembourg 12, Woluwe 14). Les heures sont recalculées quand la semaine n'a jamais été rouverte.

## v5.08 — 24/08/2026

- **Sécurité des données** : les plannings, congés, collaborateurs et commentaires ne sont plus accessibles publiquement (connexion obligatoire) et seules les personnes admin / responsable / éditeur peuvent les modifier. Les vendeurs conservent un accès en lecture seule.

## v5.07 — 24/08/2026

- **Stabilité de l'encodage du planning** : correction d'un plantage à l'ouverture de l'onglet « Semaine » lorsque les collaborateurs n'avaient pas encore fini de charger (rafraîchissement ou changement de magasin).

## v5.06 — 22/08/2026

## v5.05 — 22/08/2026


- **Simplification visuelle** : mise à jour des libellés dans l'éditeur de rôles journaliers pour plus de clarté ("Autre rôle").

## v5.04 — 22/08/2026

- **Multi-métiers plus facile à retrouver** : le descriptif de la bascule dans les paramètres du magasin détaille désormais ce qu'elle débloque, et l'encodage du planning affiche un rappel lorsque des collaborateurs ont des métiers secondaires alors que l'option est éteinte.

## v5.03 — 22/08/2026

- **Multi-métiers activable par magasin** : la fonctionnalité multi-métiers (métiers secondaires et changement de métier en cours de journée) se déclenche désormais via un interrupteur dans les paramètres du magasin. Désactivée par défaut, elle masque les métiers secondaires, la pastille d'encodage et les segments de couleur pour les magasins qui ne l'utilisent pas.

## v5.02 — 22/08/2026

- **Changement de métier en cours de journée** : on peut désormais encoder plusieurs plages horaires de métier pour un même jour (ex. 2h en caisse puis passage en technique). Le planning semaine affiche la barre en plusieurs segments colorés, « Équipe du jour » classe le collaborateur dans chaque métier avec la plage concernée, la grille horaire se colore par plage, et les heures sont réparties au prorata dans les compteurs par département.

## v5.01 — 22/08/2026

- **Collaborateurs multi-métiers** : possibilité de déclarer des « métiers secondaires » sur la fiche collaborateur, puis de choisir le métier exercé jour par jour depuis l'encodage du planning (petite pastille dans la case). Dans « Planning semaine », la barre prend la couleur et l'abréviation du métier du jour ; dans « Équipe du jour », le collaborateur apparaît sous le métier exercé ce jour-là. Aucun changement visuel pour les collaborateurs mono-métier.

## v5.00 — 22/08/2026


- **Congés** : nouveau type d'absence « Syndicat » (journée syndicale), en indigo, disponible à l'encodage, dans la légende, à l'impression et sur la fiche collaborateur (FR : SYN / NL : VAK).

## v4.99 — 17/08/2026

- **Stabilité au rafraîchissement** : l'application attend désormais de connaître le rôle avant d'afficher une page — fin des redirections parasites (admin renvoyé vers « Équipe du jour »), du magasin qui change tout seul et des clignotements d'interface après un F5.

## v4.98 — 17/08/2026

- **Impression** : rétablissement de la vue complète — les tableaux à en-tête figé (planning, planning semaine, congés) ne sont plus coupés à la zone visible, les en-têtes se répètent sur chaque page et les lignes ne sont plus coupées en deux.

## v4.97 — 14/08/2026

- **Assistant IA** : limite de 10 questions par utilisateur et par jour (compteur serveur, remise à zéro chaque jour à minuit heure belge), avec message clair quand la limite est atteinte.

## v4.96 — 14/08/2026

- **SEO** : titres, descriptions et aperçus sociaux uniques par page (react-helmet-async), balise canonique, sitemap.xml référencé dans robots.txt et structure de titres corrigée (H1 sur la connexion, H1 visible sur mobile, H2 dans la vue d'ensemble).

## v4.95 — 14/08/2026

- **Alertes de couverture** : la catégorie Stagiaires est désormais toujours exclue de « Non couverts », les stagiaires étant considérés comme un renfort et non comme une couverture obligatoire.

## v4.94 — 14/08/2026

- **Alertes de couverture** : la catégorie Stagiaires n'apparaît plus dans « Non couverts » lorsqu'aucun stagiaire n'est planifié ce jour.

## v4.93 — 14/08/2026

- **Entête figée** : la ligne des jours reste visible en haut lors du défilement, dans l'encodage du planning et dans Planning semaine.

## v4.92 — 14/08/2026

- **Jour férié dans l'encodage du planning** : les champs d'horaires (et l'heure de table) sont masqués et remplacés par un bloc « FÉRIÉ ». Les heures encodées restent enregistrées et continuent de compter dans le total hebdomadaire.

## v4.91 — 14/08/2026

- **Jour férié dans Équipe du jour** : le drapeau férié prend désormais le pas sur les horaires — bandeau férié bien visible, horaires masqués, collaborateurs concernés listés sous « Férié », compteurs de présence à 0 et plus d'alertes de couverture.
- Grille horaire du jour grisée et vide les jours fériés (toujours éditable pour les ouvertures exceptionnelles).

## v4.90 — 14/08/2026

- **Équipe du jour alignée sur les horaires du magasin** : les alertes « Non couverts » utilisent désormais la plage d'ouverture réelle du jour affiché (paramètres du magasin) au lieu de plages fixes, avec une précision à la demi-heure et affichage au format belge (ex. 09h30–11h00).
- Aucun contrôle de couverture les jours marqués « Fermé ».

## v4.89 — 14/08/2026

- **Horaires d'ouverture par jour** : dans les Paramètres du magasin, chaque responsable définit une plage horaire différente pour chaque jour de la semaine, par pas de 30 minutes (06h00 → 22h00), avec possibilité de marquer un jour comme fermé.
- **Bouton « Appliquer à tous les jours »** pour recopier rapidement la ligne du lundi.
- **Plannings synchronisés** : la grille du jour suit la plage du jour affiché, le Gantt semaine grise les zones hors ouverture, et l'encodage semaine utilise les bornes du jour concerné.

## v4.88 — 14/08/2026

- **Préparation 2027** : les jours fériés belges sont désormais calculés automatiquement pour n'importe quelle année (fériés fixes + ceux liés à Pâques), plus de liste figée sur 2026.
- **Vacances scolaires 2027** ajoutées pour les deux communautés (FWB et Vlaanderen) — dates issues des calendriers publiés, à revérifier en cas d'ajustement officiel.
- **Sélecteur d'année dans les Congés** : navigation ‹ année › permettant de consulter les années passées et d'encoder dès maintenant les congés 2027.

## v4.87 — 14/08/2026
- **Assistant IA (lecture seule)** : nouveau bouton « Assistant » dans l'en-tête (Admin, Manager, Éditeur). Il répond en FR/NL aux questions sur l'équipe, le planning d'une semaine, les congés, les trous de couverture d'une journée et l'ETP contractuel vs planifié, en s'appuyant sur les règles métier (pause 1h ≥6h, heures de table, Roulement/Extérieur à 0h, plafond ETP des cadres). Historique conservé dans le navigateur uniquement, aucune écriture en base.

## v4.86 — 14/08/2026
- **Magasin par défaut à la connexion** : l'application ouvre sur le dernier magasin sélectionné, sinon sur le magasin de rattachement du collaborateur (« Direction Fnac » n'est plus choisi par défaut).

## v4.85 — 14/07/2026
- **Intégrations agents (MCP)** : l'application expose un serveur MCP sécurisé par OAuth (connexion avec son compte Planning Fnac) avec 6 outils : `whoami`, `list_stores`, `list_employees`, `get_week_schedule`, `list_leaves`, `create_leave`. Nouvelle page de consentement `/.lovable/oauth/consent`.

## v4.84 — 14/07/2026
- **Contrats à 0h autorisés** : correction du fallback qui remplaçait 0h par 36h à la sauvegarde (création, édition, import).

## v4.83 — 30/06/2026
- **Correction en-tête figé Congés** : le wrapper devient le conteneur de défilement vertical, permettant à `sticky top-0` de fonctionner réellement sur toutes les vues (mois, trimestre, Direction).

## v4.82 — 30/06/2026
- **En-tête figé dans les congés** : la première ligne (dates et rôles) reste visible lors du défilement dans les vues mensuelle, trimestrielle et Direction Fnac.

## v4.81 — 30/06/2026
- **Lecture seule pour les vendeurs** : dans *Équipe du jour*, les vendeurs ne peuvent plus interagir avec la grille horaire ni éditer les commentaires (affichage en consultation uniquement).

## v4.80 — 30/06/2026
- **Suggestion paysage** : bandeau discret fermable sur mobile portrait, invitant à tourner le téléphone sur *Congés* et *Équipe du jour*.

## v4.79 — 30/06/2026
- **Mode paysage mobile** : la vue *Équipe du jour* s'adapte automatiquement quand le téléphone est tourné (deux colonnes réactivées, cartes et header compactés, grille horaire plus large).

## v4.78 — 30/06/2026
- **Optimisation mobile** de la vue *Équipe du jour* : mise en page colonne unique, cartes résumé compactées, grille horaire plus dense et lisible sur petit écran.

## v4.76 — 26/06/2026
- **Mot de passe oublié** : suppression du flux de réinitialisation automatique. Le lien ouvre désormais un email pré-rempli vers l'administrateur (`karim.haoud@be.fnac.com`) qui réinitialise manuellement.
- Page `/reset-password` retirée.

## v4.75 — 26/06/2026
- Correctif : la page `/reset-password` ouvre réellement le formulaire de nouveau mot de passe quand le lien est valide.
- Si le lien de réinitialisation n'est pas utilisable, l'utilisateur peut redemander immédiatement un nouveau lien sécurisé depuis la même page, sans rester bloqué sur une 404.

## v4.74 — 26/06/2026
- Correctif : le lien de l'email **« Mot de passe oublié »** pointe désormais toujours vers `https://planning.befnac.be/reset-password`, même si la demande est effectuée depuis l'aperçu Lovable.

## v4.73 — 26/06/2026
- Nouveau flux **« Mot de passe oublié »** depuis l'écran de connexion : envoi d'un email de réinitialisation.
- Nouvelle page publique `/reset-password` pour choisir un nouveau mot de passe (min. 8 caractères).
- Le lien « Contacter l'administrateur » est remplacé par ce flux self-service.

## v4.72 — 23/06/2026
- **Vue semaine** : le marquage **férié** masque désormais la barre d'horaire et affiche le bandeau « Férié » plein largeur à la place.
- Les heures saisies restent **conservées en base** et réapparaissent automatiquement si le drapeau férié est retiré.

## v4.71 — 20/06/2026
- Nouveau drapeau **« Cadre »** sur la fiche employé : plafonne les heures planifiées aux heures de contrat **uniquement** dans le calcul ETP.
- Les heures réelles prestées restent affichées telles quelles partout (planning, dashboard, exports).
- Badge `Cadre` visible dans le planning et la liste équipe ; carte ETP indique combien de cadres ont été plafonnés.

## v4.70 — 20/06/2026
- Réorganisation des employés par **glisser-déposer** dans le planning hebdomadaire (poignée à gauche de chaque ligne).
- Ordre conservé à l'intérieur de chaque catégorie de rôle (Responsables, Technique, Éditorial, Stock, Caisse, Stagiaires) et partagé pour tout le magasin.
- Tri global mis à jour partout (semaine, jour, congés) pour rester cohérent.

## v4.69 — 19/06/2026
- Nouveau rôle **Manager** (FR) / **Manager** (NL), positionné entre Éditeur et Admin.
- Le Manager hérite des droits de l'Éditeur et obtient en plus l'accès aux **paramètres du magasin** et au **planning Direction Fnac**.
- L'Éditeur n'a plus accès aux paramètres du magasin (déplacé vers Manager).

## v4.68 — 19/06/2026
- Refonte de la **politique d'accès Direction Fnac** : assignations explicites requises pour le magasin virtuel.
- Préparation de la délégation de gestion de comptes au niveau Manager.

## Versions antérieures

Jalons livrés avant la mise en place du changelog (dates non documentées précisément) :

- **Planning**
  - Heure de table configurable par magasin (toggle `has_lunch_break`, remplace la déduction auto d'1h).
  - Copie individuelle des horaires depuis N-1.
  - Semaines alternées A/B (modèles stockés sur 1970-01-05 / 1970-01-12).
  - Semaine type / template à appliquer.
  - Vue Gantt hebdomadaire.
  - Navigation par numéros de semaine ISO (S12, S13…).
  - Grille horaire interactive par tranches de 30 min avec multi-sélection.
  - Saisie intelligente des horaires en texte (sans dropdown).
  - Statuts spéciaux : Heure de table, Extérieur, Roulement, Férié global.
  - Synchronisation automatique des congés dans le planning.
  - Règles de couverture critique (alertes ≥1 employé/catégorie de 09 h à 20 h).
  - Vue Direction Fnac (magasin virtuel pour managers, libellés de congés en 3 caractères, MapPin sans heure de fin).

- **Congés**
  - 9 types d'absences avec dialogue de chevauchement et légende Popover.
  - Mise en page Excel verticale (Stagiaires exclus).
  - Vue publique en lecture seule sur `/conges`.
  - Jours fériés belges en vert émeraude (vue trimestrielle).
  - Vacances scolaires FR / NL / Communes mises en évidence.

- **Équipe & comptes**
  - Identité collaborateurs : prénom / nom séparés (URLs rétro-compatibles).
  - Système de rôles : Admin, Éditeur, User + délégation Store Manager.
  - Gestion unifiée des utilisateurs avec pivot email (suppression du reset mot de passe).
  - Drag & drop des employés (préparation v4.70).

- **Multi-magasins**
  - Architecture isolée par `store_id`, assignations utilisateur, sélecteur global.
  - Administration des magasins avec protection du magasin virtuel.
  - Paramètres magasin : heures d'ouverture configurables 06 h – 22 h.

- **Tableau de bord**
  - KPIs fusionnés avec le récap équipe (suppression du « Get Started »).
  - Insights et tri par rôle / `sort_order` / nom.

- **Identité & i18n**
  - Identité « Planning Fnac », jaune Fnac `#E1A400`, sidebar charcoal.
  - Bilingue FR / NL via `useI18n`.
  - Formats belges : `DD/MM/YYYY`, `HHhMM`, semaine commençant le lundi.
  - Couleurs par département (bordure 500, fond 100).

- **Divers**
  - Easter egg : 3 clics sur le logo.
  - FAQ statique bilingue dans le header.
  - Contact admin pré-rempli en mailto sur l'écran de connexion.
  - Impression haute densité (légende en haut, notes vides masquées).
  - Domaine personnalisé `planning.befnac.be`.

---

> À chaque bump de `src/lib/version.ts`, ajouter une nouvelle entrée en haut de ce fichier avec la date du jour et un résumé FR des fonctionnalités livrées.