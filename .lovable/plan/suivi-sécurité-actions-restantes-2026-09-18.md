# Suivi sécurité — actions restantes

Suite à l'analyse de sécurité (v5.35, aucun problème critique), deux actions de durcissement restent possibles.

## 1. Protection contre les mots de passe divulgués (HIBP)
Activer la vérification Have I Been Pwned : tout mot de passe ayant fuité ailleurs sera refusé à l'inscription et au changement de mot de passe.
- Réglage côté authentification (aucun code à modifier).

## 2. Exiger le mot de passe actuel pour tout changement de mot de passe
Empêche le changement de mot de passe depuis une session laissée ouverte sans connaître l'ancien mot de passe.
- Les liens de réinitialisation par e-mail restent fonctionnels.

## 3. Surveillance des dépendances (pas d'action immédiate possible)
- `@lovable.dev/mcp-js` 2.2.1 et `react-router-dom` 6.30.6 ont encore des avis modérés sans version corrective publiée.
- Action : relancer un scan de dépendances à la prochaine mise à jour des paquets.

## Détails techniques
- Activation via l'outil de configuration d'authentification (`password_hibp_enabled: true`, `require_current_password: true`).
- Aucune migration, aucun changement de schéma, aucune interruption pour les utilisateurs existants.
- Bump de version + entrée CHANGELOG après activation.
