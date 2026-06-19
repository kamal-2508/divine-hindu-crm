// ─────────────────────────────────────────────
// FILE: backend/routes/leads.js
// WHAT: APIs that agents use to update lead status
//       Called from the dashboard or agent mobile form
//
//   PATCH /lead/:id/status      — agent updates status + notes
//   POST  /lead/:id/reassign    — manager reassigns a lead
//   GET   /lead/:id             — get single lead details
// ─────────────────────────────────────────────

const express = require('express');
const router = express.Router();

const supabase              = require('../services/db');
const { notifyNewLead }     = require('../services/notifyAgent');
const { AGENTS }            = require('../config/agents');

// ── PATCH /lead/:id/status ───────────────────
// Agent calls this after contacting a customer
// Body: { status, notes, nextFollowUp }
// status options: 'contacted' | 'converted' | 'lost' | 'callback'
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, nextFollowUp } = req.body;

    const validStatuses = ['contacted', 'converted', 'lost', 'callback', 'assigned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const { error } = await supabase
      .from('leads')
      .update({
        status,
        notes,
        last_follow_up: new Date().toISOString(),
        next_follow_up: nextFollowUp || null,
      })
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: `Lead ${id} updated to "${status}"` });

  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /lead/:id/reassign ──────────────────
// Manager uses this when an agent is unavailable
// Body: { newAgentId, reason }
router.post('/:id/reassign', async (req, res) => {
  try {
    const { id } = req.params;
    const { newAgentId, reason } = req.body;

    const newAgent = AGENTS.find(a => a.id === newAgentId);
    if (!newAgent) {
      return res.status(404).json({ error: `Agent ${newAgentId} not found` });
    }

    const { error } = await supabase
      .from('leads')
      .update({
        assigned_to:      newAgentId,
        status:           'assigned',
        reassign_reason:  reason || 'Manual reassignment',
        reassigned_at:    new Date().toISOString(),
        escalated:        false,          // reset escalation flag
      })
      .eq('id', id);

    if (error) throw error;

    // Fetch full lead to notify new agent
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    await notifyNewLead(newAgent, lead);

    res.json({ success: true, message: `Lead reassigned to ${newAgent.name}` });

  } catch (err) {
    console.error('Reassign error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /lead/:id ────────────────────────────
// Fetch a single lead's full details
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
