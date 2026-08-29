# Rattacher un compte existant à un 2e magasin

Réponse courte : oui, c'est déjà possible côté base — un compte peut être lié à plusieurs magasins (table d'affectations `user_store_assignments`, un enregistrement par magasin, avec un indicateur « responsable » par magasin). Ce qui manque, c'est le geste dans l'interface : aujourd'hui l'onglet Équipe & Comptes ne montre que les comptes déjà affectés au magasin sélectionné, donc sur le 2e magasin le responsable apparaît comme « sans compte », et recréer un compte échoue puisque l'e-mail existe déjà.

## Ce qui sera ajouté

**1. Bouton « Rattacher ce compte au magasin »**
- Dans Équipe & Comptes, quand un collaborateur du magasin courant a une adresse e-mail qui correspond à un compte existant non affecté à ce magasin, on affiche « Compte existant — Rattacher à ce magasin » au lieu du formulaire de création.
- Un clic ajoute l'affectation au magasin courant, sans toucher au mot de passe ni au rôle existant.

**2. Création de compte tolérante**
- Si on tente de créer un compte avec une adresse déjà utilisée, au lieu d'une erreur, le système rattache le compte existant au magasin courant et le signale clairement (« Compte déjà existant : rattaché à ce magasin »). Le mot de passe saisi n'est pas appliqué.

**3. Case « Responsable de ce magasin »**
- Sur la ligne du compte, une case permet à un admin de marquer le compte comme responsable du magasin courant, indépendamment de l'autre magasin (l'indicateur est déjà par affectation).

**4. Liste des magasins du compte**
- Sur la ligne du compte, affichage des magasins auxquels il est rattaché (petits badges), et possibilité de détacher du magasin courant.

## Cas des 2 responsables actuels

Une fois l'interface en place, il suffit pour chacun : sélectionner le 2e magasin → Équipe & Comptes → « Rattacher à ce magasin » → cocher « Responsable de ce magasin ». Leur sélecteur de magasin en haut proposera alors les deux, avec le rôle responsable sur chacun.

## Détails techniques

- Aucune migration : `user_store_assignments` a déjà la contrainte unique `(user_id, store_id)` et la colonne `is_manager`; les actions `assign_store`, `unassign_store` et `set_manager` existent dans la fonction `manage-users`.
- `supabase/functions/manage-users/index.ts` : dans `create`, détecter l'e-mail déjà présent (`listUsers` / erreur de duplicat) et basculer sur un `upsert` d'affectation en renvoyant `{ linked: true }` au lieu d'une erreur.
- `src/components/dashboard/TeamAndAccounts.tsx` : conserver la liste complète des comptes (avant filtrage par magasin) pour détecter les correspondances par e-mail, ajouter le bouton de rattachement, les badges magasins, le détachement et la case responsable (visible admin).
- Traductions FR/NL dans `src/lib/i18n.tsx`.
- Bump `src/lib/version.ts` + entrée CHANGELOG.

Note : la fonctionnalité de notification de changement d'horaire, déjà approuvée, reste à implémenter ensuite.
