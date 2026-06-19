// ─────────────────────────────────────────────
// FILE: backend/cron/escalationChecker.js
// WHAT: Runs every 15 minutes
//       Finds leads assigned but not contacted within 30 minutes
//       Alerts manager on WhatsApp
// LOADED BY: backend/server.js (auto-starts with server)
// ─────────────────────────────────────────────

const cron = require('node-cron');
const supabase                        = require('../services/db');
const { notifyManagerSLABreach }      = require('../services/notifyAgent');
const { AGENTS }                      = require('../config/agents');

const SLA_MINUTES = 30;  // alert if lead uncontacted for this many minutes

// Schedule: '*/15 * * * *' = every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log(`[${new Date().toLocaleString()}] Running SLA escalation check...`);

  try {
    const slaThreshold = new Date(Date.now() - SLA_MINUTES * 60 * 1000);

    // Find leads that are:
    // - still in 'assigned' status (agent hasn't updated them)
    // - created more than SLA_MINUTES ago
    // - not already escalated
    const { data: missedLeads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('status', 'assigned')
      .lt('created_at', slaThreshold.toISOString())
      .eq('escalated', false);

    if (error) throw error;

    if (missedLeads.length === 0) {
      console.log('No SLA breaches found.');
      return;
    }

    console.log(`⚠️  ${missedLeads.length} SLA breach(es) found`);

    for (const lead of missedLeads) {
      const agent = AGENTS.find(a => a.id === lead.assigned_to);
      const agentName = agent?.name || lead.assigned_to;

      // Alert the manager
      await notifyManagerSLABreach(lead, agentName);

      // Mark as escalated so we don't alert again for this lead
      await supabase
        .from('leads')
        .update({ escalated: true })
        .eq('id', lead.id);

      console.log(`Escalated lead ${lead.id} (assigned to ${agentName})`);
    }

  } catch (err) {
    console.error('Escalation checker error:', err);
  }
});

console.log('✅ Escalation checker loaded (runs every 15 minutes)');
