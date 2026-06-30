## Objectif
Les vendeurs (rôle `user`) accèdent à la vue Équipe du jour et peuvent visuellement éditer les commentaires/cases dans la grille horaire, même si la RLS bloque la sauvegarde. On passe l'interface en **lecture seule** pour ce rôle.

## Changements

### `src/components/team-day/HourlyGrid.tsx`
- Lire `role` depuis `useAuth()`. Définir `canEdit = role === "admin" || role === "editor" || role === "manager"`.
- Si `!canEdit` :
  - Masquer les boutons « Imprimer » mis à part (garder Imprimer) + cacher bouton « Appliquer » + désactiver la sélection multi (`handleCellClick` no-op, pas de `cursor-pointer`, pas de `hover:opacity-80`).
  - Remplacer l'`<Input>` de commentaire par un simple `<span>` lecture seule (affiché uniquement s'il y a du texte), pour ne plus laisser croire qu'on peut écrire.
  - Ne pas exposer `save` (canSave toujours `false`).

### `src/pages/TeamDayView.tsx`
- Vérifier qu'aucun bouton « Enregistrer » global lié à HourlyGrid n'est rendu pour les vendeurs (déjà conditionné via `onStateChange` → si `canSave` reste false, rien ne s'affiche).

### Versioning
- Bump `src/lib/version.ts` → `v4.81`.
- Ajouter entrée en haut de `CHANGELOG.md` : « v4.81 — Vue Équipe du jour en lecture seule pour les vendeurs (commentaires et grille horaire non éditables). »

## Hors-scope
- Pas de changement RLS (déjà sécurisé côté DB).
- Vues `EmployeeView` / `EmployeeMobileView` déjà en lecture seule, aucun changement.
