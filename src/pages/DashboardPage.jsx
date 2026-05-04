import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiActivity, FiAlertCircle, FiShield, FiTrendingUp, FiTarget, FiUploadCloud, FiArrowRight 
} from "react-icons/fi";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from "recharts";
import { getDashboard } from "../services/api.js";

const MetricCard = ({ title, value, icon: Icon, colorClass, subtitle }) => (
  <div className="soc-card p-6 flex flex-col justify-between group">
    <div className="flex justify-between items-start">
      <div className="p-2.5 bg-primary/5 rounded-lg text-primary border border-primary/20 group-hover:bg-primary/10 transition-colors">
        <Icon size={20} />
      </div>
      <div className={`text-[0.6rem] font-bold uppercase tracking-[0.2em] px-2 py-1 rounded bg-black border border-white/5 ${colorClass || 'text-primary'}`}>
        SOC_LINK
      </div>
    </div>
    <div className="mt-8">
      <div className="text-[0.65rem] font-bold text-primary/60 uppercase tracking-[0.15em] mb-1">{title}</div>
      <div className="text-3xl font-bold text-white tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value || "0"}
      </div>
      {subtitle && <div className="text-tech mt-2 uppercase opacity-40">{subtitle}</div>}
    </div>
  </div>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getDashboard();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("UPLINK_FAILURE");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) return (
    <div className="h-[80vh] flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-6">
        <div className="h-10 w-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-tech uppercase tracking-[0.3em]">Establishing_Secure_Link...</span>
      </div>
    </div>
  );

  const dashboardData = stats || {
    totalLogs: 0,
    suspiciousEvents: 0,
    activeIncidents: 0,
    riskLevel: "Unknown",
    lineChartData: [],
    barChartData: [],
    recentAlerts: []
  };

  const isEmpty = dashboardData.totalLogs === 0;

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-12">
      {/* Header Section */}
      <div className="flex justify-between items-end pb-8 border-b border-white/[0.05]">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Operational_Intelligence</h1>
          <p className="text-tech mt-1 uppercase tracking-widest opacity-60">Real-time Signal Analysis // Node: SOC-ALPHA</p>
        </div>
        <div className="flex gap-4">
          {error ? (
            <div className="px-4 py-2 border border-danger/30 text-[10px] font-bold text-danger uppercase tracking-widest">
               Sync_Interrupted
            </div>
          ) : (
            <div className="px-4 py-2 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Secure_Uplink_Active
            </div>
          )}
        </div>
      </div>

      {isEmpty && (
        <div className="soc-card p-16 bg-primary/[0.01] border-primary/20 flex flex-col items-center text-center space-y-6">
           <div className="h-20 w-20 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
             <FiUploadCloud size={40} />
           </div>
           <div className="max-w-md">
             <h2 className="text-xl font-bold text-white uppercase tracking-tight">Forensic Buffer Empty</h2>
             <p className="text-slate-400 mt-2 text-sm leading-relaxed">
               No tactical signals detected in current buffer. Initialize signal ingestion to map the threat landscape.
             </p>
           </div>
           <button 
             onClick={() => navigate('/ingest')}
             className="btn-primary flex items-center gap-3 px-10"
           >
             Begin Ingestion <FiArrowRight />
           </button>
        </div>
      )}

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Signals" 
          value={dashboardData.totalLogs} 
          icon={FiActivity} 
          subtitle="Buffer_Ingest"
        />
        <MetricCard 
          title="Threat Events" 
          value={dashboardData.suspiciousEvents} 
          icon={FiAlertCircle} 
          colorClass="text-danger"
          subtitle="Priority_Review"
        />
        <MetricCard 
          title="Risk Index" 
          value={dashboardData.riskLevel} 
          icon={FiTarget} 
          colorClass={dashboardData.riskLevel === 'High' ? 'text-danger' : 'text-primary'}
          subtitle="Heuristic_Score"
        />
        <MetricCard 
          title="Node Status" 
          value="ENCRYPTED" 
          icon={FiShield} 
          colorClass="text-primary"
          subtitle="Uptime_99.9%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Traffic Trend */}
        <div className="lg:col-span-2 soc-card p-8">
          <div className="flex justify-between items-center mb-10">
            <div className="text-[0.7rem] font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
              <FiTrendingUp className="text-primary" /> Traffic_Sequence_Map
            </div>
          </div>
          <div className="h-80 w-full">
            {!isEmpty && dashboardData.lineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.lineChartData}>
                  <defs>
                    <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(16, 185, 129, 0.05)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#4b5563', fontSize: 10}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#4b5563', fontSize: 10}} 
                  />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '4px'}}
                    itemStyle={{color: '#10b981', fontSize: '11px'}}
                    labelStyle={{color: '#4b5563', fontSize: '10px', marginBottom: '4px'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorGreen)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-4">
                <FiActivity size={32} className="opacity-10" />
                <div className="text-tech uppercase tracking-widest">Awaiting_Telemetry_Stream...</div>
              </div>
            )}
          </div>
        </div>

        {/* Vector Distribution */}
        <div className="soc-card p-8">
          <div className="text-[0.7rem] font-bold text-white uppercase tracking-[0.2em] mb-10">Vector_Intelligence</div>
          <div className="h-80 w-full">
            {!isEmpty && dashboardData.barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.barChartData} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#4b5563', fontSize: 9}}
                    width={90}
                  />
                  <Bar dataKey="value" radius={[0, 2, 2, 0]} barSize={15}>
                    {dashboardData.barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#065f46'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-4">
                 <FiTarget size={32} className="opacity-10" />
                 <div className="text-tech uppercase tracking-widest">No_Vectors_Analyzed</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Critical Events Feed */}
      <div className="soc-card p-0 overflow-hidden">
        <div className="px-8 py-5 border-b border-white/[0.05] flex justify-between items-center bg-white/[0.01]">
          <div className="text-[0.7rem] font-bold text-white uppercase tracking-[0.2em]">Operational_Briefings</div>
          <button onClick={() => navigate('/incidents')} className="text-tech hover:brightness-125 transition-all uppercase tracking-widest">View_Full_Audit</button>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {dashboardData.recentAlerts.length > 0 ? (
            dashboardData.recentAlerts.map((alert) => (
              <div key={alert.id} className="px-8 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group">
                <div className="flex items-center gap-6">
                  <div className={`h-1.5 w-1.5 rounded-full ${alert.riskLevel === 'High' ? 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-primary'}`} />
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">{alert.action}</div>
                    <div className="text-tech mt-0.5 uppercase opacity-60">{alert.sourceIp} → {alert.destinationIp} // {alert.category}</div>
                  </div>
                </div>
                <div className="text-tech uppercase font-bold tracking-tighter opacity-40">
                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          ) : (
            <div className="p-16 text-center text-slate-800 text-[10px] font-bold uppercase tracking-[0.5em]">BUFFER_EMPTY // NO_ANOMALIES</div>
          )}
        </div>
      </div>
    </div>
  );
}
