## Objectif
Permettre à chaque **Éditeur** de gérer son propre magasin : activer/désactiver les **semaines A/B**, l'**heure de table**, et modifier les **heures d'ouverture**.

Actuellement ces réglages ne sont accessibles qu'aux admins via l'onglet "Magasins" (caché aux éditeurs). Les politiques RLS bloquent les UPDATE pour les non-admins.

## Plan

### 1. Migration RLS (table `stores` + `store_settings`)
Ajouter deux policies UPDATE permettant aux éditeurs de modifier **uniquement les magasins auxquels ils sont assignés** (via `user_store_assignments`) :

```sql
-- stores
CREATE POLICY "Editors can update assigned stores"
ON public.stores FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'editor') AND
  EXISTS (SELECT 1 FROM public.user_store_assignments
          WHERE user_id = auth.uid() AND store_id = stores.id)
)
WITH CHECK (
  has_role(auth.uid(), 'editor') AND
  EXISTS (SELECT 1 FROM public.user_store_assignments
          WHERE user_id = auth.uid() AND store_id = stores.id)
);

-- store_settings : même logique, plus policy INSERT (upsert)
CREATE POLICY "Editors can manage own store settings"
ON public.store_settings FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'editor') AND
  EXISTS (SELECT 1 FROM public.user_store_assignments
          WHERE user_id = auth.uid() AND store_id = store_settings.store_id)
)
WITH CHECK (
  has_role(auth.uid(), 'editor') AND
  EXISTS (SELECT 1 FROM public.user_store_assignments
          WHERE user_id = auth.uid() AND store_id = store_settings.store_id)
);
```

L'UI ne propose que les 3 réglages voulus ; les autres colonnes (`name`, `city`, `is_direction`) restent en lecture seule pour les éditeurs côté interface.

### 2. Nouvelle entrée sidebar « Paramètres magasin » (éditeurs)
- Ajouter dans `Sidebar.tsx` un lien `settings` (icône `Settings`) visible pour **admin ET editor**.
- Pour l'admin, c'est redondant avec l'onglet "Magasins" — on n'affiche le lien `settings` que pour `editor` (l'admin garde la pleine gestion via "Magasins").

### 3. Nouvelle vue `StoreSelfSettings.tsx`
Composant scoping sur `currentStore` (via `useStore()`) avec 3 blocs :
- **Heures d'ouverture** : réutilise `InlineStoreSettings` (déjà câblé sur `store_settings`).
- **Semaines A/B** : `Switch` lié à `stores.has_ab_weeks` (mutation `update stores`).
- **Heure de table** : `Switch` lié à `stores.has_lunch_break`.

Réutilise les mutations/clés de query existantes pour invalider `["stores"]` et `["store-settings", storeId]`. Affiche le nom du magasin courant en en-tête.

### 4. Routing dans `Index.tsx`
Ajouter `settings` au type `View` et router vers `<StoreSelfSettings />`.

### 5. i18n
Ajouter clés `nav.settings`, `settings.title`, `settings.scopeNote` (FR + NL).

### 6. Version
Bump `src/lib/version.ts` → v4.58.

## Hors scope
- Pas de changement sur la table `employees` ni `weekly_schedules`.
- L'éditeur ne peut toujours pas renommer/supprimer un magasin ni gérer les managers — réservé aux admins.
- Pas de changement pour le rôle "user" (lecture seule).
