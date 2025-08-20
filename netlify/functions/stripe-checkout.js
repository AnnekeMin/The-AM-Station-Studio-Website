functions/stripe-checkout.js:

const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const priceMap = {
  "BOOK-ROIB1-PB": "price_XXXX", // paste your real Stripe Price IDs
  // ...fill all SKUs used on your site
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  try {
    const { items } = JSON.parse(event.body || "{}");
    if (!Array.isArray(items) || !items.length) return { statusCode: 400, body: "No items" };

    const line_items = items.map(i => {
      const price = priceMap[i.sku];
      if (!price) throw new Error(`Unknown SKU: ${i.sku}`);
      return { price, quantity: Math.max(1, parseInt(i.qty||1,10)) };
    });

    const baseUrl = process.env.URL || "http://localhost:8888";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${baseUrl}/success.html`,
      cancel_url: `${baseUrl}/checkout.html`
    });

    return { statusCode: 200, headers: { "Content-Type":"application/json" }, body: JSON.stringify({ url: session.url }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
