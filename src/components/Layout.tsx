import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Home, CreditCard, Target, PieChart, ShoppingBag, Plus, Bell, Settings, Menu } from 'lucide-react';
import { cn } from '../lib/utils';

export function Layout() {
  const location = useLocation();

  const navItems = [
    { label: 'Início', icon: Home, path: '/' },
    { label: 'Despesas', icon: CreditCard, path: '/transactions' },
    { label: 'Metas', icon: Target, path: '/goals' },
    { label: 'Análises', icon: PieChart, path: '/analytics' },
    { label: 'Desejos', icon: ShoppingBag, path: '/wishlist' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white fixed h-full z-20">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">Nossa Casa</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-teal-50 text-teal-700" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-teal-600" : "text-slate-400")} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 mt-auto">
          <Link to="/settings" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200">
            <Settings className="w-5 h-5 text-slate-400" />
            Configurações
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around pb-safe pt-2 px-2 z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        {navItems.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-16 py-2 gap-1 rounded-xl transition-colors",
                isActive ? "text-teal-600" : "text-slate-400 hover:text-slate-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <Link to="/settings" className="flex flex-col items-center justify-center w-16 py-2 gap-1 rounded-xl text-slate-400 transition-colors">
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">Mais</span>
        </Link>
      </nav>

      {/* Global FAB (Mobile) */}
      <div className="md:hidden fixed bottom-20 right-4 z-50">
        <button className="w-14 h-14 bg-teal-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-teal-600/30 active:scale-95 transition-transform">
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
