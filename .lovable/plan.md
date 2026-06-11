# Auto-complétion intelligente N-1

## Objectif

Ajouter un bouton **"Suggérer"** dans l'éditeur de planning hebdo qui propose de pré-remplir uniquement les **cases vides** de la semaine courante en se basant sur l'historique, puis affiche un **aperçu** que l'admin valide (ou ajuste) avant d'écrire en base.

Non-destructif : aucune case déjà saisie n'est écrasée.

## Comportement utilisateur

1. Dans `ScheduleEditor`, à côté des boutons existants ("Copier semaine précédente", "Appliquer semaine type"), un nouveau bouton **`Suggérer`** (icône Sparkles, variant outline).
2. Au clic, ouverture d'un **dialog d'aperçu** listant, par employé, les cellules qui seraient remplies :
   - Colonnes : Employé · Jour · Source · Horaire suggéré
   - Source possible : `Semaine -1`, `Semaine -2`, `Semaine type`, `N-1 (même semaine ISO, année -1)` — première source non vide trouvée dans cet ordre de priorité.
   - Cases en conflit avec un congé existant → exclues automatiquement.
3. En bas du dialog :
   - Indicateur de **couverture** post-application par catégorie/jour 09-20h (badge vert OK / rouge sous-couverture restante).
   - Cases à cocher par ligne (toutes cochées par défaut) pour exclure ponctuellement une suggestion.
   - Boutons `Annuler` et `Appliquer les suggestions` (n'écrit pas en DB directement : injecte dans `localEdits`, l'admin garde la main pour ajuster puis "Enregistrer" comme aujourd'hui).

## Règles de remplissage

- Ne remplit **que** les cases dont `start` ET `end` sont vides dans `localEdits` (et pas un statut spécial comme `Roulement`, `Extérieur`, `Heure de table`).
- Si l'employé est en congé ce jour-là (table `conges`), la case est ignorée.
- Si l'horaire source tombe hors plage magasin (`store_settings`), badge "hors plage" en warning mais proposé quand même.
- Stagiaires inclus comme aujourd'hui (pas de filtrage spécifique).

## Détails techniques

**Fichiers touchés :**

- `src/components/dashboard/ScheduleEditor.tsx`
  - Nouveau bouton `Suggérer` près de la barre d'actions ligne ~728.
  - Nouvelle fonction `buildSuggestions()` :
    - Charge en parallèle : `weekly_schedules` pour `weekStr-1`, `weekStr-2`, `TEMPLATE_WEEK` (et `TEMPLATE_WEEK_B` si A/B actif), et `weekStr` année -1 (même n° ISO).
    - Charge les congés actifs sur la semaine courante.
    - Pour chaque employé × chaque jour : si cellule vide dans `localEdits`, prend la 1ère source non vide selon la priorité ci-dessus.
  - Nouveau state `suggestions: SuggestionRow[]` + `suggestDialogOpen: boolean`.

- `src/components/dashboard/SuggestionsDialog.tsx` (**nouveau**)
  - Dialog shadcn avec table des suggestions, checkbox par ligne, résumé couverture, boutons.
  - Reçoit `suggestions`, `onApply(selected)`, `onClose`.

- `src/lib/i18n.tsx`
  - Clés FR/NL : `schedule.suggest`, `schedule.suggestTitle`, `schedule.suggestApply`, `schedule.suggestEmpty`, `schedule.source.prevWeek`, `schedule.source.prev2Weeks`, `schedule.source.template`, `schedule.source.lastYear`, `schedule.coverage.ok`, `schedule.coverage.under`.

**Pas touché :**
- Schéma DB inchangé (lecture seule sur `weekly_schedules` et `conges`).
- Les fonctions existantes `copyPreviousWeekMutation` et `applyTemplateMutation` restent telles quelles.
- Pas de modification du calcul d'heures nettes ni des règles de couverture (réutilisation de la logique existante via util partagé si déjà extrait, sinon helper local dans `SuggestionsDialog`).

## Hors périmètre

- Pas d'apprentissage statistique / IA (purement déterministe basé sur l'historique).
- Pas d'auto-application sans confirmation.
- Pas de suggestion pour les statuts spéciaux (Roulement, Extérieur, etc.).
- Pas de vue Direction Fnac (uniquement éditeur magasin standard pour ce premier jet).
