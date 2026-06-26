# Changelog — Planning Fnac

Toutes les évolutions notables de l'application, de la plus récente à la plus ancienne.
Format des dates : `DD/MM/YYYY` (belge). Seules les **fonctionnalités majeures** sont listées.

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