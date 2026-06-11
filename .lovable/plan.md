## Objectif

Compléter `src/components/HelpFAQ.tsx` avec des nouvelles entrées FAQ (FR + NL) couvrant toutes les fonctionnalités récentes, sans toucher aux entrées existantes.

## Nouvelles entrées à ajouter (FR + traduction NL)

1. **Suggestions intelligentes d'horaires** — bouton "Suggérer" dans le planning. Sources consultées dans l'ordre : semaine -1, semaine -2, semaine type (A/B selon parité ISO), même semaine N-1. Seules les cases vides sont remplies. ⚠️ signale les horaires hors heures d'ouverture.

2. **Copier les horaires N-1 d'un employé** — bouton par employé dans le planning pour importer sa propre semaine équivalente de l'année précédente.

3. **Semaine type & semaines A/B** — sauvegarder une semaine de référence comme template, et alterner deux modèles A/B selon la parité de la semaine ISO.

4. **Vue Gantt semaine** — basculer en vue Gantt avec barres horizontales sur la semaine.

5. **Vue Direction Fnac** — magasin virtuel regroupant les managers, avec labels de congés courts (3 caractères) et mode déplacement (MapPin sans heure de fin).

6. **Synchronisation des congés** — les absences saisies dans l'onglet Congés remplacent automatiquement les heures dans le planning.

7. **Alertes de couverture critique** — avertissement quand moins d'un employé par catégorie est présent entre 09h et 20h.

8. **Compteur d'heures en sidebar** — suivi des heures réalisées vs contractuelles directement dans la barre latérale.

9. **Navigation par semaines ISO** — numéros de semaine ISO (S01–S52/53) avec gestion correcte du passage d'année (N-1 prend en compte les années à 53 semaines).

10. **Vue publique des congés** — lien `/conges` en lecture seule pour partager le calendrier annuel sans connexion.

11. **Jours fériés belges & vacances scolaires** — surlignage automatique (vert pour fériés, couleurs FR/NL/Commun pour vacances scolaires) dans les vues trimestrielles.

12. **Paramètres magasin configurables** — heures d'ouverture personnalisables (06h–22h) par magasin depuis l'administration.

## Détails techniques

- Étendre `FAQ_FR` et `FAQ_NL` dans `src/components/HelpFAQ.tsx` (même ordre, mêmes index).
- Aucune autre modification : pas de nouveaux composants, pas de changements i18n, pas de logique métier.
- Conserver le ton concis et orienté utilisateur des entrées existantes.
