## Compteur d'heures (responsables)

Nouvelle page dédiée affichant, par collaborateur du magasin courant, les heures **nettes planifiées** vs les **heures contractuelles**, sur la semaine en cours **et** le cumul du mois en cours. Réservée aux rôles admin et éditeur.

### Accès et navigation

- Ajouter une entrée sidebar **« Compteur d'heures »** (icône `Clock`), visible uniquement pour `admin` et `editor`. Le rôle `user` ne la voit pas.
- Nouvelle vue interne `"hours"` ajoutée à `Sidebar.tsx` (linkDefs) et au switch de `Index.tsx`.
- Pas de nouvelle route publique : page intégrée au dashboard comme les autres vues.

### Contenu de la page

Tableau unique (un collaborateur par ligne, triés par hiérarchie de rôle comme dans le planning équipe) :

| Collaborateur | Rôle | Contrat | Sem. planifiée | Écart sem. | Mois planifié | Contrat mois* | Écart mois |
|---|---|---|---|---|---|---|---|

\* Contrat mois = `contract_hours × nombre de semaines ISO commençant dans le mois affiché` (approche simple, alignée sur la planification hebdo Belge).

- Colonnes **Écart** colorées : vert (±1h), orange (>1h sous-contrat ou sur-contrat), rouge (>4h).
- Ligne **TOTAL** en bas (somme équipe).
- En haut : `WeekNavigator` existant pour changer de semaine de référence, + un libellé du mois courant déduit du lundi de la semaine. Bouton **Imprimer** + **Export CSV**.

### Calcul

- Réutilisation **stricte** de la fonction `computeNetHours` déjà utilisée dans `EmployeeView.tsx` (extraction dans `src/lib/hours.ts` pour partage propre). Règles inchangées : pause 1h déduite si shift ≥ 6h ; `Roulement`/`Extérieur` = 0h ; congés et fériés créditent les heures du template si présent.
- Semaine = lundi → dimanche affichés par le navigateur.
- Mois = mois calendaire contenant ce lundi. On itère sur toutes les semaines ISO dont le lundi tombe dans ce mois, on charge les `weekly_schedules`, `conges`, `day_comments` et le template du magasin, puis on somme.

### Données

- Aucune migration. Lectures uniquement sur `weekly_schedules`, `employees`, `conges`, `day_comments`, et template (`weekly_schedules` aux dates `1970-01-05`/`1970-01-12` pour A/B si applicable, sinon template standard déjà utilisé).
- Tout passe par le `store_id` courant via `useStoreEmployees`.

### Détails techniques

- Nouveau fichier `src/lib/hours.ts` exportant `computeNetHours` (déplacée depuis `EmployeeView.tsx`, l'import est mis à jour côté EmployeeView).
- Nouveau composant `src/components/dashboard/HoursCounter.tsx`.
- `Sidebar.tsx` : ajout du link `{ id: "hours", labelKey: "nav.hours", icon: Clock }` ; `filteredLinks` autorise `admin` + `editor` (déjà le cas pour la plupart des liens, `stores` reste admin-only).
- `Index.tsx` : ajout du case `"hours"` qui rend `<HoursCounter />`.
- `src/lib/i18n.tsx` : clés `nav.hours`, `hours.title`, `hours.weekPlanned`, `hours.monthPlanned`, `hours.contract`, `hours.gap`, `hours.total`, `hours.export` (FR + NL).
- Chargement des données via `react-query` : une query par employé serait coûteuse → une seule query `weekly_schedules` filtrée sur `employee_id IN (...)` et `week_start IN (...)`, puis agrégation côté client.
- Export CSV : génération inline (pas de lib), encodage UTF-8 BOM pour Excel.

### Hors scope

- Pas de colonne ajoutée dans le planning équipe (option écartée).
- Pas de widget dashboard.
- Pas de période trimestre/année.
- Pas d'historique ni de stockage du compteur (recalculé à chaque ouverture).

### Étapes

1. Extraire `computeNetHours` dans `src/lib/hours.ts` ; mettre à jour l'import dans `EmployeeView.tsx`.
2. Créer `HoursCounter.tsx` (tableau, calculs semaine + mois, navigateur, export, impression).
3. Brancher dans `Sidebar.tsx` (entrée admin/editor) et `Index.tsx`.
4. Ajouter les clés i18n FR/NL.
5. Vérifier visuellement sur le magasin courant.
