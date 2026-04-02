import React from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  CartesianGrid
} from "recharts";
import {
  FiActivity,
  FiAlertOctagon,
  FiDatabase,
  FiShield
} from "react-icons/fi";

import DashboardCard from "../components/DashboardCard.jsx";
import { useAsyncRequest } from "../hooks/useAsyncRequest.js";
import { getDashboard } from "../services/api.js";
import { getRiskBadgeClass } from "../utils/riskUtils.js";

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="glass-surface rounded-2xl p-5 transition duration-300 ease-out hover:shadow-glowBlue animate-fade-in-up">
      <div>
        <div className="text-sm font-semibold tracking-wide text-slate-100">{title}</div>
        <div className="text-xs text-slate-400 mt-1">{subtitle}</div>
      </div>
      <div className="mt-5 h-72">{children}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, loading, error, refetch } = useAsyncRequest(
    () => getDashboard(),
    []
  );

  // ✅ ULTRA SAFE DATA (NO CRASH POSSIBLE)
  const stats = {
    totalLogs: Number(data?.totalLogs) || 0,
    suspiciousEvents: Number(data?.suspiciousEvents) || 0,
    activeIncidents: Number(data?.activeIncidents) || 0,
    riskLevel: data?.riskLevel || "Medium",
    lineChartData: Array.isArray(data?.lineChartData)
      ? data.lineChartData
      : [],
    barChartData: Array.isArray(data?.barChartData)
      ? data.barChartData
      : [],
    recentAlerts: Array.isArray(data?.recentAlerts)
      ? data.recentAlerts
      : []
  };

  return (
    <div className="space-y-6 text-white animate-fade-in-up">
      {/* HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Cyber incident overview and alerts
          </p>
        </div>

        <button
          onClick={refetch}
          className="px-4 py-2 rounded-xl glass-surface hover:shadow-glowBlue text-slate-100 border border-primary/25 transition duration-300 ease-out"
        >
          Refresh
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-500/15 border border-red-400/25 p-3 rounded-xl text-sm backdrop-blur-sm">
          Failed to load data. Showing defaults.
        </div>
      )}

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Logs"
          value={loading ? "..." : stats.totalLogs}
          icon={FiDatabase}
        />

        <DashboardCard
          title="Suspicious Events"
          value={loading ? "..." : stats.suspiciousEvents}
          icon={FiAlertOctagon}
        />

        <DashboardCard
          title="Active Incidents"
          value={loading ? "..." : stats.activeIncidents}
          icon={FiActivity}
        />

        <DashboardCard
          title="Risk Level"
          value={loading ? "..." : stats.riskLevel}
          icon={FiShield}
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title="Event Frequency" subtitle="Last 14 days">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.lineChartData}>
              <defs>
                <linearGradient id="lineStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.14)" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} dy={8} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={34} />
              <Tooltip
                cursor={{ stroke: "rgba(96,165,250,0.35)", strokeWidth: 1 }}
                contentStyle={{
                  background: "rgba(15, 23, 42, 0.72)",
                  border: "1px solid rgba(148,163,184,0.20)",
                  borderRadius: "12px",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 14px 35px -20px rgba(0,0,0,0.85)"
                }}
                labelStyle={{ color: "#cbd5e1", fontWeight: 600, marginBottom: 8 }}
                itemStyle={{ color: "#93c5fd" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="url(#lineStrokeGradient)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: "#2563eb", stroke: "#93c5fd", strokeWidth: 2 }}
                isAnimationActive
                animationDuration={900}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Suspicious Events" subtitle="Category analysis">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.barChartData}>
              <defs>
                <linearGradient id="barFillGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.14)" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} dy={8} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={34} />
              <Tooltip
                cursor={{ fill: "rgba(37,99,235,0.12)" }}
                contentStyle={{
                  background: "rgba(15, 23, 42, 0.72)",
                  border: "1px solid rgba(148,163,184,0.20)",
                  borderRadius: "12px",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 14px 35px -20px rgba(0,0,0,0.85)"
                }}
                labelStyle={{ color: "#cbd5e1", fontWeight: 600, marginBottom: 8 }}
                itemStyle={{ color: "#93c5fd" }}
              />
              <Bar
                dataKey="value"
                fill="url(#barFillGradient)"
                radius={[10, 10, 4, 4]}
                isAnimationActive
                animationDuration={900}
                barSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ALERTS */}
      <div className="glass-surface rounded-2xl p-5 animate-fade-in-up">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold tracking-wide">Recent Alerts</h2>
          <span className={getRiskBadgeClass(stats.riskLevel)}>
            {stats.riskLevel}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {stats.recentAlerts.length > 0 ? (
            stats.recentAlerts.map((a, i) => (
              <div
                key={i}
                className={[
                  "group p-4 rounded-2xl bg-background/35 backdrop-blur-md",
                  "border border-white/10 transition duration-300 ease-out",
                  "hover:-translate-y-0.5 hover:shadow-soft",
                  a.riskLevel === "High"
                    ? "border-l-4 border-l-high hover:shadow-glowRed"
                    : a.riskLevel === "Medium"
                      ? "border-l-4 border-l-medium hover:shadow-glowBlue"
                      : "border-l-4 border-l-low hover:shadow-glowGreen"
                ].join(" ")}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-semibold text-slate-100 group-hover:text-white">
                    {a.action || "Unknown Action"}
                  </span>
                  <span className={getRiskBadgeClass(a.riskLevel)}>
                    {a.riskLevel || "Low"}
                  </span>
                </div>

                <div className="text-xs text-slate-400 mt-2">
                  {a.user || "Unknown"} • {a.ipAddress || "0.0.0.0"}
                </div>

                <div className="text-sm mt-2 text-slate-300 leading-relaxed">
                  {a.description || "No description"}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500">
              No alerts available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
