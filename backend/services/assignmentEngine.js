// ─────────────────────────────────────────────
// FILE: backend/services/assignmentEngine.js
// WHAT: Round-robin assignment across active agents
//       Counter is stored in DB so it survives server restarts
// CALLED BY: backend/routes/webhook.js
// ─────────────────────────────────────────────

const supabase = require('./db');
const { AGENTS } = require('../config/agents');

/**
 * Returns the next agent in round-robin order.
 * Skips agents with active: false (on leave).
 */
async function getNextAgent() {
  const activeAgents = AGENTS.filter(a => a.active);

  if (activeAgents.length === 0) {
    throw new Error('No active agents available for assignment');
  }

  // Read current counter from DB
  const { data } = await supabase
    .from('assignment_state')
    .select('counter')
    .eq('id', 1)
    .single();

  const counter = data?.counter ?? 0;

  // Pick agent at this position (wraps around with modulo)
  const agent = activeAgents[counter % activeAgents.length];

  // Advance counter for next lead
  await supabase
    .from('assignment_state')
    .update({ counter: counter + 1 })
    .eq('id', 1);

  return agent;
}

/**
 * Alternative: assign to agent with fewest open leads.
 * Use this instead of getNextAgent() if you want load balancing.
 */
async function getLeastLoadedAgent() {
  const activeAgents = AGENTS.filter(a => a.active);
  const activeIds = activeAgents.map(a => a.id);

  // Count open leads per agent
  const { data: counts } = await supabase
    .from('leads')
    .select('assigned_to')
    .in('assigned_to', activeIds)
    .in('status', ['assigned', 'contacted']);

  // Build a map: agentId → open lead count
  const loadMap = {};
  activeIds.forEach(id => { loadMap[id] = 0; });
  (counts || []).forEach(row => {
    if (loadMap[row.assigned_to] !== undefined) {
      loadMap[row.assigned_to]++;
    }
  });

  // Find agent with lowest count
  const leastLoadedId = Object.entries(loadMap)
    .sort(([, a], [, b]) => a - b)[0][0];

  return activeAgents.find(a => a.id === leastLoadedId) ?? activeAgents[0];
}

module.exports = { getNextAgent, getLeastLoadedAgent };
