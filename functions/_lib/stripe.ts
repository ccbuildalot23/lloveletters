import Stripe from 'stripe';
import type { Env } from './env';

export function stripeClient(env: Env): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
    apiVersion: '2026-08-27.basil' as Stripe.LatestApiVersion, // [verify against your Stripe dashboard API version]
    maxNetworkRetries: 2,
  });
}

export const webhookCrypto = () => Stripe.createSubtleCryptoProvider();
