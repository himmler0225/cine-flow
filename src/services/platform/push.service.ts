import { platformFetch } from "@/lib/platformApi";

export const pushApi = {
  async publicKey(): Promise<string | null> {
    const { public_key } = await platformFetch<{ public_key: string | null }>(
      "/api/push/public-key",
      { auth: false },
    );

    return public_key;
  },
  subscribe(subscription: PushSubscriptionJSON) {
    return platformFetch<{ ok: boolean }>("/api/push/subscribe", {
      method: "POST",
      body: JSON.stringify({ endpoint: subscription.endpoint, keys: subscription.keys }),
    });
  },
  unsubscribe(endpoint: string) {
    return platformFetch<{ ok: boolean }>("/api/push/subscribe", {
      method: "DELETE",
      body: JSON.stringify({ endpoint }),
    });
  },
  test() {
    return platformFetch<{ delivered: number }>("/api/push/test", { method: "POST" });
  },
};
