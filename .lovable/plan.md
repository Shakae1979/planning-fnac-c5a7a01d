# Correction : la case « Magasin à 2 étages » ne reste pas cochée

## Ce qui se passe

Le contexte magasin (`useStore`) charge la liste des magasins une seule fois dans un état React local, au moment de la connexion — il n'utilise pas le cache de requêtes.

Les interrupteurs des paramètres magasin (`StoreSelfSettings`) écrivent bien la valeur en base, puis demandent le rafraîchissement du cache de requêtes `["stores"]`. Mais ce cache n'est pas la source du contexte magasin : le contexte n'est jamais rechargé, donc l'interrupteur revient immédiatement à son ancienne valeur à l'écran, même si la base a été mise à jour.

Cela concerne les quatre interrupteurs de cette page (semaines A/B, heure de table, multi-métiers, 2 étages) — le symptôme est simplement plus visible sur le nouveau.

## Ce qui va être fait

1. Exposer une fonction de rafraîchissement dans le contexte magasin : elle relance le chargement de la liste des magasins et met à jour le magasin courant avec ses nouveaux réglages.
2. Appeler ce rafraîchissement après chaque changement d'interrupteur dans les paramètres magasin, de sorte que la case reflète immédiatement l'état réel enregistré.
3. Vérifier au passage que l'écriture est bien autorisée pour le profil connecté (responsable/admin). Si l'enregistrement est refusé, afficher un message clair au lieu d'un retour silencieux à l'ancienne valeur.
4. Contrôler dans le navigateur que cocher/décocher « Magasin à 2 étages » reste bien affiché après clic et après rechargement de la page.

## Détails techniques

- `src/hooks/useStore.tsx` : extraire la logique de `fetchStores` de l'effet, la mémoriser, et l'exposer via le contexte sous `refreshStores()` ; conserver le magasin courant en le ré-appariant par `id` sur la nouvelle liste (pas de reset de sélection).
- `src/components/dashboard/StoreSelfSettings.tsx` : dans `onSuccess`, appeler `refreshStores()` en plus de l'invalidation existante ; garder `onError` avec le toast d'erreur.
- `src/components/dashboard/StoreManager.tsx` (vue admin) : même appel après les mutations de flags, afin que le sélecteur global reste cohérent.
- Bump `src/lib/version.ts` en v5.12 + entrée `CHANGELOG.md`.
