## Objectif

Adoucir le thème sombre actuellement trop noir en passant à une palette **gris ardoise (slate)** avec une légère touche bleutée, plus moderne et confortable visuellement.

## Changements (uniquement `src/index.css`, bloc `.dark`)

Remplacer les valeurs HSL grises pures par des slate teintés bleu :

| Token | Avant (noir pur) | Après (slate) |
|---|---|---|
| `--background` | `0 0% 8%` | `222 25% 11%` (#0f172a) |
| `--card` / `--popover` | `0 0% 12%` | `222 22% 15%` (#1e293b) |
| `--secondary` / `--muted` / `--input` | `0 0% 16-22%` | `217 19% 22%` (#334155) |
| `--border` | `0 0% 22%` | `217 18% 26%` |
| `--muted-foreground` | `0 0% 65%` | `215 16% 70%` |
| `--foreground` / `--card-foreground` / `--popover-foreground` / `--secondary-foreground` | `0 0% 92%` | `210 25% 94%` (légère teinte froide cohérente) |
| `--sidebar-bg` | `0 0% 6%` | `222 28% 9%` (sidebar reste la plus foncée, contraste avec le contenu) |
| `--sidebar-hover` | `0 0% 14%` | `217 20% 18%` |
| `--sidebar-fg` | `0 0% 85%` | `215 16% 80%` |

Le jaune Fnac (`--primary`, `--accent`, `--ring`) et les status (success/warning/destructive) restent inchangés — ils ressortent très bien sur slate.

## Vérification

- Basculer en thème sombre, parcourir : Dashboard, Planning semaine, Équipe du jour, Congés (vue mois + trimestre), Mon compte.
- Vérifier que :
  - Le fond principal est gris ardoise (pas noir).
  - La sidebar reste légèrement plus foncée que le contenu (hiérarchie préservée).
  - Le jaune Fnac reste lisible et n'a pas changé.
  - Les KPI cards, tables, popovers, dialogs ont un contraste correct.
- Repasser en clair : aucune régression (le bloc `:root` n'est pas touché).

## Fichier modifié

- `src/index.css` (bloc `.dark` uniquement)
