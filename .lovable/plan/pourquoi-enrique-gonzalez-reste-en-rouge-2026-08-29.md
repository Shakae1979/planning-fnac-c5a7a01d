# Pourquoi Enrique Gonzalez reste en rouge

## Explication

Le rouge sur une ligne du planning n'est pas une couleur de métier : c'est l'alerte « sous les heures contractuelles ». Une ligne passe en rouge quand le collaborateur n'a aucun jour de congé sur la semaine et que son total net calculé est inférieur à son contrat (ici 36h).

## Cause vérifiée

La page d'encodage du planning calcule son propre total et déduit encore 1h de pause dès **6h00 pile** (`dayMinutes >= 360`, à deux endroits du fichier), alors que la règle validée en v5.23 est « pause déduite uniquement au-delà de 6h ». Le reste de l'application (`src/lib/hours.ts`, la vue d'ensemble, l'export, l'assistant) applique bien `> 6h`.

Conséquence pour Enrique : ses journées de 6h00 pile (ex. mardi 14h00–20h00) perdent 1h à tort dans ce total, ce qui le fait passer sous 36h et déclenche l'alerte rouge, alors que le compteur d'heures de la vue d'ensemble ne le signale pas. C'est donc une incohérence entre deux calculs, pas un problème de données.

## Correction proposée

1. Remplacer les deux `dayMinutes >= 360` par `dayMinutes > 360` dans `src/components/dashboard/ScheduleEditor.tsx` (lignes ~615 et ~1196) pour aligner l'encodage sur la règle « > 6h ».
2. Mieux : faire appeler par ces deux blocs l'utilitaire existant de `src/lib/hours.ts` afin qu'il n'existe plus qu'une seule implémentation de la règle de pause.
3. Bump `src/lib/version.ts` en v5.24 + entrée en haut de `CHANGELOG.md`.

Aucun changement de données : seuls les totaux affichés et l'alerte rouge sont corrigés.

## Note

Si après correction Enrique reste rouge, c'est que son planning encodé est réellement inférieur à 36h nettes (les statuts « Roulement » et « Extérieur » comptent 0h) — l'alerte serait alors correcte.
