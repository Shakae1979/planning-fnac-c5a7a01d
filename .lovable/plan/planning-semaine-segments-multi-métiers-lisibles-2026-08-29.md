# Planning semaine — segments multi-métiers lisibles

## Problème
Sur la page « Planning équipe » (`src/pages/TeamWeekView.tsx`), quand un employé change de rôle dans la journée (multi-métiers / 2 étages), chaque segment coloré affiche le libellé du rôle en texte (« PT HAUT », « PT BAS »…). Le texte masque la grille et on ne voit plus les horaires.

## Modification (1 fichier)

`src/pages/TeamWeekView.tsx`, rendu des segments (lignes ~373–381) :

- **Retirer** le texte du rôle affiché sur les segments (`role.{seg.role}.short`).
- **Afficher à la place le créneau horaire du segment** au format belge (`09h00–13h00`), uniquement si la largeur du segment le permet (seuil existant).
- Conserver les couleurs par rôle (inchangées) et le détail du rôle dans l'infobulle (`title`), déjà présent.
- Comportement sans changement de rôle : affichage actuel des horaires conservé.
- Le bandeau de pause (hachures) et l'indicateur férié restent inchangés.

### Détail technique
Remplacer la branche `isRoleSwitch` :
```text
{segWidth > 12 && <span>{formatTimeBE(seg.start)}–{formatTimeBE(seg.end)}</span>}
```
au lieu du `<span>` avec le libellé de rôle. L'infobulle garde la mention du rôle par segment.

## Hors périmètre
- Pas de changement sur la grille « Équipe du jour » (HourlyGrid) ni sur la légende en haut de page.
- Pas de changement de données.

## Versioning
- Bump `src/lib/version.ts` → v5.21 + entrée `CHANGELOG.md` (FR, date 29/08/2026).
