// React import not required with the new JSX transform
import { useAuthStore } from "../store/auth";
import { Button } from "./ui/button";
import { LogOut, User as UserIcon, Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface SidebarProps {
  onAction?: () => void;
}

const Sidebar = ({ onAction }: SidebarProps) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleNavigate = (path: string) => {
    navigate(path);
    onAction?.();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    onAction?.();
  };

  const menuItems = [{ icon: Home, label: "Lobby", path: "/" }];

  return (
    <aside className="w-64 bg-card border-r border-border h-full flex flex-col p-4 overflow-y-auto">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 overflow-hidden">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.user_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <UserIcon className="w-6 h-6 text-primary" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm truncate w-32">
            {user.user_name}
          </span>
          <span className="text-xs text-muted-foreground truncate w-32">
            {user.email}
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <Button
            key={item.path}
            variant={location.pathname === item.path ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 h-11 font-medium"
            onClick={() => handleNavigate(item.path)}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Button>
        ))}
      </nav>

      <div className="mt-auto border-t border-border pt-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10 font-medium"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Log out
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
