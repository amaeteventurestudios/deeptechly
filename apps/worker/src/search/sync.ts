import type { SearchDocument, SearchIndex } from "@deeptechly/kernel";

export const researchIndexName = "research";

export const researchIndexSettings = {
  searchableAttributes: ["title", "entityName", "summary", "sector", "kind"],
  filterableAttributes: ["kind", "sector", "published"],
  sortableAttributes: ["publishedAt"]
} as const;

export async function syncPublishedResearchIndex(
  index: SearchIndex,
  documents: readonly SearchDocument[],
  name = researchIndexName
) {
  const publicDocuments = documents.filter((document) => document.published === true);
  const settings = await index.configure(name, researchIndexSettings);
  const upsert = publicDocuments.length
    ? await index.upsert(name, publicDocuments)
    : { taskId: "no-public-documents" };
  return {
    indexed: publicDocuments.length,
    settingsTaskId: settings.taskId,
    documentTaskId: upsert.taskId
  };
}
