import { useQuery } from "@tanstack/react-query";
import { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, type LucideIcon } from "lucide-react";
import { formatLocalDate } from "@/lib/format";

/** Coordonnées des villes des magasins (clé = city en minuscules). */
const CITY_COORDS: Record<string, [number, number]> = {
  aalst: [50.9378, 4.0403],
  antwerpen: [51.2194, 4.4025],
  brugge: [51.2093, 3.2247],
  charleroi: [50.4108, 4.4446],
  bruxelles: [50.8503, 4.3517],
  gent: [51.0543, 3.7174],
  leuven: [50.8798, 4.7005],
  "liège": [50.6326, 5.5797],
  liege: [50.6326, 5.5797],
  lln: [50.6681, 4.6118],
  luxembourg: [49.6116, 6.1319],
  tdo: [50.8336, 4.3576],
  wijnegem: [51.2306, 4.5281],
  "woluwé": [50.8466, 4.4327],
  woluwe: [50.8466, 4.4327],
};

export interface DayWeather { code: number; tmax: number; tmin: number; rain: number }

export function getCityCoords(city?: string | null): [number, number] | null {
  if (!city) return null;
  return CITY_COORDS[city.trim().toLowerCase()] ?? null;
}

/** Prévisions 16 jours Open-Meteo, indexées par date locale YYYY-MM-DD. */
export function useWeather(city: string | null | undefined, enabled: boolean) {
  const coords = getCityCoords(city);
  return useQuery({
    queryKey: ["weather", city],
    enabled: enabled && !!coords,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const [lat, lon] = coords!;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FBrussels&forecast_days=16`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("weather");
      const j = await res.json();
      const map: Record<string, DayWeather> = {};
      (j.daily?.time ?? []).forEach((d: string, i: number) => {
        map[d] = {
          code: j.daily.weather_code[i],
          tmax: Math.round(j.daily.temperature_2m_max[i]),
          tmin: Math.round(j.daily.temperature_2m_min[i]),
          rain: j.daily.precipitation_probability_max[i] ?? 0,
        };
      });
      return map;
    },
  });
}

export function weatherIcon(code: number): LucideIcon {
  if (code === 0) return Sun;
  if (code <= 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code <= 48) return CloudFog;
  if (code <= 57) return CloudDrizzle;
  if (code <= 67 || (code >= 80 && code <= 82)) return CloudRain;
  if (code <= 77 || code === 85 || code === 86) return CloudSnow;
  return CloudLightning;
}

export function WeatherBadge({ data, date, className = "" }: { data?: Record<string, DayWeather>; date: Date; className?: string }) {
  const w = data?.[formatLocalDate(date)];
  if (!w) return null;
  const Icon = weatherIcon(w.code);
  return (
    <span
      className={`print:hidden inline-flex items-center gap-0.5 text-[10px] font-normal opacity-90 ${className}`}
      title={`${w.tmin}° / ${w.tmax}° · ${w.rain}%`}
    >
      <Icon className="h-3 w-3" />
      <span>{w.tmax}°</span>
      {w.rain >= 30 && <span className="opacity-75">· {w.rain}%</span>}
    </span>
  );
}
