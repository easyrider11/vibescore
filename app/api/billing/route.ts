import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { ensureOrg } from "../../../lib/org";
import { getBillingStatus, createCheckoutSession, createPortalSession, canCreateSession } from "../../../lib/billing";
import { PLANS, type PlanKey } from "../../../lib/stripe";

/**
 * GET /api/billing — Get current billing status
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await ensureOrg(user.id);
  const status = await getBillingStatus(org.id);
  const canCreate = await canCreateSession(org.id);

  return NextResponse.json({
    ...status,
    canCreateSession: canCreate,
    plans: PLANS,
  });
}

/**
 * POST /api/billing — Create checkout or portal session
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await ensureOrg(user.id);

  // Only owner/admin can manage billing
  const userRecord = await (await import("../../../lib/prisma")).prisma.user.findUnique({
    where: { id: user.id },
  });
  if (!userRecord || !["owner", "admin"].includes(userRecord.role)) {
    return NextResponse.json({ error: "Only admins can manage billing" }, { status: 403 });
  }

  const body = await req.json();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const returnUrl = `${appUrl}/app/billing`;

  try {
    if (body.action === "checkout") {
      const planKey = body.plan as PlanKey;
      if (!planKey || !PLANS[planKey]) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }
      const url = await createCheckoutSession(org.id, user.id, planKey, returnUrl);
      return NextResponse.json({ url });
    }

    if (body.action === "portal") {
      const url = await createPortalSession(org.id, returnUrl);
      return NextResponse.json({ url });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Billing error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
