import React, { useState } from "react";
import jsPDF from "jspdf";
import ReportCard from "../components/ReportCard.jsx";
import { getReport } from "../services/api.js";

function downloadPdfFromText(text) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;

  doc.setFont("courier", "normal");
  doc.setFontSize(10);

  const lines = doc.splitTextToSize(String(text || ""), maxWidth);
  let y = margin;

  lines.forEach((line) => {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 14;
  });

  doc.save("forensiai-report.pdf");
}

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  async function onGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await getReport();
      setReport(res);
    } catch (e) {
      setError(e);
    } finally {
      setGenerating(false);
    }
  }

  async function onDownload() {
    if (!report?.summaryText) return;
    setDownloading(true);
    try {
      // Small UX delay to show progress
      await new Promise((r) => setTimeout(r, 350));
      downloadPdfFromText(report.summaryText);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Reports</h1>
        <p className="text-sm text-slate-400 mt-1">Generate investigation reports and download as PDF.</p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-high/30 bg-high/10 p-4 text-sm text-slate-200">
          Couldn’t generate report from backend. Using mock report output.
        </div>
      ) : null}

      <ReportCard
        report={report}
        onGenerate={onGenerate}
        onDownload={onDownload}
        generating={generating}
        downloading={downloading}
      />
    </div>
  );
}

