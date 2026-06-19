# Divine Hindu — Lead Management System
## Where Every File Goes

```
divine-hindu-crm/
│
├── backend/                        ← Node.js server (run on Railway / Render)
│   ├── server.js                   ← Entry point, starts Express server
│   ├── package.json                ← Dependencies
│   ├── .env                        ← API keys (NEVER commit this)
│   │
│   ├── config/
│   │   └── agents.js               ← List of 10 sales agents
│   │
│   ├── routes/
│   │   ├── webhook.js              ← POST /webhook/lead  (receives leads from app)
│   │   ├── leads.js                ← PATCH /lead/:id/status  (agent updates)
│   │   └── dashboard.js            ← GET /dashboard  (management view)
│   │
│   ├── services/
│   │   ├── deduplication.js        ← Check if lead already exists
│   │   ├── assignmentEngine.js     ← Round-robin assignment logic
│   │   ├── notifyAgent.js          ← WhatsApp + Email notifications
│   │   └── db.js                   ← Supabase database client
│   │
│   └── cron/
│       ├── followupScheduler.js    ← Runs 9 AM daily — follow-up reminders
│       └── escalationChecker.js    ← Runs every 15 min — SLA breach alerts
│
├── frontend/
│   └── dashboard.html              ← Simple HTML dashboard for manager
│
└── docs/
    └── setup.md                    ← How to deploy step by step
```
