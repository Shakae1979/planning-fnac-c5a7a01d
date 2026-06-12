## Correctif

Dans `src/components/team-day/HourlyGrid.tsx` :

1. Calculer une clé stable des collaborateurs actifs :
   ```ts
   const employeesKey = useMemo(
     () => employees.filter(e => e.hasShift && !e.conge).map(e => e.id).sort().join(","),
     [employees]
   );
   ```
2. Remplacer la dépendance `[date, employees]` du `useEffect` de chargement par `[date, employeesKey]`. L'effet ne se redéclenchera plus à chaque re-render du parent — seulement quand la date ou la composition de l'équipe change réellement.

3. Bump version : `src/lib/version.ts` → `v4.53`, et mémoire `mem://features/versions.md` + index mis à jour.

## Hors scope

Aucune modification de `TeamDayView`, du modèle de données, ni des autres vues.
