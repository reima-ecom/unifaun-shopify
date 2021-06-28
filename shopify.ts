import { HmacSha256 } from "./deps.ts";
import { HSCode } from "./domain.ts";

type LegacyId = number;
type AdminGraphQlId = string;
type Email = string;
type PriceString = string;
type WeightGrams = string;
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
  total_weight: WeightGrams;
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
  async (req: Request): Promise<ShopifyOrderWebhook> => {
    const body = await req.text();
    const hmac = new HmacSha256(secret).update(body);
    // const hmacBase64 = btoa(hmac.hex());
    const hmacHeader = req.headers.get("X-Shopify-Hmac-SHA256");
    const hmacBase64 = btoa(
      hmac.digest().map((v) => String.fromCharCode(v)).join(""),
    );

    if (hmacBase64 !== hmacHeader) {
      throw new Error("Could not verify webhook came from Shopify");
    }

    return JSON.parse(body);
  };

export const getGetHSCodes = (shopifyShop: string, shopifyAuth: string) =>
  async (productId: LegacyId): Promise<HSCode[]> => {
    console.log("Getting tags for product", productId);
    const response = await fetch(
      `https://${shopifyShop}.myshopify.com/admin/api/2020-07/products/${productId}.json?fields=tags`,
      {
        headers: {
          "Authorization": `Basic ${shopifyAuth}`,
        },
      },
    );
    if (!response.ok) throw new Error(`Could not get HS Code, status ${response.status}`);
    // tags are comma-separated
    // https://shopify.dev/docs/admin-api/rest/reference/products/product
    const obj: { product: { tags: string } } = await response.json();
    const { product: { tags } } = obj;
    return tags
      .split(", ")
      .filter((tag) => tag.startsWith("HS:"))
      .map((tag) => {
        const [, country, statNo, subStatNo1, subStatNo2, contents, count, weight] = tag
          .split(":");
        return <HSCode> {
          contents,
          statNo,
          subStatNo1,
          subStatNo2,
          count: count ? Number.parseInt(count) : 1,
          originCountryCode: country,
          weight: weight ? Number.parseFloat(weight) : undefined,
        };
      });
  };
