import type { BillingCustomer, BillingMeter, CapabilityHealth, UsageEvent } from "@deeptechly/kernel";
import type { HttpCapabilityConfig } from "./config";
import { checkHttpHealth, requestJson } from "./http";

export class LagoBillingAdapter implements BillingMeter {
  constructor(
    private readonly config: HttpCapabilityConfig,
    private readonly fetchImplementation: typeof fetch = fetch
  ) {}

  health(): Promise<CapabilityHealth> {
    return checkHttpHealth(this.config, this.fetchImplementation);
  }

  async ensureCustomer(customer: BillingCustomer) {
    const response = await requestJson<{ customer?: { external_id?: string } }>(
      this.config,
      this.fetchImplementation,
      "/api/v1/customers",
      {
        method: "POST",
        body: JSON.stringify({
          customer: {
            external_id: customer.accountId,
            email: customer.email,
            name: customer.name ?? undefined,
            metadata: [
              { key: "deeptechly_account_id", value: customer.accountId, display_in_invoice: false }
            ]
          }
        })
      }
    );
    return { externalCustomerId: response.customer?.external_id ?? customer.accountId };
  }

  async reportUsage(event: UsageEvent) {
    if (!Number.isFinite(event.quantity) || event.quantity <= 0) {
      throw new Error("Usage quantity must be a positive finite number");
    }
    const response = await requestJson<{ event?: { transaction_id?: string; lago_id?: string } }>(
      this.config,
      this.fetchImplementation,
      "/api/v1/events",
      {
        method: "POST",
        body: JSON.stringify({
          event: {
            transaction_id: event.idempotencyKey,
            external_customer_id: event.accountId,
            code: event.code,
            timestamp: event.occurredAt,
            properties: { quantity: event.quantity, ...event.properties }
          }
        })
      }
    );
    return { externalEventId: response.event?.lago_id ?? response.event?.transaction_id ?? event.idempotencyKey };
  }
}
