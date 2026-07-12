import Stripe from "stripe";
import env from "./env.js";

const stripe = new Stripe(env.stripeSecretKey, {
  apiVersion: "2026-06-24.dahlia",
});

export default stripe;
