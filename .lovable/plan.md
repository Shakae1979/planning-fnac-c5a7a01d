## Objectif
Afficher le numéro de version de l'application dans le footer, au format **SemVer** (ex: `v1.2.3`).

## Problème actuel
- Le projet n'a **pas de footer global**.
- Le `package.json` est à `0.0.0` sans versioning actif.

## Plan technique

### 1. Constante de version
Créer `src/lib/version.ts` :
```typescript
export const APP_VERSION = "v1.0.0";
```

### 2. Synchroniser `package.json`
Mettre à jour la clé `"version"` pour correspondre (`1.0.0`).

### 3. Composant Footer
Créer `src/components/layout/AppFooter.tsx` : petit bandeau fixé en bas, texte discret (text-xs, text-muted-foreground), affichant :
> `Planning Fnac — v1.0.0`

### 4. Intégration
- **Pages avec sidebar** (`Index.tsx`) : ajouter le footer dans le `<main>` en dessous du contenu.
- **Pages pleine largeur** (`TeamDayView`, `TeamWeekView`, `EmployeeView`, `CongesView`, `MyAccount`) : ajouter le footer à la fin de leur `div` principale.
- **Login** : peut être exclu ou inclure une variante minimaliste.

### 5. Design
- Hauteur compacte (~32 px)
- Bordure supérieure subtile (`border-t`)
- Couleurs adaptées au thème ardoise actuel (`bg-card`, `text-muted-foreground`)
- Ne pas empiéter sur les impressions (`no-print`)

## Livrables
- `src/lib/version.ts`
- `src/components/layout/AppFooter.tsx`
- Modifications dans `package.json` + pages concernées