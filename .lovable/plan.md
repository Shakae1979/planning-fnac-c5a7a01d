# Ajouter le type d'absence "Syndicat"

Nouveau type de congé « Journée syndicale », utilisable comme les autres types (ajout, affichage calendrier, impression, fiche employé).

## Ce qui change

- Nouveau type `syndicat` disponible dans le formulaire d'ajout de congés et dans la légende.
- Couleur dédiée : indigo (distincte des types existants), avec variante mode sombre.
- Libellés bilingues : FR « Syndicat » / NL « Vakbond », abréviation FR « SYN » / NL « VAK » pour les vues compactes (Direction, mobile).
- Icône dédiée dans la fiche employé et le détail des heures.

## Détails techniques

- `src/components/dashboard/CongesCalendar.tsx` : ajouter `"syndicat"` à `CONGE_TYPES_KEYS` et une entrée `syndicat: "bg-indigo-500 dark:bg-indigo-600"` dans `CONGE_TYPE_COLORS`. La légende, le sélecteur de type, la légende d'impression et les vues mois/trimestre se mettent à jour automatiquement.
- `src/lib/i18n.tsx` : ajouter `leave.syndicat` et `leave.syndicat.short` (FR/NL).
- `src/pages/EmployeeView.tsx` et `src/components/dashboard/EmployeeHoursDetailDialog.tsx` : ajouter la couleur `syndicat: "bg-indigo-500"` et une icône (`Users`).
- Aucune migration : `conges.type` est une colonne texte libre.
- Bump `src/lib/version.ts` en v5.00 + entrée en haut de `CHANGELOG.md`.
