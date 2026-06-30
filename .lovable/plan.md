## Problème
Sur `/conges`, l'en-tête (Datum/Dag/Kader/TP/…) n'est pas réellement figé lors du défilement. La cause : le wrapper du tableau utilise `overflow-x-auto`, ce qui crée un conteneur de défilement. `sticky top-0` se "colle" alors à ce conteneur (qui n'a pas de scroll vertical) au lieu de la fenêtre, donc l'en-tête défile avec la page.

## Correctif
Transformer le wrapper en zone de défilement verticale interne avec hauteur maximale, ainsi `sticky top-0` fonctionne réellement.

### Fichiers à modifier
1. **`src/components/dashboard/conges/MonthGrid.tsx`**
   - Remplacer `<div className="overflow-x-auto">` par `<div className="overflow-auto max-h-[calc(100vh-220px)]">`.

2. **`src/components/dashboard/conges/QuarterView.tsx`**
   - Même changement sur le wrapper du tableau (3 mois).

3. **`src/components/dashboard/conges/DirectionMonthGrid.tsx`**
   - Idem + s'assurer que la cellule corner (sticky top+left) reste `z-30` pour passer au-dessus des autres th sticky.

4. **`src/components/dashboard/conges/DirectionQuarterView.tsx`**
   - Idem.

### Versioning
- Bump `src/lib/version.ts` → `v4.83`.
- Ajouter une ligne dans `CHANGELOG.md` : "v4.83 — Correction : en-tête des vues Congés réellement figé pendant le défilement."

Aucune logique métier modifiée, uniquement le conteneur de défilement et le CSS sticky.