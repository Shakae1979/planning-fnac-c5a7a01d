// Belgian francophone school holidays for 2026
// Sources: Fédération Wallonie-Bruxelles calendrier scolaire 2025-2026 & 2026-2027

interface SchoolHolidayPeriod {
  label: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

const SCHOOL_HOLIDAYS_2026: SchoolHolidayPeriod[] = [
  // Fin vacances d'hiver (Noël) 2025-2026
  { label: "Vacances d'hiver", start: "2026-01-01", end: "2026-01-02" },
  // Congé de détente (Carnaval)
  { label: "Congé de détente", start: "2026-02-16", end: "2026-02-27" },
  // Vacances de printemps (Pâques)
  { label: "Vacances de printemps", start: "2026-04-27", end: "2026-05-08" },
  // Vacances d'été
  { label: "Vacances d'été", start: "2026-07-04", end: "2026-08-23" },
  // Congé d'automne (Toussaint) 2026-2027
  { label: "Congé d'automne", start: "2026-10-19", end: "2026-10-30" },
  // Vacances d'hiver (Noël) 2026-2027
  { label: "Vacances d'hiver", start: "2026-12-21", end: "2026-12-31" },
];

export function isSchoolHoliday(dateStr: string): string | null {
  for (const period of SCHOOL_HOLIDAYS_2026) {
    if (dateStr >= period.start && dateStr <= period.end) {
      return period.label;
    }
  }
  return null;
}
