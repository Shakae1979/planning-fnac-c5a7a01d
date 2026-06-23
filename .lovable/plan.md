## Objectif
Créer un fichier `CHARTE_GRAPHIQUE.md` à la racine du projet (`/dev-server/`) qui documente exhaustivement la charte graphique de Planning Fnac (Belgique).

## Contenu du fichier
Le fichier comprendra les sections suivantes :

1. **Identité** — Application interne, ton professionnel, bilingue FR/NL, formats belges (DD/MM/YYYY, HHhMM, semaines ISO commençant lundi).

2. **Palette primaire** — Jaune Fnac `#E1A400` (HSL 40° 85% 44%), charbon `#1A1A1A`, texte sidebar `#CCCCCC`.

3. **Surfaces** — Light mode : fond `#F7F7F7`, surface `#FFFFFF`, texte `#212121`. Dark mode : fond `#151B2B`, surface `#1E2333`, texte `#E2E8F0`.

4. **Typographie** — Inter (400–800) pour le texte, Roboto Mono pour les chiffres tabulaires (horaires, dates, ETP).

5. **Départements (6 rôles)** avec couleurs associées :
   - Responsable : rouge `#EF4444`
   - Technique : orange `#F97316`
   - Éditorial : jaune `#EAB308`
   - Stock : bleu `#3B82F6`
   - Caisse : émeraude `#10B981`
   - Stagiaire : rose `#EC4899`

6. **États sémantiques** — Succès `#10B981`, Avertissement `#F59E0B`, Erreur `#EF4444`, Info scolaire FR `#FBBF24` / NL `#7DD3FC`.

7. **Tokens CSS** — Variables utilisées dans le projet : `--primary: 40 85% 44%`, `--background: 0 0% 97%`, `--sidebar-bg: 0 0% 10%`, `--radius: 0.5rem`.

8. **Composants** — Boutons (radius `0.5rem`, fond jaune), inputs (focus ring jaune), badges pills, tableaux, cartes KPI.

9. **Vues spécifiques** — Gantt (barres par rôle, sans colonne totale), congés (grille trimestrielle verticale, stagiaires exclus), mode Direction Fnac (vue agrégée multi-magasin, badges 3 caractères).

10. **Contraintes de design** — Pas de dégradés violets, pas de serif, pas de hardcoded colors, design plat utilitaire, dark mode via variables CSS.

## Livrable
Un seul fichier : `CHARTE_GRAPHIQUE.md` à la racine du projet.
