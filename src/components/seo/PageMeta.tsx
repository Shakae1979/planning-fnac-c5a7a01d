import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://planning.befnac.be";

interface PageMetaProps {
  title: string;
  description: string;
  noIndex?: boolean;
}

/** Métadonnées uniques par route (title, description, canonical, Open Graph). */
export function PageMeta({ title, description, noIndex }: PageMetaProps) {
  const { pathname } = useLocation();
  const url = `${SITE_URL}${pathname}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}