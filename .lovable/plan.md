# Optimisation mobile — Équipe du jour

Sur mobile (≤640px), trois zones posent problème : la grille horaire (trop dense en scroll horizontal), la double colonne "Travaillent / Absences-Alertes" (collée, illisible) et les paddings du conteneur.

## Changements

### 1. `src/pages/TeamDayView.tsx`
- Conteneur : `px-6 py-4` → `px-3 sm:px-6 py-3 sm:py-4` pour gagner de la largeur utile.
- Cartes résumé (Présents/Congés/Repos) : réduire la taille texte sur mobile (`text-xl sm:text-2xl`, padding `p-2 sm:p-3`).
- Bloc principal en deux colonnes : passer `grid grid-cols-2 gap-4` → `grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4`. Sur mobile : Travaillent au-dessus, Alertes/Congés/Roulement/Déplacements/Repos en dessous.
- Navigateur de jour : `gap-3 mb-6` → `gap-2 mb-4 sm:mb-6 flex-wrap`.

### 2. `src/components/team-day/HourlyGrid.tsx`
La grille reste en scroll horizontal (indispensable avec 28+ créneaux 30 min), mais on la rend plus lisible sur mobile :
- En-tête de section (titre + légende + bouton "Appliquer" + Imprimer) : passer en `flex-col sm:flex-row` pour éviter le débordement. Légende des rôles : `flex-wrap` + `gap-1.5` pour qu'elle se replie proprement.
- Cellules : min-width `28px → 24px` sur mobile (`min-w-[24px] sm:min-w-[28px]`), labels d'heure `text-[9px]` → `text-[8px] sm:text-[9px]`. Hauteur barre `h-6 → h-5 sm:h-6`.
- Colonne employé sticky : `min-w-[100px]` → `min-w-[88px] sm:min-w-[100px]`, troncature nom `max-w-[90px]` → `max-w-[72px] sm:max-w-[90px]`.
- Ajouter un indicateur visuel de scroll : ombre légère sur le bord droit de la colonne sticky (déjà présente via border-r, suffisant).

### 3. `CHANGELOG.md` + `src/lib/version.ts`
- Bump `v4.77` → `v4.78`.
- Entrée changelog : "Optimisation mobile de la vue Équipe du jour (mise en page colonne unique, grille horaire compactée)".

## Hors scope
- Pas de refonte de la grille horaire (pas de bascule en vue verticale ou liste).
- Pas de changement de logique métier ni de couleurs/charte.
