import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import TopBar from "./components/TopBar";
import HomeScreen from "./screens/HomeScreen";
import NotFoundScreen from "./screens/NotFoundScreen";
import { useSocket } from "./hooks/useSocket";
import { useAuthStore } from "./store/auth";

// Route-level splitting keeps the public pages (home, sudoku) light.
const AuthScreen = lazy(() => import("./screens/AuthScreen"));
const LobbyScreen = lazy(() => import("./screens/LobbyScreen"));
const RoomScreen = lazy(() => import("./screens/RoomScreen"));
const GameScreen = lazy(() => import("./screens/GameScreen"));
const SudokuScreen = lazy(() => import("./screens/SudokuScreen"));

const ConnectionBanner = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { isConnected } = useSocket();
  const location = useLocation();
  const isGameRoute = /^\/(room|game)\//.test(location.pathname);

  if (!isAuthenticated || isConnected || !isGameRoute) return null;
  return (
    <div role="status" className="bg-destructive py-1.5 text-center text-sm font-medium text-destructive-foreground">
      Connection lost. Reconnecting…
    </div>
  );
};

function AuthBootstrap() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const location = useLocation();

  // Check for an existing session once on load (the login page does its own thing).
  useEffect(() => {
    if (location.pathname !== "/login") checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkAuth]);

  return null;
}

const protect = (element: React.ReactNode) => <ProtectedRoute>{element}</ProtectedRoute>;

function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap />
      <div className="flex min-h-screen flex-col">
        <TopBar />
        <ConnectionBanner />
        <main className="flex flex-1 flex-col">
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/sudoku" element={<SudokuScreen />} />
              <Route path="/login" element={<AuthScreen />} />
              <Route path="/play" element={protect(<LobbyScreen />)} />
              <Route path="/room/:id" element={protect(<RoomScreen />)} />
              <Route path="/game/:id" element={protect(<GameScreen />)} />
              <Route path="*" element={<NotFoundScreen />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
