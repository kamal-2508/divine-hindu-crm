// ─────────────────────────────────────────────
// FILE: backend/config/agents.js
// WHAT: Master list of 10 sales agents
//       Set active: false when agent is on leave
//       Add/remove agents here — no other file needs to change
// ─────────────────────────────────────────────

const AGENTS = [
  {
    id:     'A01',
    name:   'Arjun Sharma',
    phone:  '919XXXXXXXXX',           // include country code, no + sign
    email: 'nkamalstudy@gmail.com',
    active: true,                     // set false when on leave
  },
  {
    id:     'A02',
    name:   'Priya Mehta',
    phone:  '919XXXXXXXXX',
    email: 'nkamalstudy@gmail.com',
    active: true,
  },
  {
    id:     'A03',
    name:   'Rohit Gupta',
    phone:  '919XXXXXXXXX',
    email: 'nkamalstudy@gmail.com',
    active: true,
  },
  {
    id:     'A04',
    name:   'Neha Singh',
    phone:  '919XXXXXXXXX',
    email: 'nkamalstudy@gmail.com',
    active: true,
  },
  {
    id:     'A05',
    name:   'Vikram Joshi',
    phone:  '919XXXXXXXXX',
    email: 'nkamalstudy@gmail.com',
    active: true,
  },
  {
    id:     'A06',
    name:   'Pooja Verma',
    phone:  '919XXXXXXXXX',
    email: 'nkamalstudy@gmail.com',
    active: true,
  },
  {
    id:     'A07',
    name:   'Amit Yadav',
    phone:  '919XXXXXXXXX',
    email: 'nkamalstudy@gmail.com',
    active: true,
  },
  {
    id:     'A08',
    name:   'Sneha Patel',
    phone:  '919XXXXXXXXX',
    email: 'nkamalstudy@gmail.com',
    active: true,
  },
  {
    id:     'A09',
    name:   'Rahul Kumar',
    phone:  '919XXXXXXXXX',
    email: 'nkamalstudy@gmail.com',
    active: true,
  },
  {
    id:     'A10',
    name:   'Divya Nair',
    phone:  '919XXXXXXXXX',
    email: 'nkamalstudy@gmail.com',
    active: true,
  },
];

module.exports = { AGENTS };
