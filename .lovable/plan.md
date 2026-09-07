# Corriger l'impression du planning semaine

## Ce qui se passe

À l'impression, les barres colorées des horaires travaillés disparaissent (elles deviennent invisibles), alors que les congés et les déplacements restent visibles. Ce n'est pas un problème de couleur : les barres sont écrasées à une hauteur de 0.

Vérifié en simulant une impression de la page « Planning semaine » : à l'écran une barre fait 20 px de haut, en impression elle passe à 0 px, tout en gardant sa couleur rouge/orange.

## Cause

Une règle d'impression ajoutée pour éviter les zones coupées force `height: auto` et `overflow: visible` sur tout élément dont la classe contient « overflow-hidden ». Les barres d'horaires portent justement cette classe (pour rogner le texte), donc elles s'effondrent à zéro.

## Correction proposée

Dans les styles d'impression :
- Ne plus toucher à la hauteur des éléments « overflow-hidden » ; ne relâcher hauteur et hauteur maximale que pour les vrais conteneurs défilants (`overflow-auto`, `overflow-y-auto`, `overflow-x-auto`).
- Conserver la neutralisation du défilement pour ces conteneurs, afin que la vue complète reste imprimée sans coupure.

Ensuite : contrôle visuel d'une impression simulée sur Planning semaine, Équipe du jour et Congés, puis passage en v5.31 avec entrée au changelog.

## Détails techniques

- Fichier : `src/index.css`, bloc `@media print` (règle sur `[class*="overflow-*"]`).
- Aucun changement de logique métier ni de composant.
