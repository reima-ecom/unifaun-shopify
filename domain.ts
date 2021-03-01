import { ShopifyOrderWebhook } from "./shopify.ts";
import { UnifaunShipment } from "./unifaun.ts";

export type HSCode = {
  statNo: string;
  subStatNo1?: string;
  subStatNo2?: string;
  contents: string;
  count: number;
  originCountryCode: string;
  weight?: number;
};

type Sender = string;
type ReceiverAddress = {
  name: string;
  address1: string;
  address2: string;
  zipcode: string;
  city: string;
  countryCode: string;
};
type ShippingService = string;
type WeightKg = number;
type LineItem = {
  productId: number;
  variantId: number;
  price: number;
  quantity: number;
};

export type Shipment = {
  receiver: ReceiverAddress;
  orderNo: string;
  weight: WeightKg;
  value: number;
  email: string;
  lineItems: LineItem[];
  currency: string;
  test?: boolean;
  sender?: Sender;
  service?: ShippingService;
  description?: string;
  hsCodes?: HSCode[];
};

export type ShipmentReady = Shipment & {
  sender: Sender;
  service: ShippingService;
  description: string;
  hsCodes: HSCode[];
};

export const fromShopifyDto = (order: ShopifyOrderWebhook): Shipment => ({
  email: order.email,
  orderNo: order.name,
  lineItems: order.line_items.map((line) => ({
    variantId: line.variant_id,
    productId: line.product_id,
    price: Number.parseFloat(line.price),
    quantity: line.quantity,
  })),
  receiver: {
    name: order.shipping_address.name,
    address1: order.shipping_address.address1,
    address2: order.shipping_address.address2,
    zipcode: order.shipping_address.zip,
    city: order.shipping_address.city,
    countryCode: order.shipping_address.country_code,
  },
  weight: Number.parseInt(order.total_weight) / 1000,
  currency: order.currency,
  value: Number.parseFloat(order.total_line_items_price),
  test: order.test,
});

export const getShipmentProcessor = (
  senderId: string,
  serviceId: string,
  description: string,
) =>
  <T extends Shipment>(shipment: T) => ({
    ...shipment,
    sender: senderId,
    service: serviceId,
    description: description,
  });

export const getAttachHSCodes = (
  hsCodeGetter: (id: number) => Promise<HSCode[]>,
) =>
  async <T extends Shipment>(shipment: T) => ({
    ...shipment,
    hsCodes: (await Promise.all(
      shipment.lineItems.map((line) => hsCodeGetter(line.productId)),
    )).flat(),
  });

const valuePerItem = (
  shipment: ShipmentReady,
) => (shipment.value /
  shipment.hsCodes.reduce((total, h) => total + h.count, 0));

export const toUnifaunDto = (
  shipment: ShipmentReady,
): UnifaunShipment => ({
  sender: {
    quickId: shipment.sender,
  },
  goodsDescription: shipment.description,
  orderNo: shipment.orderNo,
  receiver: {
    name: shipment.receiver.name,
    address1: shipment.receiver.address1,
    address2: shipment.receiver.address2,
    zipcode: shipment.receiver.zipcode,
    city: shipment.receiver.city,
    country: shipment.receiver.countryCode,
  },
  service: { id: shipment.service },
  parcels: [{
    contents: shipment.description,
    copies: 1,
    valuePerParcel: true,
    weight: shipment.weight,
  }],
  senderReference: shipment.email,
  customsDeclaration: {
    currencyCode: shipment.currency,
    declarant: "Reima Oy",
    declarantCity: "Vantaa, Finland",
    jobTitle: "",
    invoiceNo: shipment.orderNo,
    invoiceType: "STANDARD",
    termCode: "022",
    lines: shipment.hsCodes.map((hsCode) => ({
      contents: hsCode.contents,
      statNo: hsCode.statNo,
      subStatNo1: hsCode.subStatNo1 || null,
      subStatNo2: hsCode.subStatNo2 || null,
      sourceCountryCode: hsCode.originCountryCode,
      copies: hsCode.count,
      valuesPerItem: true,
      value: valuePerItem(shipment),
      netWeight: hsCode.weight || 0,
    })),
    declarantDate: new Date().toLocaleDateString("fi"),
    printSet: ["proformaposti", "cn23posti"],
  },
  test: shipment.test,
});
