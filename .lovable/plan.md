## Objectif

L'heure de table est aujourd'hui saisie dans l'éditeur hebdo (et déduite correctement des heures nettes), mais elle **n'est pas visible** sur :
- la **vue Semaine (Gantt)** : la pause n'apparaît pas dans la barre
- la **vue Jour (Équipe du jour + grille horaire)** : la pause n'est pas marquée et le calcul net utilise encore la règle auto

On la rend visible et cohérente partout, pour les magasins ayant `has_lunch_break = true`.

## 1. Vue Jour — `src/pages/TeamDayView.tsx`

- Récupérer `breakStart` / `breakEnd` du jour depuis `weekly_schedules` (mêmes champs `<jour>_break_start/end`).
- Remplacer le calcul net manuel (lignes 121-124) par `computeNetHours(schedule)` pour appliquer la même règle que partout (pause saisie = remplace la déduction auto).
- Étendre l'objet retourné avec `breakStart`, `breakEnd`.
- Sous le shift de chaque employé (carte + ligne `formatTimeBE(start)–formatTimeBE(end)`), afficher une seconde ligne discrète : `Pause 12h00–13h00` si pause saisie.

## 2. Grille horaire — `src/components/team-day/HourlyGrid.tsx`

- Étendre l'interface `Employee` avec `breakStart?: string | null`, `breakEnd?: string | null`.
- Au chargement (effect existant qui charge `schedule_role_overrides`), **pré-remplir** les overrides des demi-créneaux compris dans `[breakStart, breakEnd[` avec le rôle `heure_de_table`, **uniquement si** aucun override n'est déjà enregistré pour ce slot (les ajustements manuels restent prioritaires).
- Les overrides restent modifiables comme aujourd'hui (un clic peut changer le rôle d'un slot pré-marqué).
- À la sauvegarde : pas de changement, la logique actuelle écrit les overrides finaux.

## 3. Vue Semaine Gantt — `src/pages/TeamWeekView.tsx`

- Lire `<day>_break_start` / `<day>_break_end` à côté de `start` / `end` (vers ligne 251).
- Dans la barre du shift (entre `clampStart` / `clampEnd`), rendre un **sous-segment de pause** :
  - position : pause clampée à la barre, calcul `left/width` en %
  - style : bande rayée gris clair semi-transparente (cohérent avec « H. table » de la grille), ou simple bande blanche/translucide
- Étendre le `title` (tooltip) avec `\nPause 12h00–13h00` si présente.
- Si la pause sort de la plage `[scheduleStart, scheduleEnd]`, on la clampe (jamais d'overflow).

## 4. Impression

- Vue jour : la ligne `Pause 12h00–13h00` apparaît naturellement à l'impression (pas de `no-print`).
- Vue semaine : le sous-segment de pause garde le même rendu en impression (couleur compatible).

## Hors scope

- Pas de modification du calcul `computeNetHours` (déjà correct).
- Pas de pause multiple par jour.
- Pas de changement sur les magasins sans `has_lunch_break` (UI inchangée).
- Pas de changement sur les statuts spéciaux (EXT, ROULEMENT, congés, repos).

## Détails techniques

- `TeamDayView` : déjà importe `BREAK_HOURS` et `timeToHours` ; remplacer par import de `computeNetHours` depuis `@/lib/hours` et construire un objet `schedule`-like avec les 4 champs du jour (`${day}_start/end/break_start/break_end`) pour réutiliser la même formule.
- `HourlyGrid` : helper local `slotInBreak(hour, minute, bs, be)` → renvoie `true` si `hour + minute/60 ∈ [bs, be)`. Appliqué uniquement quand `bs && be` et pas d'override existant sur la clé `${empId}-${hour}-${minute}`.
- `TeamWeekView` : calcul du sous-segment :
  ```text
  bStart = max(timeToMinutes(breakStart), clampStart)
  bEnd   = min(timeToMinutes(breakEnd),   clampEnd)
  if bEnd > bStart: render <div absolute> avec left/width relatifs à la barre
  ```
- Aucune migration SQL, aucun nouveau champ DB. Pas de changement i18n nécessaire (clé `schedule.break` existe déjà). Si besoin d'un libellé "Pause" dans la vue jour, on réutilise `t("schedule.break")`.
