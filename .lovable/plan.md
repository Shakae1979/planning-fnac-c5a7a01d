# Retrouver le multi-métiers

Le travail fait précédemment (métiers secondaires, changement de métier en cours de journée, couleurs par plage) est bien en place, mais il est désormais conditionné à une bascule « Multi-métiers » dans les paramètres du magasin. Cette bascule est éteinte par défaut, donc la fonctionnalité est invisible tant qu'elle n'est pas activée.

## Ce que je propose

1. Activer la bascule « Multi-métiers » pour les magasins concernés, afin de retrouver immédiatement la fonctionnalité.
2. Rendre le réglage plus lisible dans Paramètres magasin : un court texte d'aide sous la bascule indiquant précisément ce qu'elle débloque (métiers secondaires sur la fiche collaborateur, pastille de métier dans l'encodage du planning, couleurs par plage dans planning semaine et équipe du jour).
3. Ajouter un rappel discret dans l'encodage du planning : quand un collaborateur possède des métiers secondaires mais que l'option est éteinte pour son magasin, afficher une mention renvoyant vers les paramètres magasin.

## Détails techniques

- Bascule : colonne `stores.has_multi_roles`, éditable dans `StoreManager` (admin) et `StoreSelfSettings` (responsable).
- Textes d'aide ajoutés dans `src/lib/i18n.tsx` (FR/NL).
- Mention conditionnelle dans `ScheduleEditor` lorsque `secondary_roles` est non vide et l'option désactivée.
- Bump de version `src/lib/version.ts` en v5.04 + entrée CHANGELOG.

## À confirmer

Dites-moi quels magasins doivent avoir le multi-métiers activé (ou « tous »), je m'en charge dans la foulée.
