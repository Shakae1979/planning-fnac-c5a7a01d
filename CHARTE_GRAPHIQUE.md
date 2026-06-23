# Charte Graphique — Planning Fnac (Belgique)

Document de référence visuelle et stylistique pour l'application **Planning Fnac**, outil interne de gestion des plannings des magasins Fnac Belgique.

---

## 1. Identité

- **Nom produit** : Planning Fnac
- **Contexte** : Application interne Fnac Belgique
- **Ton** : Professionnel, sobre, utilitaire, orienté efficacité opérationnelle
- **Langues** : Bilingue FR / NL (via `useI18n`)
- **Formats belges** :
  - Dates : `DD/MM/YYYY`
  - Heures : `HHhMM` (ex. `09h30`)
  - Semaines : ISO, commençant le **lundi**, notation `S12`

---

## 2. Palette primaire

| Rôle              | Hex        | HSL                  | Usage                                  |
| ----------------- | ---------- | -------------------- | -------------------------------------- |
| Jaune Fnac        | `#E1A400`  | `40° 85% 44%`        | Couleur de marque, CTA, focus, accents |
| Charbon (sidebar) | `#1A1A1A`  | `0° 0% 10%`          | Fond sidebar, header sombre            |
| Texte sidebar     | `#CCCCCC`  | `0° 0% 80%`          | Texte / icônes sur fond charbon        |

---

## 3. Surfaces

### Light mode (défaut)
| Token         | Hex        | Usage                |
| ------------- | ---------- | -------------------- |
| Background    | `#F7F7F7`  | Fond global app      |
| Surface       | `#FFFFFF`  | Cartes, modales      |
| Foreground    | `#212121`  | Texte principal      |

### Dark mode
| Token         | Hex        | Usage                |
| ------------- | ---------- | -------------------- |
| Background    | `#151B2B`  | Fond global app      |
| Surface       | `#1E2333`  | Cartes, modales      |
| Foreground    | `#E2E8F0`  | Texte principal      |

---

## 4. Typographie

- **Inter** (400 → 800) : tout le texte d'interface (titres, body, boutons, labels)
- **Roboto Mono** : chiffres tabulaires (horaires, dates, ETP, heures nettes) pour alignement vertical strict
- **Pas de serif** sous aucune circonstance

---

## 5. Départements (6 rôles)

Chaque rôle possède une couleur sémantique utilisée pour bordures, badges, barres Gantt.

| Rôle         | Hex (500) | Bordure (500) | Fond léger (100) |
| ------------ | --------- | ------------- | ---------------- |
| Responsable  | `#EF4444` | rouge         | rouge clair      |
| Technique    | `#F97316` | orange        | orange clair     |
| Éditorial    | `#EAB308` | jaune         | jaune clair      |
| Stock        | `#3B82F6` | bleu          | bleu clair       |
| Caisse       | `#10B981` | émeraude      | émeraude clair   |
| Stagiaire    | `#EC4899` | rose          | rose clair       |

**Tri global** : `rôle > sort_order > nom` (helper `sortByRoleOrder` dans `format.ts`).

---

## 6. États sémantiques

| État           | Hex        | Usage                              |
| -------------- | ---------- | ---------------------------------- |
| Succès         | `#10B981`  | Confirmations, validations         |
| Avertissement  | `#F59E0B`  | Alertes douces, couverture limite  |
| Erreur         | `#EF4444`  | Erreurs, couverture critique       |
| Info FR        | `#FBBF24`  | Vacances scolaires francophones    |
| Info NL        | `#7DD3FC`  | Vacances scolaires néerlandophones |
| Férié belge    | `#10B981`  | Jours fériés (highlight émeraude)  |

---

## 7. Tokens CSS (extrait `index.css`)

```css
:root {
  --primary: 40 85% 44%;        /* Jaune Fnac */
  --background: 0 0% 97%;       /* #F7F7F7 */
  --foreground: 0 0% 13%;       /* #212121 */
  --sidebar-bg: 0 0% 10%;       /* Charbon */
  --sidebar-fg: 0 0% 80%;       /* #CCCCCC */
  --radius: 0.5rem;
}
```

> **Règle absolue** : toutes les couleurs passent par les tokens HSL. **Jamais** de `text-white`, `bg-black`, ni `bg-[#...]` en dur dans les composants — cela casse le dark mode.

---

## 8. Composants

- **Boutons** : `border-radius: 0.5rem`, fond jaune `#E1A400` pour primaire, hover légèrement assombri
- **Inputs** : focus ring jaune `#E1A400`, bordure neutre au repos
- **Badges** : forme pill, couleur du rôle ou de l'état
- **Tableaux** : zébrage léger, en-têtes sticky, chiffres en `Roboto Mono`
- **Cartes KPI** : surface blanche, ombre douce, titre en small caps, chiffre en gros mono
- **Modales / popovers** : surface, radius `0.5rem`, ombre marquée

---

## 9. Vues spécifiques

### Vue Gantt (semaine)
- Barres horizontales colorées **par rôle**
- Créneaux de 30 minutes
- **Pas de colonne de total hebdomadaire**

### Vue Congés
- Grille trimestrielle **verticale** (style Excel)
- Stagiaires **exclus** de la vue
- Jours fériés belges surlignés émeraude
- Vacances scolaires FR / NL / Communes en pastilles colorées
- Légende dans un `Popover`

### Mode Direction Fnac
- Magasin **virtuel** agrégeant les responsables multi-magasins
- Badges absences **3 caractères** (compacts)
- Mode déplacement : `MapPin` sans heure de fin

### Planning jour (grille interactive)
- Créneaux 30 minutes
- Multi-sélection par défaut (assignation de masse)
- Statuts spéciaux : Heure de table, Extérieur, Roulement (0h pour ETP)
- Pause 1h déduite **uniquement** si shift ≥ 6h

---

## 10. Contraintes de design (à respecter strictement)

- ❌ **Pas de dégradés violets / indigo** (esthétique IA générique)
- ❌ **Pas de polices serif**
- ❌ **Pas de couleurs hardcodées** dans les composants (`text-white`, `bg-[#...]`)
- ❌ **Pas de "Liens vendeurs"**, pas de "Recap", pas de "Get started", pas de reset password
- ✅ Design **plat, utilitaire**, dense en information
- ✅ Dark mode géré **exclusivement** via variables CSS HSL
- ✅ Identité Fnac affirmée : jaune `#E1A400` + sidebar charbon
- ✅ Cohérence multi-magasin : tout isolé par `store_id`

---

_Document maintenu en parallèle du `CHANGELOG.md`. Version courante de l'app : voir `src/lib/version.ts`._