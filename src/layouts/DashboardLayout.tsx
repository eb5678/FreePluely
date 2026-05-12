import { Sidebar } from "@/components";
import { Outlet } from "react-router-dom";

export const DashboardLayout = () => {
  return (
      <div className="relative flex h-screen w-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex flex-1 flex-col overflow-hidden px-8">
          <Outlet />
        </main>
      </div>
  );
};