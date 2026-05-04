import React from "react";
import { FiActivity, FiAlertCircle, FiClock, FiShield } from "react-icons/fi";

const StatusBadge = ({ status }) => {
  const isCritical = status?.toLowerCase() === "critical";
  return (
    <span className={`px-2 py-0.5 rounded-md text-[0.6rem] font-bold uppercase tracking-wider border ${
      isCritical ? "bg-danger/10 text-danger border-danger/20" : "bg-success/10 text-success border-success/20"
    }`}>
      {status}
    </span>
  );
};

export default function Timeline({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="py-20 text-center text-slate-500 text-sm italic">
        No chronological signals indexed in current buffer.
      </div>
    );
  }

  const ordered = [...events].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="relative px-4">
      {/* Vertical Line */}
      <div className="absolute left-9 top-0 bottom-0 w-px bg-white/5" />

      <div className="space-y-8">
        {ordered.map((ev) => (
          <div key={ev.id} className="relative pl-12 group">
            {/* Timeline Dot */}
            <div className="absolute left-[31px] top-2 z-10">
              <div className={`h-[11px] w-[11px] rounded-full border-2 border-[#0f172a] shadow-sm ${
                ev.status?.toLowerCase() === 'critical' ? 'bg-danger' : 'bg-primary'
              }`} />
            </div>

            <div className="soc-card p-6 hover:bg-white/[0.02] transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                    {ev.status?.toLowerCase() === 'critical' ? <FiAlertCircle className="text-danger" /> : <FiActivity className="text-primary" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold text-white tracking-tight">{ev.title}</h3>
                      <StatusBadge status={ev.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ev.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[0.7rem] font-mono text-slate-600 sm:text-right shrink-0">
                  <FiClock />
                  {new Date(ev.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
