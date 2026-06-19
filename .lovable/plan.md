## Problème

Pour le magasin d'Aalst, les semaines A/B fonctionnent en mode **admin** mais pas en mode **éditeur**.

## Cause

En admin, `useStore` lit la table `stores` directement et récupère `has_ab_weeks`.  
En éditeur, `useStore` appelle la fonction `get_my_stores()` qui **ne renvoie pas** la colonne `has_ab_weeks`. Résultat : `currentStore.has_ab_weeks` est `undefined` → `hasABWeeks = false` → les boutons/logique semaine A et B sont désactivés.

## Correctif

1. **Migration Supabase** : recréer `public.get_my_stores()` pour ajouter `store_has_ab_weeks boolean` dans le `RETURNS TABLE` et dans le `SELECT` (joint depuis `stores.has_ab_weeks`). Signature `SECURITY DEFINER`, `search_path=public` conservés.

2. **`src/hooks/useStore.tsx`** : dans la branche non-admin, mapper `has_ab_weeks: s.store_has_ab_weeks ?? false` lors de la construction de `storeList`.

3. **`src/lib/version.ts`** : bump à `v4.54`.

## Hors scope

- Aucun changement aux RLS de `weekly_schedules` (déjà ouvert aux authentifiés).
- Aucun changement à `ScheduleEditor.tsx` ni aux templates 1970-01-05 / 1970-01-12.
- Pas de retouche à la sélection HourlyGrid corrigée précédemment.
