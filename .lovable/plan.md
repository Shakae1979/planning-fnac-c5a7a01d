# Retirer les stagiaires des alertes « Non couverts »

## Objectif
Sur la page « Équipe du jour », la catégorie Stagiaires ne doit plus générer d'alerte de couverture. Les stagiaires sont un renfort, pas une catégorie à couvrir.

## Comportement
- Si aucun stagiaire n'est planifié ce jour, aucune mention « Stagiaires » n'apparaît dans le bloc « Non couverts ».
- Les autres catégories (Responsables, Technique, Éditorial, Stock, Caisse) restent inchangées.

## Détail technique
- `src/pages/TeamDayView.tsx` : dans le calcul de `coverageAlerts` (boucle sur `ROLE_ORDER`), ignorer le rôle `stagiaire` lorsqu'aucun stagiaire n'est présent sur l'horaire du jour.
- Bump de version dans `src/lib/version.ts` (v4.94) + entrée en haut de `CHANGELOG.md`.
