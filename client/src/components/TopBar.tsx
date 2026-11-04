import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { Button } from "./ui/button";

const NAV = [
  { to: "/play", label: "Play" },
  { to: "/sudoku", label: "Daily Sudoku" },
];

const TopBar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-5 px-4 sm:gap-6 sm:px-8">
        <Link to="/" aria-label="Game Arena home" className="flex shrink-0 items-center gap-2 font-semibold">
          <img src="/favicon.svg" alt="" width={22} height={22} />
          <span className="hidden sm:inline">Game Arena</span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-5 text-sm">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `whitespace-nowrap transition-colors hover:text-foreground ${isActive ? "text-foreground" : "text-[#bbbbbb]"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden max-w-40 truncate text-sm text-muted-foreground sm:inline">{user.user_name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : pathname !== "/login" && (
            <Button asChild size="sm">
              <Link to="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
