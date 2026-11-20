import { redirect } from "next/navigation";

import { BottomNav } from "@/components/app-shell/bottom-nav";
import { Sidebar } from "@/components/app-shell/sidebar";
import { auth } from "@/lib/auth/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col">
      <Sidebar user={session.user} />
      <div className="flex flex-1 flex-col pb-24 md:pb-0 md:pl-64">{children}</div>
      <BottomNav />
    </div>
  );
}
