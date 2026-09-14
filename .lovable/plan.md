# Ordre des vendeurs stable dans l'encodage du planning

## Le problème constaté

Dans l'écran d'encodage, l'ordre des collaborateurs replace parfois les personnes différemment après un rafraîchissement.

Ce que montrent les données actuelles : dans la plupart des magasins, presque tous les collaborateurs d'une même catégorie partagent la même valeur de position (par exemple 6 des 7 de l'éditorial à Gent, 5 sur 5 des responsables à Liège). Tant que les positions ne sont pas toutes distinctes, l'ordre dépend d'un tri de secours et bouge dès qu'une position est modifiée ailleurs.

Deuxième point : quand on déplace quelqu'un, les nouvelles positions sont enregistrées une par une, en parallèle. Si la page se recharge (retour sur l'onglet, changement de semaine) pendant ces enregistrements, elle peut lire un état à moitié écrit et remettre les personnes dans le désordre.

## Ce qui va changer

1. Lors d'un déplacement, toutes les personnes de la catégorie reçoivent une position distincte, enregistrée en une seule opération au lieu de plusieurs requêtes séparées.
2. Les collaborateurs qui n'ont jamais été classés reçoivent une position propre, basée sur l'ordre actuellement affiché, pour supprimer les égalités existantes.
3. Pendant l'enregistrement, la page ne recharge plus la liste : l'ordre affiché reste celui que l'utilisateur vient de définir, et la relecture n'a lieu qu'une fois l'enregistrement confirmé.
4. La liste des collaborateurs est mise en cache quelques minutes, ce qui supprime les rechargements inutiles à chaque retour sur l'onglet et rend l'affichage plus rapide.

## Détails techniques

- `src/components/dashboard/ScheduleEditor.tsx` (`handleDragEnd`, `reorderMutation`) :
  - remplacer les `update` en `Promise.all` par un seul `upsert` sur `employees` (id + sort_order) ;
  - inclure dans les updates tous les membres du groupe de rôle, y compris ceux restés à `sort_order = 0` ;
  - `queryClient.cancelQueries` avant la mise à jour optimiste, invalidation déplacée dans `onSettled` (et non `onSuccess`), rollback du snapshot en `onError`.
- Ajouter `staleTime: 5 * 60_000` (et `refetchOnWindowFocus: false`) sur la requête `["employees", currentStore?.id]` de `ScheduleEditor.tsx` et sur `["store-employees", currentStore?.id]` / `["direction-employees"]` de `src/hooks/useStoreEmployees.tsx`.
- Migration ponctuelle : attribuer un `sort_order` unique par (store_id, role) aux collaborateurs actifs, selon l'ordre `sort_order, name` actuel, pour supprimer les égalités en base.
- Tri inchangé : rôle > `sort_order` > nom.
- Bump `src/lib/version.ts` en `v5.33` + entrée `CHANGELOG.md` (FR, 14/09/2026).
