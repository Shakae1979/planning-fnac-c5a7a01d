# Afficher le dimanche dans la vue Planning semaine

## Problème
Dans `/planning-equipe` (`src/pages/TeamWeekView.tsx`), le tableau est figé sur 6 jours (`DAY_KEYS = ["lundi", … "samedi"]`). Les magasins qui font travailler du personnel le dimanche n'ont aucun moyen de visualiser ces shifts dans cette vue, alors qu'ils sont bien stockés (`dimanche_start` / `dimanche_end` existent en base) et affichés correctement dans l'éditeur, l'Équipe du jour et la fiche employé.

## Comportement cible
- Le dimanche reste masqué par défaut pour ne pas alourdir la grille des magasins fermés ce jour-là.
- Une colonne **Dimanche** est ajoutée automatiquement à la grille de la semaine affichée dès qu'au moins un collaborateur a un horaire saisi (`dimanche_start` ou `dimanche_end` non vide, y compris statuts spéciaux `EXT` / `ROULEMENT` / `REPOS` ou un commentaire `day_comments` du jour) sur la semaine visible.
- Aucune nouvelle option ni paramètre magasin : détection purement dérivée des données déjà chargées.
- Les autres vues ne sont pas modifiées.

## Changements
**`src/pages/TeamWeekView.tsx`**
- Remplacer la constante `DAY_KEYS` par `ALL_DAY_KEYS` (7 jours) et dériver dans le composant une variable `dayKeys` calculée via `useMemo` à partir des `schedules` et `dayComments` de la semaine : on inclut `dimanche` ssi au moins un `schedule[dimanche_start|end]` est renseigné ou un `day_comments.day_key === "dimanche"` existe.
- Utiliser ce `dayKeys` partout où `DAY_KEYS` est utilisé (en-tête, `colSpan`, boucles de rendu, calculs de totaux).
- Conserver les libellés via `t("day.long.dimanche")` (déjà traduit FR/NL).

## Hors scope
- Pas de changement des autres vues, de la base, ni des paramètres magasin.
- Pas d'option utilisateur pour forcer l'affichage : la règle est automatique.
