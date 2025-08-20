// npm i stripe
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event){
  try {
    const { items } = JSON.parse(event.body || '{}');

    // Map items to Stripe price IDs (recommended).
    // For a quick demo, you can create Prices in Stripe and map SKU -> price ID here:
    const priceMap = {
      'BOOK-ROIB1-PB': 'price_123...',  // <- replace with real price IDs from Stripe
      'BOOK-FORESHADOW-PB': 'price_456...',
      // ...
    };

    const line_items = items.map(i => ({
      price: priceMap[i.sku],
      quantity: i.qty
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: 'https://YOUR-SITE/success.html',
      cancel_url: 'https://YOUR-SITE/checkout.html'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}
