## Problème

Dans la grille horaire du jour (`src/components/team-day/HourlyGrid.tsx`), au chargement des données, les créneaux couverts par la pause repas de chaque collaborateur sont **injectés dans l'état `overrides`** avec la valeur `"heure_de_table"`. Conséquences :

1. Ces entrées sont sauvegardées en base comme de vrais overrides dans `schedule_role_overrides`.
2. À chaque rechargement (changement de date, refetch employés), les modifications manuelles non sauvegardées sont remplacées par la pause auto.
3. Visuellement, l'utilisateur ne distingue pas une H. table « auto » (issue de la pause) d'une H. table « manuelle ».

## Objectif

L'heure de table doit être **un simple voile visuel** sur la grille du jour, dérivé en temps réel des champs `breakStart` / `breakEnd` de chaque collaborateur, sans interférer avec la sélection ni la sauvegarde des overrides manuels.

## Changements (frontend uniquement, `HourlyGrid.tsx`)

1. **Retirer l'injection auto dans `overrides`** dans le `useEffect` de chargement : ne plus pré-remplir les slots de pause. `overrides` ne contient à nouveau que les vrais overrides DB (saisies manuelles).

2. **Calculer un set dérivé `lunchSlots`** (via `useMemo` sur `active` + `HALF_HOURS`) qui contient, pour chaque collaborateur, l'ensemble des clés de slots couverts par sa pause (`emp.id-hour-minute`). Aucun stockage d'état.

3. **Résolution du rôle d'une cellule** dans le rendu :
   - Si un override manuel existe pour le slot → utiliser cet override (priorité absolue).
   - Sinon, si le slot est dans `lunchSlots` → afficher visuellement `heure_de_table` (style rayé/transparent).
   - Sinon → rôle de base du collaborateur.

4. **Sélection et application** : aucun changement de logique. Cliquer sur une cellule de pause continue de la sélectionner ; appliquer un rôle écrit un vrai override qui prendra le pas sur le voile visuel. Désélectionner / annuler le rôle revient à l'affichage automatique de la pause.

5. **Sauvegarde** : `handleSave` reste tel quel — comme `overrides` ne contient plus les pauses auto, on n'écrit en base que ce que l'utilisateur a réellement choisi. Plus aucune réécriture parasite.

6. **Bump version** : `src/lib/version.ts` → `v4.52`.

## Hors scope

- Aucune modification du planning semaine, du modèle de données, ni du calcul des heures nettes.
- Aucun changement du `ScheduleEditor` ni des champs `break_start` / `break_end`.
