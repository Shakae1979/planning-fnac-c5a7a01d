# Collaborateurs multi-métiers : rôle du jour visible dans le planning hebdomadaire

## Objectif

Certains vendeurs exercent plusieurs métiers (ex. Caisse le lundi, Stock le mardi). Aujourd'hui un collaborateur n'a qu'un seul département fixe (fiche collaborateur), et le seul changement possible est par demi-heure dans la grille « Équipe du jour ». On ajoute un **rôle du jour** : encodé une fois par jour, affiché de façon discrète dans le planning hebdomadaire.

## Principe retenu (léger, non intrusif)

1. Sur la fiche collaborateur : cocher un ou plusieurs **métiers secondaires** (parmi les 6 départements existants). Sans métier secondaire, rien ne change — aucun élément supplémentaire à l'écran.
2. Dans l'encodage du planning (Planning, écran de saisie) : pour un collaborateur multi-métiers uniquement, une **petite pastille de couleur cliquable** apparaît dans le coin de chaque case-jour. Un clic ouvre un mini-menu (métier principal + secondaires) pour choisir le métier de ce jour-là.
3. Dans **Planning semaine** (vue Gantt) : la barre de la journée prend la **couleur du métier du jour** au lieu de la couleur du département principal, avec l'abréviation du métier (ex. « CAI », « STO ») en petit si la barre est assez large. Le collaborateur reste rangé sous son département principal — la lecture de la page ne change pas.
4. Dans **Équipe du jour** : la ligne du collaborateur utilise le métier du jour comme couleur de base ; les affectations par demi-heure existantes continuent de primer.
5. Le métier du jour est ignoré pour les congés, fériés, roulement et extérieur (aucune pastille affichée).

## Ce que voit l'utilisateur

- Aucun encombrement pour les collaborateurs mono-métier : zéro pixel en plus.
- Pour les autres : une pastille discrète à l'encodage, une couleur/abréviation dans la vue semaine.
- Légende inchangée (mêmes couleurs de départements).

## Détails techniques

**Base de données** (une migration)
- `employees.secondary_roles text[] not null default '{}'` — métiers secondaires déclarés.
- Nouvelle table `employee_day_roles` : `id`, `employee_id` (FK employees), `date date`, `role text`, `created_at`, contrainte unique `(employee_id, date)`.
- GRANT `select` à `anon` + `authenticated`, `insert/update/delete` à `authenticated`, `all` à `service_role`, RLS activée avec les mêmes règles que `employee_day_flags` (lecture publique, écriture authentifiée).

**Frontend**
- `src/components/dashboard/EmployeeSheet.tsx` : bloc « Métiers secondaires » (cases à cocher) sous le département, visible pour admin/manager/éditeur.
- `src/components/dashboard/ScheduleEditor.tsx` : chargement des `employee_day_roles` de la semaine ; pastille + Popover de choix dans chaque case-jour des collaborateurs ayant des `secondary_roles` ; enregistrement en upsert avec la sauvegarde existante.
- `src/pages/TeamWeekView.tsx` : requête des rôles du jour de la semaine, couleur de barre et abréviation dérivées de `getRoleColors(roleDuJour ?? emp.role)`.
- `src/pages/TeamDayView.tsx` + `src/components/team-day/HourlyGrid.tsx` : couleur de ligne basée sur le rôle du jour, priorité conservée aux `schedule_role_overrides` par créneau.
- `src/lib/i18n.tsx` : clés FR/NL (`employee.secondaryRoles`, `schedule.dayRole`, aide associée).
- Version bumpée dans `src/lib/version.ts` (v5.01) + entrée en tête de `CHANGELOG.md`.
