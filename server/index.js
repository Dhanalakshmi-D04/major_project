import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import multer from "multer";
import { analyzePacket } from "./ml.js";

const app = express();
const PORT = 8080;
const SECRET_KEY = "cyber_stealth_secret_2024";

// Configure Multer for large uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./archive";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `upload_${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- DATABASE INITIALIZATION ---
const dbPath = path.join(__dirname, "forensiai.db");
const db = new sqlite3.Database(dbPath);

// Enable high-concurrency WAL mode and set a busy timeout
db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL;');
  db.run('PRAGMA busy_timeout = 5000;');

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
    userId TEXT,
    resource TEXT,
    category TEXT,
    riskLevel TEXT,
    action TEXT,
    threatScore REAL,
    raw_data TEXT
  )`);

  // Optimized Indexes for High-Performance Queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_timestamp ON incidents(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_risk ON incidents(riskLevel)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_category ON incidents(category)`);
});

// Set longer busy timeout to handle background ingestion locks more gracefully
db.run('PRAGMA busy_timeout = 30000;');

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.error("❌ JWT Verification Error:", err.message);
      return res.sendStatus(403);
    }
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
  console.log(`🔐 Login Attempt: ${username}`);
  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err) {
      console.error("❌ Login DB Error:", err);
      return res.status(500).json({ error: "Auth System Error" });
    }
    if (!user) return res.status(400).json({ error: "Analyst not found" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: "24h" });
    console.log(`✅ Login Success: ${username}`);
    res.json({ token, user: { username: user.username, role: user.role } });
  });
});

// --- CORE SOC ENDPOINTS ---

