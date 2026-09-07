# Impression du planning — couleurs perdues

## Diagnostic
Les règles d'impression existent dans `src/index.css` (`@media print`), mais `-webkit-print-color-adjust: exact` / `print-color-adjust: exact` ne sont appliqués que sur `body`. Chrome/Edge ne propagent pas toujours cette propriété aux éléments enfants : les fonds colorés des barres du planning (classes Tailwind `bg-orange-500`, `bg-emerald-500`, etc.) sont alors ignorés à l'impression, d'où un rendu en niveaux de gris. Si le thème sombre est actif, les variantes `dark:` aggravent aussi le rendu.

## Modification (1 fichier : `src/index.css`)

1. Appliquer la conservation des couleurs à **tous** les éléments, pas seulement `body` :
   ```text
   @media print {
     *, *::before, *::after {
       -webkit-print-color-adjust: exact !important;
       print-color-adjust: exact !important;
     }
     ...
   }
   ```
2. Garder le fond de page blanc sur `body`/`html` (inchangé).
3. Vérifier au passage que les barres Gantt de `TeamWeekView` et les badges de rôle n'utilisent pas de styles qui seraient masqués à l'impression.

## Vérification
- Aperçu avant impression (Ctrl+P) sur « Planning semaine » via Playwright : capture de l'aperçu pour confirmer que les barres colorées par rôle sont visibles.

## Hors périmètre
- Aucun changement de couleurs ou de données, aucun changement à l'écran.

## Versioning
- Bump `src/lib/version.ts` → v5.30 + entrée en tête de `CHANGELOG.md` (FR, date 07/09/2026).
