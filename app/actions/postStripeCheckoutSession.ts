'use server';

import axios from 'axios';

type PostStripeCheckoutSessionType = {
  stripePriceId: string;
  draftId: string;
};

export async function postStripeCheckoutSession({
  stripePriceId,
  draftId,
}: PostStripeCheckoutSessionType): Promise<{ clientSecret: string } | null> {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/stripe/create-checkout-session`,
      {
        priceId: stripePriceId,
        quantity: 1,
        uiMode: 'embedded_page',
        mode: 'subscription',
        draftId,
      },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return response.data;
  } catch (err) {
    console.error('Error creating Stripe checkout session:', err);
    return null;
  }
}
