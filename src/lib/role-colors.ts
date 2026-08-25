/**
 * Centralized role color palette.
 * Single source of truth for all role-based color variants across the app.
 * All Tailwind classes are written as full literals so the JIT can detect them.
 */

export const ROLE_KEYS = ["responsable", "technique", "editorial", "stock", "caisse", "stagiaire"] as const;
export type RoleKey = typeof ROLE_KEYS[number];

export interface RoleColorVariants {
  hue: string;
  /** Solid dot used in legends. */
  dot: string;
  /** Gantt bar / solid avatar background. */
  bar: string;
  /** Hourly grid cell (semi-transparent). */
  barSoft: string;
  /** Soft tinted row background. */
  bgSoft: string;
  /** Light chip badge (no dark variant). */
  bgChip: string;
  /** Light chip badge with dark mode variant. */
  bgChipDark: string;
  /** Section header background (Gantt). */
  headerBg: string;
  /** Left border accent. */
  borderL: string;
  /** Text color (dark + light). */
  text: string;
  /** ScheduleEditor row tint. */
  editorBg: string;
  /** QuarterView (congés) header background. */
  congesHeaderBg: string;
  /** QuarterView (congés) left border. */
  congesBorderL: string;
}

export const ROLE_COLORS: Record<RoleKey, RoleColorVariants> = {
  responsable: {
    hue: "red",
    dot: "bg-red-500",
    bar: "bg-red-500",
    barSoft: "bg-red-500/80",
    bgSoft: "bg-red-50 dark:bg-red-950/20",
    bgChip: "bg-red-100 text-red-800",
    bgChipDark: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    headerBg: "bg-red-100 dark:bg-red-900/40",
    borderL: "border-l-red-500",
    text: "text-red-800 dark:text-red-200",
    editorBg: "bg-red-100 dark:bg-red-950/40",
    congesHeaderBg: "bg-red-100 dark:bg-red-900/50",
    congesBorderL: "border-l-2 border-l-red-300 dark:border-l-red-500",
  },
  technique: {
    hue: "orange",
    dot: "bg-orange-500",
    bar: "bg-orange-500",
    barSoft: "bg-orange-500/80",
    bgSoft: "bg-orange-50 dark:bg-orange-950/20",
    bgChip: "bg-orange-100 text-orange-800",
    bgChipDark: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    headerBg: "bg-orange-100 dark:bg-orange-900/40",
    borderL: "border-l-orange-500",
    text: "text-orange-800 dark:text-orange-200",
    editorBg: "bg-orange-100 dark:bg-orange-950/40",
    congesHeaderBg: "bg-orange-100 dark:bg-orange-900/50",
    congesBorderL: "border-l-2 border-l-orange-300 dark:border-l-orange-500",
  },
  editorial: {
    hue: "yellow",
    dot: "bg-yellow-500",
    bar: "bg-yellow-500",
    barSoft: "bg-yellow-500/80",
    bgSoft: "bg-yellow-50 dark:bg-yellow-950/20",
    bgChip: "bg-yellow-100 text-yellow-800",
    bgChipDark: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    headerBg: "bg-yellow-100 dark:bg-yellow-900/40",
    borderL: "border-l-yellow-500",
    text: "text-yellow-800 dark:text-yellow-200",
    editorBg: "bg-yellow-100 dark:bg-yellow-950/40",
    congesHeaderBg: "bg-yellow-100 dark:bg-yellow-900/50",
    congesBorderL: "border-l-2 border-l-yellow-300 dark:border-l-yellow-500",
  },
  stock: {
    hue: "blue",
    dot: "bg-blue-500",
    bar: "bg-blue-500",
    barSoft: "bg-blue-500/80",
    bgSoft: "bg-blue-50 dark:bg-blue-950/20",
    bgChip: "bg-blue-100 text-blue-800",
    bgChipDark: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    headerBg: "bg-blue-100 dark:bg-blue-900/40",
    borderL: "border-l-blue-500",
    text: "text-blue-800 dark:text-blue-200",
    editorBg: "bg-blue-100 dark:bg-blue-950/40",
    congesHeaderBg: "bg-blue-100 dark:bg-blue-900/50",
    congesBorderL: "border-l-2 border-l-blue-300 dark:border-l-blue-500",
  },
  caisse: {
    hue: "emerald",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    barSoft: "bg-emerald-500/80",
    bgSoft: "bg-emerald-50 dark:bg-emerald-950/20",
    bgChip: "bg-emerald-100 text-emerald-800",
    bgChipDark: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    headerBg: "bg-emerald-100 dark:bg-emerald-900/40",
    borderL: "border-l-emerald-500",
    text: "text-emerald-800 dark:text-emerald-200",
    editorBg: "bg-emerald-100 dark:bg-emerald-950/40",
    congesHeaderBg: "bg-emerald-100 dark:bg-emerald-900/50",
    congesBorderL: "border-l-2 border-l-emerald-300 dark:border-l-emerald-500",
  },
  stagiaire: {
    hue: "pink",
    dot: "bg-pink-500",
    bar: "bg-pink-500",
    barSoft: "bg-pink-500/80",
    bgSoft: "bg-pink-50 dark:bg-pink-950/20",
    bgChip: "bg-pink-100 text-pink-800",
    bgChipDark: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    headerBg: "bg-pink-100 dark:bg-pink-900/40",
    borderL: "border-l-pink-500",
    text: "text-pink-800 dark:text-pink-200",
    editorBg: "bg-pink-100 dark:bg-pink-950/40",
    congesHeaderBg: "bg-pink-100 dark:bg-pink-900/50",
    congesBorderL: "border-l-2 border-l-pink-300 dark:border-l-pink-500",
  },
};

