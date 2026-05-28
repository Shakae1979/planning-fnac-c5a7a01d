## Objectif
Corriger le bug récurrent sur la page **Équipe & Comptes** où des collaborateurs déjà liés à un compte réapparaissent comme **« Pas de compte »** avec le bouton **« Créer un compte »**.

## Ce que je vais faire
1. **Sécuriser le chargement des comptes**
   - Faire dépendre le chargement de la liste des comptes de l’état réel de l’authentification.
   - Éviter qu’un premier appel parte trop tôt, avant que la session soit prête.

2. **Passer le chargement des comptes sur un flux React Query fiable**
   - Remplacer le `useEffect` + état local fragile par une requête pilotée par l’état auth/store.
   - Réessayer automatiquement quand la session devient disponible.
   - Ne plus masquer silencieusement les erreurs de chargement.

3. **Stabiliser l’affichage “a un compte / pas de compte”**
   - Ne montrer **« Créer un compte »** que lorsque les comptes ont réellement fini de charger.
   - Ajouter un état de chargement/attente pour éviter les faux négatifs visuels.

4. **Valider le comportement après création/suppression**
   - Garder l’invalidation et le rafraîchissement après création/suppression de compte.
   - Vérifier que le statut reste correct quand on revient sur la page ou après changement de magasin.

## Fichiers concernés
- `src/components/dashboard/TeamAndAccounts.tsx`
- possiblement `src/hooks/useAuth.tsx` si un petit ajustement d’état “auth prête” est nécessaire

## Détail technique
Cause probable confirmée par le code actuel :
- `TeamAndAccounts` charge les comptes via `fetchAccounts()` dans un `useEffect(() => ..., [])`
- cet appel peut partir avant la restauration complète de la session
- en cas d’échec, l’erreur est ignorée et `accounts` reste vide
- la logique de rendu conclut alors à tort qu’il n’existe **aucun compte** pour ces employés

## Résultat attendu
Sur cette page, un collaborateur qui a déjà un compte ne devra plus repasser en **« Créer un compte »** quand on revient sur l’écran ou qu’on recharge la vue.