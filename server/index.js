import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { analyzePacket } from "./ml.js";

const app = express();
const PORT = 8080;
const SECRET_KEY = "cyber_stealth_secret_2024";

app.use(cors());
app.use(express.json({ limit: '50mb' }));

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- DATABASE INITIALIZATION ---
const dbPath = path.join(__dirname, "forensiai.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'Analyst'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    sourceIp TEXT,
    destinationIp TEXT,
    category TEXT,
    riskLevel TEXT,
    action TEXT,
    threatScore REAL
  )`);
});

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- AUTH ENDPOINTS ---
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], (err) => {
    if (err) return res.status(400).json({ error: "Username already exists" });
    res.status(201).json({ message: "Analyst registered" });
  });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: "Analyst not found" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: "8h" });
    res.json({ token, user: { username: user.username, role: user.role } });
  });
});

// --- CORE SOC ENDPOINTS ---

app.post("/api/ingest", authenticateToken, (req, res) => {
  const { data } = req.body;
  if (!Array.isArray(data)) return res.status(400).json({ error: "Invalid signal format" });

  const stmt = db.prepare(`INSERT INTO incidents (timestamp, sourceIp, destinationIp, category, riskLevel, action, threatScore) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  
  data.forEach((packet) => {
    const analysis = analyzePacket(packet);
    stmt.run(
      packet.timestamp || new Date().toISOString(),
      packet.sourceIp || "0.0.0.0",
      packet.destinationIp || "0.0.0.0",
      analysis.category,
      analysis.riskLevel,
      analysis.action,
      analysis.threatScore
    );
  });

  stmt.finalize();
  res.json({ message: "Signal uplink successful", count: data.length });
});

app.get("/api/archive", authenticateToken, (req, res) => {
  const archivePath = path.join(process.cwd(), "archive");
  if (!fs.existsSync(archivePath)) {
    return res.json([]);
  }
  
  const files = fs.readdirSync(archivePath)
    .filter(file => file.endsWith(".csv"))
    .map(file => {
      const stats = fs.statSync(path.join(archivePath, file));
      return {
        name: file,
        size: (stats.size / (1024 * 1024)).toFixed(2) + " MB",
        modified: stats.mtime
      };
    });
  
  res.json(files);
});

app.post("/api/archive/ingest", authenticateToken, (req, res) => {
  const { filename } = req.body;
  const filePath = path.join(process.cwd(), "archive", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Archive file not found" });
  }

  let count = 0;
  const stmt = db.prepare(`INSERT INTO incidents (timestamp, sourceIp, destinationIp, category, riskLevel, action, threatScore) VALUES (?, ?, ?, ?, ?, ?, ?)`);

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      const packet = {
        timestamp: row.timestamp || row.Timestamp || new Date().toISOString(),
        sourceIp: row.sourceIp || row.Source || row.src || "0.0.0.0",
        destinationIp: row.destinationIp || row.Destination || row.dst || "0.0.0.0",
        category: row.category || row.Label || "Unclassified"
      };
      const analysis = analyzePacket(packet);
      stmt.run(packet.timestamp, packet.sourceIp, packet.destinationIp, analysis.category, analysis.riskLevel, analysis.action, analysis.threatScore);
      count++;
    })
    .on("end", () => {
      stmt.finalize();
      res.json({ message: `Archive ${filename} ingested successfully`, count });
    })
    .on("error", (err) => {
      res.status(500).json({ error: "Stream failure" });
    });
});

