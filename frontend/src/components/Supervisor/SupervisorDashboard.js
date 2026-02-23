import React, { useState, useEffect } from 'react';
import '../../styles/styles.css';
import {
  listenSupervisorProposals,
  listenSupervisorLogbooks,
  listenNotifications,
  approveProposal,
  rejectProposal,
  approveLogbook,
  rejectLogbook,
  pushNotification,
  markNotificationRead,
} from '../../api/api';

const SupervisorDashboard = ({ onLogout, showToast, currentUser }) => {
  const [activePage, setActivePage]     = useState('overview');
  const [proposals, setProposals]       = useState([]);
  const [logbooks, setLogbooks]         = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedbackText, setFeedbackText]   = useState('');
  const [viewingLogbook, setViewingLogbook]   = useState(null);
  const [viewingProposal, setViewingProposal] = useState(null);

  const supervisorName = currentUser?.fullName || 'Supervisor';
  const supervisorUid  = currentUser?.uid;

  // ── Real-time listeners ───────────────────────────────────
  useEffect(() => {
    if (!supervisorUid) return;

    const unsubProposals = listenSupervisorProposals(supervisorUid, setProposals);
    const unsubLogbooks  = listenSupervisorLogbooks(supervisorUid, setLogbooks);
    const unsubNotifs    = listenNotifications(supervisorUid, setNotifications);

    return () => { unsubProposals(); unsubLogbooks(); unsubNotifs(); };
  }, [supervisorUid]);

  // ── Computed lists ────────────────────────────────────────
  const pendingProposals = proposals.filter(p => p.status === 'pending');
  const pendingLogbooks  = logbooks.filter(l => l.status === 'pending');
  const approvedLogbooks = logbooks.filter(l => l.status === 'approved');
  const assignedGroups   = [...new Map(proposals.filter(p => p.status !== 'rejected').map(p => [p.id, p])).values()];
  const unreadCount      = notifications.filter(n => !n.read).length;

  // ── Modal helpers ─────────────────────────────────────────
  const openFeedbackModal = (type, id, action) => {
    setFeedbackModal({ type, id, action });
    setFeedbackText('');
  };
  const closeFeedbackModal = () => { setFeedbackModal(null); setFeedbackText(''); };

  // ── Proposal: Approve ─────────────────────────────────────
  const handleApproveProposal = async (proposalId) => {
    const p = proposals.find(p => p.id === proposalId);
    if (!p) return;
    try {
      await approveProposal(proposalId, supervisorName, supervisorUid);
      await pushNotification(
        p.submittedBy,
        'Proposal Approved',
        `Your proposal "${p.title}" has been approved by ${supervisorName} and forwarded to the coordinator.`,
        'success'
      );
      showToast('Proposal Approved', 'Forwarded to coordinator automatically.');
      setViewingProposal(null);
    } catch (err) { showToast('Error', err.message); }
  };

  // ── Proposal: Reject ──────────────────────────────────────
  const handleRejectProposal = async (proposalId) => {
    if (!feedbackText.trim()) { showToast('Error', 'Please provide feedback before rejecting.'); return; }
    const p = proposals.find(p => p.id === proposalId);
    if (!p) return;
    try {
      await rejectProposal(proposalId, feedbackText.trim(), supervisorName);
      await pushNotification(
        p.submittedBy,
        'Proposal Rejected — Revision Required',
        `${supervisorName} rejected your proposal: "${feedbackText.trim()}"`,
        'danger'
      );
      showToast('Proposal Rejected', 'Student notified with your feedback.');
      closeFeedbackModal();
      setViewingProposal(null);
    } catch (err) { showToast('Error', err.message); }
  };

  // ── Logbook: Approve ──────────────────────────────────────
  const handleApproveLogbook = async (logbookId) => {
    const lb = logbooks.find(l => l.id === logbookId);
    if (!lb) return;
    try {
      await approveLogbook(logbookId, supervisorName, supervisorUid);
      await pushNotification(
        lb.studentId,
        `Logbook Week ${lb.weekNo} Approved`,
        `${supervisorName} approved your Week ${lb.weekNo} logbook. The entry is now locked.`,
        'success'
      );
      showToast('Logbook Approved', 'Entry locked and digital approval recorded.');
      setViewingLogbook(null);
    } catch (err) { showToast('Error', err.message); }
  };

  // ── Logbook: Reject ───────────────────────────────────────
  const handleRejectLogbook = async (logbookId) => {
    if (!feedbackText.trim()) { showToast('Error', 'Please provide feedback before requesting revision.'); return; }
    const lb = logbooks.find(l => l.id === logbookId);
    if (!lb) return;
    try {
      await rejectLogbook(logbookId, feedbackText.trim(), supervisorName);
      await pushNotification(
        lb.studentId,
        `Logbook Week ${lb.weekNo} — Revision Required`,
        `${supervisorName} requested a revision: "${feedbackText.trim()}"`,
        'danger'
      );
      showToast('Revision Requested', 'Student notified with your feedback.');
      closeFeedbackModal();
      setViewingLogbook(null);
    } catch (err) { showToast('Error', err.message); }
  };

  const handleModalConfirm = () => {
    if (!feedbackModal) return;
    const { type, id } = feedbackModal;
    type === 'proposal' ? handleRejectProposal(id) : handleRejectLogbook(id);
  };

  // ── Render logbook detail ─────────────────────────────────
  const renderLogbookDetail = (lb) => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Logbook — Week {lb.weekNo}</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className={`badge badge-${lb.status}`}>{lb.status}</span>
          {lb.locked && <span className="badge" style={{ background: '#f3e5f5', color: '#6a1b9a' }}>🔒 Locked</span>}
        </div>
      </div>
      <div className="card-content">
        <div className="logbook-section">
          <div className="logbook-section-title">Meeting Information</div>
          <div className="logbook-meta-grid">
            <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>STUDENT</strong><p style={{ marginTop: 4 }}>{lb.studentName}</p></div>
            <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>STUDENT ID</strong><p style={{ marginTop: 4 }}>{lb.studentNumber}</p></div>
            <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PROJECT</strong><p style={{ marginTop: 4 }}>{lb.projectTitle}</p></div>
            <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>DATE RANGE</strong><p style={{ marginTop: 4 }}>{lb.dateRange}</p></div>
            <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>MEETING NO.</strong><p style={{ marginTop: 4 }}>{lb.meetingNo || '—'}</p></div>
            <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TERM</strong><p style={{ marginTop: 4 }}>{lb.term || '—'}</p></div>
          </div>
        </div>

        {['workDone', 'recordOfDiscussion', 'problemsEncountered'].map(field => (
          lb[field]?.length > 0 && (
            <div key={field} className="logbook-section">
              <div className="logbook-section-title">
                {field === 'workDone' ? 'Work Done' : field === 'recordOfDiscussion' ? 'Record of Discussion' : 'Problems Encountered'}
              </div>
              <div className="logbook-items-list">
                {lb[field].map((item, i) => (
                  <div key={i} className="logbook-item-row">
                    <div className="logbook-item-number">{i + 1}</div>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}

        {lb.furtherNotes && (
          <div className="logbook-section">
            <div className="logbook-section-title">Further Notes</div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{lb.furtherNotes}</p>
          </div>
        )}

        {lb.digitalApproval && (
          <div className="digital-approval-stamp">
            <div className="digital-approval-icon">🔐</div>
            <div>
              <strong>Digitally Approved</strong>
              <p>By {lb.digitalApproval.approvedBy} · {lb.digitalApproval.timestamp}</p>
            </div>
          </div>
        )}

        {lb.supervisorFeedback && (
          <div style={{ background: '#ffebee', borderLeft: '4px solid #c62828', padding: '1rem 1.25rem', borderRadius: 10, marginTop: '1rem' }}>
            <strong>💬 Your Feedback:</strong> {lb.supervisorFeedback}
          </div>
        )}

        <div className="logbook-signature-row">
          <div className="logbook-signature-box">
            <div className="logbook-signature-line" />
            <div className="logbook-signature-label">
              {lb.digitalApproval ? `✓ ${lb.digitalApproval.approvedBy}` : "Supervisor's Signature"}
            </div>
          </div>
          <div className="logbook-signature-box">
            <div className="logbook-signature-line" />
            <div className="logbook-signature-label">Student's Signature</div>
          </div>
        </div>

        {lb.status === 'pending' && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-outline" onClick={() => setViewingLogbook(null)}>← Back</button>
            <button className="btn btn-reject"  onClick={() => openFeedbackModal('logbook', lb.id, 'reject')}>✗ Request Revision</button>
            <button className="btn btn-approve" onClick={() => handleApproveLogbook(lb.id)}>✓ Approve &amp; Lock</button>
          </div>
        )}
        {lb.status !== 'pending' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={() => setViewingLogbook(null)}>← Back to List</button>
          </div>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  return (
    <div className="dashboard-container">

      {/* ── FEEDBACK MODAL ── */}
      {feedbackModal && (
        <div className="modal-overlay" onClick={closeFeedbackModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{feedbackModal.type === 'proposal' ? 'Reject Proposal' : 'Request Revision'}</h3>
              <button className="modal-close" onClick={closeFeedbackModal}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {feedbackModal.type === 'proposal'
                  ? 'Provide a clear reason for rejection. The student will receive this and may revise and resubmit.'
                  : 'Provide specific feedback explaining what needs to be revised. The student will be notified.'}
              </p>
              <label className="form-label">Feedback / Reason *</label>
              <textarea
                className="form-control"
                style={{ minHeight: 120, marginTop: '0.5rem' }}
                placeholder="Be specific about what needs to be changed or improved..."
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeFeedbackModal}>Cancel</button>
              <button className="btn btn-reject" onClick={handleModalConfirm} disabled={!feedbackText.trim()}>
                {feedbackModal.type === 'proposal' ? 'Reject & Notify Student' : 'Request Revision & Notify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">📚</div>
            <div className="sidebar-logo-text"><h2>WIL Monitor</h2><p>Supervisor Portal</p></div>
          </div>
          <div className="user-profile">
            <div className="user-avatar">
              {currentUser?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'SV'}
            </div>
            <div className="user-info">
              <h4>{supervisorName}</h4>
              <p>Supervisor</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Main Menu</div>
            {[
              { id: 'overview',    icon: '📊', label: 'Overview' },
              { id: 'logbooks',    icon: '📝', label: 'Logbook Reviews', badge: pendingLogbooks.length },
              { id: 'proposals',   icon: '📋', label: 'Proposals',       badge: pendingProposals.length },
              { id: 'groups',      icon: '👥', label: 'Groups' },
              { id: 'history',     icon: '📜', label: 'History' },
              { id: 'notifications', icon: '🔔', label: 'Notifications', badge: unreadCount },
            ].map(item => (
              <div
                key={item.id}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => { setActivePage(item.id); setViewingLogbook(null); setViewingProposal(null); }}
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

        <div className="logout-section" style={{ padding: '1.5rem' }}>
          <button className="btn btn-logout" onClick={onLogout} style={{ width: '100%' }}>
            <span>🚪</span><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content">

        {/* ══ OVERVIEW ══ */}
        <div className={`page-content ${activePage === 'overview' ? 'active' : ''}`}>
          <div className="content-header">
            <h1>Supervisor Dashboard</h1>
            <p>Welcome, {supervisorName}. Here's your supervision summary.</p>
          </div>

          {(pendingProposals.length > 0 || pendingLogbooks.length > 0) && (
            <div style={{ background: '#fff3e0', borderLeft: '4px solid #e65100', padding: '1rem 1.25rem', borderRadius: 10, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <strong>⚡ Action Required:</strong>{' '}
              {pendingProposals.length > 0 && `${pendingProposals.length} proposal(s) awaiting review. `}
              {pendingLogbooks.length > 0  && `${pendingLogbooks.length} logbook(s) awaiting review.`}
            </div>
          )}

          <div className="stats-grid">
            {[
              { value: assignedGroups.length,                  label: 'Assigned Groups',   trend: 'Active this semester',      icon: '👥' },
              { value: pendingLogbooks.length + pendingProposals.length, label: 'Pending Reviews', trend: 'Requires your attention', icon: '⏰' },
              { value: approvedLogbooks.length,                label: 'Logbooks Approved', trend: 'All time',                  icon: '✅' },
              { value: `${assignedGroups.length}/4`,           label: 'Capacity',          trend: `${4 - assignedGroups.length} slot(s) remaining`, icon: '📈' },
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

          {pendingLogbooks.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Logbooks Awaiting Review</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setActivePage('logbooks')}>View All</button>
              </div>
              <div className="entries-list" style={{ padding: '1.5rem' }}>
                {pendingLogbooks.slice(0, 2).map(lb => (
                  <div key={lb.id} className="entry-card pending">
                    <div className="entry-header">
                      <div className="entry-meta"><span>📝 Week {lb.weekNo}</span></div>
                      <span className="badge badge-pending">Awaiting Review</span>
                    </div>
                    <h3 className="entry-title">{lb.workDone?.[0] || `Week ${lb.weekNo} Entry`}</h3>
                    <p className="entry-text"><strong>Student:</strong> {lb.studentName} · {lb.studentNumber}</p>
                    <div className="entry-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => { setViewingLogbook(lb); setActivePage('logbooks'); }}>Review</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══ LOGBOOK REVIEWS ══ */}
        <div className={`page-content ${activePage === 'logbooks' ? 'active' : ''}`}>
          {viewingLogbook ? renderLogbookDetail(viewingLogbook) : (
            <>
              <div className="content-header"><h1>Review Logbook Entries</h1><p>Review, approve or request revisions on student logbooks.</p></div>

              {logbooks.length === 0 && (
                <div className="card"><div className="card-content">
                  <div className="empty-state"><span className="empty-icon">📝</span><h3>No logbooks submitted yet</h3><p>Student logbooks will appear here once submitted.</p></div>
                </div></div>
              )}

              {pendingLogbooks.length > 0 && (
                <div className="card">
                  <div className="card-header"><h2 className="card-title">Pending Review</h2></div>
                  <div className="entries-list" style={{ padding: '1.5rem' }}>
                    {pendingLogbooks.map(lb => (
                      <div key={lb.id} className="entry-card pending">
                        <div className="entry-header">
                          <div className="entry-meta"><span>📝 Week {lb.weekNo}</span></div>
                          <span className="badge badge-pending">Awaiting Review</span>
                        </div>
                        <h3 className="entry-title">{lb.workDone?.[0] || `Week ${lb.weekNo} Entry`}</h3>
                        <p className="entry-text"><strong>Student:</strong> {lb.studentName} · {lb.studentNumber}</p>
                        <p className="entry-text"><strong>Project:</strong> {lb.projectTitle}</p>
                        <div className="entry-actions">
                          <button className="btn btn-outline btn-sm" onClick={() => setViewingLogbook(lb)}>📄 Full Review</button>
                          <button className="btn btn-reject btn-sm"  onClick={() => openFeedbackModal('logbook', lb.id, 'reject')}>✗ Request Revision</button>
                          <button className="btn btn-approve btn-sm" onClick={() => handleApproveLogbook(lb.id)}>✓ Approve &amp; Lock</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {approvedLogbooks.length > 0 && (
                <div className="card">
                  <div className="card-header"><h2 className="card-title">Approved &amp; Locked</h2></div>
                  <div className="entries-list" style={{ padding: '1.5rem' }}>
                    {approvedLogbooks.map(lb => (
                      <div key={lb.id} className="entry-card approved">
                        <div className="entry-header">
                          <div className="entry-meta"><span>📝 Week {lb.weekNo}</span></div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span className="badge badge-approved">Approved</span>
                            <span className="badge" style={{ background: '#f3e5f5', color: '#6a1b9a' }}>🔒 Locked</span>
                          </div>
                        </div>
                        <h3 className="entry-title">{lb.workDone?.[0] || `Week ${lb.weekNo} Entry`}</h3>
                        <p className="entry-text"><strong>Student:</strong> {lb.studentName}</p>
                        <div className="entry-actions">
                          <button className="btn btn-outline btn-sm" onClick={() => setViewingLogbook(lb)}>View</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {logbooks.filter(l => l.status === 'rejected').length > 0 && (
                <div className="card">
                  <div className="card-header"><h2 className="card-title">Revision Requested</h2></div>
                  <div className="entries-list" style={{ padding: '1.5rem' }}>
                    {logbooks.filter(l => l.status === 'rejected').map(lb => (
                      <div key={lb.id} className="entry-card rejected">
                        <div className="entry-header">
                          <div className="entry-meta"><span>📝 Week {lb.weekNo}</span></div>
                          <span className="badge badge-rejected">Revision Requested</span>
                        </div>
                        <h3 className="entry-title">{lb.workDone?.[0] || `Week ${lb.weekNo} Entry`}</h3>
                        <p className="entry-text"><strong>Feedback:</strong> {lb.supervisorFeedback}</p>
                        <div className="entry-actions">
                          <button className="btn btn-outline btn-sm" onClick={() => setViewingLogbook(lb)}>View</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ══ PROPOSALS ══ */}
        <div className={`page-content ${activePage === 'proposals' ? 'active' : ''}`}>
          {viewingProposal ? (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Proposal Review</h2>
                <span className={`badge badge-${viewingProposal.status}`}>{viewingProposal.status}</span>
              </div>
              <div className="card-content">
                <table style={{ width: '100%', marginBottom: '1.5rem' }}><tbody>
                  <tr><td style={{ padding: '0.5rem 0', fontWeight: 600, width: 180, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>TITLE</td><td>{viewingProposal.title}</td></tr>
                  <tr><td style={{ padding: '0.5rem 0', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>RESEARCH AREA</td><td>{viewingProposal.researchArea}</td></tr>
                  <tr><td style={{ padding: '0.5rem 0', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>MEMBERS</td><td>{viewingProposal.groupMembers || 'Not specified'}</td></tr>
                </tbody></table>

                <div className="logbook-section">
                  <div className="logbook-section-title">Description</div>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>{viewingProposal.description}</p>
                </div>

                {viewingProposal.supervisorApproval && (
                  <div className="digital-approval-stamp">
                    <div className="digital-approval-icon">🔐</div>
                    <div>
                      <strong>Digitally Approved &amp; Forwarded to Coordinator</strong>
                      <p>By {viewingProposal.supervisorApproval.approvedBy} · {viewingProposal.supervisorApproval.timestamp}</p>
                    </div>
                  </div>
                )}

                {viewingProposal.supervisorFeedback && (
                  <div style={{ background: '#ffebee', borderLeft: '4px solid #c62828', padding: '1rem 1.25rem', borderRadius: 10, marginTop: '1rem' }}>
                    <strong>💬 Rejection Feedback:</strong> {viewingProposal.supervisorFeedback}
                  </div>
                )}

                {viewingProposal.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <button className="btn btn-outline" onClick={() => setViewingProposal(null)}>← Back</button>
                    <button className="btn btn-reject"  onClick={() => openFeedbackModal('proposal', viewingProposal.id, 'reject')}>✗ Reject</button>
                    <button className="btn btn-approve" onClick={() => handleApproveProposal(viewingProposal.id)}>✓ Approve &amp; Forward to Coordinator</button>
                  </div>
                )}
                {viewingProposal.status !== 'pending' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button className="btn btn-outline" onClick={() => setViewingProposal(null)}>← Back</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="content-header"><h1>Review Proposals</h1><p>Approved proposals are automatically forwarded to the coordinator.</p></div>

              {proposals.length === 0 && (
                <div className="card"><div className="card-content">
                  <div className="empty-state"><span className="empty-icon">📋</span><h3>No proposals assigned yet</h3></div>
                </div></div>
              )}

              {pendingProposals.length > 0 && (
                <div className="card">
                  <div className="card-header"><h2 className="card-title">Awaiting Your Review</h2></div>
                  <div className="entries-list" style={{ padding: '1.5rem' }}>
                    {pendingProposals.map(p => (
                      <div key={p.id} className="entry-card pending">
                        <div className="entry-header">
                          <div className="entry-meta"><span>📋 New Assignment</span></div>
                          <span className="badge badge-pending">Awaiting Review</span>
                        </div>
                        <h3 className="entry-title">{p.title}</h3>
                        <p className="entry-text"><strong>Area:</strong> {p.researchArea} · <strong>Members:</strong> {p.groupMembers || 'Not specified'}</p>
                        <div className="entry-actions">
                          <button className="btn btn-outline btn-sm" onClick={() => setViewingProposal(p)}>📄 Full Review</button>
                          <button className="btn btn-reject btn-sm"  onClick={() => { setViewingProposal(p); openFeedbackModal('proposal', p.id, 'reject'); }}>✗ Reject</button>
                          <button className="btn btn-approve btn-sm" onClick={() => handleApproveProposal(p.id)}>✓ Approve &amp; Forward</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {proposals.filter(p => p.status === 'approved').length > 0 && (
                <div className="card">
                  <div className="card-header"><h2 className="card-title">Approved &amp; Forwarded</h2></div>
                  <div className="entries-list" style={{ padding: '1.5rem' }}>
                    {proposals.filter(p => p.status === 'approved').map(p => (
                      <div key={p.id} className="entry-card approved">
                        <div className="entry-header">
                          <div className="entry-meta"><span>📋 Approved</span></div>
                          <span className="badge badge-approved">Approved &amp; Forwarded</span>
                        </div>
                        <h3 className="entry-title">{p.title}</h3>
                        <div className="entry-actions">
                          <button className="btn btn-outline btn-sm" onClick={() => setViewingProposal(p)}>View</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ══ GROUPS ══ */}
        <div className={`page-content ${activePage === 'groups' ? 'active' : ''}`}>
          <div className="content-header"><h1>Assigned Groups</h1><p>Monitor all supervised projects.</p></div>
          {assignedGroups.length === 0 ? (
            <div className="card"><div className="card-content">
              <div className="empty-state"><span className="empty-icon">👥</span><h3>No groups assigned yet</h3></div>
            </div></div>
          ) : (
            assignedGroups.map(p => {
              const groupLogbooks = logbooks.filter(l => l.projectTitle === p.title);
              const approved      = groupLogbooks.filter(l => l.status === 'approved').length;
              const progress      = Math.round((groupLogbooks.length / 16) * 100);
              return (
                <div key={p.id} className="card">
                  <div className="card-header">
                    <h2 className="card-title">{p.title}</h2>
                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                  </div>
                  <div className="card-content">
                    <table style={{ width: '100%' }}><tbody>
                      <tr><td style={{ padding: '0.4rem 0', fontWeight: 600, width: 180, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>MEMBERS</td><td>{p.groupMembers || 'Not specified'}</td></tr>
                      <tr><td style={{ padding: '0.4rem 0', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>RESEARCH AREA</td><td>{p.researchArea}</td></tr>
                      <tr><td style={{ padding: '0.4rem 0', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>LOGBOOKS</td><td>{groupLogbooks.length} submitted · {approved} approved</td></tr>
                      <tr>
                        <td style={{ padding: '0.4rem 0', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>PROGRESS</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ flex: 1 }}><div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div></div>
                            <span style={{ fontWeight: 700 }}>{progress}%</span>
                          </div>
                        </td>
                      </tr>
                    </tbody></table>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ══ HISTORY ══ */}
        <div className={`page-content ${activePage === 'history' ? 'active' : ''}`}>
          <div className="content-header"><h1>Review History</h1></div>
          <div className="card">
            <div className="card-header"><h2 className="card-title">All Reviews</h2></div>
            {[...logbooks.filter(l => l.status !== 'pending'), ...proposals.filter(p => p.status !== 'pending')].length === 0 ? (
              <div className="card-content"><div className="empty-state"><span className="empty-icon">📜</span><h3>No reviews yet</h3></div></div>
            ) : (
              <div style={{ overflowX: 'auto', padding: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      {['TYPE', 'ITEM', 'STUDENT', 'DECISION'].map(h => (
                        <th key={h} style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.875rem' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logbooks.filter(l => l.status !== 'pending').map(lb => (
                      <tr key={`lb-${lb.id}`} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem' }}>Logbook Wk {lb.weekNo}</td>
                        <td style={{ padding: '1rem' }}>{lb.workDone?.[0]?.slice(0, 40) || '—'}</td>
                        <td style={{ padding: '1rem' }}>{lb.studentName}</td>
                        <td style={{ padding: '1rem' }}><span className={`badge badge-${lb.status}`}>{lb.status}</span></td>
                      </tr>
                    ))}
                    {proposals.filter(p => p.status !== 'pending').map(p => (
                      <tr key={`p-${p.id}`} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem' }}>Proposal</td>
                        <td style={{ padding: '1rem' }}>{p.title?.slice(0, 40)}</td>
                        <td style={{ padding: '1rem' }}>{p.groupMembers || '—'}</td>
                        <td style={{ padding: '1rem' }}><span className={`badge badge-${p.status}`}>{p.status === 'approved' ? 'Approved & Forwarded' : p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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

export default SupervisorDashboard;