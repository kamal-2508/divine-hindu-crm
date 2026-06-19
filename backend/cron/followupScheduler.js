// ─────────────────────────────────────────────
// FILE: backend/cron/followupScheduler.js
// WHAT: Runs every day at 9:00 AM
//       Scans leads whose next_follow_up date is today or past
//       Sends WhatsApp reminder to the assigned agent
// LOADED BY: backend/server.js (auto-starts with server)
// ─────────────────────────────────────────────

const cron = require('node-cron');
const supabase                = require('../services/db');
const { notifyFollowUp }      = require('../services/notifyAgent');
const { AGENTS }              = require('../config/agents');

// Schedule: '0 9 * * *' = every day at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log(`[${new Date().toLocaleString()}] Running follow-up check...`);

  try {
    const today = new Date().toISOString();

    // Find all leads where follow-up is due and not yet closed
    const { data: overdueLeads, error } = await supabase
      .from('leads')
      .select('*')
      .lte('next_follow_up', today)           // due today or earlier
      .not('status', 'in', '("converted","lost")');  // skip closed leads

    if (error) throw error;

    console.log(`Found ${overdueLeads.length} follow-ups due today`);

    for (const lead of overdueLeads) {
      const agent = AGENTS.find(a => a.id === lead.assigned_to);
      if (!agent) {
        console.warn(`Agent ${lead.assigned_to} not found for lead ${lead.id}`);
        continue;
      }

      // Calculate which follow-up day this is
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(lead.created_at)) / 86400000
      );

      await notifyFollowUp(agent, lead, daysSinceCreated);

      // Set next follow-up date based on schedule:
      // Day 1 → remind again at Day 3
      // Day 3 → remind again at Day 7
      // Day 7+ → mark as cold (14 days inactivity = done)
      let nextFollowUp = null;

      if (daysSinceCreated <= 1) {
        nextFollowUp = new Date(Date.now() + 2 * 86400000);  // +2 days = Day 3
      } else if (daysSinceCreated <= 3) {
        nextFollowUp = new Date(Date.now() + 4 * 86400000);  // +4 days = Day 7
      } else if (daysSinceCreated <= 7) {
        nextFollowUp = new Date(Date.now() + 7 * 86400000);  // +7 days = Day 14
      } else {
        // Auto-mark as cold after 14 days with no conversion
        await supabase
          .from('leads')
          .update({ status: 'cold', next_follow_up: null })
          .eq('id', lead.id);
        console.log(`Lead ${lead.id} marked as cold (${daysSinceCreated} days old)`);
        continue;
      }

      // Update next follow-up date
      await supabase
        .from('leads')
        .update({ next_follow_up: nextFollowUp.toISOString() })
        .eq('id', lead.id);
    }

    console.log('Follow-up check complete.');

  } catch (err) {
    console.error('Follow-up scheduler error:', err);
  }
});

console.log('✅ Follow-up scheduler loaded (runs 9 AM daily)');
