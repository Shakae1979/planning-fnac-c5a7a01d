# Assistant IA — réduire la consommation de crédits

## Décision retenue

On garde l'assistant sur Lovable AI (pas de clé externe à gérer, pas de facture séparée), mais on réduit nettement ce qu'il consomme. Aujourd'hui une question coûte ~0,01 à 0,05 crédit ; l'objectif est de diviser ça par 2 à 4 et de rendre le coût prévisible.

## Ce que je change

1. **Historique de conversation raccourci**
   Actuellement les 40 derniers messages sont renvoyés au modèle à chaque question. On passe aux 8 derniers échanges. C'est la source d'économie la plus directe : les questions de fin de conversation ne coûtent plus 5x celles du début.

2. **Données outils plus compactes**
   Les outils renvoient aujourd'hui la semaine entière avec tous les champs. On resserre :
   - planning semaine : uniquement les jours réellement travaillés, horaires en format court
   - couverture jour : uniquement les heures avec un trou, pas les 11 heures d'ouverture
   - heures/ETP : totaux + écarts, sans les lignes à zéro écart
   Moins de tokens en entrée à chaque appel d'outil, sans perte d'information utile.

3. **Quota quotidien par utilisateur**
   30 questions par jour et par personne. Au-delà, message clair en FR/NL invitant à réessayer le lendemain. Ça borne le pire cas : même en cas d'usage intensif ou de mauvaise manipulation, la dépense reste plafonnée.

4. **Compteur visible pour les admins**
   Petite ligne dans le panneau de l'assistant indiquant le nombre de questions posées aujourd'hui, visible uniquement pour les admins, afin de suivre l'usage réel.

## Détails techniques

- `supabase/functions/assistant/index.ts` : troncature des `messages` aux 8 derniers, sorties d'outils allégées, vérification du quota avant l'appel modèle.
- Nouvelle table `assistant_usage` (user_id, date, count) avec RLS : lecture de sa propre ligne, incrément côté fonction. GRANT pour `authenticated` et `service_role`.
- `src/components/AssistantChat.tsx` : historique local plafonné à 8 échanges, message de quota atteint, compteur admin.
- `src/lib/i18n.tsx` : clés FR/NL pour le quota et le compteur.
- Version portée à v4.88 dans `src/lib/version.ts` + entrée `CHANGELOG.md`.

## Ce que ça ne change pas

La qualité des réponses sur une question donnée reste identique : mêmes outils, mêmes règles métier, mêmes données. Seul l'effet « la conversation devient chère au fil des messages » disparaît.

## Si tu préfères zéro crédit Lovable

Dis-le et je bascule l'assistant sur une clé API OpenAI que tu fournis : la consommation part alors sur ton compte OpenAI au lieu des crédits de l'espace de travail.
