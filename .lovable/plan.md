# Magasin à 2 étages — nuances de couleur PT / PE

## Objectif
Permettre à un magasin sur deux niveaux de distinguer visuellement les vendeurs Technique (PT) et Éditorial (PE) selon leur étage, avec deux nuances proches de la même teinte.

## Fonctionnement pour l'utilisateur
- Nouveau réglage dans les paramètres du magasin : **Magasin à 2 étages** (comme Heure de table / Multi-métiers). Désactivé par défaut.
- Une fois activé, la fiche collaborateur affiche un sélecteur **Étage** (Étage 1 / Étage 2), visible uniquement pour les rôles Technique et Éditorial.
- Dans le planning (semaine, jour, grille horaire, congés, badges d'équipe), la couleur du collaborateur suit son étage :
  - Technique : orange clair (étage 1) / orange foncé (étage 2)
  - Éditorial : jaune (étage 1) / ambre foncé (étage 2)
- Les autres rôles (Responsable, Stock, Caisse, Stagiaire) restent inchangés.
- Les légendes affichent les deux nuances (« Technique — Ét. 1 », « Technique — Ét. 2 ») uniquement quand le mode est actif.
- Le tri et la hiérarchie des rôles ne changent pas : l'étage est purement visuel.

## Détails techniques
1. Base de données (migration) :
   - `stores.has_two_floors boolean not null default false`
   - `employees.floor smallint not null default 1` (contrainte 1 ou 2)
2. `src/lib/role-colors.ts` : ajout de variantes « étage 2 » pour `technique` et `editorial` (mêmes clés de variantes : dot, bar, barSoft, bgSoft, bgChip, bgChipDark, headerBg, borderL, text, editorBg, congesHeaderBg, congesBorderL), plus un helper `getRoleColorsFor(role, floor, enabled)` qui retombe sur les couleurs actuelles si le mode est désactivé ou si le rôle n'est pas PT/PE.
3. UI de réglage : switch ajouté dans `StoreSelfSettings.tsx` et dans `StoreManager.tsx` (admin), sur le modèle de `has_multi_roles`.
4. Fiche collaborateur : champ Étage dans `EmployeeSheet.tsx`, affiché si `currentStore.has_two_floors` et rôle ∈ {technique, editorial}.
5. Consommateurs de couleurs mis à jour pour passer l'étage : `TeamWeekView`, `TeamDayView`/`HourlyGrid`, `ScheduleEditor`, `EmployeeManager`, `TeamAndAccounts`, `ShareLinks`, `EmployeeMobileView`, `conges/MonthGrid`, `conges/QuarterView`, `DayRoleEditor`.
6. Traductions FR/NL dans `i18n.tsx` (libellés réglage, étage, légendes).
7. Bump `src/lib/version.ts` en v5.11 + entrée en haut de `CHANGELOG.md`.
