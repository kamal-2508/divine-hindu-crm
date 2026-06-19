// ─────────────────────────────────────────────
// FILE: backend/routes/webhook.js
// WHAT: POST /webhook/lead
//       Your app calls this URL every time a customer submits a form
//       This is the main entry point for all new leads
// URL:  https://your-server.railway.app/webhook/lead
// ─────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const supabase                              = require('../services/db');
const { findDuplicate, logDuplicateAttempt } = require('../services/deduplication');
const { getNextAgent }                       = require('../services/assignmentEngine');
const { notifyNewLead }                      = require('../services/notifyAgent');
const { AGENTS }                             = require('../config/agents');

// POST /webhook/lead
router.post('/lead', async (req, res) => {
  try {
    const { name, phone, email, source, message } = req.body;

    // ── Step 1: Validate ─────────────────────
    if (!phone && !email) {
      return res.status(400).json({
        error: 'At least phone or email is required'
      });
    }

    // ── Step 2: Normalize input ──────────────
    const lead = {
      name:    (name || 'Unknown').trim(),
      phone:   phone ? phone.replace(/\D/g, '') : null,  // digits only
      email:   email ? email.toLowerCase().trim() : null,
      source:  source || 'app',
      message: message || '',
    };

    // ── Step 3: Idempotency check ────────────
    // If app retries the same request within 5 min, ignore the duplicate POST
    const windowMinute = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    const idempKey = crypto
      .createHash('sha256')
      .update(`${lead.phone}-${lead.email}-${lead.name}-${windowMinute}`)
      .digest('hex');

    const { data: existingIdem } = await supabase
      .from('leads')
      .select('id')
      .eq('idempotency_key', idempKey)
      .single();

    if (existingIdem) {
      return res.json({ success: true, status: 'already_processed', id: existingIdem.id });
    }

    // ── Step 4: Deduplication ────────────────
    const duplicate = await findDuplicate(lead.phone, lead.email);

    if (duplicate) {
      await logDuplicateAttempt(lead, duplicate.id);

      // Still notify the existing agent that customer enquired again
      const existingAgent = AGENTS.find(a => a.id === duplicate.assigned_to);
      if (existingAgent) {
        await notifyNewLead(existingAgent, {
          ...duplicate,
          name: lead.name,
          message: `RE-INQUIRY: ${lead.message}`,
        });
      }

      return res.json({
        success: true,
        status: 'duplicate',
        existingLeadId: duplicate.id,
        assignedTo: duplicate.assigned_to,
      });
    }

    // ── Step 5: Assign to next agent ─────────
    const agent = await getNextAgent();

    // ── Step 6: Set follow-up dates ──────────
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ── Step 7: Save to database ─────────────
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert({
        name:             lead.name,
        phone:            lead.phone,
        email:            lead.email,
        source:           lead.source,
        message:          lead.message,
        assigned_to:      agent.id,
        status:           'assigned',
        escalated:        false,
        idempotency_key:  idempKey,
        next_follow_up:   tomorrow.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // ── Step 8: Notify agent (non-blocking) ──
    notifyNewLead(agent, newLead).catch(err => {
      console.log('Notification skipped (Twilio not configured):', err.message);
    });

    // ── Step 9: Respond to app ───────────────
    return res.json({
      success: true,
      status: 'assigned',
      leadId: newLead.id,
      assignedTo: agent.name,
    });

  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

module.exports = router;
