# Optimisation auto paysage — Équipe du jour (mobile)

Détecter l'orientation paysage sur mobile et adapter automatiquement la vue pour profiter de la largeur disponible. Aucune bannière, aucune rotation forcée.

## Détection

Ajouter un petit hook `useOrientation()` dans `src/hooks/` qui retourne `"landscape" | "portrait"` via `window.matchMedia("(orientation: landscape)")` + écouteur. Combiné avec `useIsMobile()` existant pour cibler uniquement mobile paysage (largeur ≤ 900px, orientation paysage).

## Changements UI conditionnels (mobile + landscape)

### `src/pages/TeamDayView.tsx`
- Conteneur : `max-w-6xl` reste, mais padding réduit `px-2` en paysage mobile.
- **Cartes résumé** (Présents/Congés/Repos) : passer de pleine ligne à une rangée compacte sur la gauche, libérant de la place pour la grille. Concrètement : conserver `grid-cols-3` mais hauteur réduite (`py-1.5`, `text-lg` au lieu de `text-xl`).
- **Bloc deux colonnes** (Travaillent / Alertes) : repasser en `grid-cols-2` même sur mobile dès qu'on est en paysage (override le `grid-cols-1` mobile du plan précédent).
- **Header de page** : compacter (`py-2` sur mobile paysage) pour éviter que le header mange la hauteur utile.

### `src/components/team-day/HourlyGrid.tsx`
- En paysage mobile : largeur cellule remontée à `min-w-[26px]`, hauteur barre `h-5`, mais l'écran étant plus large beaucoup plus de créneaux visibles sans scroll.
- Légende des rôles : reste en `flex-wrap` (déjà fait).
- Colonne employé sticky : `min-w-[80px]` en landscape (vs 88 portrait) pour libérer la grille.

### `src/components/FnacHeader.tsx`
Si compact possible : réduire padding vertical en mobile paysage (`py-2` au lieu de `py-3/4`). À vérifier au moment de l'édition.

## Versioning
- Bump `v4.78` → `v4.79`.
- Changelog : "Optimisation automatique en mode paysage sur mobile pour la vue Équipe du jour".

## Hors scope
- Pas de bannière "tournez votre téléphone".
- Pas de rotation CSS forcée.
- Pas de changement sur les autres pages (Planning, Congés, etc.) — uniquement Équipe du jour pour ce ticket.
