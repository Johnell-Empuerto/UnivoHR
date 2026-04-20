import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Menu, Moon, Sun, User, Settings, LogOut } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";

import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "../ui/Button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { useTheme } from "@/app/providers/ThemeProvider";
import Sidebar from "./Sidebar";
import { useAuth } from "@/app/providers/AuthProvider";

const Navbar = ({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Logged out successfully", { position: "top-center" });
  };

  // Get user initials
  const getUserInitials = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    if (user?.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    }
    if (user?.last_name) {
      return user.last_name.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Get user display name for dropdown
  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.first_name && user?.last_name)
      return `${user.first_name} ${user.last_name}`;
    if (user?.first_name) return user.first_name;
    if (user?.last_name) return user.last_name;
    return "User";
  };

  return (
    <div className="h-16 border-b flex items-center justify-between px-4 md:px-6 bg-background text-foreground">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        {/* MOBILE */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="p-0 w-64">
              <Sidebar collapsed={false} />
            </SheetContent>
          </Sheet>
        </div>

        {/* DESKTOP */}
        <div className="hidden md:block">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        {/* THEME */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* NOTIFICATIONS */}
        <NotificationDropdown />

        {/* USER */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar>
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5 text-sm font-medium border-b mb-1">
              {getUserName()}
            </div>
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => navigate("/profile")}
            >
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-500"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Navbar;
