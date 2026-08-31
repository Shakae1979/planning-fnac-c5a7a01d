import { useEffect, useRef } from "react";

const BADGE_COLOR = "#E1A400";
const BADGE_TEXT_COLOR = "#1A1A1A";

function getIconLink(): HTMLLinkElement | null {
  return document.querySelector<HTMLLinkElement>('link[rel="icon"]');
}

/**
 * Dessine une pastille de compteur sur le favicon et préfixe le titre de l'onglet.
 * Restaure l'état d'origine dès que le compteur repasse à 0 (ou au démontage).
 */
export function useFaviconBadge(count: number) {
  const originalHrefRef = useRef<string | null>(null);
  const baseTitleRef = useRef<string | null>(null);

  useEffect(() => {
    const link = getIconLink();
    if (!link) return;

    if (originalHrefRef.current === null) {
      originalHrefRef.current = link.getAttribute("href") || "/favicon.png";
    }
    const originalHref = originalHrefRef.current;

    // Titre : on relit le titre courant en retirant un éventuel préfixe existant
    const currentTitle = document.title.replace(/^\(\d+\+?\)\s*/, "");
    baseTitleRef.current = currentTitle;

    if (count <= 0) {
      link.setAttribute("href", originalHref);
      document.title = currentTitle;
      return;
    }

    document.title = `(${count > 9 ? "9+" : count}) ${currentTitle}`;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = originalHref;

    const draw = () => {
      if (cancelled) return;
      const size = 64;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      try {
        ctx.drawImage(img, 0, 0, size, size);
      } catch {
        return;
      }

      const label = count > 9 ? "9+" : String(count);
      const r = 22;
      const cx = size - r - 2;
      const cy = size - r - 2;

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = BADGE_COLOR;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.stroke();

      ctx.fillStyle = BADGE_TEXT_COLOR;
      ctx.font = "bold 30px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, cx, cy + 1);

      try {
        link.setAttribute("href", canvas.toDataURL("image/png"));
      } catch {
        /* canvas potentiellement "tainted" : on garde le favicon d'origine */
      }
    };

    if (img.complete && img.naturalWidth > 0) draw();
    else img.onload = draw;

    return () => {
      cancelled = true;
    };
  }, [count]);

  // Restauration au démontage
  useEffect(() => {
    return () => {
      const link = getIconLink();
      if (link && originalHrefRef.current) link.setAttribute("href", originalHrefRef.current);
      if (baseTitleRef.current) document.title = baseTitleRef.current;
    };
  }, []);
}
