# Multi-métiers activable par magasin

Le multi-métiers (métiers secondaires + changement de métier en cours de journée) devient une option à activer magasin par magasin, exactement comme l'heure de table et les semaines A/B. Par défaut : désactivé partout.

## Ce que ça change

- **Paramètres du magasin** : un nouvel interrupteur « Multi-métiers » apparaît, activable par l'admin (gestion des magasins) et par le responsable pour son propre magasin.
- **Quand c'est éteint** (cas par défaut) : aucune case « métiers secondaires » sur la fiche collaborateur, aucune pastille de métier du jour dans l'encodage du planning, et le planning semaine / équipe du jour / grille horaire affichent le métier principal comme avant.
- **Quand c'est allumé** : tout le comportement actuel reste disponible (métiers secondaires, plages horaires par métier, segments colorés, répartition des heures par département).
- Les données déjà encodées ne sont pas supprimées si on éteint l'option : elles sont simplement ignorées à l'affichage et redeviennent visibles si on rallume.

## Détails techniques

1. **Base de données** : ajout de `has_multi_roles boolean not null default false` sur `public.stores`, et ajout de la colonne au retour de la fonction `public.get_my_stores()` (nécessaire pour les éditeurs/responsables, comme cela a été fait pour `has_ab_weeks`).
2. **`src/hooks/useStore.tsx`** : ajout de `has_multi_roles` au type `Store` et aux trois chemins de chargement (admin, `get_my_stores`, magasin Direction).
3. **Paramètres** :
   - `StoreManager.tsx` : nouveau `Switch` + mutation `stores.update({ has_multi_roles })`.
   - `StoreSelfSettings.tsx` : même interrupteur pour le responsable de son magasin.
   - Libellés FR/NL ajoutés dans `src/lib/i18n.tsx`.
4. **Conditionnement de l'UI** :
   - `EmployeeSheet.tsx` : bloc « métiers secondaires » affiché seulement si l'option est active.
   - `ScheduleEditor.tsx` : la pastille `DayRoleEditor` n'est rendue que si l'option est active.
   - `TeamWeekView.tsx`, `TeamDayView.tsx`, `HourlyGrid.tsx`, `OverviewInsights.tsx` : les segments de métier ne sont pris en compte que si le magasin courant a l'option active (sinon on retombe sur le métier principal, comportement d'origine).
5. **Version** : passage en `v5.03` dans `src/lib/version.ts` + entrée en tête de `CHANGELOG.md`.
