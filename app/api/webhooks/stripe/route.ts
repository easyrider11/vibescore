import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "../../../../lib/stripe";
import { handleSubscriptionEvent } from "../../../../lib/billing";
import { captureException } from "../../../../lib/observability";

/**
 * POST /api/webhooks/stripe — Handle Stripe webhook events
 * This endpoint must be unauthenticated (called by Stripe).
 */
export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || "",
    );
  } catch (err) {
    captureException(err, { route: "/api/webhooks/stripe", tags: { op: "signature" } });
    const message = err instanceof Error ? err.message : "Signature verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Handle subscription events
  const subscriptionEvents = [
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ];

  if (subscriptionEvents.includes(event.type)) {
    try {
      await handleSubscriptionEvent(event as unknown as {
        type: string;
        data: { object: Record<string, unknown> };
      });
    } catch (err) {
      captureException(err, {
        route: "/api/webhooks/stripe",
        tags: { op: "handler", eventType: event.type },
      });
      // Return 200 to prevent Stripe retries for handler errors
    }
  }

  return NextResponse.json({ received: true });
}
