# Export heures : passer au store_id brut

L'export agrégé existe déjà (v5.09) : deux fonctions serveur `export_hours_weekly` / `export_hours_monthly`, appelées via l'endpoint `hours-export` protégé par clé d'API. Elles renvoient aujourd'hui un `store_code` interne. Cette révision supprime ce mapping et renvoie le `store_id` (UUID brut).

## Sur l'email : réponse franche

C'est acceptable **parce que** l'accès passe par une clé d'API vérifiée côté serveur, jamais par la clé publique de l'app. Les droits sur la table `employees` ne changent pas : elle reste illisible en anonyme et l'email n'est jamais exposé au front public. L'email est donc renvoyé dans l'export, uniquement pour un appel porteur de la bonne clé. Je le garde.

## Ce qui change

### Fonctions serveur
Les deux fonctions sont recréées avec la même logique de calcul, mais :
- `store_code integer` remplacé par `store_id uuid` (l'UUID de `employees.store_id`)
- `store_name` conservé (utile pour contrôle visuel) — dis-moi si tu préfères l'enlever
- le paramètre de filtre `_store_code integer` devient `_store_id uuid`

Colonnes finales :

**Hebdomadaire** — 1 ligne = collaborateur × semaine :
`employee_id, name, last_name, email, store_id, store_name, contract_hours, week_start, hours_worked, hours_gap`

**Mensuel** — 1 ligne = collaborateur × mois planning :
`employee_id, name, last_name, email, store_id, store_name, contract_hours, month, weeks_count, month_worked, month_contract, month_gap`

Le mois planning reste défini comme l'ensemble des semaines dont le lundi tombe dans le mois ; `month_contract = contract_hours × nombre de lundis du mois`.

Le calcul de `hours_worked` ne bouge pas : `hours_modified` s'il est non nul, sinon recalcul depuis les horaires du jour (pause encodée, ou 1h automatique si la journée fait 6h ou plus ; `EXT` et `ROULEMENT` comptent 0h).

### Endpoint
Même URL, même clé. Seul le filtre magasin change :

```
GET /functions/v1/hours-export?granularity=week&from=2026-08-01&to=2026-08-31
GET /functions/v1/hours-export?granularity=month&from=2026-01&to=2026-12
Header: x-api-key: <ta clé>
```

Paramètres : `granularity` (`week`|`month`), `from`, `to`, `store_id` (UUID, optionnel — remplace `store_code`), `employee_id` (optionnel), `include_inactive=1`, `format=csv`.

### Colonne `external_code`
Elle avait été ajoutée sur les magasins pour ce besoin. Comme tu gères le mapping de ton côté, elle n'est plus utilisée par l'export. Je la laisse en place (inoffensive) sauf si tu veux que je la retire.

## Détails techniques

- Migration : `DROP` puis `CREATE` des deux fonctions `security definer` (le type de retour change, donc `CREATE OR REPLACE` ne suffit pas). Elles restent non exposées à `anon`/`authenticated` — seul `service_role` peut les appeler.
- `supabase/functions/hours-export/index.ts` : validation `store_id` en UUID au lieu d'entier, paramètre RPC `_store_id`.
- Bump de version (`src/lib/version.ts`) + entrée CHANGELOG.
- Je te renverrai les noms exacts et un appel d'exemple une fois déployé.
