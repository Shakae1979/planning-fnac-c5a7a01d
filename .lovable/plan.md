## Objectif

Permettre de sauter rapidement à n'importe quelle semaine sans cliquer 20 fois sur les flèches, dans les vues planning concernées.

## Composant central : `WeekNavigator`

Nouveau composant réutilisable `src/components/WeekNavigator.tsx` qui remplace le bloc actuel (flèche ← / date / flèche →).

Contenu :
- **◀ / ▶** : navigation semaine par semaine (comportement actuel conservé).
- **Date cliquable** (ex: `18/05/2026 — 23/05/2026`) qui ouvre un **Popover** contenant un mini calendrier (`<Calendar mode="single">` shadcn). Cliquer un jour calcule le lundi de la semaine et y saute. La semaine active est surlignée.
- **Champ « S__ »** : petit input numérique à droite. Tape `23` + Entrée → saute à la semaine ISO 23 de l'année en cours. Tape `23/2027` → saute à la S23 de 2027.
- **Bouton « Aujourd'hui »** : revient à la semaine courante (`weekOffset = 0`), désactivé si déjà dessus.

## Raccourcis clavier (globaux à la page)

Hook `useWeekShortcuts` :
- `←` / `→` : semaine précédente / suivante
- `Shift+←` / `Shift+→` : −4 / +4 semaines (mois)
- `T` ou `Home` : Aujourd'hui
- `G` : ouvre le popover calendrier (Go to)

Désactivés quand le focus est dans un input/textarea/contenteditable pour ne pas casser la saisie d'horaires.

## Intégration

Remplacer le bloc de navigation dans :
- `src/pages/TeamWeekView.tsx` (Planning semaine — vue principale concernée)
- `src/components/dashboard/ScheduleEditor.tsx` (Planning Fnac — éditeur)
- `src/pages/TeamDayView.tsx` (Équipe du jour — adapté pour navigation par jour, même UX)
- `src/pages/EmployeeView.tsx` (Mon planning)

L'API du composant accepte `weekOffset`, `onChange(offset)` et un mode optionnel `"day" | "week"` pour TeamDayView.

## Détails techniques

- Calcul ISO week : helper `getISOWeek(date)` et `getDateFromISOWeek(week, year)` dans `src/lib/format.ts` (déjà utilisé pour l'affichage `S12`, on factorise).
- Popover shadcn déjà disponible, Calendar shadcn aussi (`pointer-events-auto`).
- Affichage du numéro de semaine ISO à côté de la date (ex: `S21 · 18/05 → 23/05`) pour aider à se repérer.
- i18n FR/NL : nouvelles clés `nav.today`, `nav.goToWeek`, `nav.weekNumber`, `nav.shortcuts`.
- Tooltip sur l'input et les boutons listant les raccourcis.

## Hors scope

- Pas de changement aux données ni à la sauvegarde.
- Pas de modification de la sidebar ni de l'en-tête global.
- Pas de bookmarks/favoris de semaines (peut venir plus tard si besoin).
