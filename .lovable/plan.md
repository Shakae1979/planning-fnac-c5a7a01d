# Changement de métier en cours de journée

Aujourd'hui, un collaborateur multi-métiers ne peut porter qu'un seul métier par jour. Objectif : pouvoir dire « 09h00–11h00 en Caisse, puis 11h00–17h00 en Technique » et voir cette répartition partout.

## Où on encode

Dans **Planning semaine (encodage)**, dans la case du jour. La pastille actuelle « métier du jour » devient un petit panneau :

```text
Métier du jour — Sofie (09h00–17h00)
  [09h00] → [11h00]   Caisse        [x]
  [11h00] → [17h00]   Technique     [x]
  + Ajouter une plage
```

- Par défaut : aucune plage = le métier principal s'applique toute la journée (comportement actuel inchangé).
- Une seule plage sans découpage = équivalent au « métier du jour » actuel.
- Les heures proposées sont bornées par l'horaire encodé du jour, par pas de 30 minutes.
- Contrôles : pas de chevauchement, pas de plage hors du shift ; un « trou » entre deux plages retombe sur le métier principal.
- Visible seulement pour les collaborateurs ayant des métiers secondaires, et jamais sur un jour férié / absence.

## Ce que ça change dans les vues

- **Planning semaine (Gantt)** : la barre du jour est découpée en segments de couleur, avec l'abréviation du métier quand la place le permet ; l'infobulle liste les plages.
- **Équipe du jour** : le collaborateur apparaît dans chaque département où il travaille ce jour-là, avec la plage concernée à côté de son nom.
- **Grille horaire (demi-heures)** : les demi-heures sont pré-colorées selon les plages ; la peinture manuelle reste possible et prime sur la répartition.
- **Impression** : les segments sortent avec leurs couleurs.

## Compteurs

Les heures nettes de la journée sont réparties au prorata des plages :

- **Heures par département** et **filtres par métier** comptent chaque plage sur son métier.
- **ETP** : la répartition suit les mêmes plages ; le total par collaborateur reste identique (aucune heure créée ni perdue), le plafond « cadre » continue de s'appliquer avant répartition.
- La déduction de pause (heure de table ou règle 1h ≥ 6h) est appliquée d'abord sur le total du jour, puis répartie proportionnellement.

## Détails techniques

- Table `employee_day_roles` étendue : ajout de `start_time` / `end_time` (nullable = journée entière) et passage de la contrainte d'unicité à `(employee_id, date, start_time)`, pour autoriser plusieurs lignes par jour. Migration de compatibilité : les lignes existantes gardent `start_time`/`end_time` à NULL et continuent de fonctionner.
- Nouveau helper `src/lib/day-roles.ts` : normalisation des plages (tri, validation, comblement des trous par le métier principal) et fonction de répartition des heures nettes par métier, réutilisée par les vues et les compteurs.
- `ScheduleEditor.tsx` : le popover devient un éditeur de plages (ajout/suppression, sélecteurs 30 min) ; écriture en lot (delete + insert) sur la journée.
- `TeamWeekView.tsx` : la barre du jour est rendue en plusieurs sous-blocs positionnés en pourcentage plutôt qu'un bloc unique.
- `TeamDayView.tsx` : le regroupement par métier utilise les segments (un collaborateur peut apparaître dans plusieurs groupes) ; les alertes de couverture tiennent compte des plages réelles.
- `HourlyGrid.tsx` : pré-coloration dérivée des segments, sans écriture en base ; les `schedule_role_overrides` existants restent prioritaires.
- `HoursCounter.tsx` et `overview/OverviewInsights.tsx` : consommation de la répartition par métier pour les totaux, filtres et ETP.
- Traductions FR/NL des nouveaux libellés, bump `src/lib/version.ts` en v5.02 et entrée CHANGELOG.
