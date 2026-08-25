# Équipe du jour : couleurs et rôles corrects dans la grille horaire

## Constat vérifié

Dans la grille horaire de « Équipe du jour », la liste des rôles utilisée pour les couleurs et la légende est écrite en dur dans le composant : les 6 rôles de base, plus « Heure de table », « Trésorerie » et « Picking ». Les métiers ajoutés récemment (PT bas, PT haut, PE bas, PE haut) n'y figurent pas.

Conséquences observables sur un magasin comme LLN, multi-métiers activé :
- une plage encodée en PT bas / PT haut / PE bas / PE haut s'affiche en gris neutre au lieu de sa couleur ;
- ces rôles n'apparaissent pas dans la légende au-dessus de la grille ;
- la couleur « Trésorerie » de la grille est une teinte codée à part, qui peut différer de celle utilisée dans le planning semaine et la fiche collaborateur ;
- la légende affiche Trésorerie même quand le multi-métiers est désactivé, et affiche les rôles d'étage même quand l'option « Magasin à 2 étages » est décochée.

## Ce qui sera corrigé

1. La grille du jour utilisera la même source de couleurs que le reste de l'application, donc les mêmes teintes partout (encodage, planning semaine, équipe du jour).
2. Les rôles PT bas, PT haut, PE bas et PE haut s'afficheront avec leur couleur dédiée dans les cases, dans la barre de gauche du collaborateur et dans la légende.
3. La légende s'adaptera aux réglages du magasin :
   - multi-métiers désactivé : uniquement les 6 rôles de base, Heure de table et Picking ;
   - multi-métiers activé : + Trésorerie ;
   - option 2 étages activée : + PT bas, PT haut, PE bas, PE haut.
4. Le menu d'attribution de rôle par sélection de cases proposera exactement les mêmes rôles que la légende filtrée.

Aucun changement de données : les rôles déjà encodés seront simplement affichés correctement.

## Détails techniques

- `src/components/team-day/HourlyGrid.tsx` :
  - remplacer la constante `ROLES` figée par une liste construite avec `useMemo` à partir de `ROLE_KEYS` + `getExtraRoleKeys(currentStore?.has_multi_roles, currentStore?.has_two_floors)` + les entrées spéciales `heure_de_table` et `picking` ;
  - dériver `ROLE_BG` et `ROLE_BORDER_L` de cette liste via `getRoleColors(key)` (le composant lit déjà `useStore()`), et supprimer les teintes fuchsia/cyan codées en dur pour Trésorerie ;
  - dans le rendu des cellules, remplacer le test `ROLE_KEYS.includes(cellRole)` par un lookup direct dans la table dérivée, avec repli `bg-accent/20` seulement pour un rôle réellement inconnu ;
  - même logique pour `borderL` de la colonne collaborateur.
- `src/lib/i18n.tsx` : vérifier la présence des libellés courts FR/NL `role.pt_bas`, `role.pt_haut`, `role.pe_bas`, `role.pe_haut` pour la légende ; les ajouter si absents.
- Bump `src/lib/version.ts` en v5.17 et entrée en haut de `CHANGELOG.md`.
