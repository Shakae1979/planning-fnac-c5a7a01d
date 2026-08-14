# Administration → Magasins : cartes repliables

## Objectif
La liste des magasins affiche tout en même temps (réglages A/B, heure de table, responsables, horaires d'ouverture par jour), ce qui rend la page très longue pour l'admin. Chaque magasin devient une carte repliable, fermée par défaut.

## Ce qui change
- Chaque magasin s'affiche par défaut en une seule ligne compacte : icône, nom, ville, nombre de collaborateurs, plus quelques badges de synthèse (semaines A/B activées, heure de table activée, nombre de responsables).
- Un clic sur la ligne (ou sur le chevron à droite) déplie la carte et révèle le contenu actuel : bascules A/B et heure de table, liste et ajout de responsables, horaires d'ouverture par jour.
- Les boutons Modifier et Supprimer restent visibles sur la ligne repliée et n'ouvrent pas la carte par erreur.
- Boutons « Tout replier » / « Tout déplier » en haut de la liste.
- L'édition du nom/ville et la recherche existante continuent de fonctionner comme aujourd'hui ; passer un magasin en mode édition n'oblige pas à le déplier.
- Les libellés sont ajoutés en FR et NL.

## Détails techniques
- `src/components/dashboard/StoreManager.tsx` : état local `openIds: Set<string>` (vide au départ), en-tête de carte cliquable avec `aria-expanded`, chevron `ChevronDown`/`ChevronRight`, et rendu conditionnel du bloc détaillé (bascules, responsables, `InlineStoreSettings`).
- `stopPropagation` sur les actions Modifier/Supprimer pour éviter le toggle.
- `InlineStoreSettings` n'est monté que lorsque la carte est ouverte, ce qui allège aussi les requêtes de réglages.
- Nouvelles clés i18n dans `src/lib/i18n.tsx` : « Tout replier », « Tout déplier ».
- Bump `src/lib/version.ts` en v4.91 + entrée en haut de `CHANGELOG.md`.
