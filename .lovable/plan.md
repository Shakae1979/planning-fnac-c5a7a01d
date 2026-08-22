# Semaine type : inclure le multi-métiers

Aujourd'hui, « Enregistrer la semaine type » ne sauvegarde que les horaires (`weekly_schedules`). Les plages de métier du jour (pastille multi-métiers) ne sont ni mémorisées ni restituées quand on applique la semaine type.

## Ce que ça change

- **Enregistrer la semaine type (A ou B)** : les plages de métier encodées sur les 7 jours de la semaine affichée sont mémorisées avec le modèle.
- **Appliquer la semaine type** : en plus des horaires, les plages de métier sont réappliquées sur les jours correspondants de la semaine cible (les plages existantes de ces jours sont remplacées).
- Si le magasin n'a pas l'option « Multi-métiers » activée, rien ne change : aucune plage n'est enregistrée ni appliquée.
- Les plages hors du shift restitué sont ignorées à l'affichage (comportement existant : les trous retombent sur le métier principal).

## Détails techniques

- Les modèles sont déjà stockés sur les semaines fictives `1970-01-05` (A) et `1970-01-12` (B). On réutilise ces dates : les plages sont stockées dans `employee_day_roles` aux dates `1970-01-05..11` (A) et `1970-01-12..18` (B), indexées par offset de jour (0 = lundi).
- `saveAsTemplateMutation` (`ScheduleEditor.tsx`) : après l'écriture des horaires, si `currentStore.has_multi_roles`, supprimer les `employee_day_roles` des 7 dates modèles puis insérer une copie des lignes de la semaine courante avec la date décalée sur la date modèle correspondante.
- `initAllMutation` (application du modèle) : lire les `employee_day_roles` des 7 dates modèles, supprimer celles des 7 dates de la semaine cible pour les collaborateurs concernés, puis insérer les lignes avec la date de la semaine cible. Conditionné à `has_multi_roles`.
- Invalider la query `["employee-day-roles", weekStr]` après application pour rafraîchir les pastilles.
- Bump `src/lib/version.ts` en v5.06 + entrée en tête de `CHANGELOG.md`.