export const ROLE_ORDER: RoleKey[] = [...ROLE_KEYS];

/**
 * Métiers supplémentaires disponibles quand le magasin a le multi-métiers activé.
 * Utilisables uniquement comme rôle secondaire / rôle du jour (pas comme métier principal).
 */
export const EXTRA_ROLE_KEYS = ["tresorerie", "pt_bas", "pt_haut", "pe_bas", "pe_haut"] as const;
export type ExtraRoleKey = typeof EXTRA_ROLE_KEYS[number];

export const EXTRA_ROLE_COLORS: Record<ExtraRoleKey, RoleColorVariants> = {
  tresorerie: {
    hue: "fuchsia",
    dot: "bg-fuchsia-500",
    bar: "bg-fuchsia-500",
    barSoft: "bg-fuchsia-500/80",
    bgSoft: "bg-fuchsia-50 dark:bg-fuchsia-950/20",
    bgChip: "bg-fuchsia-100 text-fuchsia-800",
    bgChipDark: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
    headerBg: "bg-fuchsia-100 dark:bg-fuchsia-900/40",
    borderL: "border-l-fuchsia-500",
    text: "text-fuchsia-800 dark:text-fuchsia-200",
    editorBg: "bg-fuchsia-100 dark:bg-fuchsia-950/40",
    congesHeaderBg: "bg-fuchsia-100 dark:bg-fuchsia-900/50",
    congesBorderL: "border-l-2 border-l-fuchsia-300 dark:border-l-fuchsia-500",
  },
  pt_bas: { ...ROLE_COLORS.technique },
  pt_haut: {
    hue: "orange",
    dot: "bg-orange-800",
    bar: "bg-orange-800",
    barSoft: "bg-orange-800/80",
    bgSoft: "bg-orange-100 dark:bg-orange-950/40",
    bgChip: "bg-orange-200 text-orange-900",
    bgChipDark: "bg-orange-200 text-orange-900 dark:bg-orange-900/50 dark:text-orange-200",
    headerBg: "bg-orange-200 dark:bg-orange-900/60",
    borderL: "border-l-orange-800",
    text: "text-orange-900 dark:text-orange-100",
    editorBg: "bg-orange-200 dark:bg-orange-950/60",
    congesHeaderBg: "bg-orange-200 dark:bg-orange-900/70",
    congesBorderL: "border-l-2 border-l-orange-500 dark:border-l-orange-700",
  },
  pe_bas: { ...ROLE_COLORS.editorial },
  pe_haut: {
    hue: "amber",
    dot: "bg-amber-700",
    bar: "bg-amber-700",
    barSoft: "bg-amber-700/80",
    bgSoft: "bg-amber-100 dark:bg-amber-950/40",
    bgChip: "bg-amber-200 text-amber-900",
    bgChipDark: "bg-amber-200 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200",
    headerBg: "bg-amber-200 dark:bg-amber-900/60",
    borderL: "border-l-amber-700",
    text: "text-amber-900 dark:text-amber-100",
    editorBg: "bg-amber-200 dark:bg-amber-950/60",
    congesHeaderBg: "bg-amber-200 dark:bg-amber-900/70",
    congesBorderL: "border-l-2 border-l-amber-500 dark:border-l-amber-700",
  },
};

/** Safe accessor: falls back to caisse variants for unknown roles. */
export function getRoleColors(role: string): RoleColorVariants {
  return (
    ROLE_COLORS[role as RoleKey] ??
    EXTRA_ROLE_COLORS[role as ExtraRoleKey] ??
    ROLE_COLORS.caisse
  );
}

