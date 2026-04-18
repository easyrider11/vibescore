import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";
import { DashboardSidebar } from "../../components/DashboardSidebar";
import { DemoBanner } from "../../components/DemoBanner";
import { isDemoUser } from "../../lib/demo";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const demo = isDemoUser(user.email);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <DashboardSidebar userEmail={user.email} />
      <main className="flex-1 overflow-auto">
        {demo && <DemoBanner />}
        {children}
      </main>
    </div>
  );
}
