# Règle de pause : passer de « ≥ 6h » à « > 6h » partout

Nouvelle règle : la pause d'1h automatique n'est déduite que si le service dure **strictement plus de 6h** (un shift de 6h00 pile ne déduit plus de pause). Confirmé : texte **et** calcul, partout.

## Modifications

### 1. Calculs (le cœur du changement)
- `src/lib/hours.ts` : `computeNetHours` → `dayGross > 6` (au lieu de `>= 6`) + commentaire de règle mis à jour.
- `supabase/functions/assistant/planning.ts` : même changement (`computeNetHours` et `dayHours`) + commentaire.
- Base de données : migration qui recrée `public.calc_week_net_hours` avec `ELSIF day_gross > 6` (les fonctions d'export hebdo/mensuel s'appuient dessus, rien d'autre à changer).

### 2. Textes affichés
- `src/lib/i18n.tsx` : `schedule.breakNote` et `teamWeek.breakNote` → « (> 6h) » / « (> 6u) » en FR/NL.
- `src/components/HelpFAQ.tsx` : réponse sur la pause → « uniquement si le service dure **plus de 6h** ».

### 3. Suivi
- Bump version (`src/lib/version.ts` → v5.23) + entrée en haut de `CHANGELOG.md` (FR, date du jour).
- Mise à jour de la mémoire projet : la règle « 1h de pause si ≥ 6h » devient « > 6h ».

## Détails techniques
- La migration est un simple `CREATE OR REPLACE FUNCTION public.calc_week_net_hours(_schedule jsonb)` avec le corps identique sauf `ELSIF day_gross > 6 THEN` — aucune coupure de service, signature inchangée.
- Conséquence visible : une journée encodée exactement 6h00 (ex. 09h00–15h00) comptera 6h00 net au lieu de 5h00, sauf si une heure de table manuelle est encodée (dans ce cas c'est la pause encodée qui prime, inchangé).
