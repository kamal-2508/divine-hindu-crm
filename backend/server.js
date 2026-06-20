// ─────────────────────────────────────────────
// FILE: backend/server.js
// WHAT: Entry point — starts the Express server
//       and loads all routes + cron jobs
// RUN:  node backend/server.js
// ─────────────────────────────────────────────

require('dotenv').config();                        // load .env file

const express = require('express');
const app = express();

app.use(express.json());
app.use(require('express').static('frontend'));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});                           // parse JSON request bodies

// ── Routes ──────────────────────────────────
const webhookRoute    = require('./routes/webhook');    // receives leads from app
const leadsRoute      = require('./routes/leads');      // agent updates lead status
const dashboardRoute  = require('./routes/dashboard'); // manager dashboard API

app.use('/webhook', webhookRoute);
app.use('/lead',    leadsRoute);
app.use('/dashboard', dashboardRoute);

// Health check — visit in browser to confirm server is alive
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Divine Hindu CRM', time: new Date() });
});

// ── Cron jobs (start when server starts) ────
require('./cron/followupScheduler');               // 9 AM daily follow-up reminders
require('./cron/escalationChecker');               // every 15 min SLA breach check

// ── Start server ────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Divine Hindu CRM running on port ${PORT}`);
});
