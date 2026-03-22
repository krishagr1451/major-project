import { Navigate, Outlet, useLocation } from "react-router";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import QuickBacktestButton from "./QuickBacktestButton";

export default function Layout() {
  const location = useLocation();
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
      <QuickBacktestButton />
    </div>
  );
}
