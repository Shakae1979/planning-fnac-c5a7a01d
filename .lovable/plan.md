## Objectif
Ajouter un bouton bascule thème clair / thème sombre dans le header Fnac.

## Étapes

1. **Définir les tokens du thème sombre dans `src/index.css`**
   - Ajouter un bloc `.dark { ... }` avec les variables HSL inversées : `--background`, `--foreground`, `--card`, `--popover`, `--muted`, `--secondary`, `--border`, `--input`, `--card-foreground`, etc.
   - Conserver le jaune Fnac `--primary` (40 85% 44%) inchangé pour préserver l'identité de marque.
   - Le sidebar reste sombre (déjà foncé), inchangé.

2. **Créer un hook `src/hooks/useTheme.tsx`**
   - Provider qui lit/écrit le thème dans `localStorage` (`planning-fnac-theme`).
   - Applique/retire la classe `dark` sur `document.documentElement`.
   - Défaut : `light` (préserve l'apparence actuelle).
   - Expose `{ theme, setTheme, toggleTheme }`.

3. **Envelopper l'app avec `ThemeProvider`** dans `src/App.tsx` (à l'intérieur de `I18nProvider`).

4. **Ajouter le bouton dans `src/components/FnacHeader.tsx`**
   - Placé juste avant `LanguageSwitcher`.
   - Icône `Sun` (mode clair actif) / `Moon` (mode sombre actif) de `lucide-react`.
   - Même style visuel que les autres boutons du header (h-8, fond `--sidebar-hover`).
   - Tooltip + `aria-label` traduits via `useI18n` (clés `nav.theme.light` / `nav.theme.dark`).

5. **Ajouter les traductions** dans `src/lib/i18n.tsx` pour FR et NL (`Mode clair` / `Lichte modus`, `Mode sombre` / `Donkere modus`).

## Détails techniques
- Tailwind est déjà configuré en `darkMode: ["class"]` — aucune modif de config.
- Toggle initialisé via script inline dans `index.html` n'est pas nécessaire (défaut clair = comportement actuel, pas de flash).
- Les composants utilisent déjà les tokens sémantiques (`bg-background`, `text-foreground`, etc.), donc la majorité de l'UI s'adapte automatiquement.

## Hors périmètre
- Pas de détection automatique `prefers-color-scheme` (sauf si demandé ensuite).
- Pas de synchronisation cross-device via la base.
- Pas de revue/ajustement page par page : on traite les régressions visuelles si tu en signales après coup.