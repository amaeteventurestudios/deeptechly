import { task } from "@trigger.dev/sdk";
import {
  analyzeGovernmentDemand,
  type ApertureAnalysisInput
} from "@deeptechly/aperture";

export const apertureDemandIntelligenceTask = task({
  id: "aperture-demand-intelligence",
  queue: { concurrencyLimit: 2 },
  maxDuration: 600,
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 5_000,
    maxTimeoutInMs: 60_000,
    randomize: true
  },
  run: async (payload: ApertureAnalysisInput) => {
    validatePayload(payload);
    return analyzeGovernmentDemand(payload);
  }
});

function validatePayload(payload: ApertureAnalysisInput) {
  if (!payload.methodologyVersion?.trim()) throw new Error("Aperture methodology version is required");
  if (!Array.isArray(payload.documents) || payload.documents.length < 1 || payload.documents.length > 50) {
    throw new Error("Aperture workflow requires between 1 and 50 government documents");
  }
  if ((payload.targets?.length ?? 0) > 200) throw new Error("Aperture workflow accepts at most 200 capability targets");
  for (const document of payload.documents) {
    if (!document.id?.trim() || !document.title?.trim() || !document.text?.trim()) {
      throw new Error("Aperture documents require an id, title, and text");
    }
    if (document.text.length > 50_000) throw new Error("Aperture document text exceeds 50000 characters");
    const url = new URL(document.url);
    if (url.protocol !== "https:") throw new Error("Aperture government documents require HTTPS source URLs");
  }
}
