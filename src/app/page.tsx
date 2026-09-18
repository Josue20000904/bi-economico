import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050b14] text-slate-100">
      <DashboardHeader />
      <DashboardShell />
    </main>
  );
}