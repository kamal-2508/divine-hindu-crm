# Setup Guide — Divine Hindu CRM

## Step 1 — Install Node.js
Download from https://nodejs.org (LTS version)
Verify: `node --version` should show v18+

## Step 2 — Install dependencies
Open terminal in the project folder and run:
```
npm install
```

## Step 3 — Set up Supabase (free database)
1. Go to https://supabase.com → Create account → New Project
2. Go to your project → SQL Editor → paste and run this:

```sql
CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT,
  phone           TEXT,
  email           TEXT,
  source          TEXT DEFAULT 'app',
  message         TEXT,
  assigned_to     TEXT,
  status          TEXT DEFAULT 'new',
  escalated       BOOLEAN DEFAULT false,
  notes           TEXT,
  idempotency_key TEXT UNIQUE,
  last_follow_up  TIMESTAMPTZ,
  next_follow_up  TIMESTAMPTZ,
  reassign_reason TEXT,
  reassigned_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assignment_state (
  id      INT PRIMARY KEY DEFAULT 1,
  counter INT DEFAULT 0
);
INSERT INTO assignment_state (id, counter) VALUES (1, 0);
```

3. Go to Settings → API → copy URL and anon key

## Step 4 — Set up Twilio WhatsApp (notifications)
1. Go to https://twilio.com → Create account
2. Go to Messaging → Try it out → Send a WhatsApp message
3. Note your Account SID and Auth Token from Console home

## Step 5 — Set up Gmail App Password (email)
1. Go to Google Account → Security → 2-Step Verification → App Passwords
2. Create a new App Password → copy it

## Step 6 — Create your .env file
```
cp .env.example .env
```
Open .env and fill in all values.

## Step 7 — Update agents list
Open `backend/config/agents.js`
Replace the phone numbers and emails with real agent details.

## Step 8 — Run locally (test)
```
npm run dev
```
Visit http://localhost:3000 — you should see: `{ "status": "ok" }`

Test a lead submission:
```
curl -X POST http://localhost:3000/webhook/lead \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Customer","phone":"9876543210","message":"I want to buy"}'
```

## Step 9 — Open dashboard
Open `frontend/dashboard.html` in your browser.
Change API_URL in the file to `http://localhost:3000`.

## Step 10 — Deploy to Railway (free hosting)
1. Go to https://railway.app → Create account
2. New Project → Deploy from GitHub repo
3. Add all your .env variables in Railway's Variables tab
4. Railway gives you a public URL like: https://divine-hindu-crm.railway.app
5. Update your app to POST leads to: https://divine-hindu-crm.railway.app/webhook/lead
6. Update dashboard.html API_URL to your Railway URL

## How to put an agent on leave
Open `backend/config/agents.js`
Set `active: false` for that agent.
Restart the server — leads will skip that agent automatically.
