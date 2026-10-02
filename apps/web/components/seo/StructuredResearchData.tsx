import { absoluteUrl } from "@/lib/site";

type Props = {
  type: "Article" | "TechArticle" | "Report" | "Dataset";
  title: string;
  description: string;
  path: string;
  about?: string;
  datePublished?: string | null;
  dateModified?: string | null;
  citations?: string[];
};

export function StructuredResearchData({
  type,
  title,
  description,
  path,
  about,
  datePublished,
  dateModified,
  citations = []
}: Props) {
  const data = {
    "@context": "https://schema.org",
    "@type": type,
    headline: title,
    name: title,
    description,
    url: absoluteUrl(path),
    ...(about ? { about: { "@type": "Thing", name: about } } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    ...(citations.length ? { citation: [...new Set(citations)] } : {}),
    publisher: { "@type": "Organization", name: "DeepTechly", url: absoluteUrl("/") }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
