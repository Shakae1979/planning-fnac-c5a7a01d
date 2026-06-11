# Anticipation pluriannuelle — alignement ISO pour la source "N-1"

## Problème

La source "N-1" des suggestions utilise actuellement `addWeeks(currentMonday, -52)`, ce qui crée un décalage d'une semaine dès qu'une année ISO compte 53 semaines (2026, 2032, 2037, 2043, 2048…). Symptôme : début 2027 → "N-1" pointe sur S2 de 2026 au lieu de S1.

## Objectif

Faire pointer "N-1" sur la **même semaine ISO de l'année précédente**, quelle que soit l'année. Solution déterministe et durable, sans dépendance externe ajoutée.

## Détails techniques

**Fichier touché : `src/lib/format.ts`**

Ajout de 3 helpers exportés :

```ts
// ISO year (peut différer de l'année civile au 1er janv. ou 31 déc.)
export function getISOYear(date: Date): number

// Nombre de semaines ISO dans une année ISO (52 ou 53)
export function isoWeeksInYear(isoYear: number): number

// Lundi 00:00 (heure locale) de la semaine ISO donnée
export function mondayOfISOWeek(isoYear: number, isoWeek: number): Date
```

Implémentation standard (algorithme ISO 8601), sans lib tierce.

**Fichier touché : `src/components/dashboard/ScheduleEditor.tsx`**

Remplacer :
```ts
const lastYear = formatWeekDate(addWeeks(currentMonday, -52));
```

Par :
```ts
const isoYear = getISOYear(currentMonday);
const isoWeek = getWeekNumber(currentMonday);
const targetYear = isoYear - 1;
const targetWeek = Math.min(isoWeek, isoWeeksInYear(targetYear));
const lastYear = formatWeekDate(mondayOfISOWeek(targetYear, targetWeek));
```

Le `Math.min` évite de demander une S53 inexistante quand l'année N-1 n'a que 52 semaines.

## Vérifications faites mentalement

- Semaine courante S1-2027 (lundi 04/01/2027) → cible S1-2026 (lundi 29/12/2025) ✓
- Semaine courante S53-2026 (lundi 28/12/2026) → cible S52-2025 (lundi 22/12/2025), car 2025 n'a que 52 semaines ✓
- Semaine courante S10-2026 → cible S10-2025 ✓
- Semaine courante S1-2026 (lundi 29/12/2025) → cible S1-2025 (lundi 30/12/2024) ✓

## Hors périmètre

- Pas de modification du bouton "Copier sem. précédente" (basé sur -1 semaine, déjà correct quelle que soit l'année).
- Pas de modification des templates A/B (logique parité, indépendante de l'année).
- Pas de modification du calcul d'heures, congés, ou navigation.
- Pas de migration DB.
