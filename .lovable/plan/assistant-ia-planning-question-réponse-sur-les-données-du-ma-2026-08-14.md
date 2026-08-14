# Assistant IA « Planning » — question-réponse sur les données du magasin

## Ce que ça fait

Un assistant conversationnel intégré à l'application, accessible depuis un bouton dans l'en-tête, qui répond en français ou en néerlandais à des questions sur le magasin sélectionné :

- « Qui est en congé la semaine 34 ? »
- « Combien d'heures Sarah est-elle planifiée cette semaine ? »
- « Où sont les trous de couverture jeudi prochain ? »
- « Quel est l'écart ETP du magasin ce mois-ci ? »
- « Qui travaille samedi matin en caisse ? »

L'assistant est **en lecture seule** : il consulte le planning, les congés et l'équipe, mais n'écrit jamais dans la base. Aucune modification de planning ne peut venir de lui.

## Pourquoi celui-là en premier

C'est le plus utile au quotidien et le moins risqué : aucune donnée ne peut être corrompue, l'adoption est immédiate, et il pose les fondations (outils de lecture, sécurité, coûts) pour une future aide au remplissage du planning.

## Périmètre et sécurité

- Accès réservé aux rôles **Admin, Manager et Éditeur**. Les vendeurs n'y ont pas accès dans cette première version.
- L'assistant ne voit que les magasins auxquels l'utilisateur connecté est rattaché — mêmes règles que l'application.
- Historique de conversation conservé uniquement dans le navigateur (pas de stockage en base), effaçable via « Nouvelle conversation ».
- Message d'erreur clair si le quota IA est atteint.

## Ce que je construis

1. **Bouton et panneau de chat** : icône dans l'en-tête, panneau latéral, réponses en streaming, indicateur de réflexion, respect du bilinguisme FR/NL et de la charte (jaune Fnac, ardoise).
2. **Fonction backend `assistant`** : appelle le modèle IA avec un jeu d'outils de lecture, en réutilisant les requêtes déjà écrites pour le serveur MCP.
3. **Outils de lecture disponibles au modèle** :
   - liste des collaborateurs du magasin (rôle, contrat, cadre)
   - planning d'une semaine donnée (horaires, heures de table, fériés, statuts spéciaux)
   - congés sur une période (types, chevauchements)
   - analyse de couverture d'une journée (catégories manquantes)
   - calcul des heures nettes et de l'ETP contractuel vs planifié
4. **Règles métier injectées dans le prompt** : pause 1h déduite uniquement si ≥6h, « Roulement » et « Extérieur » à 0h, plafond ETP pour les cadres, formats belges (DD/MM/YYYY, HHhMM, semaines ISO démarrant le lundi).

## Détails techniques

- Fonction Edge `assistant` (Supabase), modèle par défaut du Lovable AI Gateway, streaming via l'AI SDK.
- Les outils réutilisent les mêmes accès que `src/lib/mcp/tools/*` (`employees`, `weekly_schedules`, `conges`, `stores`) mais exécutés avec le JWT de l'utilisateur, donc les RLS s'appliquent naturellement.
- Réutilisation des helpers existants `computeNetHours` (`src/lib/hours.ts`) et `sortByRoleOrder` (`src/lib/format.ts`) côté fonction pour garantir des chiffres identiques à ceux affichés dans l'app.
- Aucun outil d'écriture n'est exposé.
- Version portée à v4.87 dans `src/lib/version.ts` avec une entrée dans `CHANGELOG.md`.

## Suite possible (non incluse)

Une fois l'usage validé : aide au remplissage du planning (l'IA propose des horaires pour combler les trous, validation manuelle case par case), puis résumé hebdomadaire automatique sur le dashboard.
