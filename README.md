# Unifaun Shipment Creator from Shopify Order

Cloudflare Worker webhook that creates a shipment in Unifaun for orders in Shopify. Features:

- Able to create the shipment with customs information.
- Able to add many customs information lines for one product (e.g. in the case of bundled products).

## Usage

HS (customs) codes for the products included in the order are configured using tags. Add HS codes by adding one or many tags in the following format:

```
HS:[COUNTRY]:[STATNO]:[SUBSTATNO1?]:[SUBSTATNO2?]:[CONTENTS]:[COUNT?]:[WEIGHT?]
```

The tag should always begin with `HS:` and then list the properties in the specified order. Properties with a `?` suffix are optional, but please still include the required `:` separators. Count is assumed to be one if left blank.

Example of a tag specifying 22 counts of baby clothes (note that SUBSTATNO2 and weight is left blank):

```
HS:FI:61112090:2000::Baby clothes set:22
```

If the bundle includes many products that have the same HS code, you can add them using COUNT. If there are many different HS codes within the same bundle, just add as many HS tags as you need.

## Installation

Publishing is done with [Wrangler](https://developers.cloudflare.com/workers/cli-wrangler/install-update) using a GitHub Action. The following environment variables need to be set on the worker (via the Workers web UI or via wrangler):

- `UNIFAUN_TOKEN`: Unifaun API token
- `UNIFAUN_SENDER`: Unifaun Sender ID to send the shipment from
- `UNIFAUN_SERVICE`: Service code for specifying which shipping service to use
- `SHOPIFY_WEBHOOK_SECRET`: Shopify webhook secret
- `SHOPIFY_BASIC_AUTH`: [Shopify basic auth token](https://shopify.dev/tutorials/authenticate-a-private-app-with-shopify-admin#make-authenticated-requests)
- `SHOPIFY_SHOP`: Shopify shop name

## Development

VSCode preferred. In order to bundle the worker, you need [Deno](https://deno.land) and in order to publish you need [Wrangler](https://developers.cloudflare.com/workers/cli-wrangler/install-update).