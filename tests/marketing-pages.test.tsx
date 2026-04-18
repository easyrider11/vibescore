import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import LandingPage from "../app/page";
import PricingPage from "../app/pricing/page";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

describe("landing page", () => {
  it("prioritizes demo messaging and foregrounds the AI-native thesis", () => {
    const html = renderToStaticMarkup(<LandingPage />);

    expect(html).toContain("Book a demo");
    expect(html).toContain("Hire the engineers who build well");
    expect(html).toContain("with AI");
    expect(html).toContain("Try the interactive demo");
    expect(html).toContain("What we record while the candidate works");
  });
});

describe("pricing page", () => {
  it("frames plans as rollout packages with hybrid pricing language", () => {
    const html = renderToStaticMarkup(<PricingPage />);

    expect(html).toContain("Starting at $49");
    expect(html).toContain("Custom");
    expect(html).toContain("Book a demo");
    expect(html).toContain("Who each plan is for");
  });
});
