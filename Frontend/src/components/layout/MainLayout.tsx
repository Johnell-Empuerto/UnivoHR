import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useAuth } from "@/app/providers/AuthProvider";
import { AiChatButton } from "@/features/ai/components/AiChatButton";

const MainLayout = ({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}) => {
  const { isAuth } = useAuth();

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* SIDEBAR */}
      <div
        className={`hidden md:block transition-[width] duration-300 ease-in-out will-change-[width] ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <Sidebar collapsed={collapsed} />
      </div>

      {/* MAIN */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {/* NAVBAR (fixed height) */}
        <Navbar collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-background min-h-0">
          <Outlet />
        </main>
      </div>

      {/* AI ASSISTANT */}
      {isAuth && <AiChatButton />}
    </div>
  );
};

export default MainLayout;
