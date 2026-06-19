## Compteur ETP — Vue d'ensemble

Ajouter une nouvelle carte KPI "ETP" dans `OverviewInsights` qui affiche côte à côte l'ETP contractuel et l'ETP planifié sur la semaine affichée, avec base **1 ETP = 36h/semaine**.

### Calculs

- `totalContract` = somme `contract_hours` des employés du magasin (déjà calculé dans le composant).
- `totalPlanned` = somme `hours_modified ?? hours_base` des `weekly_schedules` de la semaine (déjà calculé).
- `FTE_BASE = 36`
- `etpContract = totalContract / 36`
- `etpPlanned = totalPlanned / 36`
- `etpDiff = etpPlanned − etpContract`

### UI

Nouvelle carte `etp` ajoutée dans `DEFAULT_ORDER` et `CARD_SPAN` (lg:col-span-1), insérée juste après `occupancy` :

```text
┌─────────────────────────────┐
│ ⚖  ETP (base 36h)       ⋮⋮ │
│                              │
│  Contractuel    Planifié    │
│    12.4           11.8      │
│              Δ -0.6 ETP     │
└─────────────────────────────┘
```

- Icône : `Scale` (lucide-react).
- Chiffres en `font-mono-data`, 1 décimale (`toFixed(1)`).
- Couleur du delta : reprend la logique de l'occupancy (`< -0.3` destructive, `> +0.3` warning, sinon emerald).
- Carte draggable comme les 4 existantes, persistée dans le même `localStorage` (`overview-insights-order-v1`) avec migration : si la carte `etp` n'est pas dans l'ordre stocké, elle est ajoutée à la fin (la logique `missing` existante gère déjà ça).

### i18n

Nouvelles clés dans `src/lib/i18n.tsx` :
- `insights.etp` : "ETP" / "VTE"
- `insights.etpBase` : "base 36h" / "basis 36u"
- `insights.etpContract` : "Contractuel" / "Contractueel"
- `insights.etpPlanned` : "Planifié" / "Gepland"

### Fichiers modifiés

- `src/components/dashboard/overview/OverviewInsights.tsx` — nouvelle carte `etp`, constante `FTE_BASE = 36`, calculs ETP, rendu dans `renderCard`.
- `src/lib/i18n.tsx` — 4 clés FR/NL.
- `src/lib/version.ts` — bump à `v4.56`.

### Hors scope

- Pas de changement DB ni de paramètre configurable par magasin (base 36h codée en dur, modifiable plus tard via store_settings si demandé).
- Pas de modification du Compteur d'heures ni de la page Direction Fnac.
- Pas de calcul ETP mensuel/annuel (uniquement la semaine affichée, comme le reste d'OverviewInsights).
