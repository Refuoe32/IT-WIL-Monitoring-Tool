import React, { useState, useEffect } from 'react';
import '../../styles/styles.css';

import {
  listenAllProposals,
  listenAllLogbooks,
  listenNotifications,
  pushNotification,
  markNotificationRead,
  getAllSupervisors,
  getSettings,
  saveSettings,
  activateProposal,
  coordinatorRejectProposal,
} from '../../api/api';



const CoordinatorDashboard = ({ onLogout, showToast, currentUser }) => {
  const [activePage, setActivePage]   = useState('overview');
  const [proposals, setProposals]     = useState([]);
  const [logbooks, setLogbooks]       = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings]       = useState({
    maxSupervisionLimit : 4,
    similarityThreshold : 70,
    logbookDeadline     : 'Friday 17:00',
    autoAssignment      : true,
    emailNotifications  : true,
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [viewingProposal, setViewingProposal] = useState(null);
  const [viewingLogbook, setViewingLogbook]   = useState(null);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('all');


  // ── Real-time listeners ───────────────────────────────────
  useEffect(() => {
    if (!currentUser?.uid) return;

    getAllSupervisors().then(setSupervisors);
    getSettings().then(s => s && setSettings(s));

    const unsubProposals = listenAllProposals(setProposals);
    const unsubLogbooks  = listenAllLogbooks(setLogbooks);
    const unsubNotifs    = listenNotifications(currentUser.uid, setNotifications);

    return () => { unsubProposals(); unsubLogbooks(); unsubNotifs(); };
  }, [currentUser?.uid]);

  // ── Computed ──────────────────────────────────────────────
  const unreadCount         = notifications.filter(n => !n.read).length;
  const pendingProposals    = proposals.filter(p => p.status === 'pending');
  const forwardedProposals  = proposals.filter(p => p.forwardedToCoordinator && p.status === 'approved');
  const activatedProposals  = proposals.filter(p => p.status === 'activated');
  const flaggedProposals    = proposals.filter(p => p.status === 'flagged');
  const pendingLogbooks     = logbooks.filter(l => l.status === 'pending');
  const approvedLogbooks    = logbooks.filter(l => l.status === 'approved');

  // ── Filtered proposals for table ──────────────────────────
  const filteredProposals = proposals.filter(p => {
    const matchSearch = !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.supervisorName?.toLowerCase().includes(search.toLowerCase()) ||
      p.groupMembers?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Activate a forwarded proposal ─────────────────────────
  const handleActivateProposal = async (proposalId) => {
    const p = proposals.find(p => p.id === proposalId);
    if (!p) return;
    try {
      await activateProposal(proposalId, currentUser.fullName);
      await pushNotification(
        p.submittedBy,
        '🎉 Project Activated!',
        `Your project "${p.title}" has been officially activated by the WIL Coordinator. You may now proceed with full WIL activities.`,
        'success'
      );
      await pushNotification(
        p.supervisorId,
        'Project Activated',
        `The project "${p.title}" has been activated by the coordinator. Supervision may proceed officially.`,
        'info'
      );
      showToast('Project Activated', `"${p.title}" is now live.`);
      setViewingProposal(null);
    } catch (err) { showToast('Error', err.message); }
  };

  // ── Reject a forwarded proposal ───────────────────────────
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectFeedback, setRejectFeedback] = useState('');

  const handleRejectProposal = async () => {
    if (!rejectFeedback.trim() || !rejectModal) return;
    const p = proposals.find(p => p.id === rejectModal);
    if (!p) return;
    try {
      await coordinatorRejectProposal(rejectModal, rejectFeedback.trim(), currentUser.fullName);
      await pushNotification(
        p.submittedBy,
        'Proposal Rejected by Coordinator',
        `The coordinator rejected your proposal "${p.title}": ${rejectFeedback.trim()}`,
        'danger'
      );
      await pushNotification(
        p.supervisorId,
        'Proposal Rejected by Coordinator',
        `The coordinator rejected "${p.title}". Please advise the student.`,
        'danger'
      );
      showToast('Proposal Rejected', 'Student and supervisor notified.');
      setRejectModal(null);
      setRejectFeedback('');
      setViewingProposal(null);
    } catch (err) { showToast('Error', err.message); }
  };

  // ── Save settings ─────────────────────────────────────────
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await saveSettings(settings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
      showToast('Settings Saved', 'System settings updated successfully.');
    } catch (err) { showToast('Error', err.message); }
  };

  // ── Supervisor stats ──────────────────────────────────────
  const getSupervisorStats = (sup) => {
    const supProposals = proposals.filter(p => p.supervisorId === sup.id);
    const supLogbooks  = logbooks.filter(l => l.supervisorId === sup.id);
    return {
      assigned  : supProposals.length,
      approved  : supProposals.filter(p => p.status === 'approved' || p.status === 'activated').length,
      logbooks  : supLogbooks.length,
      pending   : supLogbooks.filter(l => l.status === 'pending').length,
    };
  };

  // ─────────────────────────────────────────────────────────
  return (
    <div className="dashboard-container">

      {/* ── REJECT MODAL ── */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Proposal</h3>
              <button className="modal-close" onClick={() => setRejectModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Provide a reason for rejection. Both the student and supervisor will be notified.
              </p>
              <label className="form-label">Reason for Rejection *</label>
              <textarea
                className="form-control"
                style={{ minHeight: 120, marginTop: '0.5rem' }}
                placeholder="Explain why this proposal cannot be approved at this stage..."
                value={rejectFeedback}
                onChange={e => setRejectFeedback(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn btn-reject" onClick={handleRejectProposal} disabled={!rejectFeedback.trim()}>
                Reject &amp; Notify Both Parties
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🏛️</div>
            <div className="sidebar-logo-text"><h2>WIL Monitor</h2><p>Coordinator Portal</p></div>
          </div>
          <div className="user-profile">
            <div className="user-avatar">
              {currentUser?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CO'}
            </div>
            <div className="user-info">
              <h4>{currentUser?.fullName || 'Coordinator'}</h4>
              <p>WIL Coordinator</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Management</div>
            {[
              { id: 'overview',     icon: '📊', label: 'Overview' },
              { id: 'proposals',    icon: '📋', label: 'All Proposals',
                badge: forwardedProposals.length },
              { id: 'logbooks',     icon: '📝', label: 'All Logbooks',
                badge: pendingLogbooks.length },
              { id: 'supervisors',  icon: '👨‍🏫', label: 'Supervisors' },
              { id: 'reports',      icon: '📈', label: 'Reports & Analytics' },
              { id: 'settings',     icon: '⚙️',  label: 'System Settings' },
              { id: 'notifications',icon: '🔔',  label: 'Notifications',
                badge: unreadCount },
            ].map(item => (
              <div
                key={item.id}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => { setActivePage(item.id); setViewingProposal(null); setViewingLogbook(null); }}
              >
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#fff', color: 'var(--bg-primary)', fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
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
            <h1>Coordinator Dashboard</h1>
            <p>Full system overview — Faculty of Information &amp; Communication Technology</p>
          </div>

          {forwardedProposals.length > 0 && (
            <div style={{ background: '#fff3e0', borderLeft: '4px solid #e65100', padding: '1rem 1.25rem', borderRadius: 10, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <strong>⚡ Action Required:</strong>{' '}
              {forwardedProposals.length} proposal(s) forwarded by supervisors await your final activation.{' '}
              <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setActivePage('proposals')}>
                Review now →
              </span>
            </div>
          )}

          <div className="stats-grid">
            {[
              { value: proposals.length,         label: 'Total Proposals',     trend: `${pendingProposals.length} pending · ${flaggedProposals.length} flagged`, icon: '📋' },
              { value: activatedProposals.length, label: 'Active Projects',     trend: 'Fully activated',                      icon: '✅' },
              { value: forwardedProposals.length, label: 'Awaiting Activation', trend: 'Forwarded by supervisors',              icon: '⏳' },
              { value: logbooks.length,           label: 'Total Logbooks',      trend: `${approvedLogbooks.length} approved · ${pendingLogbooks.length} pending`, icon: '📝' },
              { value: supervisors.length,        label: 'Supervisors',         trend: `${supervisors.filter(s => s.currentGroups < s.maxCapacity).length} with available capacity`, icon: '👨‍🏫' },
              { value: flaggedProposals.length,   label: 'Flagged (Duplicate)', trend: 'High similarity detected',             icon: '⚠️' },
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

          {/* Forwarded proposals quick view */}
          {forwardedProposals.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Proposals Awaiting Final Activation</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setActivePage('proposals')}>View All</button>
              </div>
              <div className="entries-list" style={{ padding: '1.5rem' }}>
                {forwardedProposals.slice(0, 3).map(p => (
                  <div key={p.id} className="entry-card approved">
                    <div className="entry-header">
                      <div className="entry-meta"><span>📋 Supervisor Approved</span></div>
                      <span className="badge" style={{ background: '#e3f2fd', color: '#1565c0' }}>Awaiting Activation</span>
                    </div>
                    <h3 className="entry-title">{p.title}</h3>
                    <p className="entry-text"><strong>Supervisor:</strong> {p.supervisorName} · <strong>Members:</strong> {p.groupMembers || 'N/A'}</p>
                    <div className="entry-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => { setViewingProposal(p); setActivePage('proposals'); }}>Review</button>
                      <button className="btn btn-approve btn-sm" onClick={() => handleActivateProposal(p.id)}>🚀 Activate Project</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supervisor load overview */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Supervisor Capacity Overview</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setActivePage('supervisors')}>Full View</button>
            </div>
            <div style={{ overflowX: 'auto', padding: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {['SUPERVISOR', 'GROUPS', 'CAPACITY', 'LOAD'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.875rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {supervisors.map(sup => {
                    const load = (sup.currentGroups || 0);
                    const max  = (sup.maxCapacity || 4);
                    const pct  = Math.round((load / max) * 100);
                    return (
                      <tr key={sup.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{sup.name}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{load}/{max}</td>
                        <td style={{ padding: '0.75rem 1rem', minWidth: 160 }}>
                          <div className="capacity-bar">
                            <div className="capacity-fill" style={{ width: `${pct}%`, background: pct >= 100 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#22c55e' }} />
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`badge ${pct >= 100 ? 'badge-rejected' : pct >= 75 ? 'badge-pending' : 'badge-approved'}`}>
                            {pct >= 100 ? 'Full' : pct >= 75 ? 'Near Full' : 'Available'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ══ ALL PROPOSALS ══ */}
        <div className={`page-content ${activePage === 'proposals' ? 'active' : ''}`}>
          {viewingProposal ? (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Proposal Detail</h2>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span className={`badge badge-${viewingProposal.status}`}>{viewingProposal.status}</span>
                  {viewingProposal.forwardedToCoordinator && (
                    <span className="badge" style={{ background: '#e3f2fd', color: '#1565c0' }}>Forwarded by Supervisor</span>
                  )}
                </div>
              </div>
              <div className="card-content">
                <table style={{ width: '100%', marginBottom: '1.5rem' }}><tbody>
                  {[
                    ['TITLE',         viewingProposal.title],
                    ['RESEARCH AREA', viewingProposal.researchArea],
                    ['GROUP MEMBERS', viewingProposal.groupMembers || 'Not specified'],
                    ['SUPERVISOR',    viewingProposal.supervisorName || 'Not assigned'],
                    ['SIMILARITY',    `${viewingProposal.similarityScore || 0}%`],
                  ].map(([k, v]) => (
                    <tr key={k}><td style={{ padding: '0.5rem 0', fontWeight: 600, width: 180, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{k}</td><td>{v}</td></tr>
                  ))}
                </tbody></table>

                <div className="logbook-section">
                  <div className="logbook-section-title">Description</div>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>{viewingProposal.description}</p>
                </div>

                {viewingProposal.supervisorApproval && (
                  <div className="digital-approval-stamp">
                    <div className="digital-approval-icon">👨‍🏫</div>
                    <div>
                      <strong>Supervisor Approved &amp; Forwarded</strong>
                      <p>By {viewingProposal.supervisorApproval.approvedBy} · {viewingProposal.supervisorApproval.timestamp}</p>
                    </div>
                  </div>
                )}

                {viewingProposal.supervisorFeedback && (
                  <div style={{ background: '#ffebee', borderLeft: '4px solid #c62828', padding: '1rem 1.25rem', borderRadius: 10, marginTop: '1rem' }}>
                    <strong>💬 Supervisor Feedback:</strong> {viewingProposal.supervisorFeedback}
                  </div>
                )}

                {viewingProposal.coordinatorFeedback && (
                  <div style={{ background: '#ffebee', borderLeft: '4px solid #c62828', padding: '1rem 1.25rem', borderRadius: 10, marginTop: '1rem' }}>
                    <strong>💬 Your Feedback:</strong> {viewingProposal.coordinatorFeedback}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-outline" onClick={() => setViewingProposal(null)}>← Back</button>
                  {viewingProposal.forwardedToCoordinator && viewingProposal.status === 'approved' && (
                    <>
                      <button className="btn btn-reject" onClick={() => setRejectModal(viewingProposal.id)}>✗ Reject</button>
                      <button className="btn btn-approve" onClick={() => handleActivateProposal(viewingProposal.id)}>🚀 Activate Project</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="content-header"><h1>All Proposals</h1><p>View and manage all submitted proposals.</p></div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <input
                  className="form-control"
                  style={{ maxWidth: 320 }}
                  placeholder="Search by title, supervisor, or members..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <select className="form-control" style={{ maxWidth: 180 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="activated">Activated</option>
                  <option value="rejected">Rejected</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Proposals ({filteredProposals.length})</h2>
                </div>
                {filteredProposals.length === 0 ? (
                  <div className="card-content"><div className="empty-state"><span className="empty-icon">📋</span><h3>No proposals found</h3></div></div>
                ) : (
                  <div style={{ overflowX: 'auto', padding: '1.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                          {['TITLE', 'SUPERVISOR', 'MEMBERS', 'STATUS', 'SIMILARITY', 'ACTIONS'].map(h => (
                            <th key={h} style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.875rem' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProposals.map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '1rem', maxWidth: 200 }}>
                              <strong style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</strong>
                            </td>
                            <td style={{ padding: '1rem' }}>{p.supervisorName || '—'}</td>
                            <td style={{ padding: '1rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.groupMembers || '—'}</td>
                            <td style={{ padding: '1rem' }}>
                              <span className={`badge badge-${p.status}`}>{p.status}</span>
                              {p.forwardedToCoordinator && p.status === 'approved' && (
                                <span className="badge" style={{ background: '#e3f2fd', color: '#1565c0', marginLeft: '0.5rem', fontSize: '0.7rem' }}>Forwarded</span>
                              )}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{ color: (p.similarityScore || 0) >= 70 ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
                                {p.similarityScore || 0}%
                              </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                  onClick={() => setViewingProposal(p)}>View</button>
                                {p.forwardedToCoordinator && p.status === 'approved' && (
                                  <button className="btn btn-approve" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                    onClick={() => handleActivateProposal(p.id)}>🚀 Activate</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ══ ALL LOGBOOKS ══ */}
        <div className={`page-content ${activePage === 'logbooks' ? 'active' : ''}`}>
          {viewingLogbook ? (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Logbook Detail — Week {viewingLogbook.weekNo}</h2>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span className={`badge badge-${viewingLogbook.status}`}>{viewingLogbook.status}</span>
                  {viewingLogbook.locked && <span className="badge" style={{ background: '#f3e5f5', color: '#6a1b9a' }}>🔒 Locked</span>}
                </div>
              </div>
              <div className="card-content">
                <div className="logbook-section">
                  <div className="logbook-section-title">Meeting Information</div>
                  <div className="logbook-meta-grid">
                    <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>STUDENT</strong><p style={{ marginTop: 4 }}>{viewingLogbook.studentName}</p></div>
                    <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>STUDENT ID</strong><p style={{ marginTop: 4 }}>{viewingLogbook.studentNumber}</p></div>
                    <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SUPERVISOR</strong><p style={{ marginTop: 4 }}>{viewingLogbook.supervisorName}</p></div>
                    <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PROJECT</strong><p style={{ marginTop: 4 }}>{viewingLogbook.projectTitle}</p></div>
                    <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>DATE RANGE</strong><p style={{ marginTop: 4 }}>{viewingLogbook.dateRange}</p></div>
                    <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TERM</strong><p style={{ marginTop: 4 }}>{viewingLogbook.term || '—'}</p></div>
                  </div>
                </div>
                {['workDone', 'recordOfDiscussion', 'problemsEncountered'].map(field => (
                  viewingLogbook[field]?.length > 0 && (
                    <div key={field} className="logbook-section">
                      <div className="logbook-section-title">
                        {field === 'workDone' ? 'Work Done' : field === 'recordOfDiscussion' ? 'Record of Discussion' : 'Problems Encountered'}
                      </div>
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
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button className="btn btn-outline" onClick={() => setViewingLogbook(null)}>← Back to List</button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="content-header"><h1>All Logbooks</h1><p>Monitor logbook submissions across all groups.</p></div>
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Logbook Submissions ({logbooks.length})</h2>
                </div>
                {logbooks.length === 0 ? (
                  <div className="card-content"><div className="empty-state"><span className="empty-icon">📝</span><h3>No logbooks submitted yet</h3></div></div>
                ) : (
                  <div style={{ overflowX: 'auto', padding: '1.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                          {['STUDENT', 'PROJECT', 'WEEK', 'SUPERVISOR', 'STATUS', 'ACTIONS'].map(h => (
                            <th key={h} style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.875rem' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {logbooks.sort((a, b) => a.weekNo - b.weekNo).map(lb => (
                          <tr key={lb.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '1rem' }}><strong>{lb.studentName}</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lb.studentNumber}</span></td>
                            <td style={{ padding: '1rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lb.projectTitle}</td>
                            <td style={{ padding: '1rem' }}><strong>Week {lb.weekNo}</strong></td>
                            <td style={{ padding: '1rem' }}>{lb.supervisorName}</td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <span className={`badge badge-${lb.status}`}>{lb.status}</span>
                                {lb.locked && <span className="badge" style={{ background: '#f3e5f5', color: '#6a1b9a', fontSize: '0.7rem' }}>🔒</span>}
                              </div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                onClick={() => setViewingLogbook(lb)}>View</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ══ SUPERVISORS ══ */}
        <div className={`page-content ${activePage === 'supervisors' ? 'active' : ''}`}>
          <div className="content-header"><h1>Supervisors</h1><p>Monitor supervisor performance and workload.</p></div>
          {supervisors.length === 0 ? (
            <div className="card"><div className="card-content"><div className="empty-state"><span className="empty-icon">👨‍🏫</span><h3>No supervisors found</h3></div></div></div>
          ) : (
            supervisors.map(sup => {
              const stats = getSupervisorStats(sup);
              const load  = sup.currentGroups || 0;
              const max   = sup.maxCapacity || 4;
              const pct   = Math.round((load / max) * 100);
              return (
                <div key={sup.id} className="card">
                  <div className="card-header">
                    <div>
                      <h2 className="card-title">{sup.name}</h2>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{sup.email}</p>
                    </div>
                    <span className={`badge ${pct >= 100 ? 'badge-rejected' : pct >= 75 ? 'badge-pending' : 'badge-approved'}`}>
                      {pct >= 100 ? '🔴 Full' : pct >= 75 ? '🟡 Near Full' : '🟢 Available'}
                    </span>
                  </div>
                  <div className="card-content">
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                        <span>Supervision Load</span>
                        <span>{load}/{max} groups ({pct}%)</span>
                      </div>
                      <div className="capacity-bar" style={{ height: 10 }}>
                        <div className="capacity-fill" style={{ width: `${pct}%`, background: pct >= 100 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#22c55e' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                      {[
                        { label: 'Assigned',   value: stats.assigned },
                        { label: 'Approved',   value: stats.approved },
                        { label: 'Logbooks',   value: stats.logbooks },
                        { label: 'Pending',    value: stats.pending },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 10 }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{s.value}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>RESEARCH AREAS</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {(sup.researchAreas || []).map(area => (
                          <span key={area} style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', padding: '0.25rem 0.75rem', borderRadius: 99, fontSize: '0.8rem', border: '1px solid var(--border)' }}>
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ══ REPORTS ══ */}
        <div className={`page-content ${activePage === 'reports' ? 'active' : ''}`}>
          <div className="content-header"><h1>Reports &amp; Analytics</h1><p>System-wide statistics and progress overview.</p></div>

          <div className="card">
            <div className="card-header"><h2 className="card-title">Proposal Status Breakdown</h2></div>
            <div style={{ padding: '1.5rem' }}>
              {[
                { label: 'Total Submitted',      value: proposals.length,          color: '#6366f1' },
                { label: 'Pending Review',        value: pendingProposals.length,   color: '#f59e0b' },
                { label: 'Supervisor Approved',   value: forwardedProposals.length, color: '#3b82f6' },
                { label: 'Activated by Coordinator', value: activatedProposals.length, color: '#22c55e' },
                { label: 'Rejected',              value: proposals.filter(p => p.status === 'rejected').length, color: '#ef4444' },
                { label: 'Flagged (Duplicate)',   value: flaggedProposals.length,   color: '#f97316' },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 99, height: 10, overflow: 'hidden' }}>
                    <div style={{
                      width: proposals.length > 0 ? `${Math.round((item.value / proposals.length) * 100)}%` : '0%',
                      height: '100%', background: item.color, borderRadius: 99, transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2 className="card-title">Logbook Progress Overview</h2></div>
            <div style={{ padding: '1.5rem' }}>
              {[
                { label: 'Total Submitted', value: logbooks.length,          color: '#6366f1' },
                { label: 'Approved & Locked', value: approvedLogbooks.length, color: '#22c55e' },
                { label: 'Pending Review',  value: pendingLogbooks.length,   color: '#f59e0b' },
                { label: 'Revision Requested', value: logbooks.filter(l => l.status === 'rejected').length, color: '#ef4444' },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 99, height: 10, overflow: 'hidden' }}>
                    <div style={{
                      width: logbooks.length > 0 ? `${Math.round((item.value / logbooks.length) * 100)}%` : '0%',
                      height: '100%', background: item.color, borderRadius: 99
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2 className="card-title">Programme Distribution</h2></div>
            <div style={{ padding: '1.5rem' }}>
              {[
                'BSc Software Engineering with Multimedia',
                'Information Technology',
                'Business Information Technology',
              ].map(prog => {
                const progCount = proposals.filter(p => p.studentProgram === prog).length;
                return (
                  <div key={prog} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 10, marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{prog}</div>
                      <span style={{ fontWeight: 700 }}>{progCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══ SETTINGS ══ */}
        <div className={`page-content ${activePage === 'settings' ? 'active' : ''}`}>
          <div className="content-header"><h1>System Settings</h1><p>Configure WIL monitoring system parameters.</p></div>
          <div className="card">
            <div className="card-header"><h2 className="card-title">Configuration</h2></div>
            <div className="card-content">
              <form onSubmit={handleSaveSettings}>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">MAX SUPERVISION LIMIT (per supervisor)</label>
                    <input
                      type="number" min="1" max="10" className="form-control"
                      value={settings.maxSupervisionLimit}
                      onChange={e => setSettings(s => ({ ...s, maxSupervisionLimit: parseInt(e.target.value) }))}
                    />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      Maximum number of groups a supervisor can be assigned at once. Currently: {settings.maxSupervisionLimit}
                    </p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">SIMILARITY THRESHOLD (%)</label>
                    <input
                      type="number" min="50" max="100" className="form-control"
                      value={settings.similarityThreshold}
                      onChange={e => setSettings(s => ({ ...s, similarityThreshold: parseInt(e.target.value) }))}
                    />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      Proposals above this % similarity will be flagged as potential duplicates.
                    </p>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">LOGBOOK SUBMISSION DEADLINE</label>
                  <input
                    type="text" className="form-control"
                    value={settings.logbookDeadline}
                    onChange={e => setSettings(s => ({ ...s, logbookDeadline: e.target.value }))}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">AUTO SUPERVISOR ASSIGNMENT</label>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="radio" checked={settings.autoAssignment === true}  onChange={() => setSettings(s => ({ ...s, autoAssignment: true }))}  /> Enabled
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="radio" checked={settings.autoAssignment === false} onChange={() => setSettings(s => ({ ...s, autoAssignment: false }))} /> Disabled (manual only)
                      </label>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">EMAIL NOTIFICATIONS</label>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="radio" checked={settings.emailNotifications === true}  onChange={() => setSettings(s => ({ ...s, emailNotifications: true }))}  /> Enabled
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="radio" checked={settings.emailNotifications === false} onChange={() => setSettings(s => ({ ...s, emailNotifications: false }))} /> Disabled
                      </label>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary">Save Settings</button>
                  {settingsSaved && <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.9rem' }}>✓ Settings saved successfully</span>}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* ══ NOTIFICATIONS ══ */}
        <div className={`page-content ${activePage === 'notifications' ? 'active' : ''}`}>
          <div className="content-header"><h1>Notifications</h1></div>
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

      </main>
    </div>
  );
};

export default CoordinatorDashboard;