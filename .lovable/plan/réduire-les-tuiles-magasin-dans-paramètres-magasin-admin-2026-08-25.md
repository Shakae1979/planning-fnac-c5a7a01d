# Réduire les tuiles magasin dans Paramètres magasin (admin)

## Objectif
Permettre à l'admin de réduire/replier chaque carte magasin sur la page « Paramètres magasin » afin de gagner de la place quand la liste est longue.

## Choix validés
- **Réduction par tuile** : chaque magasin aura un bouton de collapse/expand dans son en-tête.
- **Mémorisation** : l'état replié/déplié sera stocké dans `localStorage` et restauré au retour sur la page.

## Travail à faire

### 1. `src/components/dashboard/StoreManager.tsx`
- Ajouter un état local `collapsed: Record<string, boolean>` initialisé depuis `localStorage` (clé `fnac-store-collapsed`).
- Ajouter une fonction `toggleCollapse(storeId)` qui met à jour l'état et sauvegarde dans `localStorage`.
- Modifier le rendu de chaque carte magasin :
  - L'en-tête (nom, ville, nombre de collaborateurs, boutons éditer/supprimer) reste toujours visible.
  - Ajouter un bouton avec chevron à côté des actions pour replier/déplier la tuile.
  - Masquer le corps (toggles A/B, heure de table, multi-métier, 2 étages, gestion des managers, et `InlineStoreSettings`) quand la carte est repliée.
  - Ajouter une transition simple (`transition-all` / `overflow-hidden`) pour le replier/déplier.
- Si la carte est repliée, afficher éventuellement une ligne compacte sous l'en-tête indiquant les options activées (ex. : A/B, heure de table, multi-métiers, 2 étages) pour éviter de perdre le contexte.

### 2. `src/lib/i18n.tsx`
- Ajouter les clés de traduction bilingues :
  - `store.collapse` : « Réduire » / « Inklappen »
  - `store.expand` : « Développer » / « Uitklappen »

### 3. Versioning
- `src/lib/version.ts` : passer à `v5.13`.
- `CHANGELOG.md` : ajouter une entrée en haut de fichier pour `v5.13` avec la date du jour (25/08/2026) mentionnant la possibilité de réduire les tuiles magasin.

## Vérification
- Ouvrir la page « Paramètres magasin » en admin, cliquer sur le bouton réduire : la tuile doit ne plus afficher que l'en-tête.
- Recharger la page : l'état replié doit être conservé.
- Passer en NL et vérifier que les tooltips/libellés sont traduits.
- Vérifier que la version affichée et le CHANGELOG sont à jour.
