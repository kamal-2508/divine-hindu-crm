// ─────────────────────────────────────────────
// FILE: backend/routes/dashboard.js
// WHAT: GET /dashboard
//       Returns all stats for the manager dashboard
//       Called by frontend/dashboard.html every 30 seconds
// ─────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const supabase = require('../services/db');
const { AGENTS } = require('../config/agents');

// GET /dashboard?days=7
router.get('/', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    // Fetch all leads in the time window
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .gte('created_at', sinceISO);

    if (error) throw error;

    // ── Overall totals ───────────────────────
    const totals = {
      total:     leads.length,
      assigned:  leads.filter(l => l.status !== 'new').length,
      contacted: leads.filter(l => ['contacted', 'callback'].includes(l.status)).length,
      converted: leads.filter(l => l.status === 'converted').length,
      lost:      leads.filter(l => l.status === 'lost').length,
      pending:   leads.filter(l => l.status === 'assigned').length,
      escalated: leads.filter(l => l.escalated).length,
      conversionRate: leads.length > 0
        ? ((leads.filter(l => l.status === 'converted').length / leads.length) * 100).toFixed(1)
        : 0,
    };

    // ── Per-agent breakdown ──────────────────
    const byAgent = AGENTS.map(agent => {
      const agentLeads = leads.filter(l => l.assigned_to === agent.id);
      const converted  = agentLeads.filter(l => l.status === 'converted').length;
      const pending    = agentLeads.filter(l => l.status === 'assigned').length;

      // Calculate average response time in minutes
      const responded = agentLeads.filter(l => l.last_follow_up);
      const avgResponse = responded.length > 0
        ? Math.round(
            responded.reduce((sum, l) => {
              const mins = (new Date(l.last_follow_up) - new Date(l.created_at)) / 60000;
              return sum + mins;
            }, 0) / responded.length
          )
        : null;

      return {
        id:          agent.id,
        name:        agent.name,
        active:      agent.active,
        assigned:    agentLeads.length,
        contacted:   agentLeads.filter(l => l.status !== 'assigned').length,
        converted,
        pending,
        avgResponseMin: avgResponse,
        conversionRate: agentLeads.length > 0
          ? ((converted / agentLeads.length) * 100).toFixed(1)
          : '0.0',
      };
    });

    // ── Recent 20 leads ──────────────────────
    const recentLeads = leads
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 20)
      .map(l => ({
        id:         l.id,
        name:       l.name,
        phone:      l.phone,
        email:      l.email,
        status:     l.status,
        assignedTo: AGENTS.find(a => a.id === l.assigned_to)?.name || l.assigned_to,
        escalated:  l.escalated,
        createdAt:  l.created_at,
        notes:      l.notes,
      }));

    res.json({ totals, byAgent, recentLeads, generatedAt: new Date().toISOString() });

  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
