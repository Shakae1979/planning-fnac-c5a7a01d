## Objectif

Permettre aux **cadres** (responsables sans horaire précis qui dépassent souvent 36 h/sem) d'être **plafonnés à leurs heures de contrat** dans le calcul ETP, tout en conservant l'**affichage des heures réellement prestées** partout ailleurs.

## Comportement

- **Fiche employé** (`EmployeeSheet`) : nouvelle case à cocher **« Cadre (plafonner pour le calcul ETP) »**.
- **Calcul ETP** (`OverviewInsights`, carte ETP) :
  - Pour chaque employé `is_cadre = true` : `plannedForEtp = min(plannedRéel, contract_hours)`.
  - Pour les autres : `plannedForEtp = plannedRéel` (inchangé).
  - `etpPlanned = Σ plannedForEtp / 36`.
- **Affichage carte ETP** : ajouter une petite mention sous le chiffre planifié → `"dont X cadre(s) plafonné(s)"` quand au moins un cadre est plafonné, pour expliquer la différence éventuelle avec les heures totales du dashboard.
- **Partout ailleurs** (ScheduleEditor, TeamDayView, dashboard « Heures planifiées », exports, impression) : **aucun changement** — les heures réelles prestées restent affichées telles quelles.
- **Visuel fiche employé** : petit badge `Cadre` à côté du nom dans le `ScheduleEditor` et dans le tableau employés (`TeamAndAccounts`), pour identifier en un coup d'œil.

## Détails techniques

### 1. Base de données

Migration ajoutant un flag booléen sur `employees` :

```sql
ALTER TABLE public.employees
  ADD COLUMN is_cadre boolean NOT NULL DEFAULT false;
```

Pas de nouvelle policy — les UPDATE existantes couvrent la colonne. Pas de backfill (toutes les valeurs à `false`, l'utilisateur coche les cadres concernés).

### 2. UI fiche employé

Dans `EmployeeSheet.tsx`, sous le champ `contract_hours`, ajouter un `<Switch>` ou `<Checkbox>` avec label i18n :
- FR : « Cadre — plafonner les heures planifiées aux heures de contrat dans le calcul ETP »
- NL : « Kaderlid — geplande uren begrenzen tot contracturen voor FTE-berekening »

### 3. Calcul ETP

Dans `OverviewInsights.tsx`, modifier la dérivation `totalPlanned` **uniquement pour la carte ETP** (ne pas toucher au `totalPlanned` global utilisé par la carte « Occupation ») :

```ts
const totalPlannedForEtp = employees.reduce((sum, e) => {
  const planned = plannedByEmp.get(e.id) ?? 0;
  return sum + (e.is_cadre ? Math.min(planned, Number(e.contract_hours || 0)) : planned);
}, 0);
const cappedCount = employees.filter(e => e.is_cadre && (plannedByEmp.get(e.id) ?? 0) > Number(e.contract_hours || 0)).length;
```

Puis `etpPlanned = totalPlannedForEtp / FTE_BASE` et ajout d'un sous-titre `"dont N cadre(s) plafonné(s)"` quand `cappedCount > 0`.

La carte « Occupation » et le dashboard `Heures planifiées` continuent d'utiliser les heures réelles.

### 4. Badges visuels

Petit badge `Cadre` (variant `outline`, classe `text-xs`) à côté du nom :
- `ScheduleEditor` (colonne employé)
- `TeamAndAccounts` (ligne employé)

### 5. Fichiers touchés

```text
supabase/migrations/<new>.sql                         # ALTER TABLE employees ADD is_cadre
src/integrations/supabase/types.ts                    # régénéré
src/components/dashboard/EmployeeSheet.tsx            # toggle is_cadre + i18n
src/components/dashboard/overview/OverviewInsights.tsx # calcul ETP plafonné + sous-titre
src/components/dashboard/ScheduleEditor.tsx           # badge Cadre
src/components/dashboard/TeamAndAccounts.tsx          # badge Cadre
src/hooks/useStoreEmployees.tsx                       # exposer is_cadre dans le select
src/lib/i18n.tsx                                       # nouvelles clés FR/NL
src/lib/version.ts                                     # bump v4.71
CHANGELOG.md                                           # entrée v4.71 — 20/06/2026
```

### 6. i18n (FR / NL)

- `employee.isCadre.label`
- `employee.isCadre.help`
- `employee.cadreBadge`
- `insights.etpCappedNote`

## Hors scope

- Pas de plafonnement automatique par rôle (le flag est manuel et indépendant du rôle « Responsables »).
- Pas de modification du calcul d'occupation ni des heures affichées dans le planning/exports.
- Pas d'historique des changements du flag.
- Pas de plafond personnalisé par employé (toujours `contract_hours`).
