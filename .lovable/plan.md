## Problème

En thème sombre, plusieurs combinaisons de couleurs dans la vue Congés (mensuelle et trimestrielle) cohabitent mal :

- **Entêtes de colonnes de rôles** : fond coloré faible (`bg-red-900/30`, `bg-yellow-900/30`, etc.) + texte `text-muted-foreground` → contraste insuffisant, libellés délavés.
- **Fériés** : `bg-emerald-500/15` + texte `text-emerald-400` → lisible, mais entre en conflit visuel avec la couleur de la colonne Caisse (verte) qui occupe le même espace.
- **Vacances scolaires** : `bg-amber-300/10` et `bg-sky-300/10` → quasi invisibles sur le fond sombre, on perd l'info.
- **Weekend** : `bg-muted/40` se mélange aux bordures gauches colorées des colonnes (border-l-700) → l'œil ne distingue plus la séparation.
- **Badges de congés** (`bg-{color}-500 text-white`) : OK en clair, mais en sombre le vert/jaune/orange brillent trop fort sur un fond sombre par rapport au reste.

## Correctif (présentation uniquement)

### 1. Lisibilité des entêtes de rôles (MonthGrid + QuarterView)

Remplacer `text-muted-foreground` par la variante `text` du rôle (déjà définie dans `role-colors.ts` : `text-red-800 dark:text-red-200`, etc.).

Concrètement : exposer aussi `text` dans le mapping `ROLE_COLUMNS` de `MonthGrid.tsx` (il duplique aujourd'hui une liste statique au lieu d'utiliser `ROLE_COLORS`) et l'utiliser sur le `<th>`. Pour `QuarterView.tsx`, ajouter `CENTRAL_ROLE_COLORS[key].text` au mapping et l'utiliser dans `<th>`.

### 2. Renforcer les fonds en mode sombre

- Entêtes rôles : passer de `dark:bg-{hue}-900/30` à `dark:bg-{hue}-900/50` pour mieux ressortir.
- Vacances scolaires : passer de `bg-amber-300/10` / `bg-sky-300/10` à `bg-amber-400/15 dark:bg-amber-500/20` et `bg-sky-400/15 dark:bg-sky-500/20`.
- Weekend : passer de `bg-muted/40` à `bg-muted/40 dark:bg-muted/60` pour mieux marquer.
- Fériés : conserver `bg-emerald-500/15`, mais texte passé à `text-emerald-800 dark:text-emerald-300` (plus de contraste).

### 3. Badges de congés

Garder `text-white`, mais atténuer en sombre via une variante `dark:bg-{color}-600` (les `bg-{color}-500` brillent trop). Le fichier source : `src/components/dashboard/CongesCalendar.tsx` (constante `CONGE_TYPES`).

### 4. Bordures gauches des colonnes en sombre

`border-l-{color}-700` est trop foncé sur fond sombre → souvent invisible. Passer à `dark:border-l-{color}-500` dans `role-colors.ts` (`congesBorderL`).

## Fichiers concernés

1. `src/lib/role-colors.ts` — ajuster `congesHeaderBg` (opacité /50 en dark), `congesBorderL` (500 en dark).
2. `src/components/dashboard/conges/MonthGrid.tsx` — supprimer le mapping statique local, importer `ROLE_COLORS`, utiliser la classe `text` du rôle sur les `<th>`.
3. `src/components/dashboard/conges/QuarterView.tsx` — étendre `ROLE_COLUMNS` avec `text`, appliquer sur les `<th>`.
4. `src/components/dashboard/CongesCalendar.tsx` — ajouter `dark:bg-{color}-600` sur chaque entrée de `CONGE_TYPES`.
5. Les fonds weekend / vacances scolaires / fériés sont définis inline dans `MonthGrid.tsx` et `QuarterView.tsx` (variable `schoolBg` et classes de `<tr>`) — adapter aux deux endroits.

Aucun changement de logique métier, uniquement des classes Tailwind.

## Vérification

- Basculer en thème sombre, ouvrir Congés (vue mois + vue trimestre).
- Vérifier que chaque entête de rôle est lisible (texte contrasté sur fond teinté).
- Confirmer que weekends, fériés et vacances scolaires se distinguent clairement les uns des autres et des cellules de rôles.
- Vérifier que les badges de congés ne "brûlent" pas et que les bordures gauches restent visibles.
- Repasser en clair : aucune régression visuelle.
