import type { CapabilityHealth, CheckoutRequest, PaymentCheckout } from "@deeptechly/kernel";
import type { HttpCapabilityConfig } from "./config";

export class StripeCheckoutAdapter implements PaymentCheckout {
  constructor(
    private readonly config: HttpCapabilityConfig,
    private readonly fetchImplementation: typeof fetch = fetch
  ) {}

  async health(): Promise<CapabilityHealth> {
    try {
      await this.request("/v1/account", { method: "GET" });
      return { provider: "stripe", status: "available", checkedAt: new Date().toISOString() };
    } catch {
      return { provider: "stripe", status: "unavailable", checkedAt: new Date().toISOString() };
    }
  }

  async createSubscriptionCheckout(request: CheckoutRequest) {
    for (const [label, value] of [["successUrl", request.successUrl], ["cancelUrl", request.cancelUrl]] as const) {
      const url = new URL(value);
      const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
      if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
        throw new Error(`${label} must use https outside local development`);
      }
    }
    if (!/^price_[A-Za-z0-9]+$/.test(request.priceId)) throw new Error("Stripe priceId is invalid");
    const body = new URLSearchParams({
      mode: "subscription",
      client_reference_id: request.accountId,
      customer_email: request.email,
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
      "line_items[0][price]": request.priceId,
      "line_items[0][quantity]": "1",
      "metadata[deeptechly_account_id]": request.accountId
    });
    const response = await this.request<{ id?: string; url?: string }>("/v1/checkout/sessions", {
      method: "POST",
      body: body.toString()
    });
    if (!response.id || !response.url) throw new Error("Stripe did not return a checkout session URL");
    return { sessionId: response.id, url: response.url };
  }

  private async request<ResponseBody = unknown>(path: string, init: RequestInit): Promise<ResponseBody> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await this.fetchImplementation(`${this.config.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          authorization: `Bearer ${this.config.token}`,
          ...(init.body ? { "content-type": "application/x-www-form-urlencoded" } : {})
        }
      });
      if (!response.ok) throw new Error(`Stripe request failed with HTTP ${response.status}`);
      return (await response.json()) as ResponseBody;
    } finally {
      clearTimeout(timeout);
    }
  }
}
