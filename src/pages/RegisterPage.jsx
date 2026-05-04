import React, { useState } from "react";
import { FiLock, FiUser, FiShield, FiAlertCircle, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/api.js";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(username, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.error || "Provisioning failure");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] relative">
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.2) 1px, transparent 0)',
        backgroundSize: '24px 24px'
      }} />

      <div className="w-full max-w-md px-6 z-10">
        <div className="soc-card p-10 rounded-[2.5rem] shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="h-16 w-16 bg-primary rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-primary/20 mb-6">
              <FiShield size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Provision Identity</h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">Create a new analyst access profile</p>
          </div>

          {success ? (
            <div className="text-center space-y-6 py-10 animate-fade-in">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full border-2 border-success/40 flex items-center justify-center">
                  <FiCheckCircle className="text-4xl text-success" />
                </div>
              </div>
              <div className="text-white font-bold text-xl tracking-tight">Identity Provisioned</div>
              <p className="text-slate-500 text-sm font-medium">Redirecting to authorization gateway...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-danger/10 border border-danger/20 p-4 rounded-xl flex items-center gap-3 text-danger text-sm font-medium">
                  <FiAlertCircle className="shrink-0" size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Proposed Username</label>
                <div className="relative group">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="analyst_name"
                    className="w-full input-soc pl-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Access Passphrase</label>
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
                {loading ? "Provisioning..." : "Create Identity"}
              </button>

              <div className="flex justify-center mt-6">
                <Link to="/login" className="text-xs font-bold text-slate-500 hover:text-primary flex items-center gap-2 transition uppercase tracking-widest">
                  <FiArrowLeft /> Return to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
