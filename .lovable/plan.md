## Objectif
Empêcher la page **Équipe & Comptes** d’afficher à tort **“Pas de compte / Créer un compte”** pour des collaborateurs qui ont déjà un compte existant.

## Ce que je vais corriger
1. **Corriger la source backend de la liste des comptes**
   - Mettre à jour la fonction backend `manage-users` pour récupérer **tous** les utilisateurs et pas seulement la première page.
   - Aujourd’hui, la logique utilise `auth.admin.listUsers()` sans pagination complète, ce qui peut ignorer une partie des comptes existants quand le volume d’utilisateurs dépasse la limite par défaut.

2. **Limiter la liste au magasin utile côté page**
   - Garder la correspondance par email, mais ne travailler que sur les comptes réellement liés au magasin courant.
   - Cela évitera les faux états et réduira les incohérences entre employés et comptes.

3. **Rendre l’état UI plus robuste**
   - Ne plus conclure trop vite à “Pas de compte” si la réponse backend est incomplète ou encore en cours de rafraîchissement.
   - Ajouter une gestion d’erreur explicite pour éviter les faux négatifs silencieux.

4. **Valider le correctif sur le flux concerné**
   - Vérifier que les personnes visibles sur **Fnac Charleroi** avec un compte existant n’affichent plus **Créer un compte**.
   - Contrôler aussi que le comportement reste correct pour les vrais cas sans compte.

## Détail technique
- Fichier backend concerné : `supabase/functions/manage-users/index.ts`
- Fichier frontend concerné : `src/components/dashboard/TeamAndAccounts.tsx`
- Cause probable identifiée : la récupération des comptes existants est **tronquée par pagination**, donc l’UI compare les employés à une liste incomplète.

## Résultat attendu
Sur la page **Équipe & Comptes**, un collaborateur ayant déjà un compte ne doit plus jamais réapparaître comme **“Pas de compte”** simplement parce que la liste des utilisateurs a été coupée.