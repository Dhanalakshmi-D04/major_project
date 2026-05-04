import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiBell, FiMenu, FiSearch, FiX, FiLogOut, FiActivity, FiUser, FiChevronDown } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";
import { getNotifications } from "../services/api.js";

export default function Navbar({ onOpenMobileSidebar, sidebarWidth }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const hasHighRisk = useMemo(() => {
    return notifications.some(n => n.riskLevel === "High");
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    function onKeyDown(e) { 
      if (e.key === "Escape") {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    }
    function onPointerDown(e) { 
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); 
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    const q = search.trim();
    if (q) navigate(`/incidents?query=${encodeURIComponent(q)}`);
  };

  return (
    <header 
      className="fixed top-0 right-0 z-40 soc-header transition-all duration-500"
      style={{ left: sidebarWidth || 0 }}
    >
      <div className="h-20 px-8 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button onClick={onOpenMobileSidebar} className="lg:hidden p-2 text-primary hover:text-white transition-colors">
            <FiMenu size={24} />
          </button>
          
          <div className="hidden lg:flex items-center gap-6">
             <div className="flex items-center gap-2 text-[0.6rem] font-bold text-primary uppercase tracking-[0.2em]">
               <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary-glow)]" />
               SYSTEM_SYNC_ACTIVE
             </div>
          </div>
        </div>

        {/* Global Search */}
        <form onSubmit={onSubmit} className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="w-full relative group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search threat events, IPs, or analyst notes..."
              className="w-full input-soc pl-12 bg-white/[0.02]"
            />
          </div>
        </form>

        {/* Action Controls */}
        <div className="flex items-center gap-6">
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
              }}
              className={[
                "p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all",
                hasHighRisk ? "ring-2 ring-danger/30" : ""
              ].join(" ")}
            >
              <FiBell className={hasHighRisk ? "text-danger" : "text-primary/60"} />
              {notifications.length > 0 && (
                <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-primary rounded-full ring-2 ring-black" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute top-full right-0 mt-3 w-80 soc-card p-2 overflow-hidden animate-fade-in-up">
                <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                  <span className="text-[0.65rem] font-bold text-primary uppercase tracking-widest">Security Feed</span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div key={n.id} className="p-4 hover:bg-white/[0.03] transition-colors border-b border-white/5 last:border-0 cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.riskLevel === 'High' ? 'bg-danger' : 'bg-primary'}`} />
                          <div>
                            <div className="text-[0.8rem] font-semibold text-white line-clamp-2">{n.title}</div>
                            <div className="text-[0.7rem] text-primary/60 mt-1 uppercase font-mono">{n.timestamp}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-[0.7rem] text-slate-500 uppercase tracking-widest">No active alerts</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 pl-6 border-l border-white/5 relative" ref={profileRef}>
            <div className="hidden sm:block text-right cursor-pointer" onClick={() => setProfileOpen(!profileOpen)}>
              <div className="text-sm font-bold text-white">{user?.username}</div>
              <div className="text-[0.6rem] font-bold text-primary uppercase tracking-tighter flex items-center justify-end gap-1">
                {user?.role} <FiChevronDown />
              </div>
            </div>
            
            <div 
              className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm cursor-pointer hover:bg-primary hover:text-black transition-all"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              {user?.username?.[0]?.toUpperCase()}
            </div>

            {profileOpen && (
              <div className="absolute top-full right-0 mt-3 animate-fade-in-up">
                <div className="bg-[#121212] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[220px]">
                  <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="text-xs font-bold text-white">{user?.username}</div>
                    <div className="text-[0.6rem] text-primary mt-1 uppercase tracking-widest">Analyst // Sector 7G</div>
                  </div>
                  <Link 
                    to="/profile" 
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-6 py-4 text-sm font-bold text-white hover:bg-primary/10 hover:text-primary transition-all border-b border-white/5"
                  >
                    <FiUser /> User Profile
                  </Link>
                  <button 
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-6 py-4 text-sm font-bold text-danger hover:bg-danger/10 transition-all"
                  >
                    <FiLogOut /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
