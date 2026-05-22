# Plan — Améliorations Compteur d'heures

Deux ajouts au composant `HoursCounter`, sans toucher à la logique métier (`computeNetHours` reste inchangé).

## 1. Barre de filtres, tri et recherche

Au-dessus du tableau, une ligne d'outils :

- **Recherche** : input texte qui filtre les lignes par nom (insensible casse/accents).
- **Filtre département** : sélecteur multi-choix (Popover + checkboxes) avec les 6 catégories de `ROLE_ORDER` (Responsables, Technique, Éditorial, Stock, Caisse, Stagiaires). Badge avec compteur quand un filtre est actif. Bouton « Réinitialiser ».
- **Tri** : en-têtes de colonnes cliquables (Collaborateur, Contrat, Écart sem., Écart mois) avec icône ↑/↓. Tri par défaut : ordre hiérarchique actuel (préservé). Cliquer sur "Écart sem." ou "Écart mois" trie du plus déficitaire au plus excédentaire (ou inverse).

La ligne TOTAL du `tfoot` recalcule à partir des lignes visibles après filtrage (le total reflète ce que l'utilisateur voit).

## 2. Colonne « Tendance 4 semaines »

Nouvelle colonne entre « Écart sem. » et la séparation mois, intitulée « Tendance 4 sem. ».

- Pour chaque collaborateur, on calcule les heures prestées des 4 dernières semaines glissantes (semaine courante incluse).
- Affichage : **mini-sparkline SVG inline** (~80×24px) montrant l'évolution + petite flèche colorée (↗ vert / → gris / ↘ rouge) indiquant la tendance globale (régression linéaire simple sur 4 points).
- Tooltip natif (`title`) au survol listant les 4 valeurs : ex. `S46: 34h · S47: 36h · S48: 38h · S49: 35h`.

### Récupération des données

Étendre `weekStarts` pour inclure aussi les 3 semaines précédant `currentMonday` (en plus du mois en cours). La requête `weekly_schedules` existante les récupère en une seule passe. Aucun nouvel appel réseau.

### Composant sparkline

Petit composant local `<TrendSparkline values={number[]} />` (SVG path, pas de dépendance). Pas de lib externe.

## Fichiers touchés

- `src/components/dashboard/HoursCounter.tsx` — ajout barre d'outils, état tri/filtres/recherche, calcul tendance, nouvelle colonne, sparkline inline, totals recalculés sur les lignes visibles.
- `src/lib/i18n.tsx` — nouvelles clés FR/NL : `hours.search`, `hours.searchPlaceholder`, `hours.filterDept`, `hours.allDepts`, `hours.reset`, `hours.trend4w`, `hours.sortAsc`, `hours.sortDesc`.

## Hors-scope (non touché)

- `computeNetHours` et `EmployeeHoursDetailDialog` : aucun changement.
- Pas de modification de base de données.
- Pas de changement à la mémoire projet (règle de calcul inchangée).
