// FILE: backend/services/notifyAgent.js
require('dotenv').config();
const nodemailer = require('nodemailer');

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function notifyNewLead(agent, lead) {
  await getTransporter().sendMail({
    from: `"Divine Hindu CRM" <${process.env.EMAIL_USER}>`,
    to: agent.email,
    subject: `New Lead: ${lead.name} — ID ${lead.id}`,
    html: `
      <h2>New Lead Assigned — Divine Hindu</h2>
      <table border='1' cellpadding='8' cellspacing='0'>
        <tr><td><b>Name</b></td><td>${lead.name}</td></tr>
        <tr><td><b>Phone</b></td><td>${lead.phone}</td></tr>
        <tr><td><b>Email</b></td><td>${lead.email || 'N/A'}</td></tr>
        <tr><td><b>Message</b></td><td>${lead.message || 'None'}</td></tr>
        <tr><td><b>Lead ID</b></td><td>${lead.id}</td></tr>
        <tr><td><b>Assigned To</b></td><td>${agent.name}</td></tr>
      </table>
      <br><p>Please contact within 30 minutes.</p>
    `,
  });
  console.log('Email sent to ' + agent.name + ' (' + agent.email + ')');
}

async function notifyFollowUp(agent, lead, dayNumber) {
  await getTransporter().sendMail({
    from: process.env.EMAIL_USER,
    to: agent.email,
    subject: `Follow-up Reminder Day ${dayNumber}: ${lead.name}`,
    text: `Please follow up with ${lead.name} (${lead.phone}). Status: ${lead.status}`,
  });
}

async function notifyManagerSLABreach(lead, agentName) {
  await getTransporter().sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.MANAGER_EMAIL,
    subject: `SLA Breach: ${lead.name} not contacted by ${agentName}`,
    text: `Agent ${agentName} has not responded to lead ${lead.name} (${lead.phone}) within 30 minutes.`,
  });
}

module.exports = { notifyNewLead, notifyFollowUp, notifyManagerSLABreach };
