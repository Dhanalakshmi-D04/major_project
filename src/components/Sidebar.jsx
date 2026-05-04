import React from "react";
import { NavLink } from "react-router-dom";
import {
  FiAlertCircle,
  FiClock,
  FiGrid,
  FiMessageSquare,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiHardDrive,
  FiShield
} from "react-icons/fi";

const navItems = [
  { to: "/", label: "Dashboard", icon: FiGrid },
  { to: "/incidents", label: "Threat Events", icon: FiAlertCircle },
  { to: "/timeline", label: "Timeline", icon: FiClock },
  { to: "/chatbot", label: "AI Investigation", icon: FiMessageSquare },
  { to: "/reports", label: "Reports", icon: FiFileText },
  { to: "/ingest", label: "Data Ingestion", icon: FiHardDrive }
];

export default function Sidebar({
  collapsed,
  mobileOpen,
  onMobileOpenChange,
  onToggleCollapsed
}) {
  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-50 bg-[#0a0f1e] border-r border-white/5 transition-all duration-500 ease-in-out",
        collapsed ? "lg:w-20" : "lg:w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      ].join(" ")}
    >
      <div className="flex h-full flex-col">
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-lg shadow-primary/5">
              <FiShield size={24} strokeWidth={2.5} />
            </div>
            {!collapsed && (
              <span className="text-xl font-bold tracking-tight text-white uppercase">
                Forensi<span className="text-primary">AI</span>
              </span>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => onMobileOpenChange(false)}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  ].join(" ")
                }
              >
                <Icon size={20} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Toggle & Info */}
        <div className="p-4 border-t border-white/5">
          {!collapsed && (
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">Storage Status</span>
                <span className="text-[0.65rem] font-bold text-success">Optimal</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-2/3" />
              </div>
            </div>
          )}
          <button
            onClick={onToggleCollapsed}
            className="w-full flex items-center justify-center h-10 rounded-xl hover:bg-white/5 text-slate-500 transition-colors"
          >
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>
      </div>
    </aside>
  );
}
