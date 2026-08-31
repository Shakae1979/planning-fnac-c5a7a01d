# Pastille de notification sur le favicon

Quand un collaborateur a des notifications non lues, l'onglet du navigateur doit le montrer sans devoir ouvrir l'application.

## Comportement

- Une pastille ronde jaune Fnac est dessinée en bas à droite du favicon dès qu'il y a au moins une notification non lue.
- Le nombre de non lues s'affiche dans la pastille (1 à 9, puis « 9+ »).
- Le titre de l'onglet devient « (3) Planning Fnac — … » pour être visible même quand le favicon est trop petit.
- Dès que tout est marqué comme lu (ou lu ailleurs), le favicon et le titre reviennent à la normale.
- Aucun changement pour les comptes sans notifications (responsables, admins sans fiche collaborateur).

## Détails techniques

- Nouveau hook `src/hooks/useFaviconBadge.tsx` : dessine `/favicon.png` dans un `<canvas>` 64×64, ajoute le disque `#E1A400` + le chiffre, puis remplace le `href` du `<link rel="icon">`. Restaure l'URL d'origine quand le compteur repasse à 0 et au démontage.
- `src/components/NotificationBell.tsx` appelle ce hook avec `unread.length` (le composant est monté dans le header sur toutes les pages, et rafraîchit déjà toutes les 60 s).
- Gestion du titre : préfixe `(n) ` ajouté/retiré sur `document.title` dans le même hook, compatible avec les titres définis par `RouteMeta`/`PageMeta` (on relit le titre courant à chaque mise à jour).
- Bump `src/lib/version.ts` en v5.28 + entrée en haut de `CHANGELOG.md`.
