

## Remplacer le bouton "Copier horaires" par "Copier semaine précédente" par employé

### Contexte
Actuellement, à côté du prénom de chaque vendeur dans l'éditeur de planning, il y a un bouton **Copier** (icône Copy) qui copie les horaires de cet employé pour les coller sur d'autres employés. L'utilisateur souhaite que ce bouton copie plutôt les **horaires de la semaine précédente** de ce même employé.

### Modification : `src/components/dashboard/ScheduleEditor.tsx`

1. **Nouvelle fonction `copyPreviousWeekForEmployee(empId)`** :
   - Récupère le planning de la semaine N-1 pour cet employé via Supabase
   - Injecte les valeurs dans `localEdits` pour cet employé uniquement
   - Affiche un toast de confirmation

2. **Remplacement du bouton** (ligne ~751-758) :
   - Remplacer l'icône `Copy` par `ChevronLeft` (cohérent avec le bouton global "Copier sem. précédente")
   - Changer le `onClick` pour appeler `copyPreviousWeekForEmployee(emp.id)` au lieu de `copyEmployeeSchedule(emp.id)`
   - Mettre à jour le `title` en "Copier la semaine précédente pour {nom}"

### Détails techniques
- La fonction fera un appel Supabase ciblé : `weekly_schedules` filtré par `employee_id` et `week_start` de la semaine N-1
- Les champs copiés : `lundi_start/end`, `mardi_start/end`, etc. pour les 7 jours
- Le bouton reste masqué en mode copie (`!isCopyMode`)
- Pas de mutation, juste mise à jour du state `localEdits` (l'utilisateur sauvegarde ensuite manuellement)

