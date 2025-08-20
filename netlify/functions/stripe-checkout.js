import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const priceMap = {
  // TODO: paste your real Stripe Price IDs
  "BOOK-ROIB1-PB": "price_XXX_ROI_B1_PB",
  // ...
};

export async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { items } = JSON.parse(event.body || "{}");
    if (!Array.isArray(items) || items.length === 0) return { statusCode: 400, body: "No items" };

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

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
