# Équipe du jour : suivre les horaires du magasin par jour

## Problème
La page « Équipe du jour » calcule encore la couverture des équipes sur des plages codées en dur (10h–19h du lundi au samedi, 10h–20h le vendredi, fermé le dimanche), quelles que soient les heures d'ouverture réglées dans les paramètres du magasin. La grille horaire, elle, utilise déjà les horaires par jour.

## Ce qui change
- Les alertes « Non couverts » se basent sur l'horaire réel du jour affiché (celui défini dans Paramètres du magasin), au lieu des plages fixes.
- Si le jour est marqué « Fermé » pour le magasin, aucune alerte de couverture n'est affichée.
- Les demi-heures sont prises en compte : un magasin ouvrant à 09h30 déclenche l'analyse dès 09h30 et non à 10h.
- Les plages non couvertes s'affichent au format belge (ex. « 09h30–11h00 »).

## Détails techniques
- `src/pages/TeamDayView.tsx` : supprimer la constante `REQUIRED_SLOTS`, lire `dayHours` via `useStoreSettings()` et dériver la plage requise du jour courant (`dayKey`).
- Passer la boucle de couverture d'un pas horaire à un pas de 30 minutes (en minutes depuis minuit), avec comparaison sur les minutes de début/fin de shift ; regrouper les créneaux consécutifs en plages continues.
- Réutiliser `formatTimeBE` pour l'affichage des plages non couvertes.
- Bump `src/lib/version.ts` en v4.90 et ajouter une entrée en haut de `CHANGELOG.md`.
