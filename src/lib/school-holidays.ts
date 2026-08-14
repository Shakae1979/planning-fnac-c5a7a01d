// Vacances scolaires belges (2026 et 2027)
// Sources :
//   FR: Fédération Wallonie-Bruxelles calendrier scolaire 2025-2026, 2026-2027, 2027-2028
//   NL: Vlaamse Gemeenschap schoolvakanties 2025-2026, 2026-2027, 2027-2028
// Les dates 2027 sont issues des calendriers publiés à l'avance : à revérifier
// en cas d'ajustement officiel. Pour ajouter une année, compléter les deux maps.

interface SchoolHolidayPeriod {
  label: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

// Francophone (Wallonie-Bruxelles)
const SCHOOL_HOLIDAYS_FR: Record<number, SchoolHolidayPeriod[]> = {
  2026: [
    { label: "Vacances d'hiver", start: "2026-01-01", end: "2026-01-02" },
    { label: "Congé de détente", start: "2026-02-16", end: "2026-02-27" },
    { label: "Vacances de printemps", start: "2026-04-27", end: "2026-05-08" },
    { label: "Vacances d'été", start: "2026-07-04", end: "2026-08-23" },
    { label: "Congé d'automne", start: "2026-10-19", end: "2026-10-30" },
    { label: "Vacances d'hiver", start: "2026-12-21", end: "2026-12-31" },
  ],
  2027: [
    { label: "Vacances d'hiver", start: "2027-01-01", end: "2027-01-03" },
    { label: "Congé de détente", start: "2027-02-15", end: "2027-02-26" },
    { label: "Vacances de printemps", start: "2027-04-26", end: "2027-05-07" },
    { label: "Vacances d'été", start: "2027-07-05", end: "2027-08-22" },
    { label: "Congé d'automne", start: "2027-10-25", end: "2027-11-05" },
    { label: "Vacances d'hiver", start: "2027-12-20", end: "2027-12-31" },
  ],
};

// Néerlandophone (Vlaanderen)
const SCHOOL_HOLIDAYS_NL: Record<number, SchoolHolidayPeriod[]> = {
  2026: [
    { label: "Kerstvakantie", start: "2026-01-01", end: "2026-01-04" },
    { label: "Krokusvakantie", start: "2026-02-16", end: "2026-02-22" },
    { label: "Paasvakantie", start: "2026-04-06", end: "2026-04-19" },
    { label: "Zomervakantie", start: "2026-07-01", end: "2026-08-31" },
    { label: "Herfstvakantie", start: "2026-11-02", end: "2026-11-08" },
    { label: "Kerstvakantie", start: "2026-12-21", end: "2026-12-31" },
  ],
  2027: [
    { label: "Kerstvakantie", start: "2027-01-01", end: "2027-01-03" },
    { label: "Krokusvakantie", start: "2027-02-15", end: "2027-02-21" },
    { label: "Paasvakantie", start: "2027-03-29", end: "2027-04-11" },
    { label: "Zomervakantie", start: "2027-07-01", end: "2027-08-31" },
    { label: "Herfstvakantie", start: "2027-11-01", end: "2027-11-07" },
    { label: "Kerstvakantie", start: "2027-12-20", end: "2027-12-31" },
  ],
};

function periodsFor(
  map: Record<number, SchoolHolidayPeriod[]>,
  dateStr: string
): SchoolHolidayPeriod[] {
  const year = Number(dateStr.slice(0, 4));
  return map[year] ?? [];
}

export type SchoolHolidayCommunity = "fr" | "nl" | "both";

export function isSchoolHoliday(dateStr: string): string | null {
  // Legacy: returns any match (FR)
  for (const period of periodsFor(SCHOOL_HOLIDAYS_FR, dateStr)) {
    if (dateStr >= period.start && dateStr <= period.end) {
      return period.label;
    }
  }
  return null;
}

export function getSchoolHolidayInfo(dateStr: string): { community: SchoolHolidayCommunity; labelFr: string | null; labelNl: string | null } | null {
  let labelFr: string | null = null;
  let labelNl: string | null = null;

  for (const period of periodsFor(SCHOOL_HOLIDAYS_FR, dateStr)) {
    if (dateStr >= period.start && dateStr <= period.end) {
      labelFr = period.label;
      break;
    }
  }

  for (const period of periodsFor(SCHOOL_HOLIDAYS_NL, dateStr)) {
    if (dateStr >= period.start && dateStr <= period.end) {
      labelNl = period.label;
      break;
    }
  }

  if (!labelFr && !labelNl) return null;

  const community: SchoolHolidayCommunity = labelFr && labelNl ? "both" : labelFr ? "fr" : "nl";
  return { community, labelFr, labelNl };
}
