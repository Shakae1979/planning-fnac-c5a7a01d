## Problème

Sur **/equipe-semaine** (vue Gantt), quand un jour est marqué férié via le drapeau (`day_comments.is_ferie = true`), la barre d'horaire de chaque employé reste affichée — seul un petit drapeau et le fond gris apparaissent. L'utilisateur attend que le férié **prenne le pas visuellement** et remplace la barre d'horaire par le bandeau "Férié".

## Correctif

Dans `src/pages/TeamWeekView.tsx`, dans la cellule jour (autour de la ligne 272), changer l'ordre des branches du rendu :

Ordre actuel : `congé → horaire (hasShift) → férié → roulement → location`
Nouvel ordre : `congé → férié → horaire (hasShift) → roulement → location`

Concrètement, quand `isFerie` est vrai (depuis `day_comments.is_ferie` OU legacy `FERIE`), on affiche le bandeau "Férié" plein largeur à la place de la barre d'horaire, même si `start/end` sont saisis. Les heures restent **conservées en base** (rien n'est supprimé), elles redeviennent visibles si on retire le drapeau férié.

Aucun changement de logique métier : pas de modification de `computeNetHours`, ni des données, ni de l'éditeur, ni de la vue jour. Uniquement le rendu de la cellule du Gantt semaine.

## Bump version

- `src/lib/version.ts` : v4.51 → v4.52
- `CHANGELOG.md` : nouvelle entrée en haut, date 23/06/2026, mention "Vue semaine : le marquage férié masque désormais la barre d'horaire et affiche le bandeau Férié à la place (heures conservées en base)."
