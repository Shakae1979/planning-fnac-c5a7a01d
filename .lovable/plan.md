## Objectif

Revenir à un calcul simple : seules les heures **réellement prestées** comptent. Les absences (congés, maladie, fériés) ne génèrent plus aucune heure créditée. L'écart se calcule directement contre le contrat.

## Changements

### 1. `src/lib/hours.ts`
- Simplifier `computeNetHours` pour retourner uniquement `{ worked, net }` (alias).
- Supprimer les champs `credited`, `missingFerieCredits` et toute la logique de forfait `contrat / jours_semaine`.
- Garder la règle pause 1h si shift ≥ 6h, et statuts spéciaux (Roulement / Extérieur = 0h).

### 2. `src/components/dashboard/HoursCounter.tsx`
- Supprimer les colonnes **Crédité** et **Total**.
- Garder uniquement : Collaborateur, Contrat, Presté (semaine), Écart semaine, Presté (mois), Écart mois.
- Supprimer la section **"Fériés à saisir"** et toute la UI liée à la saisie manuelle de crédits.
- Mettre à jour l'export CSV en conséquence.
- Retirer les requêtes vers `ferie_credits`.

### 3. `src/pages/EmployeeView.tsx`
- Retirer toute référence à `credited` / `missingFerieCredits` si présente.

### 4. `src/lib/i18n.tsx`
- Supprimer les clés FR/NL liées à : `credited`, `total`, `ferieCreditsToFill`, etc.

### 5. Base de données
- Créer une migration qui **DROP** la table `public.ferie_credits` (devenue inutile).

### 6. Mémoire projet
- Mettre à jour `mem://features/planning/calcul-heures-nettes` pour acter que les absences ne génèrent aucune heure et que l'écart se calcule strictement sur le presté vs contrat.

## Résultat attendu

| Colonne | Valeur |
|---|---|
| Presté | Heures réellement travaillées (net) |
| Écart | Presté − Contrat |

Un Total ne peut donc plus dépasser le contrat puisque la notion même de Total disparaît. Affichage clair et sans ambiguïté.
