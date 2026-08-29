# Pause automatique : passer de 1h à 30 min au-delà de 6h

## Problème
Avec la règle actuelle (« 1h de pause si > 6h »), une journée de 7h00 compte 6h00 net — autant qu'une journée de 6h00 pile. L'heure supplémentaire est entièrement absorbée par la pause.

## Nouvelle règle
- Journée ≤ 6h00 : aucune pause déduite.
- Journée > 6h00 : **30 min** de pause déduites.
  - 7h00 → 6h30 net, 8h00 → 7h30 net, etc.
- L'heure de table encodée manuellement (option par magasin) reste prioritaire et inchangée.
- `EXT` et `ROULEMENT` comptent toujours 0h.

## Modifications

### 1. Calculs (partout la même règle)
- `src/lib/hours.ts` (`computeNetHours`) : `breakMinutes += 30` au lieu de 60 quand `dayGross > 6`.
- `supabase/functions/assistant/planning.ts` (`computeNetHours` + `dayHours`) : `br = 0.5` au lieu de 1.
- `src/components/dashboard/ScheduleEditor.tsx` : les deux blocs de calcul internes (totaux + alerte sous-contrat) passent de 60 à 30 min.
- Base de données : migration `CREATE OR REPLACE FUNCTION public.calc_week_net_hours` avec 30 min (utilisée par l'export d'heures hebdo/mensuel).
- Redéploiement de la fonction `assistant`.

### 2. Textes affichés
- `src/lib/i18n.tsx` : notes « pause » FR/NL → « 30 min de pause déduites si > 6h » / « 30 min pauze indien > 6u ».
- `src/components/HelpFAQ.tsx` : mise à jour de la réponse correspondante.

### 3. Suivi
- Bump `src/lib/version.ts` → v5.25 + entrée en haut de `CHANGELOG.md` (FR, date du jour).
- Mise à jour de la mémoire projet (règle de pause).

## Détails techniques
- Aucun changement de données stockées ; seuls les totaux calculés changent.
- Conséquence visible : les totaux hebdo des journées > 6h augmentent de 30 min par jour concerné ; l'alerte rouge « sous contrat » peut disparaître sur certains collaborateurs.
- L'export externe (`hours-export`) suit automatiquement via la fonction SQL migrée.
