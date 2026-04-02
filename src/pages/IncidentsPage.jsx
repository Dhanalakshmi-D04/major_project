import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { FiFilter, FiSearch, FiX } from "react-icons/fi";
import AlertTable from "../components/AlertTable.jsx";
import { useAsyncRequest } from "../hooks/useAsyncRequest.js";
import { getIncidents } from "../services/api.js";
import { formatTimestamp } from "../utils/formatUtils.js";
import { getRiskBadgeClass, RISK_LEVELS } from "../utils/riskUtils.js";

function useQueryParam(name) {
  const location = useLocation();
  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get(name) || "";
  }, [location.search, name]);
}

function DetailPanel({ incident, onClose }) {
  if (!incident) return null;
  return (
    <div className="bg-card border border-white/10 rounded-2xl shadow-soft p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-slate-100">Incident Detail</div>
          <div className="text-xs text-slate-500 mt-1">Correlated log entry</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-3 py-2 text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 transition"
        >
          Close
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-background/30 p-3">
          <div className="text-xs text-slate-500">Timestamp</div>
          <div className="text-sm text-slate-200 mt-1">{formatTimestamp(incident.timestamp)}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-background/30 p-3">
          <div className="text-xs text-slate-500">Risk Level</div>
          <div className="text-sm text-slate-200 mt-1">
            <span className={getRiskBadgeClass(incident.riskLevel)}>{incident.riskLevel}</span>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-background/30 p-3">
          <div className="text-xs text-slate-500">User</div>
          <div className="text-sm text-slate-200 mt-1">{incident.user}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-background/30 p-3">
          <div className="text-xs text-slate-500">IP Address</div>
          <div className="text-sm text-slate-200 mt-1">{incident.ipAddress}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-background/30 p-3 sm:col-span-2">
          <div className="text-xs text-slate-500">Action</div>
          <div className="text-sm text-slate-200 mt-1">{incident.action}</div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-background/30 p-4">
        <div className="text-sm font-semibold text-slate-200">Suggested next steps</div>
        <div className="mt-2 text-sm text-slate-300">
          Validate authentication context, review session timeline, and correlate with endpoint telemetry for the same user
          and IP. Consider pivoting on `user`, `ipAddress`, and adjacent timestamps.
        </div>
      </div>
    </div>
  );
}

export default function IncidentsPage() {
  const queryFromUrl = useQueryParam("query");
  const { data, loading, error, refetch } = useAsyncRequest(() => getIncidents(), []);
  const [riskFilter, setRiskFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (queryFromUrl) setQuery(queryFromUrl);
  }, [queryFromUrl]);

  const rows = Array.isArray(data) ? data : [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const riskOk = riskFilter === "All" ? true : String(r.riskLevel) === riskFilter;
      const qOk = !q
        ? true
        : [r.user, r.ipAddress, r.action, r.riskLevel, r.timestamp]
            .join(" ")
            .toLowerCase()
            .includes(q);
      return riskOk && qOk;
    });
  }, [rows, riskFilter, query]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Incidents</h1>
          <p className="text-sm text-slate-400 mt-1">Search, filter, and inspect suspicious log entries.</p>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="rounded-xl px-4 py-2 text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 transition"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-high/30 bg-high/10 p-4 text-sm text-slate-200">
          Couldn’t load incidents from backend. Showing mock data.
        </div>
      ) : null}

      <div className="bg-card border border-white/10 rounded-2xl shadow-soft p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-background/40 px-3 py-2">
              <FiSearch className="text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by user, IP, action, risk..."
                className="w-full bg-transparent outline-none text-sm placeholder:text-slate-500"
              />
              {query.trim() ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="p-1 rounded-lg hover:bg-white/10 transition"
                  aria-label="Clear query"
                >
                  <FiX className="text-slate-300" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-background/40 px-3 py-2">
              <FiFilter className="text-slate-400" />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-transparent outline-none text-sm text-slate-200"
              >
                <option value="All">All</option>
                {RISK_LEVELS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
              {loading ? "Loading…" : `${filtered.length} / ${rows.length}`}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <AlertTable rows={filtered} onRowClick={setSelected} selectedId={selected?.id} />
        </div>
        <div className="xl:col-span-1">
          <DetailPanel incident={selected} onClose={() => setSelected(null)} />
        </div>
      </div>
    </div>
  );
}