app.get("/api/dashboard", authenticateToken, (req, res) => {
  db.all("SELECT * FROM incidents", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database fault" });

    const totalLogs = rows.length;
    const suspiciousEvents = rows.filter(r => r.riskLevel !== "Low").length;
    
    const categories = {};
    rows.forEach(i => {
      categories[i.category] = (categories[i.category] || 0) + 1;
    });

    const timeGroups = {};
    rows.forEach(i => {
      const hour = new Date(i.timestamp).getHours();
      const label = `${hour}:00`;
      timeGroups[label] = (timeGroups[label] || 0) + 1;
    });

    const lineChartData = Object.keys(timeGroups).length > 0 
      ? Object.keys(timeGroups).map(k => ({ name: k, value: timeGroups[k] }))
      : [];

    res.json({
      totalLogs,
      suspiciousEvents,
      activeIncidents: rows.filter(r => r.riskLevel === "High").length,
      riskLevel: suspiciousEvents > (totalLogs * 0.3) ? "High" : "Low",
      lineChartData: lineChartData.slice(-7),
      barChartData: Object.keys(categories).length > 0 
        ? Object.keys(categories).map(k => ({ name: k.length > 15 ? k.substring(0, 12) + '...' : k, value: categories[k] }))
        : [],
      recentAlerts: rows.filter(r => r.riskLevel === "High").slice(-5).reverse()
    });
  });
});

app.get("/api/incidents", authenticateToken, (req, res) => {
  db.all("SELECT * FROM incidents ORDER BY id DESC LIMIT 100", [], (err, rows) => {
    if (err) return res.sendStatus(500);
    res.json(rows);
  });
});

app.get("/api/notifications", authenticateToken, (req, res) => {
  db.all("SELECT * FROM incidents WHERE riskLevel = 'High' ORDER BY id DESC LIMIT 5", [], (err, rows) => {
    if (err) return res.sendStatus(500);
    const notifications = rows.map(r => ({
      id: r.id,
      title: `Critical Alert: ${r.action}`,
      timestamp: new Date(r.timestamp).toLocaleTimeString(),
      riskLevel: "High"
    }));
    res.json(notifications);
  });
});

app.get("/api/timeline", authenticateToken, (req, res) => {
  db.all("SELECT id, timestamp, action as title, category as description, riskLevel as status FROM incidents ORDER BY id DESC LIMIT 20", [], (err, rows) => {
    if (err) return res.sendStatus(500);
    res.json(rows);
  });
});

app.post("/api/chat", authenticateToken, (req, res) => {
  const { message } = req.body;
  db.all("SELECT * FROM incidents ORDER BY id DESC LIMIT 200", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });

    const total = rows.length;
    const high = rows.filter(r => r.riskLevel === "High").length;
    const medium = rows.filter(r => r.riskLevel === "Medium").length;
    const low = rows.filter(r => r.riskLevel === "Low").length;

    const categories = {};
    rows.forEach(r => { categories[r.category] = (categories[r.category] || 0) + 1; });
    const topCategory = Object.entries(categories).sort((a,b) => b[1]-a[1])[0];

    const sourceIps = {};
    rows.forEach(r => { if(r.sourceIp) sourceIps[r.sourceIp] = (sourceIps[r.sourceIp] || 0) + 1; });
    const topIp = Object.entries(sourceIps).sort((a,b) => b[1]-a[1])[0];

    const avgThreat = total > 0 ? (rows.reduce((s,r) => s + parseFloat(r.threatScore||0), 0) / total).toFixed(1) : 0;

    const lowerMsg = message.toLowerCase();
    let response = "";

    if (lowerMsg.includes("summar") || lowerMsg.includes("overview") || lowerMsg.includes("status")) {
      response = `📊 INVESTIGATION SUMMARY\n\nTotal Signals Analyzed: ${total}\nHigh Risk Events: ${high} (${total ? ((high/total)*100).toFixed(1) : 0}%)\nMedium Risk Events: ${medium}\nLow Risk Events: ${low}\nAverage Threat Score: ${avgThreat}/100\n\nTop Threat Category: ${topCategory ? topCategory[0] + " (" + topCategory[1] + " events)" : "N/A"}\nMost Active Source IP: ${topIp ? topIp[0] + " (" + topIp[1] + " events)" : "N/A"}\n\nRecommendation: ${high > 5 ? "⚠️ Escalate to Tier-2 SOC immediately. High-risk event density exceeds threshold." : "✅ Current risk posture is within acceptable parameters. Continue monitoring."}`;
    } else if (lowerMsg.includes("high") || lowerMsg.includes("critical")) {
      const highEvents = rows.filter(r => r.riskLevel === "High").slice(0, 5);
      response = `🔴 HIGH RISK EVENTS (${high} total)\n\n` + (highEvents.length > 0
        ? highEvents.map(e => `• [${e.category}] ${e.sourceIp} → ${e.destinationIp} | Score: ${e.threatScore} | ${e.action}`).join("\n")
        : "No high risk events detected in current buffer.");
    } else if (lowerMsg.includes("ip") || lowerMsg.includes("source")) {
      const topIps = Object.entries(sourceIps).sort((a,b) => b[1]-a[1]).slice(0, 5);
      response = `🌐 TOP SOURCE IP ADDRESSES\n\n` + (topIps.length > 0
        ? topIps.map((ip, i) => `${i+1}. ${ip[0]} — ${ip[1]} events`).join("\n")
        : "No IP data available.");
    } else if (lowerMsg.includes("categor") || lowerMsg.includes("type")) {
      const cats = Object.entries(categories).sort((a,b) => b[1]-a[1]);
      response = `📁 THREAT CATEGORY BREAKDOWN\n\n` + (cats.length > 0
        ? cats.map(c => `• ${c[0]}: ${c[1]} events`).join("\n")
        : "No category data available.");
    } else if (lowerMsg.includes("recommend") || lowerMsg.includes("action")) {
      response = `🛡️ SOC RECOMMENDATIONS\n\n${high > 10 ? "CRITICAL: Isolate top source IPs immediately and escalate to IR team." : high > 3 ? "WARNING: Review and block flagged source IPs. Enable enhanced logging." : "STABLE: Maintain current monitoring posture. Schedule routine audit."}\n\n• Run packet capture on: ${topIp ? topIp[0] : "N/A"}\n• Primary threat vector: ${topCategory ? topCategory[0] : "None identified"}\n• Suggested action: ${high > 5 ? "Activate incident response playbook" : "Continue passive monitoring"}`;
    } else {
      response = `🤖 ForensiAI Neural Analyst\n\nQuery: "${message}"\n\nBuffer Status: ${total} signals indexed | ${high} high-risk | Avg threat score: ${avgThreat}\n\nTip: Ask me to "summarize", show "high risk events", list "top IPs", explain "categories", or give "recommendations".`;
    }

    res.json({ response });
  });
});

