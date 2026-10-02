import type {
  AcquiredDocument,
  CapabilityHealth,
  SourceAcquisitionProvider
} from "@deeptechly/kernel";
import type { Crawl4AIConfig } from "./config";
import { CapabilityRequestError, checkHttpHealth, requestJson } from "./http";

type CrawlResult = {
  success?: boolean;
  url?: string;
  markdown?: string | { raw_markdown?: string; fit_markdown?: string };
  cleaned_html?: string;
  links?: { internal?: Array<{ href?: string }>; external?: Array<{ href?: string }> };
  metadata?: Record<string, unknown>;
};

export class Crawl4AIAdapter implements SourceAcquisitionProvider {
  constructor(
    private readonly config: Crawl4AIConfig,
    private readonly fetchImplementation: typeof fetch = fetch
  ) {}

  health(): Promise<CapabilityHealth> {
    return checkHttpHealth(this.config, this.fetchImplementation);
  }

  async acquire(url: string): Promise<AcquiredDocument> {
    const target = new URL(url);
    assertSafeAcquisitionUrl(target);
    const response = await requestJson<
      CrawlResult | { results?: CrawlResult[]; data?: CrawlResult[] }
    >(this.config, this.fetchImplementation, this.config.acquirePath, {
      method: "POST",
      body: JSON.stringify({ urls: [target.toString()] })
    });
    const envelope = response as { results?: CrawlResult[]; data?: CrawlResult[] };
    const result: CrawlResult | undefined = Array.isArray(envelope.results)
      ? envelope.results[0]
      : Array.isArray(envelope.data)
        ? envelope.data[0]
        : response as CrawlResult;
    if (!result || result.success === false) {
      throw new CapabilityRequestError("crawl4ai did not return a successful document");
    }
    const markdown = typeof result.markdown === "string"
      ? result.markdown
      : result.markdown?.fit_markdown ?? result.markdown?.raw_markdown ?? "";
    if (!markdown.trim()) {
      throw new CapabilityRequestError("crawl4ai returned no normalized content");
    }
    const links = [...(result.links?.internal ?? []), ...(result.links?.external ?? [])]
      .map((link) => link.href)
      .filter((href): href is string => Boolean(href));
    return {
      url: result.url ?? target.toString(),
      canonicalUrl: typeof result.metadata?.canonical === "string" ? result.metadata.canonical : null,
      title: typeof result.metadata?.title === "string" ? result.metadata.title : null,
      markdown,
      html: result.cleaned_html,
      links,
      metadata: result.metadata
    };
  }
}

function assertSafeAcquisitionUrl(target: URL) {
  if (!/^https?:$/.test(target.protocol)) {
    throw new CapabilityRequestError("Crawl target must use http or https");
  }
  if (target.username || target.password) {
    throw new CapabilityRequestError("Crawl target must not contain credentials");
  }

  const host = target.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const blockedHost =
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^fc/i.test(host) ||
    /^fd/i.test(host) ||
    /^fe[89ab]/i.test(host);

  if (blockedHost) {
    throw new CapabilityRequestError("Crawl target host is not publicly routable");
  }
}
