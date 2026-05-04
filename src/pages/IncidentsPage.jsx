import React, { useState, useEffect } from "react";
import { getIncidents } from "../services/api.js";
import { FiFilter, FiSearch, FiTarget, FiAlertCircle, FiArrowRight } from "react-icons/fi";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const data = await getIncidents();
      setIncidents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = incidents.filter(i => 
    (i.action || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.sourceIp || "").includes(search) ||
    (i.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Threat Events</h1>
          <p className="text-sm text-slate-500 mt-1">Detailed log of detected anomalies and signal vectors.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group min-w-[320px]">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by IP, Label or Category..."
              className="input-soc w-full pl-12 bg-white/[0.03]"
            />
          </div>
          <button className="bg-white/5 border border-white/10 rounded-xl p-3 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <FiFilter size={20} />
          </button>
        </div>
      </div>

      <div className="soc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-8 py-5 text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">Priority</th>
                <th className="px-8 py-5 text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">Source Entity</th>
                <th className="px-8 py-5 text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">Threat Vector</th>
                <th className="px-8 py-5 text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">Risk Level</th>
                <th className="px-8 py-5 text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest text-right">Event Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">Fetching Event Database...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-24 text-center text-slate-500 italic font-medium">
                    No matching events found in current signal buffer.
                  </td>
                </tr>
              ) : (
                filtered.map((inc) => (
                  <tr key={inc.id} className="hover:bg-white/[0.015] transition-colors cursor-pointer group">
                    <td className="px-8 py-5">
                       <div className={`h-2.5 w-2.5 rounded-full ${inc.riskLevel === 'High' ? 'bg-danger shadow-[0_0_12px_rgba(239,68,68,0.4)]' : 'bg-success'}`} />
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-white/5 rounded-lg text-slate-500 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                          <FiTarget size={18} />
                        </div>
                        <div>
                           <div className="text-sm font-bold text-slate-100">{inc.sourceIp}</div>
                           <div className="text-[0.65rem] font-bold text-slate-500 uppercase mt-0.5">→ {inc.destinationIp}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-bold text-primary">{inc.action}</div>
                      <div className="text-[0.7rem] text-slate-500 mt-1">{inc.category}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={inc.riskLevel === 'High' ? 'badge-danger' : 'badge-success'}>
                        {inc.riskLevel}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="text-sm font-bold text-slate-300 font-mono">{new Date(inc.timestamp).toLocaleDateString()}</div>
                      <div className="text-[0.7rem] text-slate-600 mt-1 font-mono uppercase">
                        {new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
