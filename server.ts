import { serve } from "./deps.ts";
import { getShipmentCreator } from "./unifaun.ts";
import { getVerifyRequestAndDeserialize } from "./shopify.ts";
import { getShipmentProcessor, fromShopifyDto, toUnifaunDto } from "./domain.ts";

const server = serve({ port: 8000 });
console.log("http://localhost:8000/");

const log = (description: string, logValue: boolean = true) =>
  <T extends any>(input: T) => {
    console.log(description);
    if (logValue) console.log(input);
    return input;
  };

const unifaunToken = Deno.env.get("UNIFAUN_TOKEN");
const unifaunSender = Deno.env.get("UNIFAUN_SENDER");
const unifaunService = Deno.env.get("UNIFAUN_SERVICE");
const shopifyWebhookSecret = Deno.env.get("SHOPIFY_WEBHOOK_SECRET");

if (
  !unifaunToken || !unifaunSender || !unifaunService || !shopifyWebhookSecret
) {
  throw new Error("Needed environment variables not set");
}

const verifyAndDeserialize = getVerifyRequestAndDeserialize(shopifyWebhookSecret);
const processShipment = getShipmentProcessor(
  unifaunSender,
  unifaunService,
  "Baby clothes",
);
const createUnifaunShipment = getShipmentCreator(unifaunToken);

for await (const req of server) {
  await Promise
    .resolve(req)
    .then(verifyAndDeserialize)
    .then(log("Got data from Shopify:"))
    .then(fromShopifyDto)
    .then(processShipment)
    .then(toUnifaunDto)
    .then(createUnifaunShipment)
    .then(log("Created shipment:"));

  req.respond({ body: "Ok" });
}
