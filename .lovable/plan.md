# Nouveau rôle « Responsable » (entre Éditeur et Admin)

## Conseil dénomination FR / NL

Trois pistes cohérentes avec le ton actuel de l'app (Planning Fnac, bilingue) :

| Option | FR | NL | Commentaire |
|---|---|---|---|
| **A (recommandée)** | Responsable | Manager | "Manager" est totalement naturel en NL belge et déjà utilisé en magasin Fnac. Court, clair, distinct de "Éditeur/Bewerker". |
| B | Responsable | Verantwoordelijke | Plus formel, mais long et lourd visuellement dans les badges/sélecteurs. |
| C | Manager | Manager | Identique FR/NL, ultra court — mais on perd la nuance "Responsable de magasin" en FR. |

→ Je pars sur **A : Responsable / Manager** sauf indication contraire.

Remarque : ne pas confondre avec la catégorie d'employé `responsable` (hiérarchie métier). Ici on parle d'un **rôle applicatif** (droits dans l'app). Pour éviter toute ambiguïté côté code, l'enum sera nommé `manager` (anglais, comme `admin`/`editor`/`user`), et seul l'affichage UI dira "Responsable" en FR / "Manager" en NL.

## Hiérarchie cible

```text
admin       → tout, tous magasins, gestion globale (magasins, comptes admin…)
manager     → ses magasins assignés : éditeur + paramètres magasin + gestion comptes du magasin
editor      → ses magasins assignés : planning, congés, équipe
user        → lecture seule
```

Le `manager` **hérite** de tous les droits `editor`, plus :
- accès complet aux **Paramètres magasin** (heures d'ouverture, A/B, heure de table, et tout réglage futur ajouté là — ex. email de contact demandé pour l'éditeur)
- gestion des **comptes utilisateurs de ses magasins** (créer / modifier rôle editor|user|manager / supprimer — comme le fait aujourd'hui un "store manager" via le flag `is_manager`)
- ne peut **pas** créer d'admin, ni gérer les magasins eux-mêmes (création/suppression/renommage), ni voir les comptes d'autres magasins.

## Lien avec le flag `is_manager` existant

Aujourd'hui il y a déjà un mécanisme "store manager" porté par `user_store_assignments.is_manager` (utilisé dans `manage-users` edge function pour déléguer la gestion de comptes). Deux options :

- **Option 1 (recommandée)** : conserver `is_manager` tel quel et **ajouter** le rôle global `manager`. Un `manager` est automatiquement traité comme `is_manager` sur tous ses magasins assignés. Avantage : pas de migration de données, rétrocompatible.
- Option 2 : remplacer `is_manager` par le rôle. Plus propre mais casse l'existant et oblige à migrer les flags actuels.

→ Je pars sur l'**Option 1**.

## Plan de mise en œuvre

### 1. Migration base de données
- `ALTER TYPE public.app_role ADD VALUE 'manager';` (après `editor`, avant `user`).
- Mettre à jour `has_role` : pas de changement nécessaire (fonctionne par valeur exacte).
- **RLS** : étendre toutes les policies actuellement réservées à `admin` ou `editor` pour inclure `manager` là où c'est pertinent :
  - `stores` UPDATE → autoriser `manager` sur ses magasins assignés (même condition que la policy éditeur du plan v4.58).
  - `store_settings` ALL → idem.
  - `employees`, `weekly_schedules`, `conges`, `day_comments`, `employee_day_flags`, `schedule_role_overrides` → ajouter `manager` partout où `editor` est autorisé.

### 2. Edge function `manage-users`
- Traiter `callerRole === 'manager'` comme un super-`is_manager` : autorisé à créer/modifier/supprimer comptes `editor`/`user`/`manager` (pas `admin`) **dans ses magasins assignés**.
- Refuser `set_manager` pour `manager` (réservé admin — cohérent avec la logique actuelle).
- Autoriser `bulk_import` pour `manager` uniquement sur ses magasins (ou rester admin-only — à confirmer ; par défaut je laisse admin-only).

### 3. Front-end
- **`useAuth`** : type `AppRole` ajoute `"manager"`.
- **`Sidebar.tsx`** : afficher "Paramètres magasin" (`settings`) pour `admin | editor | manager`. Afficher "Comptes utilisateurs" pour `admin | manager` (aujourd'hui visible aux éditeurs *manager de magasin* via flag — on ajoute le rôle).
- **Garde-fous** d'accès dans les vues sensibles (`StoreManager`, création admin…) : exclure `manager`.
- **`UserManager`** : le manager voit uniquement les comptes des magasins qu'il gère ; le sélecteur de rôle propose `manager | editor | user` (pas `admin`).
- **`StoreSelfSettings`** : accessible aux `manager` aussi (déjà OK une fois la RLS étendue).

### 4. i18n
- `roles.manager` = FR "Responsable" / NL "Manager".
- Mettre à jour tous les écrans qui affichent le rôle (UserManager, badges, filtres).

### 5. Version
- `src/lib/version.ts` → bump (v4.68).

## Hors scope
- Pas de refonte du flag `is_manager` (conservé).
- Pas de nouveau réglage "email de contact magasin" dans ce plan — à traiter dans une demande dédiée (tu l'as évoqué : on l'ajoutera ensuite, et il sera automatiquement éditable par `manager` grâce aux nouvelles RLS).
- Pas de changement pour le rôle `user`.

## Question ouverte
Confirmes-tu **Responsable / Manager** comme libellés FR/NL ? Si tu préfères "Verantwoordelijke" en NL, je l'applique sans rien changer d'autre au plan.
