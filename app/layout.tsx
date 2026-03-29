import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Buildscore — Technical Interviews for the AI Era",
  description: "Evaluate engineering candidates on how they build with AI. Real codebases, built-in copilot, live pair programming, and AI usage analytics.",
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
