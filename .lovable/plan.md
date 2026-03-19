

# Remplacer les boutons template par "Semaine type" et "Copier semaine précédente"

## Résumé

Renommer et restructurer les deux boutons existants :
- **"Sauver comme Sem. 0"** → **"Sauver comme semaine type"** (même logique, libellé plus clair)
- **"Initialiser depuis Sem. 0"** → **"Copier semaine précédente"** (nouvelle logique : copie les horaires de la semaine N-1 vers la semaine courante)

## Changements

### Fichier : `src/components/dashboard/ScheduleEditor.tsx`

1. **Bouton "Sauver comme semaine type"** (ligne ~532-534)
   - Renommer le libellé de "Sauver comme Sem. 0" → "Sauver semaine type"
   - La mutation `saveAsTemplateMutation` reste identique (sauvegarde dans `TEMPLATE_WEEK = 1970-01-05`)
   - Toast mis à jour : "Semaine type sauvegardée !"

2. **Bouton "Initialiser depuis semaine type"** — conservé tel quel mais renommé "Appliquer semaine type"
   - Libellé : "Appliquer sem. type"

3. **Nouveau bouton "Copier semaine précédente"**
   - Ajouter une nouvelle mutation `copyPreviousWeekMutation` qui :
     - Calcule le lundi de la semaine précédente (`weekOffset - 1`)
     - Récupère les `weekly_schedules` de cette semaine
     - Pour chaque employé, copie les colonnes horaires (lundi_start..samedi_end) dans `localEdits`
   - Les données sont chargées dans l'éditeur local (non sauvées directement), permettant de vérifier et ajuster avant sauvegarde
   - Icône : `Copy`, libellé : "Copier sem. précédente"

### Disposition des boutons (barre d'outils)
```text
[Imprimer] [Sauver sem. type] [Appliquer sem. type] [Copier sem. précédente] [Sauvegarder]
```

## Détails techniques

- La mutation `copyPreviousWeekMutation` fait un `SELECT` sur `weekly_schedules` avec `week_start = previousWeekStr`, puis peuple `localEdits` avec les valeurs trouvées pour chaque employé
- Les champs copiés : `lundi_start`, `lundi_end`, `mardi_start`, ..., `samedi_end`
- Si un employé n'a pas de planning la semaine précédente, il est ignoré

