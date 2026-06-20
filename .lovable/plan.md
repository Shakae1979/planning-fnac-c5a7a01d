## Objectif

Mettre en place un **CHANGELOG.md** à la racine du projet pour tracer chaque version de Planning Fnac, et l'alimenter rétroactivement avec les versions connues + à chaque future modification.

## Format adopté

Inspiré de [Keep a Changelog](https://keepachangelog.com), simplifié :

- Versions listées de la plus récente à la plus ancienne
- Date au format belge `DD/MM/YYYY`
- Une seule section par version : liste à puces des **fonctionnalités majeures** uniquement (pas de fixes mineurs ni détails DB)
- Langue : **français uniquement**

Exemple :

```markdown
# Changelog — Planning Fnac

Toutes les évolutions notables de l'application.

## v4.70 — 20/06/2026
- Réorganisation des employés par glisser-déposer dans le planning hebdomadaire (ordre conservé par catégorie de rôle, partagé pour tout le magasin).

## v4.69 — 19/06/2026
- Nouveau rôle « Manager » : accès aux paramètres du magasin et au planning Direction Fnac (entre Éditeur et Admin).

## v4.68 — …
- …
```

## Reconstruction de l'historique

Reconstituer les ~10 dernières versions à partir de la mémoire projet (`mem://index.md` liste déjà les grandes features) et du dossier `supabase/migrations` (dates des changements DB importants). Les versions antérieures qu'on ne peut pas dater précisément seront regroupées sous une entrée `## Versions antérieures` listant les jalons sans date.

Versions identifiables à partir du contexte actuel :
- **v4.70** (20/06/2026) — Drag & drop ordre employés
- **v4.69** (19/06/2026) — Rôle Manager + paramètres magasin retirés à Éditeur
- **v4.68** (19/06/2026) — Refonte gestion des rôles (politique d'accès Direction Fnac)

Versions plus anciennes : entrée groupée listant les jalons mémorisés (heure de table par magasin, copier horaires N-1, semaines A/B, vue Gantt, jours fériés belges, vacances scolaires, etc.) sans numéro précis.

## Processus pour les futures versions

Règle ajoutée à `mem://index.md` (section Core) :

> **À chaque bump de `src/lib/version.ts`, ajouter une entrée en haut de `CHANGELOG.md` avec la date du jour (DD/MM/YYYY) et un résumé FR des fonctionnalités livrées.**

Cette règle complète celle existante sur le bump de version. L'agent l'appliquera systématiquement.

## Fichiers touchés

```text
CHANGELOG.md            # nouveau fichier à la racine
mem://index.md          # ajout de la règle "mettre à jour CHANGELOG à chaque bump"
mem://features/versions # mise à jour de la mémoire existante avec le nouveau processus
```

## Hors scope

- Pas d'affichage du changelog dans l'interface utilisateur (peut s'ajouter plus tard si besoin).
- Pas de versioning sémantique strict (major.minor.patch) — on garde le format `vX.YY` actuel.
- Pas de traduction NL.
- Pas de génération automatique depuis git — l'agent maintient le fichier manuellement à chaque changement.
