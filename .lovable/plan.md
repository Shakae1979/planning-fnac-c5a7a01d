## Problème

Dans la vue Congés (mensuelle, trimestrielle et Direction), les colonnes par catégorie (Responsables, Technique, Éditorial, Stock, Caisse) n'ont pas la même largeur. Elles s'élargissent ou se rétrécissent selon le contenu (noms d'employés, nombre de congés affichés), ce qui rend la grille visuellement déséquilibrée.

La cause : les tables utilisent `w-full` sans `table-fixed`, donc le navigateur applique l'algorithme `table-auto` qui ajuste chaque colonne au contenu. Seules les colonnes Date (`w-[70px]`) et Jour (`w-[30px]`) ont une largeur explicite ; les colonnes de rôles n'en ont aucune.

## Correctif

Forcer une largeur égale pour toutes les colonnes de rôles, sans toucher aux deux colonnes fixes Date/Jour.

### Fichiers concernés

1. `src/components/dashboard/conges/MonthGrid.tsx`
2. `src/components/dashboard/conges/QuarterView.tsx`
3. `src/components/dashboard/conges/DirectionMonthGrid.tsx`
4. `src/components/dashboard/conges/DirectionQuarterView.tsx` (vérifier, même pattern probable)

### Modifications

Pour chaque table :

- Ajouter la classe `table-fixed` sur l'élément `<table>` (en plus de `w-full`).
- Ajouter une largeur explicite identique sur chaque `<th>` de rôle, par ex. `style={{ width: \`${100 / activeRoles.length}%\` }}` calculée dynamiquement, ou via `<colgroup>` pour rester propre.
- Conserver les largeurs fixes Date (70px) et Jour (30px) inchangées.
- Sur les `<td>` de contenu : garder `truncate` sur les badges (déjà présent dans MonthGrid) pour que les noms longs ne forcent pas l'élargissement.

### Approche recommandée : `<colgroup>`

Plus lisible qu'un style inline par cellule :

```tsx
<table className="w-full text-[11px] border-collapse table-fixed">
  <colgroup>
    <col style={{ width: "70px" }} />
    <col style={{ width: "30px" }} />
    {activeRoles.map(r => (
      <col key={r.key} style={{ width: `calc((100% - 100px) / ${activeRoles.length})` }} />
    ))}
  </colgroup>
  <thead>...</thead>
```

### Vérification

- Vue mensuelle Congés : colonnes Resp./Tech./Édit./Stock/Caisse de largeur identique, peu importe le nombre de congés.
- Vue trimestrielle : idem.
- Vue Direction Fnac : idem avec les libellés courts 3 caractères.
- Le contenu (badges de noms) tronque correctement quand trop long, sans déborder.
- Aucun changement de logique métier, uniquement de la présentation.
