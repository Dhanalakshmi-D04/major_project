import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getReport } from "../services/api.js";
import { FiFileText, FiDownload, FiZap, FiShield, FiAlertCircle, FiActivity, FiTarget } from "react-icons/fi";

function generateProfessionalPdf(report) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const drawHeaderFooter = () => {
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageWidth, 58, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("FORENSIAI — SOC INVESTIGATION REPORT", margin, 36);
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text("CONFIDENTIAL SECURITY INTELLIGENCE // AUTHORIZED PERSONNEL ONLY", pageWidth / 2, pageHeight - 18, { align: "center" });
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin, pageHeight - 18, { align: "right" });
  };

  drawHeaderFooter();
  let y = 80;

  // Executive Summary
  doc.setTextColor(16, 185, 129);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("EXECUTIVE SUMMARY", margin, y); y += 20;

  doc.setTextColor(200, 200, 200);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Report Generated: ${new Date(report.generationTime).toLocaleString()}`, margin, y); y += 14;
  doc.text(`Overall Risk Score: ${report.riskScore?.toUpperCase()}`, margin, y); y += 14;
  doc.text(`Average Threat Score: ${report.avgThreatScore}/100`, margin, y); y += 28;

  // Risk Breakdown
  doc.setTextColor(16, 185, 129);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("SIGNAL RISK DISTRIBUTION", margin, y); y += 16;

  autoTable(doc, {
    startY: y,
    head: [["Risk Level", "Count", "% of Total"]],
    body: [
      ["High", report.high, report.incidents ? ((report.high / report.incidents) * 100).toFixed(1) + "%" : "0%"],
      ["Medium", report.medium, report.incidents ? ((report.medium / report.incidents) * 100).toFixed(1) + "%" : "0%"],
      ["Low", report.low, report.incidents ? ((report.low / report.incidents) * 100).toFixed(1) + "%" : "0%"],
      ["TOTAL", report.incidents, "100%"],
    ],
    styles: { fillColor: [10, 10, 10], textColor: [200, 200, 200], fontSize: 8, lineColor: [30, 30, 30] },
    headStyles: { fillColor: [16, 185, 129], textColor: [0, 0, 0], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [18, 18, 18] },
  });
  y = doc.lastAutoTable.finalY + 20;

  // Category Breakdown
  if (report.categoryBreakdown?.length > 0) {
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("THREAT CATEGORY BREAKDOWN", margin, y); y += 16;
    autoTable(doc, {
      startY: y,
      head: [["Category", "Event Count"]],
      body: report.categoryBreakdown.map(c => [c.name, c.count]),
      styles: { fillColor: [10, 10, 10], textColor: [200, 200, 200], fontSize: 8, lineColor: [30, 30, 30] },
      headStyles: { fillColor: [16, 185, 129], textColor: [0, 0, 0], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [18, 18, 18] },
    });
    y = doc.lastAutoTable.finalY + 20;
  }

  // Top Source IPs
  if (report.topSourceIps?.length > 0) {
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TOP SOURCE IP ADDRESSES", margin, y); y += 16;
    autoTable(doc, {
      startY: y,
      head: [["Rank", "Source IP", "Event Count"]],
      body: report.topSourceIps.map((ip, i) => [i + 1, ip.ip, ip.count]),
      styles: { fillColor: [10, 10, 10], textColor: [200, 200, 200], fontSize: 8, lineColor: [30, 30, 30] },
      headStyles: { fillColor: [16, 185, 129], textColor: [0, 0, 0], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [18, 18, 18] },
    });
    y = doc.lastAutoTable.finalY + 20;
  }

  // Recent High Risk Events
  if (report.recentHighRisk?.length > 0) {
    doc.setTextColor(239, 68, 68);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("RECENT HIGH RISK EVENTS", margin, y); y += 16;
    autoTable(doc, {
      startY: y,
      head: [["Source IP", "Destination", "Category", "Score", "Action"]],
      body: report.recentHighRisk.map(e => [e.sourceIp, e.destinationIp, e.category, e.threatScore, e.action]),
      styles: { fillColor: [10, 10, 10], textColor: [200, 200, 200], fontSize: 7, lineColor: [30, 30, 30] },
      headStyles: { fillColor: [180, 30, 30], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [18, 18, 18] },
    });
  }

  doc.save(`ForensiAI_SOC_Report_${Date.now()}.pdf`);
}

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReport();
      setReport(data);
    } catch (err) {
      setError("Failed to compile report from SOC Engine");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!report) return;
    setDownloading(true);
    setTimeout(() => {
      generateProfessionalPdf(report);
      setDownloading(false);
    }, 800);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-center pb-6 border-b border-white/[0.05]">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Intelligence_Reports</h1>
          <p className="text-tech mt-1 uppercase tracking-widest opacity-60">Compile and export high-fidelity investigation summaries</p>
        </div>
        <button onClick={fetchReport} disabled={loading} className="btn-primary flex items-center gap-2 px-8">
          <FiZap className={loading ? "animate-spin" : ""} />
          {loading ? "Compiling..." : "Generate Report"}
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 p-4 rounded-xl text-danger text-sm font-medium flex items-center gap-2">
          <FiAlertCircle /> {error}
        </div>
      )}

      {report ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Signals", value: report.incidents, icon: FiActivity, color: "text-primary" },
              { label: "High Risk", value: report.high, icon: FiAlertCircle, color: "text-danger" },
              { label: "Avg Threat Score", value: report.avgThreatScore, icon: FiTarget, color: "text-warning" },
              { label: "Overall Risk", value: report.riskScore, icon: FiShield, color: report.riskScore === "Critical" ? "text-danger" : "text-primary" },
            ].map((card) => (
              <div key={card.label} className="soc-card p-5">
                <div className={`text-[0.6rem] font-bold uppercase tracking-widest mb-3 ${card.color}`}>{card.label}</div>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-black text-white">{card.value}</div>
                  <card.icon className={`${card.color} opacity-30`} size={28} />
                </div>
              </div>
            ))}
          </div>

          {/* Category Breakdown */}
          {report.categoryBreakdown?.length > 0 && (
            <div className="soc-card p-6">
              <div className="text-[0.7rem] font-bold text-white uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                <FiTarget className="text-primary" /> Threat Category Breakdown
              </div>
              <div className="space-y-3">
                {report.categoryBreakdown.map((cat) => (
                  <div key={cat.name}>
                    <div className="flex justify-between text-[0.7rem] font-bold uppercase mb-1">
                      <span className="text-slate-300">{cat.name}</span>
                      <span className="text-primary">{cat.count} events</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{ width: `${Math.min((cat.count / report.incidents) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Source IPs */}
          {report.topSourceIps?.length > 0 && (
            <div className="soc-card p-6">
              <div className="text-[0.7rem] font-bold text-white uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                <FiShield className="text-primary" /> Top Source IP Addresses
              </div>
              <div className="divide-y divide-white/[0.04]">
                {report.topSourceIps.map((ip, i) => (
                  <div key={ip.ip} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-[0.6rem] font-black text-primary/40 w-5">#{i + 1}</span>
                      <span className="font-mono text-sm text-slate-200">{ip.ip}</span>
                    </div>
                    <span className="text-[0.7rem] font-bold text-primary uppercase tracking-widest">{ip.count} events</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent High Risk */}
          {report.recentHighRisk?.length > 0 && (
            <div className="soc-card p-6 border-danger/20">
              <div className="text-[0.7rem] font-bold text-danger uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                <FiAlertCircle /> Recent High Risk Events
              </div>
              <div className="space-y-3">
                {report.recentHighRisk.map((e, i) => (
                  <div key={i} className="bg-danger/5 border border-danger/10 rounded-lg p-4 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-danger uppercase tracking-wider">{e.category}</span>
                      <span className="font-mono text-slate-500">Score: {e.threatScore}</span>
                    </div>
                    <div className="text-slate-400 mt-1 font-mono">{e.sourceIp} → {e.destinationIp}</div>
                    <div className="text-primary/60 mt-1 uppercase text-[0.6rem] tracking-widest">{e.action}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download Button */}
          <button
            onClick={downloadPdf}
            disabled={downloading}
            className="w-full btn-outline flex items-center justify-center gap-3 py-4 text-sm"
          >
            {downloading ? (
              <div className="h-4 w-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            ) : (
              <FiDownload />
            )}
            {downloading ? "Formatting PDF..." : "Download Full PDF Report"}
          </button>
        </div>
      ) : (
        <div className="soc-card p-20 flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center text-slate-700">
            <FiFileText size={40} />
          </div>
          <div className="max-w-xs">
            <h3 className="text-white font-bold">No Active Report</h3>
            <p className="text-sm text-slate-500 mt-2">Click "Generate Report" to compile the current signal buffer into a formal intelligence document.</p>
          </div>
        </div>
      )}
    </div>
  );
}
