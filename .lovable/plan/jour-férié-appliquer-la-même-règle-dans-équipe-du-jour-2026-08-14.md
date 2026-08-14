# Jour férié : appliquer la même règle dans « Équipe du jour »

## Constat
Le drapeau « férié » est bien enregistré (table des commentaires de journée, champ férié, par magasin et par semaine) et le Planning semaine l'utilise pour masquer les horaires et afficher la mention Férié. Dans Équipe du jour, ce même drapeau n'est lu que pour afficher un petit bandeau gris discret : les compteurs, les listes par département et la grille horaire continuent d'afficher les horaires comme un jour normal.

## Ce qui change dans Équipe du jour
- Bandeau férié bien visible en haut (même style que le Planning semaine : fond sombre, drapeau, libellé « Férié »), avec le commentaire du jour s'il existe.
- Les horaires n'apparaissent plus : les collaborateurs qui avaient un horaire ce jour-là basculent dans une liste « Férié » au lieu de « Présents », comme dans la vue semaine.
- Les compteurs du haut passent à 0 présent / 0 heure planifiée, et le total « repos » inclut les collaborateurs concernés.
- Plus d'alertes « Non couverts » un jour férié.
- Les congés restent affichés (un congé posé sur un férié reste visible dans sa liste).
- La grille horaire de la journée est grisée avec la mention Férié et ne pré-remplit aucun créneau ; elle reste consultable mais n'affiche plus les plages de travail.

## Détails techniques
- `src/pages/TeamDayView.tsx` : `isDayFerie` (déjà calculé) neutralise `hasShift` lors de la construction de `teamDay`, alimente une liste `ferieDay`, court-circuite le calcul de couverture et les heures nettes, et remplace le bandeau muted actuel par le style férié de `TeamWeekView`.
- `src/components/team-day/HourlyGrid.tsx` : nouvelle prop `isFerie` passée depuis `TeamDayView` ; quand elle est vraie, la grille n'injecte pas les plages issues des plannings (ni les heures de table), applique un fond grisé et affiche un libellé Férié.
- Réutilisation des clés i18n existantes (`schedule.holiday`, `teamWeek.ferie`, `teamDay.holidayBanner`) ; ajout d'une clé seulement si nécessaire.
- Bump `src/lib/version.ts` en v4.91 et entrée en haut de `CHANGELOG.md`.

## Question ouverte traitée par défaut
La grille horaire reste éditable en cas d'exception (ouverture spéciale un férié) mais démarre vide ; dis-le si tu préfères qu'elle soit totalement verrouillée.
