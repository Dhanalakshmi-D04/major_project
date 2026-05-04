import React, { useState, useEffect } from "react";
import { 
  FiUploadCloud, FiDatabase, FiFileText, FiCheckCircle, FiZap, FiPlusCircle, FiHardDrive 
} from "react-icons/fi";
import { ingestData, getLocalArchive, ingestFromArchive } from "../services/api.js";

export default function IngestPage() {
  const [archive, setArchive] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [activeFile, setActiveFile] = useState(null);

  useEffect(() => {
    fetchArchive();
  }, []);

  const fetchArchive = async () => {
    try {
      const files = await getLocalArchive();
      setArchive(files);
    } catch (err) {
      console.error("Failed to fetch archive", err);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setStatus(`Reading ${file.name}...`);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split("\n");
        const headers = lines[0].split(",");
        const jsonData = lines.slice(1).map(line => {
          const values = line.split(",");
          const obj = {};
          headers.forEach((h, i) => obj[h.trim()] = values[i]?.trim());
          return obj;
        }).filter(item => Object.keys(item).length > 1);

        const res = await ingestData(jsonData.slice(0, 5000)); // Limit frontend upload size
        setStatus(`Uplink complete: ${res.count} signals indexed.`);
        setTimeout(() => setStatus(null), 5000);
      } catch (err) {
        setStatus("Error: Invalid signal format");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleArchiveIngest = async (filename) => {
    setLoading(true);
    setActiveFile(filename);
    setStatus(`Streaming ${filename} into SOC core...`);
    try {
      const res = await ingestFromArchive(filename);
      setStatus(`Success: ${res.count} signals synchronized.`);
      setTimeout(() => setStatus(null), 5000);
    } catch (err) {
      setStatus("Archive synchronization failed.");
    } finally {
      setLoading(false);
      setActiveFile(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20">
      <div className="flex justify-between items-end border-b border-white/[0.05] pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Signal_Uplink</h1>
          <p className="text-sm text-primary/60 mt-1 uppercase tracking-widest font-mono">Ingest network telemetry into forensic buffer</p>
        </div>
        <div className="flex gap-4">
           {status && (
             <div className="bg-primary/5 border border-primary/20 px-4 py-2 rounded-lg text-[10px] font-bold text-primary uppercase tracking-[0.2em] animate-pulse">
               {status}
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* EXTERNAL UPLINK Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-sm font-bold text-white uppercase tracking-[0.2em]">
            <FiPlusCircle className="text-primary" /> External_Uplink
          </div>
          <div className="soc-card p-12 border-dashed border-primary/20 bg-primary/[0.01] hover:bg-primary/[0.03] transition-all group relative cursor-pointer overflow-hidden">
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              disabled={loading}
            />
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <FiUploadCloud size={40} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Drop External Capture</h3>
                <p className="text-xs text-primary/50 mt-1 uppercase tracking-widest font-mono">Format: .CSV // Limits: 5000 lines</p>
              </div>
              <div className="text-[10px] font-bold text-white px-4 py-2 border border-white/5 rounded uppercase tracking-[0.2em]">
                Click or drag to select file
              </div>
            </div>
          </div>

          <div className="soc-card p-6 border-primary/10 bg-black/40">
             <div className="flex items-center gap-3 text-[10px] font-bold text-primary mb-3">
               <FiZap />
               UPLINK_PROTOCOL_INFO
             </div>
             <p className="text-[11px] text-white/50 leading-relaxed uppercase tracking-tight">
               External uploads are processed client-side. Ensure headers include: <span className="text-primary">Timestamp, Source, Destination, Label</span>. Large files ( &gt;5000 lines) should be moved to the System Archive for streaming.
             </p>
          </div>
        </div>

        {/* SYSTEM ARCHIVE Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm font-bold text-white uppercase tracking-[0.2em]">
              <FiHardDrive className="text-primary" /> System_Archive
            </div>
            <button onClick={fetchArchive} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">Refresh_Library</button>
          </div>

          <div className="soc-card overflow-hidden">
            <div className="divide-y divide-white/[0.03] max-h-[500px] overflow-y-auto custom-scrollbar">
              {archive.length > 0 ? (
                archive.map((file) => (
                  <div key={file.name} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center text-slate-500">
                        <FiFileText size={24} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{file.name}</div>
                        <div className="text-[10px] font-mono text-primary/40 mt-1 uppercase">Size: {file.size} // Mod: {new Date(file.modified).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleArchiveIngest(file.name)}
                      disabled={loading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        activeFile === file.name 
                          ? 'bg-primary/20 text-primary border border-primary/40' 
                          : 'bg-white/5 text-white border border-white/10 hover:border-primary/40 hover:text-primary'
                      }`}
                    >
                      {activeFile === file.name ? (
                        <> <FiZap className="animate-spin" /> Ingesting... </>
                      ) : (
                        <> <FiDatabase /> Uplink </>
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center space-y-4 opacity-30">
                  <FiFileText size={40} className="mx-auto" />
                  <div className="text-[10px] font-bold uppercase tracking-[0.4em]">Archive_Library_Empty</div>
                </div>
              )}
            </div>
          </div>

          <div className="soc-card p-6 bg-primary/[0.02] border-primary/20">
             <div className="flex items-center gap-3 text-xs font-bold text-white uppercase tracking-widest mb-2">
               <FiCheckCircle className="text-primary" /> Streaming_Active
             </div>
             <p className="text-[10px] text-primary/60 font-mono uppercase tracking-tighter">
               System Archive files are streamed directly into the SOC engine. Ideal for large high-fidelity capture files.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
