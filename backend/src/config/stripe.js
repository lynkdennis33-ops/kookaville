import Stripe from 'stripe';

/**
 * Stripe client initialization
 * Loaded once and shared across the application
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default stripe;
