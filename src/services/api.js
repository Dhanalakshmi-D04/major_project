import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickRiskLevel(value) {
  if (value >= 75) return "High";
  if (value >= 40) return "Medium";
  return "Low";
}

function makeMockDashboard() {
  const now = Date.now();
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(now - (13 - i) * 24 * 60 * 60 * 1000);
    return {
      name: d.toLocaleDateString(undefined, { month: "short", day: "2-digit" }),
      value: Math.round(18 + Math.random() * 65)
    };
  });

  const suspiciousEvents = Math.round(220 + Math.random() * 210);
  const totalLogs = Math.round(12000 + Math.random() * 16000);
  const activeIncidents = Math.round(4 + Math.random() * 18);
  const riskLevel = pickRiskLevel((suspiciousEvents / totalLogs) * 100);

  const barData = [
    { name: "Failed login", value: Math.round(70 + Math.random() * 120) },
    { name: "Suspicious file", value: Math.round(35 + Math.random() * 90) },
    { name: "Privilege escalation", value: Math.round(20 + Math.random() * 70) },
    { name: "Data transfer", value: Math.round(25 + Math.random() * 85) }
  ];

  const riskOptions = ["High", "Medium", "Low"];
  const recentAlerts = Array.from({ length: 7 }).map((_, i) => {
    const ts = new Date(now - i * (1000 * 60 * (18 + Math.random() * 12))).toISOString();
    const user = ["root", "admin", "service-bot", "analyst", "operator"][Math.floor(Math.random() * 5)];
    const ip = `10.0.${Math.floor(Math.random() * 20)}.${Math.floor(10 + Math.random() * 200)}`;
    const action = ["Login failed", "Malware signature", "API token misuse", "Mass export", "Privilege change"][
      Math.floor(Math.random() * 5)
    ];
    const riskLevel = riskOptions[Math.floor(Math.random() * 3)];
    return {
      id: `alert_${now}_${i}`,
      timestamp: ts,
      user,
      ipAddress: ip,
      action,
      riskLevel,
      description: "Suspicious activity detected. Correlated with threat intelligence signals."
    };
  });

  return {
    totalLogs,
    suspiciousEvents,
    activeIncidents,
    riskLevel,
    lineChartData: days,
    barChartData: barData,
    recentAlerts
  };
}

function makeMockIncidents() {
  const now = Date.now();
  const actions = [
    "Login failed",
    "Successful login",
    "File accessed",
    "Data transfer",
    "API token misuse",
    "Privilege escalation attempt",
    "Suspicious admin action"
  ];
  const users = ["root", "admin", "service-bot", "analyst", "operator", "auditor"];
  const risks = ["High", "Medium", "Low"];

  return Array.from({ length: 28 }).map((_, i) => {
    const ts = new Date(now - i * (1000 * 60 * (12 + Math.random() * 22))).toISOString();
    return {
      id: `inc_${now}_${i}`,
      timestamp: ts,
      user: users[Math.floor(Math.random() * users.length)],
      ipAddress: `192.168.${Math.floor(Math.random() * 40)}.${Math.floor(10 + Math.random() * 220)}`,
      action: actions[Math.floor(Math.random() * actions.length)],
      riskLevel: risks[Math.floor(Math.random() * risks.length)]
    };
  });
}

function makeMockTimeline() {
  const now = Date.now();
  const typeToTitle = [
    { type: "failed_login", title: "Failed login", iconKey: "user-x" },
    { type: "successful_login", title: "Successful login", iconKey: "user-check" },
    { type: "file_accessed", title: "File accessed", iconKey: "file-search" },
    { type: "data_transfer", title: "Data transfer", iconKey: "upload" }
  ];

  const eventTypes = ["failed_login", "successful_login", "file_accessed", "data_transfer"];
  return Array.from({ length: 12 }).map((_, i) => {
    const ts = new Date(now - (11 - i) * (1000 * 60 * (9 + Math.random() * 11))).toISOString();
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const match = typeToTitle.find((t) => t.type === type);
    return {
      id: `tl_${now}_${i}`,
      timestamp: ts,
      type,
      title: match?.title ?? "Security event",
      iconKey: match?.iconKey ?? "alert-circle",
      detail: "Event correlated with session and network telemetry."
    };
  });
}

function makeMockChatReply(prompt) {
  const msg = String(prompt ?? "").toLowerCase();
  if (!msg.trim()) return "Please describe the incident or logs you want analyzed.";
  if (msg.includes("login") || msg.includes("credential") || msg.includes("fail")) {
    return "I identified multiple authentication anomalies. Recommend checking account lockouts, MFA enforcement, and correlating source IP reputation with the session timeline.";
  }
  if (msg.includes("file") || msg.includes("access")) {
    return "File access events appear elevated. Validate whether the accessed paths match expected workflows, and review integrity changes and downstream process lineage.";
  }
  if (msg.includes("transfer") || msg.includes("exfil") || msg.includes("export")) {
    return "The activity resembles potential data egress. Confirm destination endpoints, verify transfer volume thresholds, and look for unusual process ancestry.";
  }
  return "Thanks. Based on the available telemetry, focus on correlation between authentication events, process lineage, and network indicators. Share any specific incident ID to refine the analysis.";
}

function makeMockReport() {
  const now = new Date();
  const summaryLines = [
    "ForensiAI Cyber Incident Investigation Report",
    `Generated: ${now.toLocaleString()}`,
    "",
    "Executive Summary:",
    "- Increased suspicious event rate detected during the last 24 hours.",
    "- Multiple authentication anomalies with correlated IP reputation signals.",
    "- Elevated risk events indicate potential escalation attempts and anomalous data handling.",
    "",
    "Recommended Next Steps:",
    "- Verify affected accounts and enforce/validate MFA settings.",
    "- Hunt for related processes and inspect credential usage.",
    "- Review endpoint and network telemetry around the identified timestamps.",
    ""
  ];

  const summaryText = summaryLines.join("\n");

  return {
    summaryText,
    summary: {
      risk: "High",
      highlights: [
        "Authentication anomalies clustered around suspect IP ranges",
        "Potential privilege escalation attempts detected",
        "Data handling signals require validation"
      ],
      timeframe: "Last 24 hours"
    }
  };
}

async function withMockFallback(liveFn, mockFn) {
  try {
    const response = await liveFn();
    return response.data;
  } catch (err) {
    // Backend not available: return deterministic mock after a realistic delay.
    await delay(800);
    return mockFn();
  }
}

export async function getDashboard() {
  return withMockFallback(
    () => api.get("/api/dashboard"),
    () => makeMockDashboard()
  );
}

export async function getIncidents() {
  return withMockFallback(
    () => api.get("/api/incidents"),
    () => makeMockIncidents()
  );
}

export async function getTimeline() {
  return withMockFallback(
    () => api.get("/api/timeline"),
    () => makeMockTimeline()
  );
}

export async function postChat(message) {
  return withMockFallback(
    () => api.post("/api/chat", { message }),
    () => ({ reply: makeMockChatReply(message) })
  );
}

export async function getReport() {
  return withMockFallback(
    () => api.get("/api/report"),
    () => makeMockReport()
  );
}