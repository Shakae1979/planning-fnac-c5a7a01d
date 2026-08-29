# Corriger le rattachement d'un compte existant à un 2e magasin

## Diagnostic
Le code local de la fonction `manage-users` contient bien la logique « email déjà existant → rattacher au magasin au lieu d'échouer », et la contrainte unique `(user_id, store_id)` existe en base. L'erreur « le compte existe déjà » vue par l'utilisateur indique donc très probablement que la version déployée de la fonction n'est pas à jour, ou qu'un chemin d'erreur (createUser qui renvoie « already registered ») n'est pas intercepté.

## Étapes

1. **Redéployer la fonction `manage-users`** avec le code actuel (contenant le bloc de rattachement automatique).
2. **Sécuriser le chemin d'erreur** : dans l'action `create`, intercepter aussi l'erreur `createUser` « already been registered » comme garde-fou (rattacher au magasin au lieu de propager l'erreur), au cas où la détection préalable par e-mail raterait (casse, espaces, alias).
3. **Normaliser l'e-mail** (trim + lowercase) avant comparaison dans `create`.
4. **Vérifier les autres écrans de création de compte** (`UserManager.tsx` admin) pour s'assurer qu'ils passent bien par `manage-users` avec `store_id`, afin que le rattachement fonctionne partout.
5. **Test de bout en bout** : créer/rattacher un compte existant sur un 2e magasin via l'interface et confirmer le toast « Compte rattaché » + badges multi-magasins.
6. Bump version → **v5.26** + entrée `CHANGELOG.md` (FR, date du jour).

## Détails techniques
- Fichier principal : `supabase/functions/manage-users/index.ts` (action `create`, lignes ~135-199).
- Garde-fou proposé :
```text
createUser error?
  └─ message contient "already been registered" / "already exists"
       └─ retrouver l'utilisateur par e-mail → upsert user_store_assignments → { linked: true }
  └─ sinon → erreur normale
```
- Aucune migration nécessaire (contrainte unique déjà en place).
