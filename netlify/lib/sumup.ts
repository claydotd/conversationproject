import { getEnv, requireEnv } from "./env";

export interface SumUpCheckout {
  id: string;
  status: string;
  checkout_reference?: string;
  amount?: number;
  currency?: string;
  hosted_checkout_url?: string;
  hosted_checkout?: {
    enabled?: boolean;
  };
}

function apiKey(): string {
  return requireEnv("SUMUP_API_KEY");
}

function merchantCode(): string {
  return requireEnv("SUMUP_MERCHANT_CODE");
}

export function sumupConfigured(): boolean {
  return Boolean(getEnv("SUMUP_API_KEY") && getEnv("SUMUP_MERCHANT_CODE"));
}

async function sumupFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey()}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`https://api.sumup.com${path}`, {
    ...init,
    headers,
  });
}

export async function createHostedCheckout(input: {
  amountMajor: number;
  currency: string;
  checkoutReference: string;
  description: string;
  redirectUrl: string;
}): Promise<SumUpCheckout> {
  const payToEmail = getEnv("SUMUP_PAY_TO_EMAIL");
  const body: Record<string, unknown> = {
    amount: input.amountMajor,
    currency: input.currency,
    checkout_reference: input.checkoutReference,
    merchant_code: merchantCode(),
    description: input.description,
    redirect_url: input.redirectUrl,
    hosted_checkout: { enabled: true },
  };
  if (payToEmail) body.pay_to_email = payToEmail;

  const response = await sumupFetch("/v0.1/checkouts", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as
    | SumUpCheckout
    | { message?: string; error_message?: string }
    | null;
  if (!response.ok) {
    const message =
      (payload && "message" in payload && payload.message) ||
      (payload && "error_message" in payload && payload.error_message) ||
      `SumUp checkout failed (${response.status}).`;
    throw new Error(String(message));
  }
  return payload as SumUpCheckout;
}

export async function getCheckout(checkoutId: string): Promise<SumUpCheckout> {
  const response = await sumupFetch(
    `/v0.1/checkouts/${encodeURIComponent(checkoutId)}`,
  );
  const payload = (await response.json().catch(() => null)) as
    | SumUpCheckout
    | { message?: string }
    | null;
  if (!response.ok) {
    const message =
      (payload && "message" in payload && payload.message) ||
      `Unable to load SumUp checkout (${response.status}).`;
    throw new Error(String(message));
  }
  return payload as SumUpCheckout;
}

export function isCheckoutPaid(checkout: SumUpCheckout): boolean {
  return String(checkout.status || "").toUpperCase() === "PAID";
}

export function isCheckoutFailed(checkout: SumUpCheckout): boolean {
  const status = String(checkout.status || "").toUpperCase();
  return status === "FAILED" || status === "EXPIRED";
}
