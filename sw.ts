import "https://raw.githubusercontent.com/ericselin/worker-types/main/cloudflare-worker-types.ts";
import { getWorkflow } from "./workflow.ts";

declare global {
  interface Window {
    UNIFAUN_TOKEN: string | undefined;
    UNIFAUN_SENDER: string | undefined;
    UNIFAUN_SERVICE: string | undefined;
    SHOPIFY_WEBHOOK_SECRET: string | undefined;
    SHOPIFY_BASIC_AUTH: string | undefined;
    SHOPIFY_SHOP: string | undefined;
  }
}

const handleRequest = async (request: Request) => {
  const unifaunToken = self.UNIFAUN_TOKEN;
  const unifaunSender = self.UNIFAUN_SENDER;
  const unifaunService = self.UNIFAUN_SERVICE;
  const shopifyWebhookSecret = self.SHOPIFY_WEBHOOK_SECRET;
  const shopifyBasicAuth = self.SHOPIFY_BASIC_AUTH;
  const shopifyShop = self.SHOPIFY_SHOP;

  if (
    !unifaunToken || !unifaunSender || !unifaunService ||
    !shopifyWebhookSecret ||
    !shopifyBasicAuth || !shopifyShop
  ) {
    throw new Error("Needed environment variables not set");
  }

  const createShipment = getWorkflow({
    unifaunToken,
    unifaunSender,
    unifaunService,
    shopifyWebhookSecret,
    shopifyBasicAuth,
    shopifyShop,
  });
  await createShipment(request);

  return new Response(undefined, { status: 201 });
};

addEventListener("fetch", async (event) => {
  event.respondWith(handleRequest(event.request));
});
