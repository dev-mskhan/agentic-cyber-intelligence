import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useGetCurrentSessionQuery, useLogoutMutation } from "../../api/authApi";
import { useGetSubscriptionQuery } from "../../api/subscriptionApi";
import { useToast } from "../ui/Toast";
import {
  LayoutDashboard,
  Shield,
  Layers,
  Activity,
  FileBadge,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session } = useGetCurrentSessionQuery();
  const { data: subscription } = useGetSubscriptionQuery();
  const [logout] = useLogoutMutation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const user = session?.data.user;
  const org = session?.data.org;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      showToast("success", "Successfully logged out");
      navigate("/login");
    } catch {
      showToast("error", "Failed to logout");
    }
  };

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      allowedRoles: ["admin", "analyst", "viewer"],
    },
    {
      label: "Technology Inventory",
      path: "/technology",
      icon: <Layers className="h-4 w-4" />,
      allowedRoles: ["admin", "analyst", "viewer"],
    },
    {
      label: "Analysis Runs",
      path: "/runs",
      icon: <Activity className="h-4 w-4" />,
      allowedRoles: ["admin", "analyst", "viewer"],
    },
    {
      label: "Intelligence Reports",
      path: "/reports",
      icon: <FileBadge className="h-4 w-4" />,
      allowedRoles: ["admin", "analyst", "viewer"],
    },
    {
      label: "Team Management",
      path: "/team",
      icon: <Users className="h-4 w-4" />,
      allowedRoles: ["admin"],
    },
    {
      label: "Billing & Subscriptions",
      path: "/billing",
      icon: <CreditCard className="h-4 w-4" />,
      allowedRoles: ["admin"],
    },
    {
      label: "Platform Settings",
      path: "/settings",
      icon: <Settings className="h-4 w-4" />,
      allowedRoles: ["admin", "analyst", "viewer"],
    },
  ];

  const visibleNavItems = navItems.filter(
    (item) => !item.allowedRoles || (user && item.allowedRoles.includes(user.role))
  );

  const getRoleBadgeColor = (role?: string) => {
    if (role === "admin") return "bg-slate-100 text-slate-800 border-slate-200";
    if (role === "analyst") return "bg-blue-50/70 text-blue-700 border-blue-100";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-slate-800 border-r border-slate-200">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-200 flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shrink-0">
          <Shield className="h-4.5 w-4.5 text-white fill-white rotate-45" />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight text-slate-900 uppercase">SENTINEL AI</span>
          <div className="text-[9px] text-slate-400 font-mono leading-none tracking-wide">SECOPS ANALYST</div>
        </div>
      </div>

      {/* Org Profile At a Glance */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700 truncate">{org?.name}</span>
        </div>
        <div className="mt-1 text-[9px] font-mono text-slate-400 uppercase tracking-wider">
          Org Workspace
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 px-3 py-2 uppercase tracking-widest font-mono">
          Main Menu
        </div>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors duration-150 group cursor-pointer ${
                isActive
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {isActive && <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      {user && (
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate leading-none mt-0.5">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${getRoleBadgeColor(
                user.role
              )}`}
            >
              {user.role}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer transition-all duration-150"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-brand-bg">
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="relative w-64 max-w-xs h-full flex flex-col">
            <button
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-4 right-[-48px] bg-slate-900 text-white rounded-md p-1.5 focus:outline-none cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </div>
          <div className="flex-1 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsMobileOpen(false)} />
        </div>
      )}

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden text-slate-800 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs hidden sm:inline">Organization:</span>
              <span className="text-xs font-semibold flex items-center gap-1.5 text-slate-800">
                {org?.name}
                <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 uppercase text-slate-600">
                  {subscription?.planTier || "FREE"}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100 hidden sm:inline">
              UTC: {new Date().toISOString().substring(11, 19)}
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-slate-500 hidden sm:inline font-medium">
              Operator: <span className="font-semibold text-slate-800">{user?.name} ({user?.role})</span>
            </span>
          </div>
        </header>

        {/* Content Box */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
