import { notFound } from "next/navigation";
import {
  ArticleBody,
  ArticleHero,
  ArticleSection,
  ArticleVisualPanel,
  ComparisonTable,
  DossierCTA,
  InlineResearchStatus,
  ShareResearchCard,
  SourcesBlock
} from "@/components/article/ArticleComponents";
import { PageShell } from "@/components/layout/PageShell";
import { entities } from "@/lib/data";
import { getEntityBySlugFromAll } from "@/lib/research/public-data";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return entities.map((entity) => ({ slug: entity.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const entity = await getEntityBySlugFromAll(slug);

  if (!entity) {
    return { title: "Article not found | DeepTechly" };
  }

  return {
    title: `${entity.article.headline} | DeepTechly`,
    description: entity.article.dek
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const entity = await getEntityBySlugFromAll(slug);

  if (!entity) {
    notFound();
  }

  const [whyItMatters, technicalWedge, marketContext, ...remainingSections] =
    entity.article.sections;

  return (
    <PageShell>
      <ArticleHero entity={entity} />
      <ArticleVisualPanel entity={entity} />
      <ArticleBody>
        <InlineResearchStatus entity={entity} />
        <ArticleSection section={whyItMatters} />
        <ArticleSection section={technicalWedge} />
        <ArticleSection section={marketContext} />
        <ComparisonTable entity={entity} />
        {remainingSections.map((section) => (
          <ArticleSection key={section.title} section={section} />
        ))}
        <SourcesBlock sources={entity.sources} />
      </ArticleBody>
      <DossierCTA entity={entity} />
      <ShareResearchCard entity={entity} />
    </PageShell>
  );
}
