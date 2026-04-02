import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const desktopPadding = sidebarCollapsed ? "lg:pl-20" : "lg:pl-64";

  return (
    <div className={`min-h-screen bg-background ${desktopPadding}`}>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden ${
          mobileSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileSidebarOpen(false)}
        aria-hidden
      />

      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
      />

      <div className="relative z-10">
        <Navbar
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        />

        <main className="p-4 sm:p-6 lg:p-8 pt-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

