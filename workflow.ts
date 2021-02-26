import { getShipmentCreator } from "./unifaun.ts";
import { getGetHSCodes, getVerifyRequestAndDeserialize } from "./shopify.ts";
import {
  fromShopifyDto,
  getAttachHSCodes,
  getShipmentProcessor,
  toUnifaunDto,
} from "./domain.ts";

const log = (description: string, logValue: boolean = true) =>
  <T extends any>(input: T) => {
    console.log(description);
    if (logValue) console.log(input);
    return input;
  };

type WorkflowOptions = {
  unifaunToken: string;
  unifaunSender: string;
  unifaunService: string;
  shopifyWebhookSecret: string;
  shopifyBasicAuth: string;
  shopifyShop: string;
};

export const getWorkflow = (options: WorkflowOptions) =>
  async (request: Request) => {
    const verifyAndDeserialize = getVerifyRequestAndDeserialize(
      options.shopifyWebhookSecret,
    );
    const processShipment = getShipmentProcessor(
      options.unifaunSender,
      options.unifaunService,
      "Baby clothes",
    );
    const attachHSCodes = getAttachHSCodes(
      getGetHSCodes(options.shopifyShop, options.shopifyBasicAuth),
    );
    const createUnifaunShipment = getShipmentCreator(options.unifaunToken);

    return await Promise
      .resolve(request)
      .then(verifyAndDeserialize)
      .then(log("Got data from Shopify:"))
      .then(fromShopifyDto)
      .then(processShipment)
      .then(attachHSCodes)
      .then(log("Ready shipment:"))
      .then(toUnifaunDto)
      .then(createUnifaunShipment)
      .then(log("Created shipment:"));
  };
