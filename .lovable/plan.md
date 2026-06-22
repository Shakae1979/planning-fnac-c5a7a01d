Problème : dans `ScheduleEditor.tsx`, quand l'option « heure de table » est activée, chaque cellule jour affiche 4 inputs (début/fin shift + début/fin pause) empilés, ce qui rend l'horaire principal moins lisible.

Solution proposée (3 améliorations cumulatives, faciles à ajuster) :

1. **Masquer les inputs de pause tant qu'ils ne sont pas utiles**
   - Si la cellule n'a pas d'horaire (`start`/`end` vides) ou est un statut spécial (Roulement/Extérieur/Congé), on ne montre plus la ligne pause du tout.
   - Si la pause est vide ET la cellule n'a pas le focus, on affiche un seul mini-bouton « + pause » (icône `Coffee`, h-3 w-3) au lieu des deux inputs vides.
   - Au clic ou au focus d'une cellule, les deux inputs de pause apparaissent et restent visibles tant qu'ils contiennent une valeur.

2. **Différencier visuellement l'horaire principal de la pause**
   - Inputs principaux : conserver `text-[11px]` font-mono, fond `bg-background`, bordure solide.
   - Inputs pause : passer à `text-[9px]`, italique, fond transparent, bordure pointillée plus pâle (`border-muted-foreground/20`), couleur `text-muted-foreground/70`.
   - Ajouter un séparateur visuel : petit `·` ou icône `Coffee` de 8px entre les deux champs pause pour clairement signaler « pause ».

3. **Affichage condensé quand la pause est remplie**
   - Quand la pause est remplie ET la cellule n'a pas le focus, afficher une seule ligne texte au lieu des 2 inputs : `↳ 12h00–13h00` en gris clair, cliquable pour repasser en édition.
   - Cela libère 1 ligne sur 2 dans la grille et rend l'horaire principal dominant visuellement.

Fichier touché : `src/components/dashboard/ScheduleEditor.tsx` (bloc lignes 1317-1338).

Aucun changement de logique de calcul ni de schéma — uniquement le rendu de la cellule.