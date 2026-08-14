# Magasin par défaut à la connexion

## Objectif
À la connexion, l'application doit ouvrir directement sur **mon magasin**, et non sur le premier magasin de la liste (ordre alphabétique).

## Comportement actuel
Le sélecteur de magasin choisit toujours le premier élément de la liste : pour un admin c'est le premier magasin par nom, pour un éditeur/responsable le premier magasin assigné. Aucun souvenir du magasin précédemment choisi.

## Comportement souhaité
Ordre de priorité pour déterminer le magasin affiché à l'ouverture :

1. **Dernier magasin sélectionné** (mémorisé par utilisateur, restauré à la reconnexion) — s'il fait toujours partie des magasins accessibles.
2. **Mon magasin de rattachement** : le magasin lié à ma fiche collaborateur (via mon adresse e-mail) ou, à défaut, mon affectation magasin.
3. Sinon, premier magasin accessible (comportement actuel), en évitant de sélectionner « Direction Fnac » par défaut.

Le changement de magasin dans le sélecteur reste possible à tout moment ; le nouveau choix devient le magasin par défaut de la prochaine connexion.

## Détails techniques
- `src/hooks/useStore.tsx` : après le chargement de `stores`, résoudre le magasin initial selon la priorité ci-dessus au lieu de `storeList[0]`.
- Mémorisation : clé `localStorage` par utilisateur (`planning-fnac:last-store:<user id>`), écrite dans un `setCurrentStore` encapsulé, lue au chargement et validée contre la liste des magasins accessibles.
- Rattachement : lecture de `employees.store_id` filtré sur `email = user.email` (une seule requête, uniquement si aucun magasin mémorisé valide).
- Filtrer les magasins `is_direction` du choix par défaut (ils restent sélectionnables manuellement).
- Bump de version dans `src/lib/version.ts` + entrée CHANGELOG.
