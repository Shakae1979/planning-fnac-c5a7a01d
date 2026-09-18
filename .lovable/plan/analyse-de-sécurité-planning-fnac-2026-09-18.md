# Analyse de sécurité — Planning Fnac

## Bilan général

Le socle est sain : toutes les tables de données sensibles (plannings, congés, collaborateurs, rôles, notifications) sont protégées par des règles d'accès actives, les rôles sont stockés dans une table dédiée (pas de risque d'élévation de privilège), et les clés secrètes ne sont jamais exposées côté navigateur. Aucun problème critique n'a été détecté.

Restent des points d'attention de niveau moyen, listés ci-dessous par priorité.

## 1. Bibliothèques externes à mettre à jour (priorité haute)

Le scan de dépendances remonte 24 vulnérabilités connues, dont plusieurs élevées :

| Bibliothèque | Risque | Correctif |
|---|---|---|
| `xlsx` 0.18.5 | Pollution de prototype + déni de service à la lecture d'un fichier Excel | passer en 0.20.2 |
| `react-router-dom` 6.30.1 | Redirections ouvertes (phishing possible via un lien piégé) | passer en 6.30.4+ |
| `@supabase/supabase-js` 2.104.0 | Déni de service via `ws` | monter de version |
| `recharts` 2.15.4 | `lodash` vulnérable (injection de code) | monter de version |
| `@lovable.dev/mcp-js` | 10 avis (SSRF, ReDoS) via dépendances internes | monter de version |

Action : mise à jour des paquets puis vérification que l'export Excel, la navigation, les graphiques et l'assistant fonctionnent toujours.

## 2. Données lisibles sans être connecté (priorité moyenne)

- `stores` : liste des magasins, villes et options, lisible par n'importe qui sur Internet.
- `store_settings` : horaires d'ouverture jour par jour, également lisibles publiquement.

Ce n'est pas une fuite de données personnelles, mais ce sont des informations internes. Proposition : restreindre la lecture aux utilisateurs connectés, en conservant l'accès public uniquement si la page congés publique en a besoin (à vérifier avant modification).

## 3. Rattachement compte ↔ collaborateur par e-mail (priorité moyenne)

La règle `employees_select_own_by_email` donne accès à une fiche collaborateur quand l'e-mail du compte correspond à celui de la fiche. Sans unicité garantie ni e-mail vérifié, un doublon d'e-mail pourrait donner accès à la fiche d'un autre.

Action : ajouter une contrainte d'unicité sur l'e-mail (en minuscules) dans `employees`, et vérifier qu'aucun doublon n'existe avant de l'appliquer.

## 4. Fonctions techniques appelables par tout compte connecté (priorité basse)

Six fonctions internes (calculs et exports d'heures, notamment `export_hours_weekly` / `export_hours_monthly`) sont appelables par n'importe quel compte connecté. Elles renvoient des heures de tous les magasins sans filtrage par droits.

Action : retirer le droit d'exécution aux comptes standards et le réserver au service interne utilisé par l'export sécurisé.

## 5. Formulaire de contact

Fonctionnement correct : envoi ouvert à tous, lecture réservée aux admin/responsables/éditeurs. Aucun changement nécessaire, simplement à ne jamais ouvrir en lecture publique.

## Ordre d'exécution proposé

1. Mise à jour des bibliothèques vulnérables + vérification des écrans impactés.
2. Unicité des e-mails collaborateurs.
3. Restriction de lecture sur `stores` et `store_settings` (après contrôle de la page publique congés).
4. Restriction des droits d'exécution sur les fonctions d'export.
5. Bump de version (`src/lib/version.ts`) et entrée CHANGELOG.

Dites-moi si vous voulez tout appliquer, ou seulement une partie (par exemple uniquement les mises à jour de bibliothèques).
