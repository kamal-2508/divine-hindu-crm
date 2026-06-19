// ─────────────────────────────────────────────
// FILE: backend/services/db.js
// WHAT: Supabase database client
//       All other files import this to talk to the DB
// SETUP: Go to supabase.com → New Project → Settings → API
//        Copy URL and anon key into .env
// ─────────────────────────────────────────────

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,   // from .env
  process.env.SUPABASE_KEY    // from .env
);

module.exports = supabase;

// ─────────────────────────────────────────────
// RUN THIS SQL ONCE in Supabase SQL editor
// to create the required tables:
// ─────────────────────────────────────────────
//
// -- Leads table
// CREATE TABLE leads (
//   id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   name            TEXT,
//   phone           TEXT,
//   email           TEXT,
//   source          TEXT DEFAULT 'app',
//   message         TEXT,
//   assigned_to     TEXT,
//   status          TEXT DEFAULT 'new',
//   escalated       BOOLEAN DEFAULT false,
//   notes           TEXT,
//   idempotency_key TEXT UNIQUE,
//   last_follow_up  TIMESTAMPTZ,
//   next_follow_up  TIMESTAMPTZ,
//   reassign_reason TEXT,
//   reassigned_at   TIMESTAMPTZ,
//   created_at      TIMESTAMPTZ DEFAULT NOW()
// );
//
// -- Assignment counter (single row, tracks round-robin position)
// CREATE TABLE assignment_state (
//   id      INT PRIMARY KEY DEFAULT 1,
//   counter INT DEFAULT 0
// );
// INSERT INTO assignment_state (id, counter) VALUES (1, 0);