app.get("/api/report", authenticateToken, (req, res) => {
  db.all("SELECT * FROM incidents", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });

    const total = rows.length;
    const high = rows.filter(r => r.riskLevel === "High").length;
    const medium = rows.filter(r => r.riskLevel === "Medium").length;
    const low = rows.filter(r => r.riskLevel === "Low").length;

    const categories = {};
    rows.forEach(r => { categories[r.category] = (categories[r.category] || 0) + 1; });

    const sourceIps = {};
    rows.forEach(r => { if(r.sourceIp) sourceIps[r.sourceIp] = (sourceIps[r.sourceIp] || 0) + 1; });
    const topIps = Object.entries(sourceIps).sort((a,b) => b[1]-a[1]).slice(0, 10);

    const avgScore = total > 0 ? (rows.reduce((s,r) => s + parseFloat(r.threatScore||0), 0) / total).toFixed(1) : 0;

    const riskScore = high > (total * 0.3) ? "Critical" : high > (total * 0.1) ? "High" : total > 0 ? "Stable" : "No Data";

    res.json({
      summary: "ForensiAI Network Integrity Report",
      generationTime: new Date().toISOString(),
      incidents: total,
      high, medium, low,
      avgThreatScore: avgScore,
      riskScore,
      categoryBreakdown: Object.entries(categories).sort((a,b) => b[1]-a[1]).map(([name, count]) => ({ name, count })),
      topSourceIps: topIps.map(([ip, count]) => ({ ip, count })),
      recentHighRisk: rows.filter(r => r.riskLevel === "High").slice(-5).map(r => ({
        sourceIp: r.sourceIp, destinationIp: r.destinationIp,
        category: r.category, action: r.action, threatScore: r.threatScore, timestamp: r.timestamp
      }))
    });
  });
});

app.listen(PORT, () => {
  console.log(`SOC ENGINE ACTIVE ON PORT ${PORT}`);
});
