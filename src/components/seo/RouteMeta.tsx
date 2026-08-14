import { useLocation, useParams } from "react-router-dom";
import { PageMeta } from "./PageMeta";

type Meta = { title: string; description: string; noIndex?: boolean };

const ROUTE_META: Record<string, Meta> = {
  "/login": {
    title: "Connexion — Planning Fnac",
    description:
      "Connectez-vous à Planning Fnac pour consulter et gérer les horaires de votre magasin Fnac Belgique.",
  },
  "/": {
    title: "Planning Fnac — Gestion des plannings et des équipes",
    description:
      "Tableau de bord Planning Fnac : encodage des horaires, compteurs d'heures, ETP et couverture des rayons par magasin.",
  },
  "/equipe-du-jour": {
    title: "Équipe du jour — Planning Fnac",
    description:
      "Vue du jour : présences, horaires par demi-heure, heures de table et alertes de couverture du magasin.",
  },
  "/planning-equipe": {
    title: "Planning semaine — Planning Fnac",
    description:
      "Planning hebdomadaire de l'équipe en vue Gantt : horaires, absences et jours fériés semaine par semaine.",
  },
  "/conges": {
    title: "Congés et absences — Planning Fnac",
    description:
      "Calendrier des congés et absences de l'équipe, avec jours fériés belges et vacances scolaires.",
  },
  "/mon-planning": {
    title: "Mon planning — Planning Fnac",
    description: "Consultez votre planning personnel : horaires de la semaine, pauses et congés.",
  },
  "/mon-compte": {
    title: "Mon compte — Planning Fnac",
    description: "Gérez votre compte Planning Fnac : préférences, langue et sécurité.",
    noIndex: true,
  },
  "/changer-mot-de-passe": {
    title: "Changer de mot de passe — Planning Fnac",
    description: "Mettez à jour le mot de passe de votre compte Planning Fnac.",
    noIndex: true,
  },
};

const FALLBACK: Meta = {
  title: "Page introuvable — Planning Fnac",
  description: "Cette page n'existe pas ou n'est plus disponible sur Planning Fnac.",
  noIndex: true,
};

/** Applique des métadonnées uniques à chaque route. */
export function RouteMeta() {
  const { pathname } = useLocation();
  const params = useParams();

  let meta = ROUTE_META[pathname];

  if (!meta && pathname.startsWith("/mon-planning/")) {
    const name = decodeURIComponent(pathname.replace("/mon-planning/", ""));
    meta = {
      title: `Planning de ${name} — Planning Fnac`,
      description: `Horaires de la semaine de ${name} : shifts, pauses et absences.`,
      noIndex: true,
    };
  }

  if (!meta && pathname.startsWith("/.lovable/")) {
    meta = {
      title: "Autorisation d'accès — Planning Fnac",
      description: "Autorisez une application externe à accéder à vos données Planning Fnac.",
      noIndex: true,
    };
  }

  void params;

  return <PageMeta {...(meta ?? FALLBACK)} />;
}