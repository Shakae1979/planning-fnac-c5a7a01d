# Jean-Laurent visible comme responsable de Fnac TDO

## Diagnostic

Côté base de données, tout est déjà correct : Jean-Laurent a le rôle `manager`, une assignation `is_manager = true` sur Fnac TDO et Fnac LLN, et une fiche employé dans les deux magasins.

Le problème est dans l'écran admin « Gestion des magasins » (`src/components/dashboard/StoreManager.tsx`) : la rubrique **Responsables** de chaque tuile magasin ne liste que les comptes de rôle `editor` ou `admin`. Le rôle `manager` (créé en v4.69) n'y a jamais été ajouté — donc Jean-Laurent (et tout responsable de magasin) n'apparaît jamais dans cette liste.

## Changements

Dans `src/components/dashboard/StoreManager.tsx` :

1. **Liste des responsables par magasin** (ligne ~83) : inclure le rôle `manager` dans le filtre qui construit `storeManagers`, aux côtés de `editor` et `admin`. Jean-Laurent apparaîtra alors dans la tuile Fnac TDO avec la couronne et le badge « Store Manager ».

2. **Menu « Ajouter un responsable »** (`getAvailableUsers`, ligne ~294) : même correction, pour qu'un compte de rôle `manager` puisse aussi être proposé à l'ajout sur un autre magasin.

3. **Versioning** : bump de `src/lib/version.ts` (v5.26) + entrée en haut de `CHANGELOG.md` (FR, date du jour).

## Vérification

- Recharger l'écran Gestion des magasins et confirmer que `jean-laurent.stubbe@be.fnac.com` apparaît dans les Responsables de Fnac TDO et Fnac LLN avec le badge Store Manager.
