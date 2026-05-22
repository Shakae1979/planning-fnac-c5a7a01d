## Vue d'ensemble enrichie — version épurée

Objectif : ajouter de la valeur sans alourdir. **1 bandeau d'alertes** + **1 ligne de mini-cartes synthétiques**. Pas de tableau supplémentaire, pas de répliques du compteur d'heures déjà présent.

### Disposition

```text
[ KPIs existants ]
─────────────────────────────────────────────
[ Alertes de la semaine ]               ← unique bandeau, visible seulement s'il y a qqch
─────────────────────────────────────────────
[ Occupation % ] [ Non planifiés ] [ Absences 7j ]   ← 3 mini-cartes compactes
─────────────────────────────────────────────
[ Compteur d'heures (existant) ]
```

### Contenu des 4 blocs

**1. Bandeau « Alertes de la semaine »** (masqué si rien à signaler)
- Détection automatique :
  - Employés actifs sans heures planifiées
  - Créneaux 09–20h sans Responsable ou sans Caisse
- Affichage : 1 ligne par alerte, icône + texte court. Pas d'actions complexes, juste de l'info.

**2. Mini-carte « Occupation »**
- Un chiffre : `Σ heures planifiées / Σ heures contrat` en %.
- Libellé court (Sous-effectif / Optimal / Sur-effectif) + petite barre.

**3. Mini-carte « Non planifiés »**
- Compteur `N collaborateurs sans planning`.
- Liste des 3 premiers noms (texte plein, pas de boutons). Si 0 → message positif.

**4. Mini-carte « Absences à venir (7j) »**
- Compteur d'absences sur les 7 prochains jours.
- Liste des 3 premières : nom · type · dates `DD/MM → DD/MM`.

### Ce qu'on NE fait PAS (volontairement)

- Pas de répartition par département (l'info est déjà visible dans le compteur).
- Pas de synthèse heures par catégorie (doublon avec compteur).
- Pas de boutons d'action dans les cartes (clic sur compteur suffit).
- Pas de tableau replié.

### Technique

- Tout côté client à partir de `useStore` (employees + weekly_schedules semaine courante + conges).
- Réutiliser : `CATEGORIES`, formule heures nettes, `getDisplayName`, `formatDateLongBE`.
- I18n FR/NL via `useI18n` (préfixe `overview.*`).
- Cartes shadcn existantes, tokens sémantiques, couleurs département existantes.

### Fichiers touchés

- `src/components/dashboard/DashboardOverview.tsx` — insertion des blocs.
- 1 nouveau fichier : `src/components/dashboard/overview/OverviewInsights.tsx` (regroupe les 4 blocs pour rester compact).
- `src/lib/i18n.tsx` — quelques clés FR/NL.
