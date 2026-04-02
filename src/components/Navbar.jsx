import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiMenu, FiSearch, FiX } from "react-icons/fi";
import { getRiskTone } from "../utils/riskUtils.js";

const notificationsMock = [
  {
    id: "n1",
    title: "Brute force pattern detected",
    riskLevel: "High",
    timestamp: "2 min ago"
  },
  {
    id: "n2",
    title: "Suspicious token reuse attempt",
    riskLevel: "Medium",
    timestamp: "14 min ago"
  },
  {
    id: "n3",
    title: "Unusual file access sequence",
    riskLevel: "Low",
    timestamp: "1 hr ago"
  }
];

export default function Navbar({ onOpenMobileSidebar, onToggleCollapsed }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const toneDotClass = useMemo(() => {
    return (tone) => {
      if (tone === "high") return "bg-high";
      if (tone === "low") return "bg-low";
      return "bg-medium";
    };
  }, []);

  useEffect(() => {
    if (!notifOpen) return;

    function onKeyDown(e) {
      if (e.key === "Escape") setNotifOpen(false);
    }

    function onPointerDown(e) {
      const el = notifRef.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      setNotifOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [notifOpen]);

  function onSubmit(e) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    navigate(`/incidents?query=${encodeURIComponent(q)}`);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-30">
      <div className="lg:pl-0">
        <div className="bg-background/75 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between gap-3 px-4 h-16 lg:h-18">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onOpenMobileSidebar}
                className="lg:hidden inline-flex items-center justify-center rounded-xl p-2 bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 ease-out hover:shadow-glowBlue"
                aria-label="Open sidebar"
              >
                <FiMenu />
              </button>

              <div className="flex items-baseline gap-2">
                <div className="text-lg font-extrabold tracking-wide text-slate-100">ForensiAI</div>
                <div className="hidden sm:block text-xs text-slate-400">Cyber Incident Investigation</div>
              </div>
            </div>

            <form onSubmit={onSubmit} className="hidden md:flex flex-1 max-w-xl">
              <div className="flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-card/45 backdrop-blur-lg px-3 py-2 shadow-glass transition-all duration-300 ease-out focus-within:border-primary/40 focus-within:shadow-glowBlue">
                <FiSearch className="text-slate-400 text-base" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search logs, IPs, users..."
                  className="w-full bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-500"
                />
                {search.trim() ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="p-1 rounded-lg hover:bg-white/10 transition duration-300"
                    aria-label="Clear search"
                  >
                    <FiX className="text-slate-300" />
                  </button>
                ) : null}
              </div>
            </form>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative inline-flex items-center justify-center rounded-xl p-2 bg-card/45 backdrop-blur-md hover:bg-white/10 border border-white/10 transition-all duration-300 ease-out hover:shadow-glowBlue"
                aria-label="Notifications"
              >
                <FiBell />
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-high shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
              </button>

              <button
                type="button"
                onClick={onToggleCollapsed}
                className="hidden lg:inline-flex items-center justify-center rounded-xl p-2 bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 ease-out hover:shadow-glowBlue"
                aria-label="Collapse sidebar"
              >
                <FiMenu />
              </button>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-slate-200">Security Analyst</span>
                  <span className="text-xs text-slate-500">Admin Console</span>
                </div>
                <div
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-white/5 border border-white/20 flex items-center justify-center shadow-glowBlue"
                  aria-label="User profile avatar"
                >
                  <span className="font-bold text-primary">A</span>
                </div>
              </div>
            </div>
          </div>

          {notifOpen ? (
            <div ref={notifRef} className="px-4 pb-4">
              <div className="bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <div className="text-sm font-semibold">Notifications</div>
                  <div className="text-xs text-slate-400">Live signals</div>
                </div>
                <div className="p-2 space-y-2">
                  {notificationsMock.map((n) => {
                    const tone = getRiskTone(n.riskLevel);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        className="w-full text-left rounded-xl bg-white/0 hover:bg-white/5 transition-all duration-300 ease-out border border-transparent hover:border-white/10 p-3 hover:translate-x-0.5"
                        onClick={() => {
                          setNotifOpen(false);
                          navigate(`/incidents?query=${encodeURIComponent(n.title)}`);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span className={`h-2 w-2 rounded-full ${toneDotClass(tone)}`} />
                            <div>
                              <div className="text-sm font-medium text-slate-100">{n.title}</div>
                              <div className="text-xs text-slate-500">{n.timestamp}</div>
                            </div>
                          </div>
                          <div className="text-xs px-2 py-1 rounded-full border border-white/10 bg-white/5 text-slate-200">
                            {n.riskLevel}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

