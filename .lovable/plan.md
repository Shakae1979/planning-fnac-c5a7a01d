# Export lecture seule des heures (hebdo + mensuel) pour outil externe

Objectif : un endpoint stable, agrégé, en lecture seule, qui renvoie par collaborateur les heures prestées vs contrat, à la semaine et au mois planning, avec le code magasin interne.

## Sur l'email : réponse franche

Exposer les emails via une RPC appelable avec la clé publique (anon) reviendrait à réouvrir exactement la fuite qu'on vient de fermer : n'importe qui avec la clé publique (visible dans le JS de l'app) pourrait aspirer l'annuaire complet des collaborateurs. Donc : oui à l'email, mais **pas** sur un endpoint anonyme.

Solution retenue : l'accès se fait par une **clé d'API dédiée** (secret partagé), vérifiée côté serveur. L'email n'est renvoyé que si l'appel présente cette clé. La table `employees` elle-même ne change pas de droits.

## Ce qui sera construit

### 1. Code magasin interne
Ajout d'une colonne `external_code` (numérique) sur les magasins, remplie ainsi :

| Magasin | Code |
|---|---|
| Liège | 1 |
| Gent | 2 |
| LLN | 7 |
| TDO (Toison d'Or) | 9 |
| Aalst | 10 |
| Charleroi | 11 |
| Luxembourg | 12 |
| Woluwe | 14 |

Les autres magasins (Antwerpen, Brugge, City2, Leuven, Wijnegem, Direction) restent sans code pour l'instant — ils sortiront avec un code vide. Dis-moi les codes si tu veux les compléter.

### 2. Recalcul fiable des heures
Une fonction serveur applique la règle métier de l'app pour chaque semaine :
- si `hours_modified` est renseigné → on le prend ;
- sinon on recalcule depuis les horaires du jour : total brut moins la pause encodée, ou moins 1h automatique si la journée fait 6h ou plus ; `EXT` et `ROULEMENT` comptent 0h.

Ça évite les 0h sur une semaine issue d'une semaine type jamais rouverte.

### 3. Deux jeux de données

**Hebdomadaire** — 1 ligne = collaborateur × semaine :
`employee_id`, `name`, `last_name`, `email`, `store_code`, `store_name`, `contract_hours`, `week_start`, `hours_worked`, `hours_gap`

**Mensuel** — 1 ligne = collaborateur × mois planning :
`employee_id`, `name`, `last_name`, `email`, `store_code`, `store_name`, `contract_hours`, `month` (ex. `2026-08`), `month_worked`, `month_contract` (= contrat × nombre de lundis du mois), `month_gap`

Le mois planning = toutes les semaines dont le lundi tombe dans le mois.

### 4. Endpoint unique paramétrable
Une fonction serveur `hours-export` accessible en HTTPS :

```
GET /functions/v1/hours-export?granularity=week&from=2026-08-01&to=2026-08-31
GET /functions/v1/hours-export?granularity=month&from=2026-01&to=2026-12
Header: x-api-key: <clé fournie>
```

Filtres optionnels : `store_code`, `employee_id`. Réponse JSON (option `format=csv` possible si utile).

## Détails techniques

- Migration : `stores.external_code integer unique`, valeurs insérées, plus deux fonctions SQL `security definer` (`export_hours_weekly(from, to)`, `export_hours_monthly(from, to)`) **non exposées à anon/authenticated** — seul `service_role` peut les appeler.
- Le recalcul des heures est fait en SQL, en miroir de `src/lib/hours.ts` (pause encodée sinon 1h si ≥6h ; `EXT`/`ROULEMENT` = 0).
- Edge function `hours-export` (`verify_jwt = false`) : vérifie l'en-tête `x-api-key` contre un nouveau secret `HOURS_EXPORT_API_KEY`, puis appelle les RPC en service_role et renvoie le JSON. Sans clé valide → 401.
- Le secret sera à générer ; je te le communiquerai une fois créé pour que tu le configures côté outil externe.
- Seuls les collaborateurs actifs (`is_active`) sont exportés par défaut ; paramètre `include_inactive=1` pour tout avoir.
- Bump de version + entrée CHANGELOG.
