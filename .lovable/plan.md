# Plan : un seul créneau horaire en multi-métiers (planning semaine)

## Objectif
Dans la vue **Planning équipe / semaine**, quand un vendeur effectue plusieurs métiers dans la même journée, l’affichage actuel découpe le créneau en autant de segments que de rôles et répète l’horaire sur chaque segment (ex. « 09h00–13h00 », « 13h00–17h00 »). L’utilisateur souhaite conserver **un seul créneau horaire** visible (ex. « 09h00–17h00 »), tout en gardant l’indication visuelle du changement de rôle par les couleurs.

## État actuel vérifié
- `src/pages/TeamWeekView.tsx` (lignes 354-378) : quand `isRoleSwitch` est vrai et que `roleSegments` existe, le code mappe chaque segment en une `<div>` distincte avec son propre libellé horaire.
- `src/lib/day-roles.ts` : `buildRoleSegments` couvre toute la plage du shift en remplissant les trous avec le métier principal, et fusionne les segments consécutifs de même rôle.

## Solution proposée
1. **Rendre une seule barre par shift** même en présence de `roleSegments`.
2. **Libellé unique** : afficher `formatTimeBE(start)–formatTimeBE(end)` une fois, centré sur la barre complète.
3. **Couleurs segmentées** : utiliser un `linear-gradient` CSS généré à partir des `roleSegments` pour que la couleur de fond indique toujours les portions par métier (proportions respectées).
4. **Infobulle conservée** : le `title` continuera d’afficher le détail segment par segment (`09h00–13h00 · PT bas`, etc.) et la pause éventuelle.
5. **Overlay de pause inchangé** : la barre de pause reste rendue par-dessus comme aujourd’hui.
6. **Gestion de la largeur** : si le créneau complet est trop court, masquer le texte comme le fait déjà le test `segWidth > 12`.

## Fichiers concernés
- `src/pages/TeamWeekView.tsx` : refactor du bloc de rendu des segments (lignes ~354-378) pour générer une barre unique avec gradient.
- `src/lib/version.ts` : passage en `v5.22`.
- `CHANGELOG.md` : ajout d’une entrée pour la v5.22.

## Non concernés
- La vue **Équipe du jour** (`TeamDayView.tsx`) conserve sa logique actuelle : elle liste les collaborateurs regroupés par rôle, donc le découpage par segment y reste pertinent.
- L’encodage du planning hebdomadaire (`ScheduleEditor.tsx`) et les règles métier (`day-roles.ts`) ne changent pas.

## Livrables attendus
- Un seul libellé horaire par shift dans la grille semaine, même en multi-métiers.
- Les couleurs par rôle restent visibles grâce au gradient.
- Version incrémentée et changelog mis à jour.
