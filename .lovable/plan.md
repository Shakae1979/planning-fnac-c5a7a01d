## Objectif
Dans la vue planning semaine (Gantt), le déplacement "WV" doit s'afficher en gris (comme le roulement), tandis que les autres déplacements (ex: "Gan") restent en indigo.

## Changement
Modifier `src/pages/TeamWeekView.tsx` dans le bloc `isLocation` :
- Si `start === "WV"` → appliquer `bg-gray-400` (même style que roulement)
- Sinon → conserver `bg-indigo-500`

## Vérification
Vérifier visuellement dans le planning semaine que "WV" apparaît gris et "Gan" reste indigo.