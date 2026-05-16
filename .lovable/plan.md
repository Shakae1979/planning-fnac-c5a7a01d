## Objectif

Dans **Planning Fnac → Planning**, ajouter une séparation visuelle entre les différents rayons (rôles) de la grille des horaires, pour faciliter le repérage lors de la saisie.

## Contexte

Les employés sont déjà triés par rôle (Responsables → Technique → Éditorial → Stock → Caisse → Stagiaires) dans `src/components/dashboard/ScheduleEditor.tsx` (ligne 148-153). Chaque ligne a déjà une bordure gauche colorée par département, mais aucune séparation horizontale ne marque le passage d'un rayon à l'autre.

Le même pattern existe déjà dans `HourlyGrid.tsx` (vue jour) avec `isFirstOfRole` + `border-t-4 border-t-foreground/25`. On va reproduire ce comportement dans l'éditeur de planning hebdo.

## Changement

Dans `src/components/dashboard/ScheduleEditor.tsx`, au niveau du `.map((emp) => ...)` ligne 876 :

1. Capturer l'index dans le map : `employees?.map((emp, idx) => { ... })`.
2. Calculer `const isFirstOfRole = idx > 0 && employees[idx - 1].role !== emp.role;`
3. Ajouter à la className du `<tr>` (ligne 904) un séparateur top épais quand `isFirstOfRole` est vrai : `${isFirstOfRole ? "border-t-4 border-t-foreground/25" : ""}`.

Cela donnera une ligne horizontale marquée à chaque changement de rayon, cohérente visuellement avec la grille horaire du jour.

## Fichier modifié

- `src/components/dashboard/ScheduleEditor.tsx` (≈3 lignes modifiées, aucune logique métier touchée)
