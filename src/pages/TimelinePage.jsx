import React, { useState, useEffect } from "react";
import Timeline from "../components/Timeline.jsx";
import { getTimeline } from "../services/api.js";
import { FiRefreshCw, FiClock } from "react-icons/fi";

export default function TimelinePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const data = await getTimeline();
      setEvents(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Sequence data unavailable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Event Timeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">Sequential audit of detected anomalies and system logs.</p>
        </div>
        <button
          onClick={fetchTimeline}
          disabled={loading}
          className="btn-outline flex items-center gap-2 text-xs uppercase tracking-widest font-bold"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 p-4 rounded-xl text-danger text-sm font-medium flex items-center gap-3">
           <FiClock /> {error}
        </div>
      )}

      <div className="mt-10">
        {loading && events.length === 0 ? (
          <div className="py-20 text-center space-y-4">
             <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reconstructing Sequence...</p>
          </div>
        ) : (
          <Timeline events={events} />
        )}
      </div>
    </div>
  );
}
