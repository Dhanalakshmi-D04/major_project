import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { FiLock, FiUser, FiShield, FiAlertCircle } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.success) navigate("/");
      else setError(result.error);
    } catch (err) {
      setError("Authorization server unavailable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] relative">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.05) 1px, transparent 0)',
        backgroundSize: '32px 32px'
      }} />

      <div className="w-full max-w-md px-6 z-10">
        <div className="soc-card p-10 rounded-[2.5rem] shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="h-16 w-16 bg-primary rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-primary/20 mb-6">
              <FiShield size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Access Control</h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">Authenticate to enter ForensiAI SOC</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-danger/10 border border-danger/20 p-4 rounded-xl flex items-center gap-3 text-danger text-sm font-medium animate-shake">
                <FiAlertCircle className="shrink-0" size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-primary/60 uppercase tracking-widest ml-1">Account Identifier</label>
              <div className="relative group">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="analyst_root"
                  className="w-full input-soc pl-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-primary/60 uppercase tracking-widest ml-1">Security Key</label>
              <div className="relative group">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full input-soc pl-12"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-14 text-sm tracking-widest uppercase font-bold"
            >
              {loading ? "Authenticating..." : "Authorize Session"}
            </button>
          </form>

          <div className="mt-8 text-center pt-8 border-t border-white/5">
            <p className="text-slate-500 text-sm font-medium">
              New Analyst?{" "}
              <Link to="/register" className="text-primary font-bold hover:underline transition-all">
                Request Identity
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
           <p className="text-[0.65rem] font-bold text-slate-600 uppercase tracking-widest leading-loose">
             Proprietary Investigation Software <br />
             Authorized Personnel Only // Compliance ID: SOC-2
           </p>
        </div>
      </div>
    </div>
  );
}
