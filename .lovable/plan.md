## Problème

Certains contrats doivent être à 0h/semaine, mais l'expression `Number(hours) || 36` remplace toute valeur 0 par 36 (car `0` est falsy en JS). Impossible donc de sauvegarder un contrat à 0h.

## Correctifs

1. **`src/components/dashboard/EmployeeSheet.tsx`** (l.96) — remplacer `Number(hours) || 36` par une lecture qui accepte 0 :
   ```ts
   const parsed = Number(hours);
   contract_hours: Number.isFinite(parsed) && parsed >= 0 ? parsed : 36,
   ```

2. **`src/components/dashboard/EmployeeManager.tsx`** (l.50) — même correction pour la création d'employé.

3. **`src/components/dashboard/TeamAndAccounts.tsx`** (l.169) — même correction.

4. **`supabase/functions/manage-users/index.ts`** (l.409) — même correction côté import :
   ```ts
   contract_hours: (typeof heures_contrat === "number" && heures_contrat >= 0) ? heures_contrat : 36,
   ```

5. **`src/lib/version.ts`** — bump `v4.83` → `v4.84`.

6. **`CHANGELOG.md`** — nouvelle entrée v4.84 (FR, date du jour) : « Autorise les contrats à 0h/semaine (correction du fallback qui forçait 36h). »

## Hors périmètre

- Aucun changement de schéma DB (la colonne accepte déjà 0, DEFAULT reste 36).
- Aucune logique de calcul d'heures/ETP modifiée : les employés à 0h apparaîtront simplement avec un contrat à 0 dans les affichages existants.
- L'input UI (`min={0}`) autorise déjà la saisie de 0.
