// ─────────────────────────────────────────────
// FILE: backend/services/deduplication.js
// WHAT: Checks if a lead already exists in DB
//       before creating a new one
// CALLED BY: backend/routes/webhook.js
// ─────────────────────────────────────────────

const supabase = require('./db');

/**
 * Returns existing lead if phone or email was seen in last 30 days.
 * Returns null if this is a genuinely new lead.
 */
async function findDuplicate(phone, email) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Check phone match
  if (phone) {
    const { data: phoneMatch } = await supabase
      .from('leads')
      .select('id, assigned_to, status, name')
      .eq('phone', phone)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .limit(1)
      .single();

    if (phoneMatch) return phoneMatch;
  }

  // Check email match
  if (email) {
    const { data: emailMatch } = await supabase
      .from('leads')
      .select('id, assigned_to, status, name')
      .eq('email', email)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .limit(1)
      .single();

    if (emailMatch) return emailMatch;
  }

  return null;   // no duplicate found — proceed with new lead
}

/**
 * Logs that someone submitted a form again for an existing lead.
 * Useful for the manager to see re-inquiries.
 */
async function logDuplicateAttempt(incomingLead, existingLeadId) {
  console.log(
    `Duplicate attempt: incoming [${incomingLead.phone}/${incomingLead.email}]` +
    ` matched existing lead ${existingLeadId}`
  );
  // Optional: store in a separate "duplicate_attempts" table
}

module.exports = { findDuplicate, logDuplicateAttempt };
