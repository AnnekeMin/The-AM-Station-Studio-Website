// functions/stripe-checkout.js
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Secure server-side map from your SKUs -> Stripe Price IDs.
 * This prevents customers from modifying prices in the browser.
 */
const priceMap = {
  // Books (examples – paste your real price IDs)
  "BOOK-ROIB1-PB":       "price_XXX_ROI_B1_PB",
  "BOOK-ROIB1-HC":       "price_XXX_ROI_B1_HC",
  "BOOK-FORESHADOW-PB":  "price_XXX_FORES_PB",
  "BOOK-FORESHADOW-EB":  "price_XXX_FORES_EB",
  "BOOK-ISLAREALM-PB":   "price_XXX_ISLA_PB",
  "BOOK-ISLAREALM-HC":   "price_XXX_ISLA_HC",
  "BOOK-LORE-PB":        "price_XXX_LORE_PB",
  "SET-SHADOWLIGHT":     "price_XXX_SET_SHADOWLIGHT",
  "PRINT-TOMB-CIRCLE":   "price_XXX_TOMB_PRINT",

  // AM Designs services (optional)
  "DES-EDES-ROOM":       "price_XXX_EDESIGN",
  "DES-COLOR-90":        "price_XXX_COLOR",
  "DES-FULL-SVC-DEP":    "price_XXX_FULLSVC_DEP",

  // M-C Production packages (optional)
  "PROD-BRAND-STORY-DEP":"price_XXX_BRAND_STORY_DEP",
  "PROD-EVENT-HL":       "price_XXX_EVENT_HL",
  "PROD-TEASER":         "price_XXX_TEASER"
};

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { items } = JSON.parse(event.body || "{}");
    if (!Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, body: "No items" };
    }

    // Convert cart items (SKU + qty) to Stripe line_items using trusted price IDs
    const line_items = [];
    for (const i of items) {
      const priceId = priceMap[i.sku];
      if (!priceId) return { statusCode: 400, body: `Unknown SKU: ${i.sku}` };
      const qty = Number.isFinite(i.qty) && i.qty > 0 ? i.qty : 1;
      line_items.push({ price: priceId, quantity: qty });
    }

    const baseUrl = process.env.URL || "http://localhost:8888";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: `${baseUrl}/success.html`,
      cancel_url: `${baseUrl}/checkout.html`
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
