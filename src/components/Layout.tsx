import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  Home,
  Hexagon,
  CreditCard,
  Target,
  PieChart,
  ShoppingBag,
  Plus,
  Bell,
  Settings,
  Menu,
  ScanLine,
  Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";

export function Layout() {
  const location = useLocation();
  const { userProfile } = useAuth();

  const navItems = [
    { label: "Início", icon: Home, path: "/" },
    { label: "Calendário", icon: CalendarIcon, path: "/calendar" },
    { label: "Lançamentos", icon: CreditCard, path: "/transactions" },
    { label: "IA Leitor", icon: ScanLine, path: "/import" },
    { label: "Metas", icon: Target, path: "/goals" },
    { label: "Análises", icon: PieChart, path: "/analytics" },
    { label: "Desejos", icon: ShoppingBag, path: "/wishlist" },
  ];

  return (
    <div className="min-h-screen bg-[#090E17] flex flex-col md:flex-row font-sans text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/5 bg-[#151E2E] fixed h-full z-20">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">
              FlowControl
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-3xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/50"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white",
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5",
                    isActive ? "text-white" : "text-slate-400",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-3 py-3 rounded-3xl text-sm font-medium text-slate-400 hover:bg-white/[0.04] hover:text-white transition-all duration-200"
          >
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="Perfil" className="w-6 h-6 rounded-full object-cover border border-white/10" />
            ) : (
              <Settings className="w-5 h-5 text-slate-400" />
            )}
            Configurações
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pb-24 md:pb-0">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation - Scrollable */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#151E2E] border-t border-white/5 flex items-center overflow-x-auto pb-safe pt-2 px-2 z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] scrollbar-none">
        <div className="flex w-full items-center justify-start gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[4.5rem] py-2 gap-1 rounded-3xl transition-colors shrink-0",
                  isActive ? "text-white bg-indigo-600" : "text-slate-400 hover:text-white",
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          <Link
            to="/settings"
            className="flex flex-col items-center justify-center min-w-[4.5rem] py-2 gap-1 rounded-3xl text-slate-400 transition-colors shrink-0"
          >
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="Perfil" className="w-5 h-5 rounded-full object-cover border border-white/10" />
            ) : (
              <Settings className="w-5 h-5" />
            )}
            <span className="text-[10px] font-medium">Ajustes</span>
          </Link>
        </div>
      </nav>

      {/* Global FAB (Mobile) - Link to transactions as a generic add */}
      <div className="md:hidden fixed bottom-20 right-4 z-50">
        <Link to="/transactions" className="w-14 h-14 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-sky-500/30 active:scale-95 transition-transform">
          <Plus className="w-6 h-6" />
        </Link>
      </div>
    </div>
  );
}
