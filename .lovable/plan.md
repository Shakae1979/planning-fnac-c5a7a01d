## Objectif

Permettre, comme pour les semaines A/B, d'activer **par magasin** la saisie d'une **heure de table** (pause déjeuner) dans l'éditeur de planning hebdomadaire. Quand une pause est saisie, elle **remplace** la déduction automatique d'1h (règle « shift ≥ 6h »).

## 1. Activation par magasin

- Ajouter une option `has_lunch_break` sur la table `stores` (booléen, défaut `false`).
- L'exposer dans **Administration → Magasins** (StoreManager) à côté de la case « Semaines A/B », libellé : « Encodage de l'heure de table ».
- Charger la valeur dans `useStore` (comme `has_ab_weeks`).

## 2. Stockage des pauses

Ajouter, par jour, deux colonnes texte à `weekly_schedules` (même format `HH:MM` que start/end) :

```
lundi_break_start, lundi_break_end,
mardi_break_start, mardi_break_end,
... (7 jours)
```

Nullable. Format identique aux autres champs horaires. Pas de migration de données existantes.

## 3. Saisie dans l'éditeur (ScheduleEditor)

- Si `currentStore.has_lunch_break = true`, afficher sous chaque cellule jour deux mini-champs « pause » (début → fin), même parsing intelligent que les champs existants.
- Si `false`, ne rien afficher (UI identique à aujourd'hui pour les autres magasins).
- Mêmes règles pour la **Semaine type** (et Semaine B si A/B également activé).
- La copie N-1 / application de template propage aussi ces champs.

## 4. Calcul des heures nettes

Modifier `computeNetHours` dans `src/lib/hours.ts` :

```text
Pour chaque jour avec start/end valides :
  gross = end - start
  si break_start ET break_end fournis :
     pause = break_end - break_start  (replace la règle auto)
  sinon :
     pause = 1h si gross >= 6h, sinon 0
  net_jour = gross - pause
```

Statuts `EXT` / `ROULEMENT` inchangés (0h, pas de pause).

## 5. Affichage

- **Vue jour (HourlyGrid)** : si une pause est saisie dans l'horaire de l'employé, marquer automatiquement les demi-créneaux correspondants en « H. table » (au chargement, comme un override par défaut, mais modifiable). Aucun changement pour les magasins sans l'option.
- **Vue semaine Gantt** : afficher un trait/segment plus clair sur le créneau de pause si présent.
- **Impression** : la pause apparaît sous le shift au format `12h00–13h00`.

## 6. i18n

Ajouter clés FR/NL :
- `store.hasLunchBreak` : « Encodage de l'heure de table » / « Invoer van de etenstijd »
- `schedule.breakStart` / `schedule.breakEnd`

## Hors scope

- Pas de pause multiple par jour (une seule plage).
- Pas de pause sur les statuts spéciaux (EXT, ROULEMENT, congés).
- La marque manuelle « H. table » dans la grille du jour reste disponible pour ajustements ponctuels.

## Détails techniques

- Migration : `ALTER TABLE stores ADD COLUMN has_lunch_break boolean NOT NULL DEFAULT false;` + 14 colonnes texte sur `weekly_schedules`.
- Mettre à jour `useStore` (mapping `has_lunch_break`) et l'interface `Store`.
- `computeNetHours` reçoit déjà l'objet `schedule` complet → lecture directe des nouveaux champs, signature inchangée.
- Mémoire à mettre à jour après implémentation : `mem://features/planning/calcul-heures-nettes` (nouvelle règle de pause explicite) et nouveau memo `mem://features/planning/heure-de-table-par-magasin`.
