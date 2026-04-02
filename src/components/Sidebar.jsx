import React from "react";
import { NavLink } from "react-router-dom";
import {
  FiAlertTriangle,
  FiClock,
  FiHome,
  FiMessageCircle,
  FiFileText,
  FiChevronsLeft,
  FiChevronsRight
} from "react-icons/fi";

const navItems = [
  { to: "/", label: "Dashboard", icon: FiHome },
  { to: "/incidents", label: "Incidents", icon: FiAlertTriangle },
  { to: "/timeline", label: "Timeline", icon: FiClock },
  { to: "/chatbot", label: "Chatbot", icon: FiMessageCircle },
  { to: "/reports", label: "Reports", icon: FiFileText }
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
        "fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 shadow-glass",
        "bg-card/55 backdrop-blur-xl",
        "transform transition-all duration-300 ease-in-out",
        collapsed ? "lg:w-20" : "lg:w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      ].join(" ")}
      aria-label="Sidebar navigation"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/30 via-primary/10 to-white/5 border border-primary/30 flex items-center justify-center text-primary font-bold shadow-soft">
              F
            </div>
            {!collapsed && (
              <div className="leading-tight">
                <div className="font-semibold tracking-wide text-slate-100">ForensiAI</div>
                <div className="text-xs text-slate-400">Cyber Investigations</div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleCollapsed}
            className="hidden lg:flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 ease-out p-2 hover:shadow-glowBlue"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1.5">
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
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300 ease-out",
                    "border border-transparent",
                    isActive
                      ? "bg-gradient-to-r from-primary/25 to-primary/5 text-blue-200 border-primary/35 shadow-glowBlue"
                      : "text-slate-200 hover:bg-white/5 hover:border-white/10 hover:text-slate-100 hover:translate-x-0.5"
                  ].join(" ")
                }
              >
                <Icon className="text-lg shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span className={[collapsed ? "hidden" : "block", "font-medium tracking-wide"].join(" ")}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="px-4 pb-5 pt-3 border-t border-white/10 text-xs text-slate-400">
          {!collapsed ? (
            <div className="space-y-2">
              <div className="font-medium text-slate-300 tracking-wide">Threat posture</div>
              <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-high shadow-[0_0_12px_rgba(239,68,68,0.75)]" />
                <span>Elevated alerts</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="inline-block h-2 w-2 rounded-full bg-high" />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

