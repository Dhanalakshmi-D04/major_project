import React from "react";
import { FiFileText, FiUpload, FiUserCheck, FiUserX } from "react-icons/fi";
import { getRiskDotClass } from "../utils/riskUtils.js";

const iconForType = {
  failed_login: FiUserX,
  successful_login: FiUserCheck,
  file_accessed: FiFileText,
  data_transfer: FiUpload
};

function toneForType(type) {
  if (type === "failed_login") return "high";
  if (type === "data_transfer") return "medium";
  if (type === "file_accessed") return "medium";
  if (type === "successful_login") return "low";
  return "medium";
}

export default function Timeline({ events }) {
  const ordered = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-white/10 hidden lg:block" aria-hidden />
      <div className="space-y-4">
        {ordered.map((ev, idx) => {
          const Icon = iconForType[ev.type] ?? FiFileText;
          const tone = toneForType(ev.type);
          return (
            <div
              key={ev.id}
              className={[
                "relative pl-12 lg:pl-14",
                idx === ordered.length - 1 ? "pb-1" : ""
              ].join(" ")}
            >
              <div
                className="absolute left-3 top-5 h-3.5 w-3.5 rounded-full border border-white/20"
                aria-hidden
              >
                <div className={`h-3.5 w-3.5 rounded-full ${getRiskDotClass(tone)}`} />
              </div>

              <div className="bg-card border border-white/10 rounded-2xl shadow-soft p-4 hover:-translate-y-0.5 transition-transform duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Icon className="text-slate-200" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-100">{ev.title}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(ev.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-300 mt-2">{ev.detail}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

