# Plan : Reset de semaine et suppression du bouton Suggérer

## Objectif
Sur la page **Planning hebdomadaire** (`ScheduleEditor`) :
1. Ajouter un bouton **Reset** qui efface tous les horaires de la semaine affichée.
2. Supprimer définitivement le bouton **Suggérer** et toute la logique/fenêtre associée.

## Décisions techniques

### Bouton Reset
- Placer le bouton à côté des actions existantes (Sauvegarder, Appliquer semaine type, etc.).
- Icône `RotateCcw` + libellé `Réinitialiser` / `Reset`.
- Au clic :
  - Afficher une boîte de confirmation (`AlertDialog`) pour éviter les effacements accidentels.
  - Si confirmé, mettre à jour toutes les lignes `weekly_schedules` de la semaine courante pour vider les champs `*_start`, `*_end`, `*_break_start`, `*_break_end`.
  - Réinitialiser aussi l'état local `localEdits`, `localDayComments`, `localFerieDays`.
  - Invalider les requêles React Query concernées (`schedules`, `all-schedules`, `day-comments`).
  - Afficher un toast de succès.
- Le bouton est désactivé s'il n'y a aucune donnée à réinitialiser pour la semaine courante.

### Suppression de Suggérer
- Retirer l'import `Sparkles` et l'import `SuggestionsDialog`.
- Supprimer les états `suggestDialogOpen`, `suggestions`, `suggestLoading`.
- Supprimer les fonctions `buildSuggestions` et `applySuggestions`.
- Retirer le rendu de `<SuggestionsDialog />` en bas du composant.
- Supprimer les clés de traduction liées aux suggestions dans `i18n.tsx`.

### i18n
- Ajouter les clés :
  - `schedule.reset`
  - `schedule.resetConfirmTitle`
  - `schedule.resetConfirmDesc`
  - `schedule.resetSuccess`
- Traductions FR et NL.

### Versioning
- Bumper `src/lib/version.ts` vers `v5.20`.
- Ajouter une entrée en haut de `CHANGELOG.md` (FR, date du jour au format DD/MM/YYYY).

## Fichiers concernés
- `src/components/dashboard/ScheduleEditor.tsx`
- `src/lib/i18n.tsx`
- `src/lib/version.ts`
- `CHANGELOG.md`

## Non inclus
- Aucun changement de schéma base de données.
- Aucune modification des droits/RLS.
- Le bouton Reset ne supprime pas les employés, uniquement leurs horaires de la semaine courante.
