import { describe, expect, it } from "vitest";
import { marketingCtas, pricingPackages } from "../lib/marketing";

describe("marketing CTA model", () => {
  it("keeps demo as the primary CTA and free as the secondary CTA", () => {
    expect(marketingCtas.primary.label).toBe("Book a demo");
    expect(marketingCtas.primary.href).toContain("sales@buildscore.dev");
    expect(marketingCtas.secondary.label).toBe("Start free");
    expect(marketingCtas.secondary.href).toBe("/login");
  });
});

describe("pricing packages", () => {
  it("uses a hybrid pricing posture across packages", () => {
    expect(pricingPackages.find((pkg) => pkg.name === "Free")?.priceLabel).toBe("$0");
    expect(pricingPackages.find((pkg) => pkg.name === "Pro")?.priceLabel).toContain("Starting at");
    expect(pricingPackages.find((pkg) => pkg.name === "Enterprise")?.priceLabel).toBe("Custom");
  });
});
