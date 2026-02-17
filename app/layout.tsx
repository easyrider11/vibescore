import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Vbescore",
  description: "Vibe coding + architecture interview evaluation",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-mist via-white to-slate-50">
          {children}
        </div>
      </body>
    </html>
  );
}
