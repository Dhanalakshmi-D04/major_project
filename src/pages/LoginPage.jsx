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
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Tactical Grid Background */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'linear-gradient(#1E2530 1px, transparent 1px), linear-gradient(90deg, #1E2530 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="w-full max-w-[400px] px-6 z-10">
        <div className="soc-card p-8 shadow-tactical bg-elevated">
          <div className="flex flex-col items-start mb-8">
            <div className="text-primary mb-4">
              <FiShield size={28} />
            </div>
            <h1 className="text-xl">Access Control</h1>
            <p className="text-text-secondary text-[0.7rem] mt-1 font-mono uppercase tracking-widest">Authenticate to enter ForensiAI SOC</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-danger/10 border border-danger/20 p-3 rounded-sm flex items-center gap-3 text-danger text-[0.7rem] font-mono uppercase tracking-wider">
                <FiAlertCircle className="shrink-0" size={14} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="label-mono">Account Identifier</label>
              <div className="relative group">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={14} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="analyst_root"
                  className="w-full input-soc pl-10 py-2"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="label-mono">Security Key</label>
              <div className="relative group">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={14} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full input-soc pl-10 py-2"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-[0.75rem]"
            >
              {loading ? "Authenticating..." : "Authorize Session"}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-divider">
            <p className="text-text-secondary text-xs">
              New Analyst?{" "}
              <Link to="/register" className="text-primary font-bold hover:underline transition-all">
                Request Identity
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
           <p className="text-[0.6rem] font-mono font-bold text-text-muted uppercase tracking-widest leading-loose">
             Proprietary Investigation Software <br />
             Authorized Personnel Only // Sector 7G
           </p>
        </div>
      </div>
    </div>
  );
}
