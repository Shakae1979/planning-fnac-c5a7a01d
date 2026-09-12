# Équipe du jour : les jours de repos codés « WV » ne sont pas comptés

## Ce que j'ai constaté (Fnac Gent, samedi 12/09)

La page affiche **16 présents, 7 en congé, 0 repos**, alors que 4 collaborateurs sont bien en repos ce jour-là (Alex Rambaut, Rina Messiaen, Yanaïka Lopes Rodrigues en « WV », Wendy Donckers en « ANTW »).

Raison : dans le planning, ces journées ne sont pas encodées avec un horaire mais avec un code texte sans heure de fin (`WV`, `ANTW`, `BRUGGE`, `WIJN`, `ALO`, `SPL`, `-`, ou une case vide). La page ne reconnaît que trois cas particuliers : férié, extérieur et « ROULEMENT ». Tout autre texte sans heure de fin est automatiquement rangé dans « déplacement » — d'où un compteur Repos à 0.

Deux défauts visibles liés au même endroit :
- le bloc qui les regroupe affiche le libellé brut **TEAMDAY.TRAVEL** : la traduction FR/NL n'existe pas ;
- certains collaborateurs affichent **NaNh** au lieu du total d'heures (Trui Vereecke, Claudine Dobbelaere, Nicky Cools), et un horaire corrompu « Gan–- » chez Fnac Aalst, quand la valeur enregistrée n'est pas une heure valide.

## Ce qui sera corrigé

1. **WV compté comme repos** : `WV` (et sa variante `Wv`) est traité comme un jour non travaillé, au même titre que ROULEMENT — il rejoint le compteur et la liste « Repos », en gris, comme déjà fait dans le Planning semaine.
2. **Cases vides ou « - » comptées comme repos** au lieu d'être vues comme un déplacement.
3. **Déplacements réservés aux vrais codes magasin** (ANTW, BRUGGE, WIJN, LLN, TDO, ALO, SPL…), avec un libellé traduit « Déplacements » / « Verplaatsingen » à la place de TEAMDAY.TRAVEL.
4. **Plus de NaNh** : quand l'heure enregistrée n'est pas exploitable, la ligne affiche un tiret et n'entre ni dans les présents ni dans le total d'heures, au lieu d'un calcul invalide.

Aucune donnée n'est modifiée : c'est uniquement la lecture et l'affichage qui changent.

## Détails techniques

- `src/pages/TeamDayView.tsx` :
  - ajouter un helper `isTimeValue(v)` (`/^\d{1,2}:\d{2}$/`) et une constante `REST_CODES = ["ROULEMENT", "WV", "REPOS", "-", ""]` (comparaison en majuscules, valeur trimée) ;
  - `isRoulement` devient `isRestCode` et couvre ces valeurs ; `isLocation` ne s'applique plus qu'à un code non vide, non reconnu comme repos/férié/EXT, et sans heure de fin ;
  - `hasShift` exige désormais `isTimeValue(start) && isTimeValue(end)` pour éviter les `NaN` ;
  - les listes `off` / `roulement` intègrent les codes de repos, le rendu de ligne affiche « — » quand l'heure est invalide.
- `src/lib/i18n.tsx` : ajouter `teamDay.travel` (FR « Déplacements », NL « Verplaatsingen ») et, si absent, le libellé court `WV`.
- `src/components/team-day/HourlyGrid.tsx` : ne pas injecter de plage pour un code non horaire (même garde `isTimeValue`).
- Bump `src/lib/version.ts` en v5.32 + entrée en haut de `CHANGELOG.md`.

## Vérification

Sur Fnac Gent, samedi 12/09 : les 3 « WV » apparaissent dans Repos (compteur à 3), Wendy Donckers reste en « Déplacements » avec un libellé lisible, et aucune ligne n'affiche NaNh.
