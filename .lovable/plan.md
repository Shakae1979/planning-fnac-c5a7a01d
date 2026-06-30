## Objectif
Rendre la première ligne d'en-tête des tableaux de congés fixe lors du défilement vertical, pour garder visibles les colonnes (dates, rôles ou employés) en permanence.

## Fichiers concernés
- `src/components/dashboard/conges/MonthGrid.tsx` — vue mensuelle standard
- `src/components/dashboard/conges/QuarterView.tsx` — vue trimestrielle (3 colonnes mensuelles)
- `src/components/dashboard/conges/DirectionMonthGrid.tsx` — vue mensuelle Direction Fnac

## Implémentation
1. **MonthGrid.tsx**
   - Ajouter `sticky top-0 z-10` sur la balise `<thead>` (ou `<tr>`).
   - Conserver le fond `bg-muted/30` pour éviter la transparence par-dessus le contenu.
   - Vérifier que le conteneur parent `overflow-x-auto` autorise bien le sticky (remplacer éventuellement par `overflow-auto` si nécessaire).

2. **QuarterView.tsx**
   - Même traitement sur le `<thead>` / `<tr>` de chaque `VerticalMonthColumn`.
   - Comme le conteneur global est `overflow-x-auto`, s'assurer que le sticky vertical fonctionne malgré le scroll horizontal.

3. **DirectionMonthGrid.tsx**
   - Ajouter `sticky top-0 z-20` sur la ligne `<tr>` du `<thead>`.
   - Préserver les fonds conditionnels (fériés, weekends, vacances scolaires) existants sur chaque `<th>`.

## Tests attendus
- Scroller vers le bas dans chaque vue : la ligne d'en-tête reste visible.
- Pas de régression sur le scroll horizontal ou les z-index des cellules sticky latérales (Direction).
- Apparence inchangée au-delà du comportement sticky.