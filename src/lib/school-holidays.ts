// Belgian school holidays for 2026
// Sources:
//   FR: Fédération Wallonie-Bruxelles calendrier scolaire 2025-2026 & 2026-2027
//   NL: Vlaamse Gemeenschap schoolvakanties 2025-2026 & 2026-2027

interface SchoolHolidayPeriod {
  label: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

// Francophone (Wallonie-Bruxelles)
const SCHOOL_HOLIDAYS_FR_2026: SchoolHolidayPeriod[] = [
  { label: "Vacances d'hiver", start: "2026-01-01", end: "2026-01-02" },
  { label: "Congé de détente", start: "2026-02-16", end: "2026-02-27" },
  { label: "Vacances de printemps", start: "2026-04-27", end: "2026-05-08" },
  { label: "Vacances d'été", start: "2026-07-04", end: "2026-08-23" },
  { label: "Congé d'automne", start: "2026-10-19", end: "2026-10-30" },
  { label: "Vacances d'hiver", start: "2026-12-21", end: "2026-12-31" },
];

// Néerlandophone (Vlaanderen)
const SCHOOL_HOLIDAYS_NL_2026: SchoolHolidayPeriod[] = [
  { label: "Kerstvakantie", start: "2026-01-01", end: "2026-01-04" },
  { label: "Krokusvakantie", start: "2026-02-16", end: "2026-02-22" },
  { label: "Paasvakantie", start: "2026-04-06", end: "2026-04-19" },
  { label: "Zomervakantie", start: "2026-07-01", end: "2026-08-31" },
  { label: "Herfstvakantie", start: "2026-11-02", end: "2026-11-08" },
  { label: "Kerstvakantie", start: "2026-12-21", end: "2026-12-31" },
];

export type SchoolHolidayCommunity = "fr" | "nl" | "both";

export function isSchoolHoliday(dateStr: string): string | null {
  // Legacy: returns any match (FR)
  for (const period of SCHOOL_HOLIDAYS_FR_2026) {
    if (dateStr >= period.start && dateStr <= period.end) {
      return period.label;
    }
  }
  return null;
}

export function getSchoolHolidayInfo(dateStr: string): { community: SchoolHolidayCommunity; labelFr: string | null; labelNl: string | null } | null {
  let labelFr: string | null = null;
  let labelNl: string | null = null;

  for (const period of SCHOOL_HOLIDAYS_FR_2026) {
    if (dateStr >= period.start && dateStr <= period.end) {
      labelFr = period.label;
      break;
    }
  }

  for (const period of SCHOOL_HOLIDAYS_NL_2026) {
    if (dateStr >= period.start && dateStr <= period.end) {
      labelNl = period.label;
      break;
    }
  }

  if (!labelFr && !labelNl) return null;

  const community: SchoolHolidayCommunity = labelFr && labelNl ? "both" : labelFr ? "fr" : "nl";
  return { community, labelFr, labelNl };
}