app.post("/api/ingest", authenticateToken, (req, res) => {
  const { data } = req.body;
  if (!Array.isArray(data)) return res.status(400).json({ error: "Invalid signal format" });

  const stmt = db.prepare(`INSERT INTO incidents (timestamp, sourceIp, destinationIp, userId, resource, category, riskLevel, action, threatScore, raw_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  
  data.forEach((packet) => {
    const analysis = analyzePacket(packet);
    stmt.run(
      packet.timestamp || new Date().toISOString(),
      packet.sourceIp || "0.0.0.0",
      packet.destinationIp || "0.0.0.0",
      packet.userId || "system",
      packet.resource || "N/A",
      analysis.category,
      analysis.riskLevel,
      analysis.action,
      analysis.threatScore,
      packet.raw_data || JSON.stringify(packet)
    );
  });

  stmt.finalize();
  res.json({ message: "Signal uplink successful", count: data.length });
});

app.post("/api/upload", authenticateToken, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filePath = req.file.path;
  
  // Respond immediately to prevent client-side "Network Error" or timeouts
  res.json({ 
    message: "Forensic uplink initiated. Processing in SOC background.", 
    filename: req.file.filename,
    status: "processing"
  });

  // Background Ingestion Task with Batch Commits to prevent UI locking
  setImmediate(async () => {
    let count = 0;
    const BATCH_SIZE = 5000;
    try {
      const stmt = db.prepare(`INSERT INTO incidents (timestamp, sourceIp, destinationIp, userId, resource, category, riskLevel, action, threatScore, raw_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      const stream = fs.createReadStream(filePath).pipe(csv());

      await new Promise((resolve, reject) => db.run("BEGIN TRANSACTION", (err) => err ? reject(err) : resolve()));

      for await (const packet of stream) {
        const analysis = analyzePacket(packet);
        await new Promise((resolve, reject) => {
          stmt.run(
            packet.timestamp || new Date().toISOString(),
            packet.sourceIp || "0.0.0.0",
            packet.destinationIp || "0.0.0.0",
            packet.userId || "system",
            packet.resource || "N/A",
            analysis.category,
            analysis.riskLevel,
            analysis.action,
            analysis.threatScore,
            JSON.stringify(packet),
            (err) => err ? reject(err) : resolve()
          );
        });
        count++;

        // Commit and restart transaction every BATCH_SIZE to release the lock for UI queries
        if (count % BATCH_SIZE === 0) {
          await new Promise((resolve, reject) => db.run("COMMIT", (err) => err ? reject(err) : resolve()));
          await new Promise((resolve, reject) => db.run("BEGIN TRANSACTION", (err) => err ? reject(err) : resolve()));
          console.log(`📡 SOC Ingest Progress: ${count} signals indexed...`);
        }
      }

      stmt.finalize();
      await new Promise((resolve, reject) => db.run("COMMIT", (err) => err ? reject(err) : resolve()));
      console.log(`✅ Background Ingest Complete: ${count} signals total.`);
    } catch (err) {
      console.error("❌ Background Ingest Error:", err);
      db.run("ROLLBACK");
    }
  });
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

  // Use async for-await for natural backpressure (prevents Memory Crash)
  (async () => {
    let count = 0;
    const BATCH_SIZE = 5000;
    try {
      await new Promise((resolve, reject) => db.run("BEGIN TRANSACTION", (err) => err ? reject(err) : resolve()));
      const stmt = db.prepare(`INSERT INTO incidents (timestamp, sourceIp, destinationIp, userId, resource, category, riskLevel, action, threatScore, raw_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      
      const stream = fs.createReadStream(filePath).pipe(csv());
      for await (const row of stream) {
        const packet = {
          timestamp: row.timestamp || row.Timestamp || new Date().toISOString(),
          sourceIp: row.sourceIp || row.Source || row.src || "0.0.0.0",
          destinationIp: row.destinationIp || row.Destination || row.dst || "0.0.0.0",
          userId: row.userId || "system",
          resource: row.resource || "N/A",
          category: row.category || row.Label || "Unclassified"
        };
        const analysis = analyzePacket(packet);
        await new Promise((resolve, reject) => {
          stmt.run(
            packet.timestamp, 
            packet.sourceIp, 
            packet.destinationIp, 
            packet.userId,
            packet.resource,
            analysis.category, 
            analysis.riskLevel, 
            analysis.action, 
            analysis.threatScore,
            JSON.stringify(row),
            (err) => err ? reject(err) : resolve()
          );
        });
        count++;

        if (count % BATCH_SIZE === 0) {
          await new Promise((resolve, reject) => db.run("COMMIT", (err) => err ? reject(err) : resolve()));
          await new Promise((resolve, reject) => db.run("BEGIN TRANSACTION", (err) => err ? reject(err) : resolve()));
          console.log(`📡 Archive Sync Progress: ${count} signals indexed...`);
        }
      }

      stmt.finalize();
      await new Promise((resolve, reject) => db.run("COMMIT", (err) => err ? reject(err) : resolve()));
      res.json({ message: `Archive ${filename} ingested successfully`, count });
    } catch (err) {
      console.error("❌ Archive Ingest Error:", err);
      db.run("ROLLBACK");
      if (!res.headersSent) res.status(500).json({ error: "Forensic stream failure" });
    }
  })();
});

app.get("/api/dashboard", authenticateToken, async (req, res) => {
  console.log("📊 Dashboard Request Received...");
  try {
    // Perform high-speed SQL aggregations
    console.log("--- Executing SQL Aggregations ---");
    const totalLogs = await new Promise((resolve) => db.get("SELECT COUNT(*) as count FROM incidents", (err, row) => resolve(row?.count || 0)));
    console.log(`--- Total Logs: ${totalLogs} ---`);
    
    const suspiciousEvents = await new Promise((resolve) => db.get("SELECT COUNT(*) as count FROM incidents WHERE riskLevel != 'Low'", (err, row) => resolve(row?.count || 0)));
    const activeIncidents = await new Promise((resolve) => db.get("SELECT COUNT(*) as count FROM incidents WHERE riskLevel = 'High'", (err, row) => resolve(row?.count || 0)));
    
    const categoryData = await new Promise((resolve) => {
      db.all("SELECT category as name, COUNT(*) as value FROM incidents GROUP BY category ORDER BY value DESC LIMIT 10", (err, rows) => resolve(rows || []));
    });

    const timeData = await new Promise((resolve) => {
      db.all(`SELECT strftime('%H:00', timestamp) as name, COUNT(*) as value FROM incidents GROUP BY name ORDER BY name ASC LIMIT 24`, (err, rows) => resolve(rows || []));
    });

    const recentAlerts = await new Promise((resolve) => {
      db.all("SELECT * FROM incidents WHERE riskLevel = 'High' ORDER BY id DESC LIMIT 5", (err, rows) => resolve(rows || []));
    });

    console.log("✅ Dashboard Data Synthesized.");
    res.json({
      totalLogs,
      suspiciousEvents,
      activeIncidents,
      riskLevel: suspiciousEvents > (totalLogs * 0.3) ? "High" : "Low",
      lineChartData: timeData,
      barChartData: categoryData.map(c => ({ 
        name: c.name.length > 15 ? c.name.substring(0, 12) + '...' : c.name, 
        value: c.value 
      })),
      recentAlerts
    });
  } catch (err) {
    console.error("❌ Dashboard Optimization Error:", err);
    res.status(500).json({ error: "Intelligence Engine Timeout" });
  }
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

import { getKnowledgeForIncident, cybersecurityKnowledge } from "./knowledge_base.js";

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
    const knowledge = topCategory ? getKnowledgeForIncident(topCategory[0], "") : null;

    const sourceIps = {};
    rows.forEach(r => { if(r.sourceIp) sourceIps[r.sourceIp] = (sourceIps[r.sourceIp] || 0) + 1; });
    const topIp = Object.entries(sourceIps).sort((a,b) => b[1]-a[1])[0];

    const avgThreat = total > 0 ? (rows.reduce((s,r) => s + parseFloat(r.threatScore||0), 0) / total).toFixed(1) : 0;

    const lowerMsg = message.toLowerCase();
    let response = "";

    if (lowerMsg.includes("summar") || lowerMsg.includes("overview") || lowerMsg.includes("status")) {
      response = `📊 INVESTIGATION SUMMARY\n\n` +
                 `Total Signals: ${total} | High Risk: ${high} | Avg Threat: ${avgThreat}/100\n\n` +
                 `🔍 PRIMARY PATTERN: ${topCategory ? topCategory[0] : "None"}\n` +
                 `🛡️ TECHNIQUE: ${knowledge ? knowledge.technique : "Generic Pattern"}\n` +
                 `📝 DESCRIPTION: ${knowledge ? knowledge.description : "Continuous monitoring recommended."}\n\n` +
                 `💡 MITIGATION STEPS:\n` +
                 (knowledge ? knowledge.mitigation.map(m => `• ${m}`).join("\n") : "• Maintain standard SOC posture.\n• Review logs for anomalies.") +
                 `\n\nRecommendation: ${high > 5 ? "⚠️ Escalate to Tier-2 SOC immediately." : "✅ Risk posture is stable."}`;
    } else if (lowerMsg.includes("high") || lowerMsg.includes("critical")) {
      const highEvents = rows.filter(r => r.riskLevel === "High").slice(0, 5);
      response = `🔴 HIGH RISK EVENTS (${high} total)\n\n` + (highEvents.length > 0
        ? highEvents.map(e => `• [${e.category}] ${e.sourceIp} → ${e.destinationIp} | Score: ${e.threatScore} | ${e.action}`).join("\n")
        : "No high risk events detected.");
    } else if (lowerMsg.includes("recommend") || lowerMsg.includes("action") || lowerMsg.includes("mitigat")) {
      response = `🛡️ SOC MITIGATION PLAYBOOK\n\n` +
                 `Based on current buffer (${topCategory ? topCategory[0] : "N/A"}): \n\n` +
                 (knowledge ? knowledge.mitigation.map(m => `✅ ${m}`).join("\n") : "• Review top source IP: " + (topIp ? topIp[0] : "N/A") + "\n• Perform baseline audit.") +
                 `\n\n• Primary Actor: ${topIp ? topIp[0] : "Internal/Unknown"}\n• Recommended Action: ${high > 5 ? "Activate Incident Response" : "Log & Monitor"}`;
    } else {
      response = `🤖 ForensiAI Neural Analyst\n\nBuffer Status: ${total} signals indexed | ${high} high-risk\n\nTry asking: "Summarize the findings", "What are the mitigation steps?", or "Show high risk events".`;
    }

    res.json({ response });
  });
});

app.get("/api/report", authenticateToken, async (req, res) => {
  try {
    // Optimized SQL aggregations for reporting
    const total = await new Promise((resolve) => db.get("SELECT COUNT(*) as count FROM incidents", (err, row) => resolve(row?.count || 0)));
    const high = await new Promise((resolve) => db.get("SELECT COUNT(*) as count FROM incidents WHERE riskLevel = 'High'", (err, row) => resolve(row?.count || 0)));
    const medium = await new Promise((resolve) => db.get("SELECT COUNT(*) as count FROM incidents WHERE riskLevel = 'Medium'", (err, row) => resolve(row?.count || 0)));
    const low = await new Promise((resolve) => db.get("SELECT COUNT(*) as count FROM incidents WHERE riskLevel = 'Low'", (err, row) => resolve(row?.count || 0)));
    
    const categoryBreakdown = await new Promise((resolve) => {
      db.all("SELECT category as name, COUNT(*) as count FROM incidents GROUP BY category ORDER BY count DESC", (err, rows) => resolve(rows || []));
    });

    const topIps = await new Promise((resolve) => {
      db.all("SELECT sourceIp as ip, COUNT(*) as count FROM incidents WHERE sourceIp IS NOT NULL GROUP BY sourceIp ORDER BY count DESC LIMIT 10", (err, rows) => resolve(rows || []));
    });

    const avgScore = await new Promise((resolve) => {
      db.get("SELECT AVG(threatScore) as avg FROM incidents", (err, row) => resolve(row?.avg?.toFixed(1) || 0));
    });

    const recentHighRisk = await new Promise((resolve) => {
      db.all("SELECT sourceIp, destinationIp, category, action, threatScore, timestamp FROM incidents WHERE riskLevel = 'High' ORDER BY id DESC LIMIT 5", (err, rows) => resolve(rows || []));
    });

    const riskScore = high > (total * 0.3) ? "Critical" : high > (total * 0.1) ? "High" : total > 0 ? "Stable" : "No Data";

    res.json({
      summary: "ForensiAI Network Integrity Report",
      generationTime: new Date().toISOString(),
      incidents: total,
      high, medium, low,
      avgThreatScore: avgScore,
      riskScore,
      categoryBreakdown,
      topSourceIps: topIps,
      recentHighRisk
    });
  } catch (err) {
    console.error("❌ Reporting Optimization Error:", err);
    res.status(500).json({ error: "Reporting Engine Failure" });
  }
});

const server = app.listen(PORT, () => {
  console.log(`SOC ENGINE ACTIVE ON PORT ${PORT}`);
});

// Hardened connection settings for large forensic uplinks
server.timeout = 600000; // 10 minutes
server.keepAliveTimeout = 610000;
server.headersTimeout = 620000;
