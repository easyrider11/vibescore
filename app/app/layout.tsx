import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";
import { DashboardSidebar } from "../../components/DashboardSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <DashboardSidebar userEmail={user.email} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
