# Stabiliser définitivement l’ordre dans l’encodage du planning

## Cause confirmée

Les positions enregistrées en base sont maintenant toutes distinctes par magasin et par métier. Le problème restant vient de l’affichage : plusieurs pages partagent la même liste mémorisée des collaborateurs, alors qu’elles la chargent et la trient différemment.

La capture de Fnac Charleroi montre précisément ce cas : les personnes apparaissent dans un ordre alphabétique global (Adam, Alix, Amélie, Axel…), au lieu d’être regroupées par métier puis classées selon leur position personnalisée. Avec la mise en cache récente, cette mauvaise liste peut rester affichée plusieurs minutes.

## Corrections prévues

1. Donner à l’encodage sa propre liste mémorisée, distincte de celles utilisées dans la gestion de l’équipe et les autres pages.
2. Appliquer systématiquement le tri métier → position personnalisée → nom au moment de l’affichage, même si les données proviennent du cache.
3. Adapter le glisser-déposer pour mettre à jour cette liste dédiée immédiatement, puis rafraîchir les autres listes concernées après l’enregistrement.
4. Conserver l’enregistrement atomique et les positions uniques déjà mis en place.
5. Passer l’application en `v5.34` et ajouter l’entrée correspondante au journal des changements.

## Vérification

- Ouvrir la gestion de l’équipe, puis revenir dans l’encodage : l’ordre personnalisé doit rester identique.
- Rafraîchir directement la page d’encodage : même ordre, sans passage temporaire en ordre alphabétique.
- Déplacer un vendeur dans son métier, changer d’onglet puis revenir : la nouvelle position doit être conservée.
- Vérifier le résultat sur Fnac Charleroi et sur un second magasin.

## Détails techniques

- `ScheduleEditor.tsx` : clé de cache dédiée au planning, tri dérivé avec le helper commun `sortByRoleOrder`, et mise à jour optimiste alignée sur cette clé.
- Les invalidations générales des collaborateurs restent déclenchées après un déplacement afin que les autres écrans reçoivent ensuite les nouvelles positions.
- Aucun changement supplémentaire de données n’est nécessaire : la vérification actuelle ne montre plus aucun doublon de position parmi les collaborateurs actifs.
