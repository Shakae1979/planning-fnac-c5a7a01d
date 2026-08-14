# Jours fériés : masquer les horaires dans l'encodage du planning

## Problème
Sur la page d'encodage du planning (tableau semaine), un jour marqué comme férié affiche toujours les heures de début/fin de chaque collaborateur, avec seulement un petit badge « FÉRIÉ » ajouté en dessous. Visuellement, on ne voit pas que la journée est fériée.

## Comportement souhaité
Pour un jour marqué férié, dans chaque case collaborateur :
- Les champs d'horaires (et les champs d'heure de table si le magasin les utilise) ne sont plus affichés.
- La case affiche à la place un bloc « FÉRIÉ » sombre, centré, cohérent avec l'en-tête de colonne déjà noire.
- Les horaires encodés restent enregistrés en base : si on retire le drapeau férié, ils réapparaissent tels quels.
- Le total d'heures hebdomadaire de l'employé reste inchangé (les heures du jour férié continuent de compter).
- Les congés déjà affichés sur un jour férié gardent leur pastille de congé (le congé reste prioritaire visuellement).

## Détails techniques
- `src/components/dashboard/ScheduleEditor.tsx` : dans le rendu de cellule (`DAYS.map`), quand `isDayFerie(day.key)` est vrai, remplacer le bloc des inputs (mode normal, mode Direction et bloc heure de table) par l'affichage « FÉRIÉ ». Aucun changement aux fonctions de calcul d'heures ni à la sauvegarde.
- Boutons copier/coller de cellule masqués sur un jour férié (rien à copier visuellement).
- Bump `src/lib/version.ts` en v4.92 et ajout d'une entrée en tête de `CHANGELOG.md`.
