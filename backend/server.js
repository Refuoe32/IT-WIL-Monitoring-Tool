// backend/server.js
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const pool       = require('./db');
const authMiddleware = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));   // tighten in production
app.use(express.json());

// Helper: issue a JWT token
function signToken(user) {
  return jwt.sign(
    { uid: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Helper: map a users DB row → the shape the React dashboards expect
function mapUser(row) {
  return {
    uid            : row.id,
    id             : row.id,
    role           : row.role,
    fullName       : row.full_name,
    name           : row.full_name,
    email          : row.email,
    idNumber       : row.id_number       || '',
    employeeNumber : row.employee_number || '',
    program        : row.program         || '',
    faculty        : row.faculty         || '',
    researchAreas  : row.research_areas  || [],
    currentGroups  : row.current_groups  ?? 0,
    maxCapacity    : row.max_capacity    ?? 4,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  AUTH ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { role, fullName, email, password, idNumber, employeeNumber, program } = req.body;
  try {
    // Check duplicate email
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'email-already-in-use' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users
         (role, full_name, email, password_hash, id_number, employee_number, program)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [role, fullName.trim(), email.trim().toLowerCase(), hash,
       idNumber?.trim() || null, employeeNumber?.trim() || null, program || null]
    );

    const user  = result.rows[0];
    const token = signToken(user);
    return res.status(201).json({ success: true, token, user: mapUser(user) });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Incorrect email or password. Please try again.' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect email or password. Please try again.' });
    }

    const token = signToken(user);
    return res.json({ success: true, token, user: mapUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me  — validate token and return fresh user data
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.uid]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    return res.json({ user: mapUser(result.rows[0]) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  SUPERVISORS
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/supervisors
app.get('/api/supervisors', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM users WHERE role = 'supervisor' ORDER BY full_name`
    );
    return res.json(result.rows.map(mapUser));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  PROPOSALS
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/proposals
app.post('/api/proposals', authMiddleware, async (req, res) => {
  const {
    title, description, researchArea, groupMembers,
    submittedBy, supervisorId, supervisorName, similarityScore, steps
  } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO proposals
         (title, description, research_area, group_members, submitted_by,
          supervisor_id, supervisor_name, similarity_score, steps)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [title, description, researchArea, groupMembers, submittedBy,
       supervisorId, supervisorName, similarityScore || 0, JSON.stringify(steps || [])]
    );
    return res.status(201).json(mapProposal(result.rows[0]));
  } catch (err) {
    console.error('Submit proposal error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/proposals?submittedBy=uid
// GET /api/proposals?supervisorId=uid
// GET /api/proposals  (all — coordinator)
app.get('/api/proposals', authMiddleware, async (req, res) => {
  try {
    let query, params;

    if (req.query.submittedBy) {
      query = `
        SELECT p.*, u.full_name as student_full_name, u.email as student_email,
               u.id_number as student_id_number, u.program as student_program
        FROM proposals p
        LEFT JOIN users u ON p.submitted_by = u.id
        WHERE p.submitted_by = $1
        ORDER BY p.submitted_at DESC`;
      params = [req.query.submittedBy];
    } else if (req.query.supervisorId) {
      query = `
        SELECT p.*, u.full_name as student_full_name, u.email as student_email,
               u.id_number as student_id_number, u.program as student_program
        FROM proposals p
        LEFT JOIN users u ON p.submitted_by = u.id
        WHERE p.supervisor_id = $1
        ORDER BY p.submitted_at DESC`;
      params = [req.query.supervisorId];
    } else {
      query = `
        SELECT p.*, u.full_name as student_full_name, u.email as student_email,
               u.id_number as student_id_number, u.program as student_program
        FROM proposals p
        LEFT JOIN users u ON p.submitted_by = u.id
        ORDER BY p.submitted_at DESC`;
      params = [];
    }

    const result = await pool.query(query, params);
    return res.json(result.rows.map(mapProposalWithStudent));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/proposals/:id
app.patch('/api/proposals/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    // Build dynamic SET clause
    const fields = [];
    const values = [];
    let i = 1;

    const colMap = {
      status                  : 'status',
      forwardedToCoordinator  : 'forwarded_to_coordinator',
      supervisorApproval      : 'supervisor_approval',
      supervisorFeedback      : 'supervisor_feedback',
      coordinatorFeedback     : 'coordinator_feedback',
      coordinatorApprovedAt   : 'coordinator_approved_at',
      coordinatorApprovedBy   : 'coordinator_approved_by',
      rejectedBy              : 'rejected_by',
      reviewedAt              : 'reviewed_at',
    };

    for (const [key, col] of Object.entries(colMap)) {
      if (updates[key] !== undefined) {
        fields.push(`${col} = $${i++}`);
        values.push(typeof updates[key] === 'object' && updates[key] !== null
          ? JSON.stringify(updates[key]) : updates[key]);
      }
    }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update.' });

    values.push(id);
    const result = await pool.query(
      `UPDATE proposals SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    return res.json(mapProposal(result.rows[0]));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  LOGBOOKS
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/logbooks
app.post('/api/logbooks', authMiddleware, async (req, res) => {
  const {
    proposalId, studentId, studentName, studentNumber,
    supervisorId, supervisorName, projectTitle,
    weekNo, meetingNo, term, dateRange,
    workDone, recordOfDiscussion, problemsEncountered, furtherNotes
  } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO logbooks
         (proposal_id, student_id, student_name, student_number,
          supervisor_id, supervisor_name, project_title,
          week_no, meeting_no, term, date_range,
          work_done, record_of_discussion, problems_encountered, further_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [proposalId, studentId, studentName, studentNumber,
       supervisorId, supervisorName, projectTitle,
       weekNo, meetingNo, term, dateRange,
       JSON.stringify(workDone || []),
       JSON.stringify(recordOfDiscussion || []),
       JSON.stringify(problemsEncountered || []),
       furtherNotes]
    );
    return res.status(201).json(mapLogbook(result.rows[0]));
  } catch (err) {
    console.error('Submit logbook error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/logbooks?studentId=uid | supervisorId=uid | all
app.get('/api/logbooks', authMiddleware, async (req, res) => {
  try {
    let query, params;

    if (req.query.studentId) {
      query = 'SELECT * FROM logbooks WHERE student_id = $1 ORDER BY week_no ASC';
      params = [req.query.studentId];
    } else if (req.query.supervisorId) {
      query = 'SELECT * FROM logbooks WHERE supervisor_id = $1 ORDER BY week_no ASC';
      params = [req.query.supervisorId];
    } else {
      query = 'SELECT * FROM logbooks ORDER BY submitted_at DESC';
      params = [];
    }

    const result = await pool.query(query, params);
    return res.json(result.rows.map(mapLogbook));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/logbooks/:id
app.patch('/api/logbooks/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const fields = [];
    const values = [];
    let i = 1;

    const colMap = {
      status            : 'status',
      locked            : 'locked',
      digitalApproval   : 'digital_approval',
      supervisorFeedback: 'supervisor_feedback',
      rejectedBy        : 'rejected_by',
      reviewedAt        : 'reviewed_at',
    };

    for (const [key, col] of Object.entries(colMap)) {
      if (updates[key] !== undefined) {
        fields.push(`${col} = $${i++}`);
        values.push(typeof updates[key] === 'object' && updates[key] !== null
          ? JSON.stringify(updates[key]) : updates[key]);
      }
    }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update.' });

    values.push(id);
    const result = await pool.query(
      `UPDATE logbooks SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    return res.json(mapLogbook(result.rows[0]));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/notifications
app.post('/api/notifications', authMiddleware, async (req, res) => {
  const { toUid, title, message, type } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO notifications (to_uid, title, message, type)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [toUid, title, message, type || 'info']
    );
    return res.status(201).json(mapNotification(result.rows[0]));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/notifications?uid=uid
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE to_uid = $1 ORDER BY created_at DESC',
      [req.query.uid || req.user.uid]
    );
    return res.json(result.rows.map(mapNotification));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id/read
app.patch('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET read = TRUE WHERE id = $1', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  SETTINGS
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/settings
app.get('/api/settings', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE id = 1');
    const row    = result.rows[0];
    return res.json({
      maxSupervisionLimit: row.max_supervision_limit,
      similarityThreshold: row.similarity_threshold,
      logbookDeadline    : row.logbook_deadline,
      autoAssignment     : row.auto_assignment,
      emailNotifications : row.email_notifications,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings
app.put('/api/settings', authMiddleware, async (req, res) => {
  const { maxSupervisionLimit, similarityThreshold, logbookDeadline, autoAssignment, emailNotifications } = req.body;
  try {
    await pool.query(
      `UPDATE settings SET
         max_supervision_limit = $1, similarity_threshold = $2,
         logbook_deadline = $3, auto_assignment = $4, email_notifications = $5
       WHERE id = 1`,
      [maxSupervisionLimit, similarityThreshold, logbookDeadline, autoAssignment, emailNotifications]
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── Row mappers ──────────────────────────────────────────────────────────────
function mapProposal(row) {
  return {
    id                     : row.id,
    title                  : row.title,
    description            : row.description,
    researchArea           : row.research_area,
    groupMembers           : row.group_members,
    submittedBy            : row.submitted_by,
    supervisorId           : row.supervisor_id,
    supervisorName         : row.supervisor_name,
    similarityScore        : row.similarity_score        ?? 0,
    steps                  : row.steps                  ?? [],
    status                 : row.status,
    forwardedToCoordinator : row.forwarded_to_coordinator ?? false,
    supervisorApproval     : row.supervisor_approval     ?? null,
    supervisorFeedback     : row.supervisor_feedback     ?? null,
    coordinatorFeedback    : row.coordinator_feedback    ?? null,
    coordinatorApprovedAt  : row.coordinator_approved_at ?? null,
    coordinatorApprovedBy  : row.coordinator_approved_by ?? null,
    rejectedBy             : row.rejected_by             ?? null,
    reviewedAt             : row.reviewed_at             ?? null,
    submittedAt            : row.submitted_at,
  };
}

function mapProposalWithStudent(row) {
  return {
    ...mapProposal(row),
    studentName    : row.student_full_name  || '',
    studentEmail   : row.student_email      || '',
    studentIdNumber: row.student_id_number  || '',
    studentProgram : row.student_program    || '',
  };
}

function mapLogbook(row) {
  return {
    id                  : row.id,
    proposalId          : row.proposal_id,
    studentId           : row.student_id,
    studentName         : row.student_name,
    studentNumber       : row.student_number,
    supervisorId        : row.supervisor_id,
    supervisorName      : row.supervisor_name,
    projectTitle        : row.project_title,
    weekNo              : row.week_no,
    meetingNo           : row.meeting_no,
    term                : row.term,
    dateRange           : row.date_range,
    workDone            : row.work_done            ?? [],
    recordOfDiscussion  : row.record_of_discussion ?? [],
    problemsEncountered : row.problems_encountered ?? [],
    furtherNotes        : row.further_notes        ?? '',
    status              : row.status,
    locked              : row.locked               ?? false,
    digitalApproval     : row.digital_approval     ?? null,
    supervisorFeedback  : row.supervisor_feedback  ?? null,
    reviewedAt          : row.reviewed_at          ?? null,
    submittedAt         : row.submitted_at,
  };
}

function mapNotification(row) {
  return {
    id       : row.id,
    title    : row.title,
    message  : row.message,
    type     : row.type,
    read     : row.read,
    createdAt: row.created_at,
  };
}

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  WIL Monitor API running on http://localhost:${PORT}`);
});