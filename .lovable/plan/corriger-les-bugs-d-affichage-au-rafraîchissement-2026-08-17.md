# Corriger les bugs d'affichage au rafraîchissement

## Ce qui se passe

Au rafraîchissement (F5), l'application se déclare "prête" avant de connaître votre rôle. Résultat : pendant une fraction de seconde (parfois plus), l'app se comporte comme si vous étiez un simple vendeur — d'où des redirections inattendues, un magasin qui change, des menus/colonnes qui apparaissent puis disparaissent, ou une page qui s'affiche à moitié.

Trois causes vérifiées dans le code :

1. `useAuth` passe `loading` à `false` dès que la session est connue, sans attendre la réponse du rôle (`get_my_role`). Le rôle vaut donc `null` pendant les premiers rendus.
2. Conséquence directe dans `App.tsx` : la route protégée `/` (Plannings) teste `role !== "admin" && role !== "editor" && role !== "manager"`. Avec `role = null`, un admin est renvoyé vers `/equipe-du-jour` au rafraîchissement.
3. `useStore` charge les magasins une première fois avec `role = null` (donc via la liste restreinte), puis une seconde fois quand le rôle arrive. La liste et le magasin sélectionné peuvent « sauter », et la vérification `if (!currentStore)` utilise une valeur figée hors dépendances.

## Corrections prévues

- **Attendre le rôle avant d'afficher** : `loading` ne repasse à `false` qu'une fois le rôle résolu (ou l'absence de session confirmée). Les écrans protégés ne se rendent plus avec un rôle inconnu.
- **Garde de route fiable** : la redirection selon le rôle n'est évaluée que lorsque le rôle est connu ; sinon on garde l'écran de chargement.
- **Chargement des magasins stabilisé** : un seul chargement, déclenché une fois le rôle connu, avec suivi de la dernière requête pour ignorer les réponses obsolètes, et sélection initiale du magasin gérée via une référence stable au lieu d'une valeur figée.
- **Vérification du mot de passe** : ne plus laisser passer le rendu tant que le contrôle `must_change_password` n'a pas répondu, pour éviter le flash de page suivi d'une redirection.

## Détails techniques

- `src/hooks/useAuth.tsx` : `fetchRole` devient bloquant pour `loading` (try/finally), aussi bien dans `getSession()` que dans `onAuthStateChange`.
- `src/App.tsx` : `ProtectedRoute` affiche le loader tant que `role === null` ou `mustChange === null` pour un utilisateur connecté.
- `src/hooks/useStore.tsx` : effet déclenché sur `[user?.id, role]` avec sortie anticipée si `role === null` ; `requestId`/`useRef` pour ignorer les réponses en retard ; `currentStoreRef` pour la sélection initiale.
- Bump `src/lib/version.ts` (v4.99) + entrée `CHANGELOG.md`.

## Vérification

Rafraîchissement sur `/` (Plannings), `/planning-equipe` et `/equipe-du-jour` en admin puis en éditeur : aucune redirection parasite, magasin correct dès le premier affichage, pas de clignotement de la barre latérale.
