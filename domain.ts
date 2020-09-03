import { ShopifyOrderWebhook } from "./shopify.ts";
import { UnifaunShipment } from "./unifaun.ts";

export type HSCode = {
  statNo: string;
  subStatNo1?: string;
  subStatNo2?: string;
  contents: string;
  count: number;
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

export type Shipment = {
  receiver: ReceiverAddress;
  orderNo: string;
  weight: WeightKg;
  email: string;
  test?: boolean;
};

export type ShipmentReady = Shipment & {
  sender: Sender;
  service: ShippingService;
  description: string;
};

export const fromShopifyDto = (order: ShopifyOrderWebhook): Shipment => ({
  email: order.email,
  orderNo: order.name,
  receiver: {
    name: order.shipping_address.name,
    address1: order.shipping_address.address1,
    address2: order.shipping_address.address2,
    zipcode: order.shipping_address.zip,
    city: order.shipping_address.city,
    countryCode: order.shipping_address.country_code,
  },
  weight: order.total_weight,
  test: order.test,
});

export const getShipmentProcessor = (
  senderId: string,
  serviceId: string,
  description: string,
) => (shipment: Shipment): ShipmentReady => ({
  ...shipment,
  sender: senderId,
  service: serviceId,
  description: description,
});

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
  test: shipment.test,
});
