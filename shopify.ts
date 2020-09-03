import { ServerRequest, HmacSha256 } from "./deps.ts";

type LegacyId = number;
type AdminGraphQlId = string;
type Email = string;
type PriceString = string;
type Weight = number;
type WeightGrams = number;
type Currency = string;
type OrderNumber = string;

type Address = {
  first_name: string;
  address1: string;
  phone: string;
  city: string;
  zip: string;
  province: string;
  country: string;
  last_name: string;
  address2: string;
  company: string;
  name: string;
  country_code: string;
  province_code: string;
};

type LineItem = {
  id: LegacyId;
  variant_id: LegacyId;
  product_id: LegacyId;
  name: string;
  title: string;
  variant_title: string;
  quantity: number;
  sku: string;
  vendor: string;
  requires_shipping: true;
  fulfillable_quantity: number;
  grams: WeightGrams;
  price: PriceString;
  admin_graphql_api_id: AdminGraphQlId;
};

export type ShopifyOrderWebhook = {
  test: boolean;
  id: LegacyId;
  email: Email;
  total_price: PriceString;
  subtotal_price: PriceString;
  total_weight: Weight;
  total_tax: PriceString;
  taxes_included: boolean;
  currency: Currency;
  total_discounts: PriceString;
  total_line_items_price: PriceString;
  name: OrderNumber;
  contact_email: Email;
  admin_graphql_api_id: AdminGraphQlId;
  shipping_address: Address;
  line_items: LineItem[];
};

export const getVerifyRequestAndDeserialize = (secret: string) =>
  async (req: ServerRequest): Promise<ShopifyOrderWebhook> => {
    const buf: Uint8Array = await Deno.readAll(req.body);
    const hmac = new HmacSha256(secret).update(buf.buffer);
    // const hmacBase64 = btoa(hmac.hex());
    const hmacHeader = req.headers.get("X-Shopify-Hmac-SHA256");
    const hmacBase64 = btoa(
      hmac.digest().map((v) => String.fromCharCode(v)).join(""),
    );

    if (hmacBase64 !== hmacHeader) {
      throw new Error("Could not verify webhook came from Shopify");
    }

    const body = new TextDecoder().decode(buf);
    return JSON.parse(body);
  };