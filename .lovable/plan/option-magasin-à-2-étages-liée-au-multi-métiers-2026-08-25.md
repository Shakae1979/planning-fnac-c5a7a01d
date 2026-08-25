# Option « Magasin à 2 étages » liée au multi-métiers

## Idée retenue
Oui, c'est la bonne approche : un interrupteur dédié « Magasin à 2 étages » dans les paramètres du magasin. Les rôles d'étage (PT bas, PT haut, PE bas, PE haut) n'apparaissent dans le multi-métiers que si cet interrupteur est activé. Sinon ils restent invisibles.

Trésorerie reste disponible dès que le multi-métiers est activé (ce n'est pas lié aux étages).

## Comportement
- Multi-métiers OFF : aucun rôle supplémentaire, rien ne change.
- Multi-métiers ON, 2 étages OFF : Trésorerie uniquement.
- Multi-métiers ON, 2 étages ON : Trésorerie + PT bas, PT haut, PE bas, PE haut, avec leurs couleurs dédiées.

L'interrupteur « 2 étages » n'est proposé que lorsque le multi-métiers est activé (il en dépend).

## Où ça se voit
- Paramètres magasin (admin et responsable de magasin) : nouvel interrupteur sous le multi-métiers.
- Fiche collaborateur : rôles secondaires filtrés selon les réglages.
- Planning (rôle du jour), planning semaine, équipe du jour : légendes et couleurs filtrées de la même façon.

## Détails techniques
- Migration : rajouter `stores.has_two_floors boolean not null default false` et remettre le champ dans la fonction `get_my_stores()`.
- `src/lib/role-colors.ts` : séparer `EXTRA_ROLE_KEYS` en `TRESORERIE_ROLE_KEYS` (`tresorerie`) et `FLOOR_ROLE_KEYS` (`pt_bas`, `pt_haut`, `pe_bas`, `pe_haut`), plus un helper `getExtraRoleKeys(multiRoles, twoFloors)`.
- `src/hooks/useStore.tsx` : rajouter `has_two_floors` dans l'interface `Store` et les trois mappings.
- `StoreManager.tsx` / `StoreSelfSettings.tsx` : interrupteur + badge résumé, avec `refreshStores()` après mutation.
- `EmployeeSheet.tsx`, `DayRoleEditor.tsx`, `ScheduleEditor.tsx`, `TeamWeekView.tsx`, `TeamDayView.tsx` : remplacer l'usage direct de `EXTRA_ROLE_KEYS` par le helper.
- `src/lib/i18n.tsx` : libellés FR/NL `store.twoFloors` + aide.
- Bump `src/lib/version.ts` en v5.15 et entrée CHANGELOG.
