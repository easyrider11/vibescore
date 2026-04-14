import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MarketingNav } from "../components/marketing/MarketingNav";
import { PricingPackageCard } from "../components/marketing/PricingPackageCard";
import { marketingCtas } from "../lib/marketing";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

describe("MarketingNav", () => {
  it("renders demo-first CTA order", () => {
    const html = renderToStaticMarkup(
      <MarketingNav primaryCta={marketingCtas.primary} secondaryCta={marketingCtas.secondary} />,
    );

    const demoIndex = html.indexOf("Book a demo");
    const freeIndex = html.indexOf("Start free");

    expect(demoIndex).toBeGreaterThan(-1);
    expect(freeIndex).toBeGreaterThan(-1);
    expect(demoIndex).toBeLessThan(freeIndex);
  });
});

describe("PricingPackageCard", () => {
  it("renders enterprise-style package language", () => {
    const html = renderToStaticMarkup(
      <PricingPackageCard
        name="Enterprise"
        priceLabel="Custom"
        cadenceLabel=" engagement"
        audience="For security and rollout needs"
        description="Security review, onboarding, and rollout support."
        features={["SSO", "Integrations"]}
        cta={marketingCtas.primary}
      />,
    );

    expect(html).toContain("Enterprise");
    expect(html).toContain("Custom");
    expect(html).toContain("For security and rollout needs");
    expect(html).toContain("Book a demo");
  });
});
