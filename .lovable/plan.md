## Diagnostic

Le code de `EmployeeSheet.tsx` (l.96) est bien corrigé : `Number("0")` → `0`, isFinite → `true`, `>= 0` → renvoie `0`. La DB n'a aucune contrainte `CHECK`. La RLS employees autorise l'update. Le fix devrait donc fonctionner.

Deux causes probables restantes :

1. **Le navigateur affiche encore l'ancienne version bundle** (le rechargement HMR de Vite peut avoir raté le remplacement de la mutation).
2. **Une autre écriture invisible** vient réécrire la valeur juste après (par ex. un side-effect que je n'ai pas repéré).

## Étapes

1. **Ajouter un log de trace** dans `src/components/dashboard/EmployeeSheet.tsx` juste avant `.update(...)` :
   ```ts
   console.log("[EmployeeSheet] saving contract_hours=", hours, "→", parsed);
   ```
   Puis relire la valeur DB juste après pour confirmer.

2. **Demander à l'utilisateur un rechargement dur** (Ctrl+Shift+R) puis retenter la sauvegarde à 0h.

3. **Vérifier la DB directement** via `supabase--read_query` sur `SELECT id, name, contract_hours FROM employees WHERE ...` juste après l'essai de l'utilisateur, pour savoir si :
   - la valeur est bien écrite en 0 côté DB → problème d'affichage/état local,
   - ou reste à 36 → il y a bien un chemin d'écriture non identifié.

4. Une fois la cause confirmée, appliquer le correctif ciblé (retirer un side-effect, ou nettoyer le state d'affichage). Retirer le `console.log`.

5. Bump version `v4.84` → `v4.85` + entrée `CHANGELOG.md`.

## Hors périmètre

- Aucun changement de schéma DB.
- Aucun changement de logique de calcul d'heures.
