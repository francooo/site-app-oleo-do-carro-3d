import { redirect } from "next/navigation";

import { BottomNav } from "@/components/app-shell/bottom-nav";
import { Sidebar } from "@/components/app-shell/sidebar";
import { auth } from "@/lib/auth/auth";
import { getSelectedVehicleForUser } from "@/lib/db/queries/vehicles";
import { vehicleDisplayName, vehicleEngineLabel } from "@/lib/domain/vehicle";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const selected = await getSelectedVehicleForUser(session.user.id);

  return (
    <div className="flex flex-1 flex-col">
      <Sidebar
        user={session.user}
        selectedVehicle={
          selected
            ? { name: vehicleDisplayName(selected), engine: vehicleEngineLabel(selected) }
            : null
        }
      />
      <div className="flex flex-1 flex-col pb-24 md:pb-0 md:pl-64">{children}</div>
      <BottomNav />
    </div>
  );
}
