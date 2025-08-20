// functions/stripe-checkout.js
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Paste your real Stripe Price IDs (from Dashboard → Products → Prices).
 * Use TEST prices while you’re testing; switch to LIVE when you’re ready.
 */
const priceMap = {
  // ——— Minott Press (Books / Prints) ———
  // Book One: The Realm of Isla
  "BOOK-ROIB1-PB":       "price_XXX_ROI_B1_PB",   // Paperback $19.99
  "BOOK-ROIB1-HC":       "price_XXX_ROI_B1_HC",   // Signed Hardcover $29.99

  // Book Two: Foreshadow
  "BOOK-FORESHADOW-PB":  "price_XXX_FORES_PB",    // Paperback $21.99
  "BOOK-FORESHADOW-EB":  "price_XXX_FORES_EB",    // eBook $9.99

  // Book Three: Isla Realm
  "BOOK-ISLAREALM-PB":   "price_XXX_ISLA_PB",     // Paperback $22.99
  "BOOK-ISLAREALM-HC":   "price_XXX_ISLA_HC",     // Deluxe Hardcover $34.99

  // Companion & Set
  "BOOK-LORE-PB":        "price_XXX_LORE_PB",     // Lore & Runes Compendium $17.99
  "SET-SHADOWLIGHT":     "price_XXX_SET_SHADOWLIGHT", // Collector’s Set $59.00

  // Art Print
  "PRINT-TOMB-CIRCLE":   "price_XXX_TOMB_PRINT",  // Tombstone Circle Print $24.00

  // ——— AM Designs (Services) ———
  "DES-EDES-ROOM":       "price_XXX_EDESIGN",      // E-Design Essentials $349
  "DES-COLOR-90":        "price_XXX_COLOR",        // Color & Styling Session $149
  "DES-FULL-SVC-DEP":    "price_XXX_FULLSVC_DEP",  // Full-Service Design (Deposit) $500

  // ——— M-C Production (Packages) ———
  "PROD-BRAND-STORY-DEP":"price_XXX_BRAND_STORY_DEP", // Brand Story Video (Deposit) $500
  "PROD-EVENT-HL":       "price_XXX_EVENT_HL",        // Event Coverage $1,800
  "PROD-TEASER":         "price_XXX_TEASER"           // Short Film / Teaser $1,200
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

    // Build Stripe line items using trusted server-side price IDs
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
