# Bannière "Tourner en paysage" (mobile portrait)

Afficher une petite bannière discrète, fermable, suggérant de tourner le téléphone pour une meilleure vue. Visible uniquement sur mobile en portrait, sur les vues *Congés* et *Équipe du jour*.

## Implémentation

### Nouveau composant `src/components/RotateHint.tsx`
- Bandeau fin (`py-1.5`, fond `bg-accent/10`, texte `text-xs`) avec icône `Smartphone` ou `RotateCw` de lucide.
- Texte bilingue via `useI18n` : FR "Tournez votre téléphone pour une meilleure vue" / NL "Draai je telefoon voor een betere weergave".
- Bouton de fermeture (X) qui masque le bandeau pour la session courante (state local, pas localStorage → réapparait à chaque visite, conforme à "discrète").
- Visible uniquement en `max-sm:portrait` (Tailwind variants). Caché en paysage et sur tablette/desktop via `hidden max-sm:portrait:flex`.

### Intégration
- `src/pages/CongesView.tsx` : insérer `<RotateHint />` juste après le header.
- `src/pages/TeamDayView.tsx` : insérer `<RotateHint />` juste après `<FnacHeader>`.

### i18n
Ajouter deux clés dans `src/lib/i18n.tsx` :
- `rotate.hint` → "Tournez votre téléphone pour une meilleure vue" / "Draai je telefoon voor een betere weergave"
- `rotate.dismiss` → aria-label "Fermer" / "Sluiten"

### Versioning
- Bump `v4.79` → `v4.80`.
- Changelog : "Suggestion 'tourner en paysage' sur mobile pour Congés et Équipe du jour".

## Hors scope
- Pas de mémorisation permanente (localStorage).
- Pas d'ajout sur Planning semaine / Mon planning.
