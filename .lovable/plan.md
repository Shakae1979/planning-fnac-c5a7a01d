## Objectif

Permettre de **réorganiser l'ordre des vendeurs par glisser-déposer** dans l'éditeur de planning hebdomadaire (`ScheduleEditor`). L'ordre est **partagé pour tout le magasin**, **conservé à l'intérieur de chaque catégorie de rôle** (Responsables, Technique, Éditorial, Stock, Caisse, Stagiaires), et **activé partout** sans toggle.

## Comportement

- Une petite poignée (icône `GripVertical`) apparaît à gauche du nom de chaque employé dans la grille hebdomadaire de création de planning.
- L'utilisateur glisse une ligne vers le haut/bas. Le déplacement est **limité au groupe de rôle courant** (impossible de faire passer un Caisse au-dessus d'un Responsable).
- Au drop, l'ordre est sauvegardé immédiatement en base. Toast `Ordre mis à jour` / `Erreur de sauvegarde`.
- L'ordre personnalisé est **utilisé partout où la liste d'employés est triée par rôle** (semaine, jour, grille horaire, congés) pour rester cohérent visuellement, mais le drag & drop n'est exposé que dans `ScheduleEditor`.
- Si plusieurs utilisateurs éditent en même temps, le dernier qui drop gagne (simple, comme le reste de l'app).

## Détails techniques

### 1. Base de données

Migration ajoutant une colonne `sort_order` sur `employees` :

```sql
ALTER TABLE public.employees
  ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX employees_store_sort_idx
  ON public.employees (store_id, role, sort_order);
```

Initialisation : `sort_order` reste à 0 pour tous (le tri secondaire `name` prend le relais). Aucun backfill nécessaire — le drag réécrit les valeurs au fur et à mesure.

Pas de nouvelle policy : les policies UPDATE existantes sur `employees` couvrent déjà la colonne.

### 2. Tri global

Dans **toutes** les sources qui trient par rôle (`ScheduleEditor`, `useStoreEmployees`, `TeamDayView`, `HourlyGrid` via la prop `sortByRole`, vues congés), remplacer la comparaison secondaire :

```ts
// avant
if (orderA !== orderB) return orderA - orderB;
return a.name.localeCompare(b.name, "fr");

// après
if (orderA !== orderB) return orderA - orderB;
if ((a.sort_order ?? 0) !== (b.sort_order ?? 0)) return (a.sort_order ?? 0) - (b.sort_order ?? 0);
return a.name.localeCompare(b.name, "fr");
```

Centraliser dans un helper `sortEmployees(list, roleOrder)` dans `src/lib/format.ts` pour éviter la divergence.

### 3. Drag & drop dans `ScheduleEditor`

- Dépendance : utiliser **`@dnd-kit/core` + `@dnd-kit/sortable`** (léger, accessible, déjà courant dans cet écosystème).
- Envelopper le `<tbody>` des employés avec `DndContext` + `SortableContext` (stratégie `verticalListSortingStrategy`).
- Chaque `<tr>` employé devient un composant `SortableEmployeeRow` qui expose un handle `<GripVertical>` via `useSortable`.
- Sur `onDragEnd` :
  - Refuser si le rôle de l'item glissé ≠ rôle de la cible (silent no-op, l'animation revient).
  - Recalculer les `sort_order` du groupe de rôle : `0, 1, 2, …` pour la nouvelle séquence.
  - Mise à jour optimiste du cache React Query (`["employees", storeId]`) puis `supabase.from("employees").upsert(rows, { onConflict: "id" })` avec `{ id, sort_order }`.
  - Invalider les autres caches qui listent les employés (`["direction-employees"]`, `["store-employees", …]`).
- Vue **Direction Fnac** : drag désactivé (les "employés" y sont des managers virtuels) — pas de handle affiché si `isDirection`.

### 4. Fichiers touchés

```text
supabase/migrations/<new>.sql        # ajout colonne sort_order + index
src/lib/format.ts                    # helper sortEmployees() partagé
src/components/dashboard/ScheduleEditor.tsx  # DndContext, SortableRow, handle, mutation
src/hooks/useStoreEmployees.tsx      # utiliser sortEmployees
src/components/team-day/HourlyGrid.tsx       # tri via sort_order (déjà passé via prop)
src/pages/TeamDayView.tsx + TeamWeekView.tsx # passer sort_order au tri
src/integrations/supabase/types.ts   # régénéré automatiquement après migration
src/lib/version.ts                   # bump v4.70
```

### 5. i18n

Ajouter dans `useI18n` :
- `schedule.dragHint` : FR "Glisser pour réorganiser" / NL "Sleep om te herordenen"
- `schedule.orderSaved` : FR "Ordre mis à jour" / NL "Volgorde bijgewerkt"
- `schedule.orderError` : FR "Erreur lors du changement d'ordre" / NL "Fout bij wijzigen volgorde"

## Hors scope

- Pas de drag entre catégories de rôle (changer le rôle d'un employé reste dans `EmployeeSheet`).
- Pas de drag dans les vues congés ou la grille horaire (lecture seule de l'ordre).
- Pas d'historique / undo : un mauvais drop se corrige par un nouveau drop.
- Pas de toggle par magasin — activé pour tous.
- Pas de réordonnancement par utilisateur (ordre global magasin seulement).
