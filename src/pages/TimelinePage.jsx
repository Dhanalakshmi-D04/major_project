import React from "react";
import Timeline from "../components/Timeline.jsx";
import { useAsyncRequest } from "../hooks/useAsyncRequest.js";
import { getTimeline } from "../services/api.js";

export default function TimelinePage() {
  const { data, loading, error, refetch } = useAsyncRequest(() => getTimeline(), []);
  const events = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Timeline</h1>
          <p className="text-sm text-slate-400 mt-1">Chronological view of investigation events.</p>
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
          Couldn’t load timeline from backend. Showing mock data.
        </div>
      ) : null}

      <div className="bg-card border border-white/10 rounded-2xl shadow-soft p-5">
        {loading ? (
          <div className="text-sm text-slate-500">Loading timeline…</div>
        ) : (
          <Timeline events={events} />
        )}
      </div>
    </div>
  );
}

