## Objectif
Supprimer les contraintes de largeur qui laissent de grandes marges vides à droite/gauche sur grand écran, pour que l'application exploite tout l'espace disponible.

## Constat
Plusieurs limites de largeur sont posées à différents niveaux :
- `src/App.css` → `#root { max-width: 1280px; ... padding: 2rem; text-align: center }` (vestige du template Vite, contraint TOUTE l'app à 1280 px et ajoute un padding/centrage indésirable).
- `src/pages/TeamDayView.tsx` → `max-w-6xl` (≈1152 px).
- `src/pages/TeamWeekView.tsx` → `max-w-[1600px]`.
- `src/pages/CongesView.tsx` → `max-w-[1600px]` (sauf vue Direction déjà en `max-w-full`).
- `src/pages/EmployeeView.tsx` → `max-w-3xl` (vue mobile employé, à laisser tel quel : c'est une lecture personnelle type mobile).
- `src/pages/Login.tsx`, `ChangePassword.tsx`, `MyAccount.tsx` → cartes étroites centrées, à laisser tel quel.

## Modifications proposées

1. **`src/App.css`** : neutraliser les règles `#root` (retirer `max-width`, `margin: auto`, `padding`, `text-align`) pour ne plus brider l'app globalement. Conserver le fichier (utilisé par d'autres styles legacy) mais vider le bloc `#root`.

2. **`src/pages/TeamDayView.tsx`** : remplacer `max-w-6xl mx-auto px-6` par `w-full px-6` (pleine largeur, padding latéral conservé).

3. **`src/pages/TeamWeekView.tsx`** : remplacer `max-w-[1600px] mx-auto px-4` par `w-full px-4`.

4. **`src/pages/CongesView.tsx`** : passer la vue magasin en `max-w-full` également (alignée sur la vue Direction).

5. **Pages laissées intentionnellement étroites** (pas de changement) :
   - `EmployeeView` (lecture personnelle, format mobile)
   - `Login`, `ChangePassword`, `MyAccount` (formulaires)
   - `Index.tsx` (déjà en pleine largeur via `flex-1`, pas de contrainte propre)

## Hors périmètre
- Pas de refonte du contenu interne (tableaux, grilles) : ils s'élargiront naturellement une fois les conteneurs libérés.
- Pas de modification des composants UI eux-mêmes.
- Pas de changement de la logique métier ni des données.

## Vérification après implémentation
- Charger `/`, `/equipe-du-jour`, `/planning-equipe`, `/conges` en grand écran (1791 px actuel) et confirmer que le contenu occupe toute la largeur sans marges vides.
- Vérifier que les pages "étroites" (login, mon compte, mon planning) restent inchangées.
