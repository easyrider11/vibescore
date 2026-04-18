import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "Buildscore — Technical interviews for the AI era",
    template: "%s · Buildscore",
  },
  description:
    "Evaluate engineering candidates on how they build with AI. Real codebases, built-in copilot, live pair programming, and AI-usage analytics.",
  openGraph: {
    title: "Buildscore — Technical interviews for the AI era",
    description:
      "Evaluate how engineers build with AI. Real codebases, built-in copilot, AI-usage analytics.",
    type: "website",
    siteName: "Buildscore",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buildscore — Technical interviews for the AI era",
    description:
      "Evaluate how engineers build with AI. Real codebases, built-in copilot, AI-usage analytics.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e1117",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
