# Préparer l'application pour 2027

## Le problème

Trois éléments sont figés sur 2026 et cesseront de fonctionner au 1er janvier 2027 :

- **Jours fériés** : la liste est codée en dur avec des dates 2026 uniquement (`getHolidays2026`). En 2027, plus aucun férié ne s'affichera en vert dans les vues congés.
- **Vacances scolaires** : les périodes FR et NL ne couvrent que 2026. Les surlignages disparaîtront.
- **Vue Congés** : l'année est déduite de la date du jour, sans sélecteur. Impossible de consulter 2026 depuis 2027, ni de préparer 2027 depuis 2026.

Le planning hebdomadaire lui-même n'est pas concerné : il fonctionne par semaine ISO et passera 2027 sans intervention.

## Ce que je fais

### 1. Fériés multi-années
Remplacement de la liste figée par un calcul : les fériés belges à date fixe (1/1, 1/5, 21/7, 15/8, 1/11, 11/11, 25/12) plus ceux qui dépendent de Pâques (Pâques, lundi de Pâques, Ascension, Pentecôte), calculés automatiquement pour n'importe quelle année. Plus jamais de maintenance annuelle sur ce point.

Pour 2027 cela donne : 1/1, Pâques 28/03, lundi de Pâques 29/03, 1/5, Ascension 06/05, Pentecôte 17/05, 21/07, 15/08, 1/11, 11/11, 25/12.

### 2. Vacances scolaires 2027
Ajout des périodes 2027 pour les deux communautés (Wallonie-Bruxelles et Vlaanderen), avec la structure actuelle étendue par année. Les calendriers officiels étant publiés à l'avance mais susceptibles d'ajustement, je saisis les dates connues et te les liste dans le changelog pour que tu puisses les vérifier.

Le système reste extensible : ajouter 2028 ne demandera que quelques lignes.

### 3. Sélecteur d'année dans les Congés
Ajout d'une navigation d'année (‹ 2026 › 2027) en haut de la page Congés, à côté du sélecteur mois/trimestre. L'année choisie pilote le chargement des congés, les fériés et les vacances scolaires. Par défaut : l'année en cours. Disponible dans les vues mensuelle, trimestrielle et Direction Fnac.

Cela permet dès maintenant d'encoder les congés 2027 sans attendre janvier.

## Détails techniques

- `src/lib/i18n.tsx` : `getHolidays2026` devient `getHolidays(year, t)` avec algorithme de Pâques (Meeus/Jones/Butcher). Un alias conserve la compatibilité le temps de la migration des appels.
- `src/lib/school-holidays.ts` : les tableaux passent en `Record<number, SchoolHolidayPeriod[]>`, `getSchoolHolidayInfo` sélectionne le bon millésime selon la date.
- `src/components/dashboard/CongesCalendar.tsx` : `year` passe d'une constante à un état, propagé aux requêtes et aux grilles ; la clé React Query inclut l'année.
- `MonthGrid.tsx`, `QuarterView.tsx`, `DirectionMonthGrid.tsx` : appel de `getHolidays(year, t)` au lieu de la version figée.
- Aucun changement de base de données : les congés sont déjà stockés avec des dates complètes.
- Version portée à v4.88 dans `src/lib/version.ts` + entrée `CHANGELOG.md`.
