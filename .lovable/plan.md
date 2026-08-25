# Remplacer le mode « 2 étages » par des métiers supplémentaires

## Objectif
Abandonner le réglage « Magasin à 2 étages » et l'étage par collaborateur. À la place, quand le **Multi-métiers** est activé pour un magasin, cinq métiers supplémentaires deviennent disponibles : **Trésorerie, PT bas, PT haut, PE bas, PE haut**.

## Fonctionnement pour l'utilisateur
- Le réglage « Magasin à 2 étages » disparaît des paramètres magasin (admin et responsable).
- Le champ « Étage » disparaît de la fiche collaborateur, ainsi que les nuances de couleur liées à l'étage.
- Le métier principal reste inchangé (Responsable, Technique, Éditorial, Stock, Caisse, Stagiaire).
- Quand le Multi-métiers est activé, les nouveaux métiers apparaissent :
  - dans les **rôles secondaires** de la fiche collaborateur,
  - dans le **rôle du jour** (y compris les plages horaires intra-journée).
- Couleurs : PT bas = orange clair, PT haut = orange foncé, PE bas = jaune, PE haut = ambre foncé, Trésorerie = fuchsia (même teinte que la tâche Trésorerie de la grille).
- Ces métiers s'affichent partout où les rôles du jour sont déjà rendus : planning semaine (segments Gantt), équipe du jour / grille horaire, encodage planning, légendes.
- Les magasins sans Multi-métiers ne voient aucun changement.

## Détails techniques
1. Migration : suppression de `stores.has_two_floors` et `employees.floor`, et recréation de `get_my_stores()` sans `store_has_two_floors`.
2. `src/lib/role-colors.ts` :
   - suppression de `FLOOR2_ROLE_COLORS`, `FLOOR_SPLIT_ROLES` et `getRoleColorsFor`,
   - ajout des clés `tresorerie`, `pt_bas`, `pt_haut`, `pe_bas`, `pe_haut` dans une liste `EXTRA_ROLE_KEYS` avec leurs variantes de couleur complètes,
   - `getRoleColors` reconnaît ces clés ; `ROLE_KEYS` / `ROLE_ORDER` (métiers principaux) restent inchangés, avec un tri plaçant les extras juste après leur métier parent.
3. `src/hooks/useStore.tsx` : retrait de `has_two_floors` du type et des mappings.
4. UI : retrait du switch dans `StoreManager.tsx` et `StoreSelfSettings.tsx` (et du badge résumé), retrait du sélecteur Étage dans `EmployeeSheet.tsx` ; la liste des rôles secondaires utilise `ROLE_KEYS + EXTRA_ROLE_KEYS` quand `has_multi_roles`.
5. `DayRoleEditor.tsx` : liste de métiers étendue aux extras quand `has_multi_roles`.
6. Consommateurs de couleurs (`TeamWeekView`, `TeamDayView`, `HourlyGrid`, `ScheduleEditor`, `EmployeeManager`, `TeamAndAccounts`, `conges/*`, `EmployeeMobileView`) : remplacement des appels `getRoleColorsFor(role, floor, enabled)` par `getRoleColors(role)`, légendes des étages remplacées par les libellés des nouveaux métiers présents dans la semaine.
7. Traductions FR/NL dans `i18n.tsx` : `role.tresorerie`, `role.pt_bas`, `role.pt_haut`, `role.pe_bas`, `role.pe_haut` ; suppression des clés `employee.floor.*` et `legend.floor*`.
8. Bump `src/lib/version.ts` en v5.14 + entrée en haut de `CHANGELOG.md`.
