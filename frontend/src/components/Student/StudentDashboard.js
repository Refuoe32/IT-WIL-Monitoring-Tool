import React, { useState, useEffect } from 'react';
import '../../styles/styles.css';
import {
  submitProposal,
  listenStudentProposals,
  listenStudentLogbooks,
  submitLogbook,
  listenNotifications,
  pushNotification,
  getAllSupervisors,
  markNotificationRead,
} from '../../api/api';

const StudentDashboard = ({ onLogout, showToast, currentUser }) => {
  const [activePage, setActivePage]   = useState('overview');

  // ── Firebase data ─────────────────────────────────────────
  const [proposal, setProposal]       = useState(null);      // current active proposal
  const [logbooks, setLogbooks]       = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [supervisors, setSupervisors] = useState([]);         // all supervisors from Firestore

  // ── Proposal form ─────────────────────────────────────────
  const [proposalData, setProposalData] = useState({
    projectTitle: '', description: '', researchArea: '', groupMembers: '',
  });
  const [descriptionType, setDescriptionType]   = useState('text');
  const [descriptionFile, setDescriptionFile]   = useState(null);
  const [descriptionFileName, setDescriptionFileName] = useState('');
  const [showSupervisors, setShowSupervisors]   = useState(false);
  const [similarityCheck, setSimilarityCheck]   = useState(null);
  const [selectedSupervisor, setSelectedSupervisor]   = useState(null);   // supervisor object
  const [matchedSupervisors, setMatchedSupervisors]   = useState([]);

  // ── Logbook form ──────────────────────────────────────────
  const [logbookForm, setLogbookForm] = useState({
    weekNo: '', meetingNo: '', term: '',
    workDone:              ['', '', '', '', '', ''],
    recordOfDiscussion:    ['', '', '', '', '', '', ''],
    problemsEncountered:   ['', '', '', '', '', '', ''],
    furtherNotes: '',
  });
  const [viewingLogbook, setViewingLogbook] = useState(null);

  // ── Helpers ───────────────────────────────────────────────
  const now = () => new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const getWeekDateRange = (week) => {
    const start = new Date(2026, 1, 2);
    start.setDate(start.getDate() + (week - 1) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 4);
    const fmt = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    return `${fmt(start)} – ${fmt(end)}, 2026`;
  };

  const updateArrayField = (field, index, value) => {
    setLogbookForm(prev => {
      const arr = [...prev[field]];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  // ── Real-time listeners ───────────────────────────────────
  useEffect(() => {
    if (!currentUser?.uid) return;

    // Load all supervisors once (for matching)
    getAllSupervisors().then(setSupervisors);

    // Live proposals
    const unsubProposals = listenStudentProposals(currentUser.uid, (proposals) => {
      setProposal(proposals.length > 0 ? proposals[0] : null);
    });

    // Live logbooks
    const unsubLogbooks = listenStudentLogbooks(currentUser.uid, (lbs) => {
      setLogbooks(lbs.sort((a, b) => a.weekNo - b.weekNo));
    });

    // Live notifications
    const unsubNotifs = listenNotifications(currentUser.uid, setNotifications);

    return () => {
      unsubProposals();
      unsubLogbooks();
      unsubNotifs();
    };
  }, [currentUser?.uid]);

  // ── Duplicate check simulation ────────────────────────────
  const simulateDuplicateCheck = (title) => {
    const existing = [
      "Smart Campus Navigation System Using IoT",
      "Web-based Student Result Management Portal",
      "AI-Powered Crop Disease Detection Mobile App",
      "IT WIL Monitoring System",
      "E-Commerce Platform for SMEs",
    ];
    const randomBase = Math.floor(Math.random() * 30) + 10;
    const isHigh = existing.some(e =>
      title.toLowerCase().includes(e.toLowerCase().split(' ')[1]) ||
      e.toLowerCase().includes(title.toLowerCase().split(' ')[1])
    );
    return Math.min(98, isHigh ? randomBase + 45 : randomBase);
  };

  // ── Supervisor matching against real Firestore data ───────
  const getBestMatchingSupervisors = () => {
    if (!proposalData.researchArea || supervisors.length === 0) return [];

    // Map researchArea dropdown value → keywords to match against supervisor researchAreas
    const areaKeywords = {
      web      : ['web', 'e-commerce', 'subscription', 'online shopping'],
      mobile   : ['mobile', 'app', 'ios', 'android', 'react native'],
      ml       : ['machine learning', 'ai', 'artificial intelligence', 'data mining', 'deep learning'],
      database : ['database', 'data', 'sql', 'nosql'],
      security : ['security', 'forensics', 'blockchain', 'cryptography', 'digital identity'],
      cloud    : ['cloud', 'aws', 'azure', 'devops'],
      iot      : ['iot', 'smart', 'sensor', 'embedded'],
      erp      : ['erp', 'enterprise', 'business analytics', 'digital transformation'],
    };

    const keywords = areaKeywords[proposalData.researchArea] || [proposalData.researchArea];

    return supervisors
      .map(sup => {
        const areas = (sup.researchAreas || []).join(' ').toLowerCase();
        let score   = 50;

        // Boost for each matching keyword
        keywords.forEach(kw => {
          if (areas.includes(kw)) score += 15;
        });

        // Capacity penalty
        const load = (sup.currentGroups || 0) / (sup.maxCapacity || 4);
        if (load >= 1)    score -= 50;
        else if (load >= 0.75) score -= 10;

        return { ...sup, calculatedMatch: Math.max(0, Math.min(100, score)) };
      })
      .filter(sup => (sup.currentGroups || 0) < (sup.maxCapacity || 4))
      .sort((a, b) => b.calculatedMatch - a.calculatedMatch);
  };

  const checkDuplicateAndMatch = () => {
    if (!proposalData.projectTitle || !proposalData.researchArea) {
      showToast('Error', 'Project title and research area are required.');
      return;
    }
    if (descriptionType === 'text' && !proposalData.description?.trim()) {
      showToast('Error', 'Please provide a project description.');
      return;
    }
    if (descriptionType === 'file' && !descriptionFile) {
      showToast('Error', 'Please upload a description document.');
      return;
    }

    const similarity  = simulateDuplicateCheck(proposalData.projectTitle);
    const isDuplicate = similarity >= 70;

    setSimilarityCheck({
      type   : isDuplicate ? 'danger' : 'success',
      message: isDuplicate
        ? `⚠️ High similarity detected (${similarity}%) — possible duplicate. Please revise.`
        : `✓ Originality check passed (${similarity}% similarity)`,
    });

    if (isDuplicate) { setShowSupervisors(false); return; }

    const matches = getBestMatchingSupervisors();
    setMatchedSupervisors(matches);

    if (matches.length === 0) {
      showToast('Warning', 'No supervisors currently available with capacity.');
      setShowSupervisors(false);
      return;
    }

    setSelectedSupervisor(matches[0]);   // auto-select best match
    setShowSupervisors(true);
    setTimeout(() => document.getElementById('supervisorSelection')?.scrollIntoView({ behavior: 'smooth' }), 150);
    showToast('Matching Complete', `Found ${matches.length} suitable supervisor(s)`);
  };

  // ── Submit proposal to Firestore ──────────────────────────
  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupervisor) { showToast('Error', 'Please select a supervisor.'); return; }

    const descriptionValue = descriptionType === 'file'
      ? `[File uploaded: ${descriptionFileName}]`
      : proposalData.description;

    const steps = [
      { label: 'Duplicate Check Passed',       detail: 'Proposal title cleared — similarity below threshold.',                       done: true,  time: now() },
      { label: 'Supervisor Matched & Assigned', detail: `Matched with ${selectedSupervisor.name} based on research area.`,           done: true,  time: now() },
      { label: 'Awaiting Supervisor Review',    detail: 'Supervisor will review and provide feedback.',                               done: false, time: null },
      { label: 'Forward to Coordinator',        detail: 'Pending supervisor approval.',                                               done: false, time: null },
      { label: 'Project Activation',            detail: 'Pending final approval.',                                                    done: false, time: null },
    ];

    try {
      await submitProposal({
        title          : proposalData.projectTitle,
        description    : descriptionValue,
        researchArea   : proposalData.researchArea,
        groupMembers   : proposalData.groupMembers,
        submittedBy    : currentUser.uid,
        supervisorId   : selectedSupervisor.id,
        supervisorName : selectedSupervisor.name,
        similarityScore: 0,
        steps,
      });

      // Notify supervisor
      await pushNotification(
        selectedSupervisor.id,
        'New Proposal Assigned',
        `A new proposal "${proposalData.projectTitle}" has been matched to you. Please review.`,
        'info'
      );

      showToast('Proposal Submitted', `Assigned to ${selectedSupervisor.name} for review.`);

      // Reset form
      setProposalData({ projectTitle: '', description: '', researchArea: '', groupMembers: '' });
      setSimilarityCheck(null);
      setShowSupervisors(false);
      setSelectedSupervisor(null);
      setDescriptionType('text');
      setDescriptionFile(null);
      setDescriptionFileName('');
      setTimeout(() => setActivePage('my-proposal'), 1500);
    } catch (err) {
      showToast('Error', err.message);
    }
  };

  // ── Submit logbook to Firestore ───────────────────────────
  const handleLogbookSubmit = async (e) => {
    e.preventDefault();
    if (!logbookForm.weekNo) { showToast('Error', 'Please select a week number.'); return; }
    if (!proposal)           { showToast('Error', 'You need an active proposal before submitting logbooks.'); return; }

    const usedWeeks = logbooks.map(l => String(l.weekNo));
    if (usedWeeks.includes(String(logbookForm.weekNo))) {
      showToast('Duplicate Week', `A logbook for Week ${logbookForm.weekNo} already exists.`);
      return;
    }

    try {
      await submitLogbook({
        proposalId         : proposal.id,
        studentId          : currentUser.uid,
        studentName        : currentUser.fullName,
        studentNumber      : currentUser.idNumber,
        supervisorId       : proposal.supervisorId,
        supervisorName     : proposal.supervisorName,
        projectTitle       : proposal.title,
        weekNo             : parseInt(logbookForm.weekNo),
        meetingNo          : parseInt(logbookForm.meetingNo) || 1,
        term               : logbookForm.term,
        dateRange          : getWeekDateRange(parseInt(logbookForm.weekNo)),
        workDone           : logbookForm.workDone.filter(Boolean),
        recordOfDiscussion : logbookForm.recordOfDiscussion.filter(Boolean),
        problemsEncountered: logbookForm.problemsEncountered.filter(Boolean),
        furtherNotes       : logbookForm.furtherNotes,
      });

      // Notify supervisor
      await pushNotification(
        proposal.supervisorId,
        `New Logbook Submitted — Week ${logbookForm.weekNo}`,
        `${currentUser.fullName} submitted Week ${logbookForm.weekNo} logbook for "${proposal.title}".`,
        'info'
      );

      showToast('Logbook Submitted', `Week ${logbookForm.weekNo} sent to ${proposal.supervisorName} for review.`);

      // Reset form
      setLogbookForm({
        weekNo: '', meetingNo: '', term: '',
        workDone: ['', '', '', '', '', ''],
        recordOfDiscussion: ['', '', '', '', '', '', ''],
        problemsEncountered: ['', '', '', '', '', '', ''],
        furtherNotes: '',
      });
      setTimeout(() => setActivePage('logbooks'), 1200);
    } catch (err) {
      showToast('Error', err.message);
    }
  };

  // ── Computed ──────────────────────────────────────────────
  const approvedCount  = logbooks.filter(l => l.status === 'approved').length;
  const pendingCount   = logbooks.filter(l => l.status === 'pending').length;
  const approvalRate   = logbooks.length > 0 ? Math.round((approvedCount / logbooks.length) * 100) : 0;
  const progressPercent= Math.round((logbooks.length / 16) * 100);
  const usedWeeks      = logbooks.map(l => String(l.weekNo));
  const weeks          = Array.from({ length: 16 }, (_, i) => i + 1);
  const unreadCount    = notifications.filter(n => !n.read).length;

  // ── Supervisor cards ──────────────────────────────────────
  const renderSupervisorCards = () =>
    matchedSupervisors.map((sup, index) => {
      const load    = (sup.currentGroups || 0);
      const max     = (sup.maxCapacity  || 4);
      const pct     = Math.round((load / max) * 100);
      const isSelected = selectedSupervisor?.id === sup.id;
      return (
        <div
          key={sup.id}
          className={`supervisor-card ${isSelected ? 'selected' : ''}`}
          onClick={() => setSelectedSupervisor(sup)}
        >
          <div className="supervisor-header">
            <div>
              <div className="supervisor-name">
                <span className="icon">👨‍🏫</span> {sup.name}
              </div>
            </div>
            {index === 0 && <span className="recommended-badge">⭐ Best Match</span>}
          </div>
          <div className="supervisor-meta">
            <strong>Expertise:</strong> {(sup.researchAreas || []).slice(0, 3).join(', ')}<br />
            <strong>Match Score:</strong> {sup.calculatedMatch}% compatibility<br />
            <strong>Current Load:</strong> {load}/{max} groups
          </div>
          <div className="capacity-indicator">
            <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: 60 }}>Capacity:</span>
            <div className="capacity-bar">
              <div className="capacity-fill" style={{ width: `${pct}%` }} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{load}/{max}</span>
          </div>
        </div>
      );
    });

  // ─────────────────────────────────────────────────────────
  return (
    <div className="dashboard-container">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">📚</div>
            <div className="sidebar-logo-text">
              <h2>WIL Monitor</h2>
              <p>Student Portal</p>
            </div>
          </div>
          <div className="user-profile">
            <div className="user-avatar">
              {currentUser?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
            </div>
            <div className="user-info">
              <h4>{currentUser?.fullName || 'Student'}</h4>
              <p>ID: {currentUser?.idNumber || '—'}</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Main Menu</div>
            {[
              { id: 'overview',     icon: '📊', label: 'Overview' },
              { id: 'proposal',     icon: '📋', label: 'Submit Proposal' },
              { id: 'my-proposal',  icon: '📄', label: 'My Proposal' },
              { id: 'new-logbook',  icon: '➕', label: 'New Logbook' },
              { id: 'logbooks',     icon: '📝', label: 'My Logbooks', badge: logbooks.length },
              { id: 'notifications',icon: '🔔', label: 'Notifications', badge: unreadCount },
            ].map(item => (
              <div
                key={item.id}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => setActivePage(item.id)}
              >
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#fff', color: 'var(--bg-primary)', fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: '99px' }}>
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="nav-section">
            <div className="nav-section-title">Account</div>
            <div className={`nav-item ${activePage === 'profile' ? 'active' : ''}`} onClick={() => setActivePage('profile')}>
              <span className="icon">👤</span><span>Profile</span>
            </div>
          </div>
        </nav>

        <div className="logout-section">
          <button className="btn btn-logout" onClick={onLogout}>
            <span>🚪</span><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content">

        {/* ══ OVERVIEW ══ */}
        <div className={`page-content ${activePage === 'overview' ? 'active' : ''}`}>
          <div className="content-header">
            <h1>Dashboard Overview</h1>
            <p>Track your project progress and submissions</p>
          </div>

          {!proposal && (
            <div className="alert alert-warn" style={{ background: '#354649', borderLeft: '4px solid #e65100', padding: '1rem 1.25rem', borderRadius: 10, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <strong>⚡ Action Required:</strong> You haven't submitted a project proposal yet.{' '}
              <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setActivePage('proposal')}>Submit one now →</span>
            </div>
          )}

          <div className="stats-grid">
            {[
              { value: proposal ? 1 : 0, label: 'Active Project',       trend: proposal?.title || 'No proposal yet', icon: '📋' },
              { value: logbooks.length,  label: 'Logbooks Submitted',    trend: 'Out of 16 weeks',                    icon: '📝' },
              { value: approvedCount,    label: 'Approved Entries',      trend: logbooks.length > 0 ? `${approvalRate}% approval rate` : 'No entries yet', icon: '✅' },
              { value: pendingCount,     label: 'Pending Review',        trend: 'Awaiting feedback',                  icon: '⏳' },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-header">
                  <div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-trend">{s.trend}</div>
                  </div>
                  <div className="stat-icon">{s.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {proposal && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Project Information</h2>
                <button className="btn btn-outline btn-sm" onClick={() => setActivePage('my-proposal')}>View Details</button>
              </div>
              <div className="table-container">
                <table><tbody>
                  <tr><th style={{ width: 200 }}>PROJECT TITLE</th><td>{proposal.title}</td></tr>
                  <tr><th>SUPERVISOR</th><td>{proposal.supervisorName}</td></tr>
                  <tr><th>STATUS</th><td><span className={`badge badge-${proposal.status}`}>{proposal.status}</span></td></tr>
                  <tr><th>GROUP MEMBERS</th><td>{proposal.groupMembers || 'Not specified'}</td></tr>
                  <tr>
                    <th>PROGRESS</th>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ flex: 1 }}><div className="progress-bar"><div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div></div>
                        <span style={{ fontWeight: 700 }}>{progressPercent}%</span>
                      </div>
                    </td>
                  </tr>
                </tbody></table>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Logbook Entries</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setActivePage('new-logbook')}>+ New Entry</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {logbooks.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📝</span>
                  <h3>No logbook entries yet</h3>
                  <p>Start submitting your weekly logbooks to track your progress.</p>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={() => setActivePage('new-logbook')}>Submit First Logbook</button>
                </div>
              ) : (
                <div className="entries-list">
                  {logbooks.slice(0, 3).map(lb => (
                    <div key={lb.id} className={`entry-card ${lb.status}`}>
                      <div className="entry-header">
                        <div className="entry-meta"><span>📅 Week {lb.weekNo}</span></div>
                        <span className={`badge badge-${lb.status}`}>{lb.status}</span>
                      </div>
                      <h3 className="entry-title">{lb.workDone?.[0] || `Week ${lb.weekNo} Entry`}</h3>
                      <div className="entry-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => { setViewingLogbook(lb); setActivePage('view-logbook'); }}>View Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ SUBMIT PROPOSAL ══ */}
        <div className={`page-content ${activePage === 'proposal' ? 'active' : ''}`}>
          <div className="content-header">
            <h1>Submit Project Proposal</h1>
            <p>Submit your proposal with automatic duplicate detection and supervisor matching</p>
          </div>

          {proposal && (
            <div className="alert alert-warn" style={{ background: '#354649', borderLeft: '4px solid #e65100', padding: '1rem 1.25rem', borderRadius: 10, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <strong>⚠️ You already have a submitted proposal.</strong> Submitting again will create a new one.
            </div>
          )}

          <div className="card">
            <div className="card-header"><h2 className="card-title">Project Proposal Form</h2></div>
            <div className="card-content">
              <form onSubmit={handleProposalSubmit}>

                {/* Title */}
                <div className="form-group">
                  <label className="form-label">PROJECT TITLE *</label>
                  <input
                    type="text" className="form-control"
                    placeholder="Enter your project title"
                    value={proposalData.projectTitle}
                    onChange={e => { setProposalData({ ...proposalData, projectTitle: e.target.value }); setSimilarityCheck(null); setShowSupervisors(false); }}
                    required
                  />
                  {similarityCheck && (
                    <div className={`alert alert-${similarityCheck.type}`} style={{ marginTop: '1rem' }}>
                      <strong>{similarityCheck.message}</strong>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">PROJECT DESCRIPTION *</label>
                  <div style={{ marginBottom: '1rem', display: 'flex', gap: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="radio" name="descType" checked={descriptionType === 'text'} onChange={() => { setDescriptionType('text'); setDescriptionFile(null); setDescriptionFileName(''); }} />
                      Type description
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="radio" name="descType" checked={descriptionType === 'file'} onChange={() => setDescriptionType('file')} />
                      Upload document (PDF/Word)
                    </label>
                  </div>
                  {descriptionType === 'text' ? (
                    <textarea className="form-control" rows={6} placeholder="Objectives, methodology, expected outcomes, technologies..."
                      value={proposalData.description}
                      onChange={e => setProposalData({ ...proposalData, description: e.target.value })}
                      required
                    />
                  ) : (
                    <div>
                      <input type="file" accept=".pdf,.doc,.docx"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) { showToast('Error', 'File too large (max 5MB)'); e.target.value = ''; return; }
                            setDescriptionFile(file); setDescriptionFileName(file.name);
                          }
                        }}
                        required
                      />
                      {descriptionFileName && <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#4caf50' }}>Selected: {descriptionFileName}</p>}
                    </div>
                  )}
                </div>

                {/* Research area */}
                <div className="form-group">
                  <label className="form-label">RESEARCH AREA *</label>
                  <select className="form-control" value={proposalData.researchArea}
                    onChange={e => { setProposalData({ ...proposalData, researchArea: e.target.value }); setSimilarityCheck(null); setShowSupervisors(false); }}
                    required
                  >
                    <option value="">Select research area...</option>
                    <option value="web">Web Development</option>
                    <option value="mobile">Mobile Applications</option>
                    <option value="ml">Machine Learning & AI</option>
                    <option value="database">Database Systems</option>
                    <option value="security">Network Security / Blockchain</option>
                    <option value="cloud">Cloud Computing</option>
                    <option value="iot">Internet of Things (IoT)</option>
                    <option value="erp">ERP / Business Analytics</option>
                  </select>
                </div>

                {/* Group members */}
                <div className="form-group">
                  <label className="form-label">GROUP MEMBERS (Student Numbers, comma separated)</label>
                  <input type="text" className="form-control"
                    placeholder="e.g. 901015219, 901015004, 901014942"
                    value={proposalData.groupMembers}
                    onChange={e => setProposalData({ ...proposalData, groupMembers: e.target.value })}
                  />
                </div>

                {/* Supervisor selection */}
                {showSupervisors && (
                  <div id="supervisorSelection">
                    <div style={{ margin: '2rem 0', padding: '1.5rem', background: '#fafafa', borderRadius: 12, borderLeft: '4px solid #000' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#000' }}>🎓 Select Your Supervisor</h3>
                      <p style={{ color: '#666', fontSize: '0.95rem' }}>Based on your research area, we've matched and ranked available supervisors. The top match is pre-selected.</p>
                    </div>
                    <div className="form-group">
                      <label className="form-label">RECOMMENDED SUPERVISORS (Ranked by Expertise Match)</label>
                      <div className="entries-list">{renderSupervisorCards()}</div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setActivePage('overview')}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={checkDuplicateAndMatch}>Check &amp; Match Supervisor</button>
                  {showSupervisors && (
                    <button type="submit" className="btn btn-primary">Submit Proposal</button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* ══ MY PROPOSAL ══ */}
        <div className={`page-content ${activePage === 'my-proposal' ? 'active' : ''}`}>
          <div className="content-header"><h1>My Proposal Status</h1><p>Track your proposal approval workflow</p></div>
          {!proposal ? (
            <div className="card"><div className="card-content">
              <div className="empty-state">
                <span className="empty-icon">📄</span>
                <h3>No proposal submitted yet</h3>
                <p>Submit a project proposal to see its status here.</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={() => setActivePage('proposal')}>Submit Proposal</button>
              </div>
            </div></div>
          ) : (
            <>
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Proposal Approval Workflow</h2>
                  <span className={`badge badge-${proposal.status}`}>{proposal.status}</span>
                </div>
                <div className="entries-list" style={{ padding: '1.5rem' }}>
                  {(proposal.steps || []).map((step, i) => (
                    <div key={i} className={`entry-card ${step.done ? 'approved' : 'pending'}`}>
                      <div className="entry-header">
                        <div className="entry-meta"><span>Step {i + 1}</span>{step.time && <span>🕒 {step.time}</span>}</div>
                        <span className={`badge ${step.done ? 'badge-approved' : 'badge-pending'}`}>{step.done ? '✓ Done' : 'Pending'}</span>
                      </div>
                      <h3 className="entry-title">{step.label}</h3>
                      <p className="entry-text">{step.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ margin: '0 0 2rem', padding: '1.5rem', background: '#fafafa', borderRadius: 12, border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Proposal Details</h3>
                <table style={{ width: '100%' }}><tbody>
                  <tr><td style={{ padding: '0.5rem 0', fontWeight: 600, width: 200 }}>Title:</td><td>{proposal.title}</td></tr>
                  <tr><td style={{ padding: '0.5rem 0', fontWeight: 600 }}>Research Area:</td><td>{proposal.researchArea}</td></tr>
                  <tr><td style={{ padding: '0.5rem 0', fontWeight: 600 }}>Supervisor:</td><td>{proposal.supervisorName}</td></tr>
                  <tr><td style={{ padding: '0.5rem 0', fontWeight: 600 }}>Group Members:</td><td>{proposal.groupMembers || 'Not specified'}</td></tr>
                </tbody></table>
              </div>

              {proposal.supervisorFeedback && (
                <div style={{ background: '#ffebee', borderLeft: '4px solid #c62828', padding: '1rem 1.25rem', borderRadius: 10 }}>
                  <strong>💬 Supervisor Feedback:</strong> {proposal.supervisorFeedback}
                </div>
              )}
            </>
          )}
        </div>

        {/* ══ NEW LOGBOOK ══ */}
        <div className={`page-content ${activePage === 'new-logbook' ? 'active' : ''}`}>
          <div className="content-header"><h1>Submit Weekly Logbook</h1><p>Record your weekly progress</p></div>

          {!proposal && (
            <div className="alert alert-danger" style={{ background: '#354649', borderLeft: '4px solid #e65100', padding: '1rem 1.25rem', borderRadius: 10, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <strong>⚠️ No active project.</strong> You need a submitted proposal before submitting logbooks.{' '}
              <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setActivePage('proposal')}>Submit a proposal first.</span>
            </div>
          )}

          <div className="card">
            <div className="card-header"><h2 className="card-title">Logbook Entry Form</h2></div>
            <div className="card-content">
              <form onSubmit={handleLogbookSubmit}>
                {/* Meeting info */}
                <div className="logbook-section">
                  <div className="logbook-section-title">Meeting Information</div>
                  <div className="logbook-meta-grid">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Student's Full Name</label>
                      <input className="form-control" value={currentUser?.fullName || ''} readOnly />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Student Number</label>
                      <input className="form-control" value={currentUser?.idNumber || ''} readOnly />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Supervisor</label>
                      <input className="form-control" value={proposal?.supervisorName || 'Not yet assigned'} readOnly />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Project Title</label>
                      <input className="form-control" value={proposal?.title || 'No active project'} readOnly />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Meeting No.</label>
                      <input type="text" className="form-control" placeholder="e.g. 3"
                        value={logbookForm.meetingNo}
                        onChange={e => setLogbookForm(p => ({ ...p, meetingNo: e.target.value }))}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Term</label>
                      <select className="form-control" value={logbookForm.term}
                        onChange={e => setLogbookForm(p => ({ ...p, term: e.target.value }))}>
                        <option value="">Select term...</option>
                        <option value="Term 1">Term 1</option>
                        <option value="Term 2">Term 2</option>
                        <option value="Term 3">Term 3</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Week selector */}
                <div className="logbook-section">
                  <div className="logbook-section-title">Circle Week Number *</div>
                  <div className="logbook-week-selector">
                    {weeks.map(w => (
                      <button key={w} type="button"
                        className={`week-circle ${logbookForm.weekNo === String(w) ? 'selected' : ''} ${usedWeeks.includes(String(w)) ? 'used' : ''}`}
                        onClick={() => !usedWeeks.includes(String(w)) && setLogbookForm(p => ({ ...p, weekNo: String(w) }))}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                  {logbookForm.weekNo && (
                    <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      📅 Date range: <strong>{getWeekDateRange(parseInt(logbookForm.weekNo))}</strong>
                    </p>
                  )}
                </div>

                {/* Work done */}
                <div className="logbook-section">
                  <div className="logbook-section-title">Work Done (since last meeting)</div>
                  <div className="logbook-items-list">
                    {logbookForm.workDone.map((val, idx) => (
                      <div key={idx} className="logbook-item-row">
                        <div className="logbook-item-number">{idx + 1}</div>
                        <input className="logbook-item-input" type="text" placeholder={`Work item ${idx + 1}...`}
                          value={val} onChange={e => updateArrayField('workDone', idx, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Record of discussion */}
                <div className="logbook-section">
                  <div className="logbook-section-title">Record of Discussion</div>
                  <div className="logbook-items-list">
                    {logbookForm.recordOfDiscussion.map((val, idx) => (
                      <div key={idx} className="logbook-item-row">
                        <div className="logbook-item-number">{idx + 1}</div>
                        <input className="logbook-item-input" type="text" placeholder={`Discussion point ${idx + 1}...`}
                          value={val} onChange={e => updateArrayField('recordOfDiscussion', idx, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Problems */}
                <div className="logbook-section">
                  <div className="logbook-section-title">Problems Encountered</div>
                  <div className="logbook-items-list">
                    {logbookForm.problemsEncountered.map((val, idx) => (
                      <div key={idx} className="logbook-item-row">
                        <div className="logbook-item-number">{idx + 1}</div>
                        <input className="logbook-item-input" type="text" placeholder={`Problem ${idx + 1}...`}
                          value={val} onChange={e => updateArrayField('problemsEncountered', idx, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Further notes */}
                <div className="logbook-section">
                  <div className="logbook-section-title">Further Notes</div>
                  <textarea className="form-control" style={{ minHeight: 90 }}
                    placeholder="Any additional notes..."
                    value={logbookForm.furtherNotes}
                    onChange={e => setLogbookForm(p => ({ ...p, furtherNotes: e.target.value }))}
                  />
                </div>

                <div className="logbook-signature-row">
                  <div className="logbook-signature-box"><div className="logbook-signature-line" /><div className="logbook-signature-label">Supervisor's Signature</div></div>
                  <div className="logbook-signature-box"><div className="logbook-signature-line" /><div className="logbook-signature-label">Student's Signature</div></div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setActivePage('overview')}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={!proposal}>Submit Logbook</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* ══ MY LOGBOOKS ══ */}
        <div className={`page-content ${activePage === 'logbooks' ? 'active' : ''}`}>
          <div className="content-header"><h1>All Logbook Entries</h1><p>View and manage your submissions</p></div>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Entry History</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setActivePage('new-logbook')}>+ New Entry</button>
            </div>
            {logbooks.length === 0 ? (
              <div className="card-content"><div className="empty-state"><span className="empty-icon">📝</span><h3>No logbooks submitted yet</h3></div></div>
            ) : (
              <div style={{ overflowX: 'auto', padding: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      {['WEEK', 'DATE RANGE', 'WORK DONE (SUMMARY)', 'STATUS', 'SUBMITTED', 'ACTIONS'].map(h => (
                        <th key={h} style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.875rem' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logbooks.map(lb => (
                      <tr key={lb.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem' }}><strong>Week {lb.weekNo}</strong></td>
                        <td style={{ padding: '1rem' }}>{lb.dateRange}</td>
                        <td style={{ padding: '1rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lb.workDone?.[0] || '—'}</td>
                        <td style={{ padding: '1rem' }}><span className={`badge badge-${lb.status}`}>{lb.status}</span></td>
                        <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{lb.submittedAt ? new Date(lb.submittedAt).toLocaleDateString('en-GB') : '—'}</td>
                        <td style={{ padding: '1rem' }}>
                          <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            onClick={() => { setViewingLogbook(lb); setActivePage('view-logbook'); }}>View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ══ VIEW LOGBOOK ══ */}
        <div className={`page-content ${activePage === 'view-logbook' ? 'active' : ''}`}>
          {viewingLogbook && (
            <>
              <div className="content-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setActivePage('logbooks')}>← Back</button>
                <div>
                  <h1>Logbook — Week {viewingLogbook.weekNo}</h1>
                  <p>{viewingLogbook.dateRange}</p>
                </div>
              </div>
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Entry Details</h2>
                  <span className={`badge badge-${viewingLogbook.status}`}>{viewingLogbook.status}</span>
                </div>
                <div className="card-content">
                  <div className="logbook-section">
                    <div className="logbook-section-title">Meeting Information</div>
                    <div className="logbook-meta-grid">
                      <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>STUDENT</strong><p style={{ marginTop: 4 }}>{viewingLogbook.studentName}</p></div>
                      <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>STUDENT ID</strong><p style={{ marginTop: 4 }}>{viewingLogbook.studentNumber}</p></div>
                      <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SUPERVISOR</strong><p style={{ marginTop: 4 }}>{viewingLogbook.supervisorName}</p></div>
                      <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PROJECT</strong><p style={{ marginTop: 4 }}>{viewingLogbook.projectTitle}</p></div>
                      <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>MEETING NO.</strong><p style={{ marginTop: 4 }}>{viewingLogbook.meetingNo}</p></div>
                      <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TERM</strong><p style={{ marginTop: 4 }}>{viewingLogbook.term || '—'}</p></div>
                    </div>
                  </div>
                  {['workDone', 'recordOfDiscussion', 'problemsEncountered'].map(field => (
                    viewingLogbook[field]?.length > 0 && (
                      <div key={field} className="logbook-section">
                        <div className="logbook-section-title">{field === 'workDone' ? 'Work Done' : field === 'recordOfDiscussion' ? 'Record of Discussion' : 'Problems Encountered'}</div>
                        <div className="logbook-items-list">
                          {viewingLogbook[field].map((item, i) => (
                            <div key={i} className="logbook-item-row">
                              <div className="logbook-item-number">{i + 1}</div>
                              <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                  {viewingLogbook.furtherNotes && (
                    <div className="logbook-section">
                      <div className="logbook-section-title">Further Notes</div>
                      <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{viewingLogbook.furtherNotes}</p>
                    </div>
                  )}
                  {viewingLogbook.digitalApproval && (
                    <div className="digital-approval-stamp">
                      <div className="digital-approval-icon">🔐</div>
                      <div>
                        <strong>Digitally Approved</strong>
                        <p>By {viewingLogbook.digitalApproval.approvedBy} · {viewingLogbook.digitalApproval.timestamp}</p>
                      </div>
                    </div>
                  )}
                  {viewingLogbook.supervisorFeedback && (
                    <div style={{ background: '#ffebee', borderLeft: '4px solid #c62828', padding: '1rem 1.25rem', borderRadius: 10, marginTop: '1rem' }}>
                      <strong>💬 Supervisor Feedback:</strong> {viewingLogbook.supervisorFeedback}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ══ NOTIFICATIONS ══ */}
        <div className={`page-content ${activePage === 'notifications' ? 'active' : ''}`}>
          <div className="content-header"><h1>Notifications</h1><p>System alerts and activity updates</p></div>
          <div className="card">
            <div style={{ padding: '1.5rem' }}>
              {notifications.length === 0 ? (
                <div className="empty-state"><span className="empty-icon">🔔</span><h3>No notifications yet</h3></div>
              ) : (
                <div className="entries-list">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`entry-card ${n.type === 'success' ? 'approved' : n.type === 'danger' ? 'rejected' : 'pending'}`}
                      style={{ opacity: n.read ? 0.6 : 1, cursor: 'pointer' }}
                      onClick={() => !n.read && markNotificationRead(n.id)}
                    >
                      <div className="entry-header">
                        <div className="entry-meta">
                          <span>✉️ System</span>
                          {!n.read && <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 99, fontWeight: 700 }}>NEW</span>}
                        </div>
                      </div>
                      <h3 className="entry-title">{n.title}</h3>
                      <p className="entry-text">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ PROFILE ══ */}
        <div className={`page-content ${activePage === 'profile' ? 'active' : ''}`}>
          <div className="content-header"><h1>My Profile</h1></div>
          <div className="card">
            <div className="card-header"><h2 className="card-title">Personal Information</h2></div>
            <div className="card-content">
              <div className="form-row">
                <div className="form-group"><label className="form-label">FULL NAME</label><input className="form-control" value={currentUser?.fullName || ''} readOnly /></div>
                <div className="form-group"><label className="form-label">STUDENT NUMBER</label><input className="form-control" value={currentUser?.idNumber || ''} readOnly /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">EMAIL</label><input className="form-control" value={currentUser?.email || ''} readOnly /></div>
                <div className="form-group"><label className="form-label">PROGRAMME</label><input className="form-control" value={currentUser?.program || ''} readOnly /></div>
              </div>
              <div className="form-group"><label className="form-label">FACULTY</label><input className="form-control" value={currentUser?.faculty || ''} readOnly /></div>
            </div>
          </div>
          {proposal && (
            <div className="card">
              <div className="card-header"><h2 className="card-title">Academic Summary</h2></div>
              <div className="table-container"><table><tbody>
                <tr><th style={{ width: 200 }}>PROJECT</th><td>{proposal.title}</td></tr>
                <tr><th>SUPERVISOR</th><td>{proposal.supervisorName}</td></tr>
                <tr><th>LOGBOOKS SUBMITTED</th><td>{logbooks.length} / 16</td></tr>
                <tr><th>APPROVED ENTRIES</th><td>{approvedCount}</td></tr>
              </tbody></table></div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default StudentDashboard;