# Rétablir la vue complète à l'impression

## Problème confirmé

Les vues à en-tête figé introduites récemment placent le tableau dans un conteneur défilant à hauteur limitée :

- Planning semaine (`TeamWeekView`) : `overflow-auto max-h-[75vh]`
- Encodage planning (`ScheduleEditor`) : `overflow-auto max-h-[75vh]`
- Congés (`MonthGrid`, `QuarterView`, `DirectionMonthGrid`, `DirectionQuarterView`) : `overflow-auto max-h-[calc(100vh-220px)]`

À l'impression, le navigateur n'imprime que la portion visible de ces conteneurs : tout ce qui se trouve en dessous de la zone de défilement est coupé. Les en-têtes `sticky` peuvent en plus se superposer au contenu sur la feuille.

## Correction proposée

Ajouter une règle d'impression globale dans `src/index.css` (bloc `@media print`) qui neutralise ces contraintes uniquement lors de l'impression :

- Hauteur maximale supprimée et débordement rendu visible pour tous les conteneurs défilants.
- En-têtes `sticky` repassés en position normale, et répétition des en-têtes de tableau sur chaque page (`thead { display: table-header-group }`).
- Éviter les coupures au milieu d'une ligne (`tr { break-inside: avoid }`).

Aucune modification du comportement à l'écran : les en-têtes restent figés en navigation normale.

## Détails techniques

Dans le bloc `@media print` de `src/index.css` :

```text
[class*="overflow-auto"], [class*="overflow-y-auto"], [class*="overflow-hidden"] {
  max-height: none !important;
  overflow: visible !important;
}
.sticky { position: static !important; }
thead { display: table-header-group; }
tr, .kpi-card { break-inside: avoid; }
```

## Suivi de version

- Bump de `src/lib/version.ts` (v4.98) et nouvelle entrée en tête de `CHANGELOG.md`.
