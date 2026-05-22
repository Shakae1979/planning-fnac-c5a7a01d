# Crédit des heures d'absence — Nouvelle règle métier

## Le problème

Aujourd'hui, un jour de congé, maladie ou férié crédite les heures **de la semaine type** du collaborateur. Conséquences :
- Pas de semaine type → 0h créditées → la semaine semble incomplète
- Semaine type décalée (A/B, modifications ponctuelles) → crédit faux
- Aucun moyen de distinguer ce qui a été *réellement travaillé* de ce qui est *compensé par une absence*

## Nouvelle règle (validée)

**Crédit par jour d'absence = contrat hebdo ÷ nombre de jours habituellement travaillés**

Exemple : vendeur 36h sur 5 jours → chaque jour d'absence vaut **7,2h**.
Calculé automatiquement depuis la semaine type (compte des jours avec shift réel, hors EXT/ROULEMENT/FERIE). Si pas de semaine type → fallback **5 jours** (config par défaut).

### Cas particulier : férié sans planning

Pour un jour marqué férié dans `day_comments.is_ferie = true` où **aucun shift** n'est saisi pour le collaborateur (ni dans la semaine, ni dans le template), on demande au responsable de saisir manuellement les heures à créditer. Stocké dans une nouvelle table `ferie_credits` (employee_id + date + hours).

Tant que la saisie n'est pas faite, on affiche un badge "À saisir" dans le Compteur d'heures.

## Affichage dans le Compteur d'heures

Refonte des colonnes "Semaine" et "Mois" pour montrer la décomposition :

```text
| Collaborateur | Contrat | Presté | Crédité | Total | Écart |
|---------------|---------|--------|---------|-------|-------|
| Marie         | 36h     | 28,8h  | 7,2h    | 36h   | 0h    |  ← 1 jour congé
| Paul          | 36h     | 32h    | 0h      | 32h   | -4h   |  ← sous-prest
| Anna          | 30h     | 0h     | 6h      | 6h    | -24h  |  ← férié à saisir
```

- **Presté** : heures réellement travaillées (logique actuelle inchangée).
- **Crédité** : somme des absences × forfait jour.
- **Total** : Presté + Crédité.
- **Écart** : Total − Contrat, coloré (vert = 0, orange si <0, rouge si >0).

Idem pour la vue mensuelle (Contrat × nb semaines ISO du mois).

## Détails techniques

### 1. `src/lib/hours.ts` — refonte de `computeNetHours`

Nouvelle signature retournant la décomposition :
```ts
{ gross, breaks, worked, credited, net, missingFerieCredits: string[] }
```
- `worked` : heures effectivement prestées (− pause).
- `credited` : `nbJoursAbsents × (contract_hours / typicalDays)`.
- `typicalDays` : compte des jours du template avec start+end valides (≠ EXT/ROULEMENT/FERIE), fallback 5.
- `missingFerieCredits` : liste des dates fériées non couvertes ni par planning ni par saisie manuelle.

Les jours `Roulement` et `Extérieur` restent à 0h (règle existante préservée).

### 2. Nouvelle table `ferie_credits`

```sql
create table public.ferie_credits (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null,
  date date not null,
  hours numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (employee_id, date)
);
alter table public.ferie_credits enable row level security;
-- RLS : lecture publique, écriture authentifiée (mêmes policies que conges)
```

### 3. UI Compteur d'heures (`src/components/dashboard/HoursCounter.tsx`)

- Ajout colonnes **Presté / Crédité / Total / Écart** (remplace les 2 colonnes actuelles "planifié/écart").
- Section repliable en bas : **"Fériés à saisir"** listant les `missingFerieCredits` avec un mini-formulaire (collaborateur, date, input heures, bouton Enregistrer).
- Légende mise à jour expliquant la règle de crédit.

### 4. Vue collaborateur (`EmployeeView.tsx` + `EmployeeMobileView.tsx`)

- Le total semaine affiche `Xh travaillées + Yh créditées = Zh / contrat`.
- Tooltip explicite sur le calcul.

### 5. i18n

Nouvelles clés FR/NL : `hours.worked`, `hours.credited`, `hours.total`, `hours.ferieToFill`, `hours.ferieCreditSaved`, `hours.creditRule`.

## Hors scope

- Pas de modification de la saisie des absences (`conges` table inchangée).
- Pas de modification du planning équipe (la colonne planifiée existante n'est pas touchée).
- Pas de paramètre par magasin pour la règle (forfait fixe contrat ÷ jours template).
- Pas d'historisation des modifications de `ferie_credits`.

## Migration des données existantes

Aucune migration de données nécessaire : la nouvelle logique est recalculée à l'ouverture. Les responsables verront simplement apparaître la section "Fériés à saisir" pour les jours fériés passés sans planning.
