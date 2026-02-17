import React, { useState } from 'react';
import '../../styles/Dashboard.css';

const SupervisorDashboard = ({ onLogout, showToast, currentUser, sharedState, setSharedState }) => {
    const [activePage, setActivePage] = useState('overview');
    const [feedbackModal, setFeedbackModal] = useState(null); // { type: 'logbook'|'proposal', id, action: 'reject' }
    const [feedbackText, setFeedbackText] = useState('');
    const [viewingLogbook, setViewingLogbook] = useState(null);
    const [viewingProposal, setViewingProposal] = useState(null);

    // ── sharedState is passed from parent App and shared with StudentDashboard
    // Shape: { proposals: [], logbooks: [], notifications: [] }
    // If not connected yet, fall back to local empty state
    const proposals = sharedState?.proposals || [];
    const logbooks  = sharedState?.logbooks  || [];

    const now = () => new Date().toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const supervisorId   = currentUser?.id   || 'SUP-001';
    const supervisorName = currentUser?.name || 'Supervisor';

    // ── Computed lists ────────────────────────────────────────────────────────
    const pendingProposals  = proposals.filter(p => p.status === 'pending');
    const pendingLogbooks   = logbooks.filter(l => l.status === 'pending');
    const approvedLogbooks  = logbooks.filter(l => l.status === 'approved');
    const assignedGroups    = [...new Map(proposals.filter(p => p.status !== 'rejected').map(p => [p.id, p])).values()];
    const reviewHistory     = logbooks.filter(l => l.status !== 'pending').concat(proposals.filter(p => p.status !== 'pending'));

    // ── Helpers ───────────────────────────────────────────────────────────────
    const updateShared = (updates) => {
        if (setSharedState) setSharedState(prev => ({ ...prev, ...updates }));
    };

    const pushNotification = (title, message, type = 'info') => {
        const notif = { id: Date.now(), title, message, type, time: now() };
        if (setSharedState) {
            setSharedState(prev => ({
                ...prev,
                notifications: [notif, ...(prev.notifications || [])]
            }));
        }
    };

    const openFeedbackModal = (type, id, action) => {
        setFeedbackModal({ type, id, action });
        setFeedbackText('');
    };

    const closeFeedbackModal = () => {
        setFeedbackModal(null);
        setFeedbackText('');
    };

    // ── PROPOSAL: Approve ─────────────────────────────────────────────────────
    const approveProposal = (proposalId) => {
        const updated = proposals.map(p => {
            if (p.id !== proposalId) return p;
            return {
                ...p,
                status: 'approved',
                supervisorApproval: {
                    approvedBy: supervisorName,
                    supervisorId,
                    timestamp: now(),
                    action: 'approved'
                },
                // Mark workflow steps as done
                steps: p.steps?.map((s, i) => i <= 3 ? { ...s, done: true, time: i >= 2 ? now() : s.time } : s) || p.steps,
                // Auto-forward to coordinator
                forwardedToCoordinator: true,
                forwardedAt: now()
            };
        });
        updateShared({ proposals: updated });
        pushNotification(
            'Proposal Approved',
            `Your proposal has been approved by ${supervisorName} and forwarded to the coordinator.`,
            'success'
        );
        showToast('Proposal Approved', 'Proposal forwarded to coordinator automatically.');
        setViewingProposal(null);
    };

    // ── PROPOSAL: Reject ──────────────────────────────────────────────────────
    const rejectProposal = (proposalId) => {
        if (!feedbackText.trim()) {
            showToast('Error', 'Please provide feedback before rejecting.');
            return;
        }
        const updated = proposals.map(p => {
            if (p.id !== proposalId) return p;
            return {
                ...p,
                status: 'rejected',
                supervisorFeedback: feedbackText.trim(),
                rejectedBy: supervisorName,
                rejectedAt: now()
            };
        });
        updateShared({ proposals: updated });
        pushNotification(
            'Proposal Rejected — Revision Required',
            `${supervisorName} has rejected your proposal: "${feedbackText.trim()}". Please revise and resubmit.`,
            'danger'
        );
        showToast('Proposal Rejected', 'Student notified with your feedback.');
        closeFeedbackModal();
        setViewingProposal(null);
    };

    // ── LOGBOOK: Approve ──────────────────────────────────────────────────────
    const approveLogbook = (logbookId) => {
        const updated = logbooks.map(l => {
            if (l.id !== logbookId) return l;
            return {
                ...l,
                status: 'approved',
                locked: true, // cannot be edited by student once approved
                digitalApproval: {
                    approvedBy: supervisorName,
                    supervisorId,
                    timestamp: now(),
                    action: 'approved'
                }
            };
        });
        updateShared({ logbooks: updated });
        pushNotification(
            `Logbook Week ${logbooks.find(l => l.id === logbookId)?.weekNo} Approved`,
            `Your logbook has been approved by ${supervisorName}. Entry is now locked.`,
            'success'
        );
        showToast('Logbook Approved', 'Entry locked and digital approval recorded.');
        setViewingLogbook(null);
    };

    // ── LOGBOOK: Reject / Request Revision ───────────────────────────────────
    const rejectLogbook = (logbookId) => {
        if (!feedbackText.trim()) {
            showToast('Error', 'Please provide feedback before requesting revision.');
            return;
        }
        const updated = logbooks.map(l => {
            if (l.id !== logbookId) return l;
            return {
                ...l,
                status: 'rejected',
                supervisorFeedback: feedbackText.trim(),
                rejectedBy: supervisorName,
                rejectedAt: now()
            };
        });
        updateShared({ logbooks: updated });
        pushNotification(
            `Logbook Week ${logbooks.find(l => l.id === logbookId)?.weekNo} — Revision Required`,
            `${supervisorName} requested a revision: "${feedbackText.trim()}"`,
            'danger'
        );
        showToast('Revision Requested', 'Student notified with your feedback.');
        closeFeedbackModal();
        setViewingLogbook(null);
    };

    const handleModalConfirm = () => {
        if (!feedbackModal) return;
        const { type, id, action } = feedbackModal;
        if (action === 'reject') {
            type === 'proposal' ? rejectProposal(id) : rejectLogbook(id);
        }
    };

    // ── Render logbook detail ─────────────────────────────────────────────────
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
                        <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>STUDENT</strong><p style={{ marginTop: '4px' }}>{lb.studentName}</p></div>
                        <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>STUDENT ID</strong><p style={{ marginTop: '4px' }}>{lb.studentId}</p></div>
                        <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PROJECT TITLE</strong><p style={{ marginTop: '4px' }}>{lb.projectTitle}</p></div>
                        <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>DATE RANGE</strong><p style={{ marginTop: '4px' }}>{lb.dateRange}</p></div>
                        <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>MEETING NO.</strong><p style={{ marginTop: '4px' }}>{lb.meetingNo || '—'}</p></div>
                        <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TERM</strong><p style={{ marginTop: '4px' }}>{lb.term || '—'}</p></div>
                    </div>
                </div>

                {lb.workDone?.length > 0 && (
                    <div className="logbook-section">
                        <div className="logbook-section-title">Work Done</div>
                        <div className="logbook-items-list">
                            {lb.workDone.map((item, i) => (
                                <div key={i} className="logbook-item-row">
                                    <div className="logbook-item-number">{i + 1}</div>
                                    <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {lb.recordOfDiscussion?.length > 0 && (
                    <div className="logbook-section">
                        <div className="logbook-section-title">Record of Discussion</div>
                        <div className="logbook-items-list">
                            {lb.recordOfDiscussion.map((item, i) => (
                                <div key={i} className="logbook-item-row">
                                    <div className="logbook-item-number">{i + 1}</div>
                                    <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {lb.problemsEncountered?.length > 0 && (
                    <div className="logbook-section">
                        <div className="logbook-section-title">Problems Encountered</div>
                        <div className="logbook-items-list">
                            {lb.problemsEncountered.map((item, i) => (
                                <div key={i} className="logbook-item-row">
                                    <div className="logbook-item-number">{i + 1}</div>
                                    <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {lb.furtherNotes && (
                    <div className="logbook-section">
                        <div className="logbook-section-title">Further Notes</div>
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{lb.furtherNotes}</p>
                    </div>
                )}

                {/* Digital approval record */}
                {lb.digitalApproval && (
                    <div className="digital-approval-stamp">
                        <div className="digital-approval-icon">🔐</div>
                        <div>
                            <strong>Digitally Approved</strong>
                            <p>By {lb.digitalApproval.approvedBy} · ID: {lb.digitalApproval.supervisorId} · {lb.digitalApproval.timestamp}</p>
                        </div>
                    </div>
                )}

                {lb.supervisorFeedback && (
                    <div style={{ background: '#ffebee', borderLeft: '4px solid #c62828', padding: '1rem 1.25rem', borderRadius: '10px', marginTop: '1rem' }}>
                        <strong>💬 Your Feedback:</strong> {lb.supervisorFeedback}
                        <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>Sent {lb.rejectedAt}</p>
                    </div>
                )}

                {/* Signature area */}
                <div className="logbook-signature-row">
                    <div className="logbook-signature-box">
                        <div className="logbook-signature-line"></div>
                        <div className="logbook-signature-label">
                            {lb.digitalApproval ? `✓ ${lb.digitalApproval.approvedBy}` : "Supervisor's Signature"}
                        </div>
                    </div>
                    <div className="logbook-signature-box">
                        <div className="logbook-signature-line"></div>
                        <div className="logbook-signature-label">Student's Signature</div>
                    </div>
                </div>

                {/* Action buttons — only if still pending */}
                {lb.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                        <button className="btn btn-outline" onClick={() => setViewingLogbook(null)}>← Back</button>
                        <button className="btn btn-reject" onClick={() => openFeedbackModal('logbook', lb.id, 'reject')}>✗ Request Revision</button>
                        <button className="btn btn-approve" onClick={() => approveLogbook(lb.id)}>✓ Approve &amp; Lock</button>
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

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="dashboard-container">

            {/* ── FEEDBACK MODAL ─────────────────────────────────────────────── */}
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
                                    ? 'Provide a clear reason for rejection. The student will receive this feedback and may revise and resubmit.'
                                    : 'Provide specific feedback explaining what needs to be revised. The student will be notified.'}
                            </p>
                            <label className="form-label">Feedback / Reason *</label>
                            <textarea
                                className="form-control"
                                style={{ minHeight: '120px', marginTop: '0.5rem' }}
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

            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">📚</div>
                        <div className="sidebar-logo-text">
                            <h2>WIL Monitor</h2>
                            <p>Supervisor Portal</p>
                        </div>
                    </div>
                    <div className="user-profile">
                        <div className="user-avatar">
                            {currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'SV'}
                        </div>
                        <div className="user-info">
                            <h4>{currentUser?.name || 'Supervisor'}</h4>
                            <p>Supervisor</p>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <div className="nav-section-title">Main Menu</div>
                        {[
                            { id: 'overview',     icon: '📊', label: 'Overview' },
                            { id: 'logbooks',     icon: '📝', label: 'Logbook Reviews',  badge: pendingLogbooks.length },
                            { id: 'proposals',    icon: '📋', label: 'Proposals',         badge: pendingProposals.length },
                            { id: 'groups',       icon: '👥', label: 'Groups' },
                            { id: 'history',      icon: '📜', label: 'History' },
                            { id: 'performance',  icon: '📈', label: 'Performance' },
                        ].map(item => (
                            <div key={item.id} className={`nav-item ${activePage === item.id ? 'active' : ''}`} onClick={() => { setActivePage(item.id); setViewingLogbook(null); setViewingProposal(null); }}>
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
                </nav>

                <div className="logout-section" style={{ padding: '1.5rem' }}>
                    <button className="btn btn-logout" onClick={onLogout} style={{ width: '100%' }}>
                        <span>🚪</span><span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">

                {/* ══════════════════ OVERVIEW ══════════════════ */}
                <div className={`page-content ${activePage === 'overview' ? 'active' : ''}`}>
                    <div className="content-header">
                        <h1>Supervisor Dashboard</h1>
                        <p>Welcome, {supervisorName}. Here's your supervision summary.</p>
                    </div>

                    {(pendingProposals.length > 0 || pendingLogbooks.length > 0) && (
                        <div className="alert-warn" style={{ background: '#fff3e0', borderLeft: '4px solid #e65100', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            <strong>⚡ Action Required:</strong>{' '}
                            {pendingProposals.length > 0 && `${pendingProposals.length} proposal${pendingProposals.length > 1 ? 's' : ''} awaiting review. `}
                            {pendingLogbooks.length > 0 && `${pendingLogbooks.length} logbook${pendingLogbooks.length > 1 ? 's' : ''} awaiting review.`}
                        </div>
                    )}

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">{assignedGroups.length}</div>
                                    <div className="stat-label">Assigned Groups</div>
                                    <div className="stat-trend">Active this semester</div>
                                </div>
                                <div className="stat-icon">👥</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">{pendingLogbooks.length + pendingProposals.length}</div>
                                    <div className="stat-label">Pending Reviews</div>
                                    <div className="stat-trend">Requires your attention</div>
                                </div>
                                <div className="stat-icon">⏰</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">{approvedLogbooks.length}</div>
                                    <div className="stat-label">Logbooks Approved</div>
                                    <div className="stat-trend">All time</div>
                                </div>
                                <div className="stat-icon">✅</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">{assignedGroups.length}/4</div>
                                    <div className="stat-label">Capacity</div>
                                    <div className="stat-trend">{4 - assignedGroups.length} slot{4 - assignedGroups.length !== 1 ? 's' : ''} remaining</div>
                                </div>
                                <div className="stat-icon">📈</div>
                            </div>
                        </div>
                    </div>

                    {/* Quick action: show pending items */}
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
                                            <div className="entry-meta">
                                                <span>📝 Week {lb.weekNo}</span>
                                                <span>🕒 {lb.submittedAt}</span>
                                            </div>
                                            <span className="badge badge-pending">Awaiting Review</span>
                                        </div>
                                        <h3 className="entry-title">{lb.workDone?.[0] || `Week ${lb.weekNo} Entry`}</h3>
                                        <p className="entry-text"><strong>Student:</strong> {lb.studentName} · {lb.studentId}</p>
                                        <div className="entry-actions">
                                            <button className="btn btn-outline btn-sm" onClick={() => { setViewingLogbook(lb); setActivePage('logbooks'); }}>Review</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ══════════════════ LOGBOOK REVIEWS ══════════════════ */}
                <div className={`page-content ${activePage === 'logbooks' ? 'active' : ''}`}>

                    {viewingLogbook ? (
                        renderLogbookDetail(viewingLogbook)
                    ) : (
                        <>
                            <div className="content-header">
                                <h1>Review Logbook Entries</h1>
                                <p>Review submitted logbooks, provide comments, and approve or request revisions.</p>
                            </div>

                            {pendingLogbooks.length === 0 && logbooks.length === 0 && (
                                <div className="card">
                                    <div className="card-content">
                                        <div className="empty-state">
                                            <span className="empty-icon">📝</span>
                                            <h3>No logbooks submitted yet</h3>
                                            <p>Logbooks submitted by your students will appear here for review.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {pendingLogbooks.length > 0 && (
                                <div className="card">
                                    <div className="card-header"><h2 className="card-title">Pending Review</h2></div>
                                    <div className="entries-list" style={{ padding: '1.5rem' }}>
                                        {pendingLogbooks.map(lb => (
                                            <div key={lb.id} className="entry-card pending">
                                                <div className="entry-header">
                                                    <div className="entry-meta">
                                                        <span>📝 Week {lb.weekNo}</span>
                                                        <span>🕒 {lb.submittedAt}</span>
                                                    </div>
                                                    <span className="badge badge-pending">Awaiting Review</span>
                                                </div>
                                                <h3 className="entry-title">{lb.workDone?.[0] || `Week ${lb.weekNo} Entry`}</h3>
                                                <p className="entry-text"><strong>Student:</strong> {lb.studentName} · {lb.studentId}</p>
                                                <p className="entry-text"><strong>Project:</strong> {lb.projectTitle}</p>
                                                <div className="entry-actions">
                                                    <button className="btn btn-outline btn-sm" onClick={() => setViewingLogbook(lb)}>📄 Full Review</button>
                                                    <button className="btn btn-reject btn-sm" onClick={() => openFeedbackModal('logbook', lb.id, 'reject')}>✗ Request Revision</button>
                                                    <button className="btn btn-approve btn-sm" onClick={() => approveLogbook(lb.id)}>✓ Approve &amp; Lock</button>
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
                                                    <div className="entry-meta">
                                                        <span>📝 Week {lb.weekNo}</span>
                                                        <span>🕒 {lb.submittedAt}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <span className="badge badge-approved">Approved</span>
                                                        <span className="badge" style={{ background: '#f3e5f5', color: '#6a1b9a' }}>🔒 Locked</span>
                                                    </div>
                                                </div>
                                                <h3 className="entry-title">{lb.workDone?.[0] || `Week ${lb.weekNo} Entry`}</h3>
                                                <p className="entry-text"><strong>Student:</strong> {lb.studentName}</p>
                                                {lb.digitalApproval && (
                                                    <p className="entry-text" style={{ fontSize: '0.8rem' }}>
                                                        🔐 Digitally approved by {lb.digitalApproval.approvedBy} · {lb.digitalApproval.timestamp}
                                                    </p>
                                                )}
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
                                                    <div className="entry-meta">
                                                        <span>📝 Week {lb.weekNo}</span>
                                                    </div>
                                                    <span className="badge badge-rejected">Revision Requested</span>
                                                </div>
                                                <h3 className="entry-title">{lb.workDone?.[0] || `Week ${lb.weekNo} Entry`}</h3>
                                                <p className="entry-text"><strong>Feedback sent:</strong> {lb.supervisorFeedback}</p>
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

                {/* ══════════════════ PROPOSALS ══════════════════ */}
                <div className={`page-content ${activePage === 'proposals' ? 'active' : ''}`}>

                    {viewingProposal ? (
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">Proposal Review</h2>
                                <span className={`badge badge-${viewingProposal.status}`}>{viewingProposal.status}</span>
                            </div>
                            <div className="card-content">
                                <table style={{ width: '100%', marginBottom: '1.5rem' }}>
                                    <tbody>
                                        <tr><td style={{ padding: '0.5rem 0', fontWeight: '600', width: '180px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>TITLE</td><td style={{ padding: '0.5rem 0' }}>{viewingProposal.title}</td></tr>
                                        <tr><td style={{ padding: '0.5rem 0', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>RESEARCH AREA</td><td style={{ padding: '0.5rem 0' }}>{viewingProposal.researchArea}</td></tr>
                                        <tr><td style={{ padding: '0.5rem 0', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>MEMBERS</td><td style={{ padding: '0.5rem 0' }}>{viewingProposal.groupMembers || 'Not specified'}</td></tr>
                                        <tr><td style={{ padding: '0.5rem 0', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>SUBMITTED</td><td style={{ padding: '0.5rem 0' }}>{viewingProposal.submittedAt}</td></tr>
                                    </tbody>
                                </table>

                                <div className="logbook-section">
                                    <div className="logbook-section-title">Description</div>
                                    <p style={{ fontSize: '0.9rem', lineHeight: '1.7' }}>{viewingProposal.description}</p>
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
                                    <div style={{ background: '#ffebee', borderLeft: '4px solid #c62828', padding: '1rem 1.25rem', borderRadius: '10px', marginTop: '1rem' }}>
                                        <strong>💬 Rejection Feedback:</strong> {viewingProposal.supervisorFeedback}
                                        <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>Sent {viewingProposal.rejectedAt}</p>
                                    </div>
                                )}

                                {viewingProposal.status === 'pending' && (
                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                        <button className="btn btn-outline" onClick={() => setViewingProposal(null)}>← Back</button>
                                        <button className="btn btn-reject" onClick={() => openFeedbackModal('proposal', viewingProposal.id, 'reject')}>✗ Reject</button>
                                        <button className="btn btn-approve" onClick={() => approveProposal(viewingProposal.id)}>✓ Approve &amp; Forward to Coordinator</button>
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
                            <div className="content-header">
                                <h1>Review Proposals</h1>
                                <p>Evaluate assigned proposals. Approved proposals are automatically forwarded to the coordinator.</p>
                            </div>

                            {proposals.length === 0 && (
                                <div className="card">
                                    <div className="card-content">
                                        <div className="empty-state">
                                            <span className="empty-icon">📋</span>
                                            <h3>No proposals assigned yet</h3>
                                            <p>Proposals matched to you by the system will appear here.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {pendingProposals.length > 0 && (
                                <div className="card">
                                    <div className="card-header"><h2 className="card-title">Awaiting Your Review</h2></div>
                                    <div className="entries-list" style={{ padding: '1.5rem' }}>
                                        {pendingProposals.map(p => (
                                            <div key={p.id} className="entry-card pending">
                                                <div className="entry-header">
                                                    <div className="entry-meta">
                                                        <span>📋 New Assignment</span>
                                                        <span>🕒 {p.submittedAt}</span>
                                                    </div>
                                                    <span className="badge badge-pending">Awaiting Review</span>
                                                </div>
                                                <h3 className="entry-title">{p.title}</h3>
                                                <p className="entry-text"><strong>Area:</strong> {p.researchArea} · <strong>Members:</strong> {p.groupMembers || 'Not specified'}</p>
                                                <div className="entry-actions">
                                                    <button className="btn btn-outline btn-sm" onClick={() => setViewingProposal(p)}>📄 Full Review</button>
                                                    <button className="btn btn-reject btn-sm" onClick={() => { setViewingProposal(p); openFeedbackModal('proposal', p.id, 'reject'); }}>✗ Reject</button>
                                                    <button className="btn btn-approve btn-sm" onClick={() => approveProposal(p.id)}>✓ Approve &amp; Forward</button>
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
                                                    <div className="entry-meta"><span>📋 {p.submittedAt}</span></div>
                                                    <span className="badge badge-approved">Approved &amp; Forwarded</span>
                                                </div>
                                                <h3 className="entry-title">{p.title}</h3>
                                                {p.supervisorApproval && (
                                                    <p className="entry-text" style={{ fontSize: '0.8rem' }}>
                                                        🔐 Approved by {p.supervisorApproval.approvedBy} · {p.supervisorApproval.timestamp}
                                                    </p>
                                                )}
                                                <div className="entry-actions">
                                                    <button className="btn btn-outline btn-sm" onClick={() => setViewingProposal(p)}>View</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {proposals.filter(p => p.status === 'rejected').length > 0 && (
                                <div className="card">
                                    <div className="card-header"><h2 className="card-title">Rejected</h2></div>
                                    <div className="entries-list" style={{ padding: '1.5rem' }}>
                                        {proposals.filter(p => p.status === 'rejected').map(p => (
                                            <div key={p.id} className="entry-card rejected">
                                                <div className="entry-header">
                                                    <div className="entry-meta"><span>📋 {p.submittedAt}</span></div>
                                                    <span className="badge badge-rejected">Rejected</span>
                                                </div>
                                                <h3 className="entry-title">{p.title}</h3>
                                                <p className="entry-text"><strong>Feedback:</strong> {p.supervisorFeedback}</p>
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

                {/* ══════════════════ GROUPS ══════════════════ */}
                <div className={`page-content ${activePage === 'groups' ? 'active' : ''}`}>
                    <div className="content-header">
                        <h1>Assigned Groups</h1>
                        <p>Monitor all supervised projects and their logbook progress.</p>
                    </div>

                    {assignedGroups.length === 0 ? (
                        <div className="card">
                            <div className="card-content">
                                <div className="empty-state">
                                    <span className="empty-icon">👥</span>
                                    <h3>No groups assigned yet</h3>
                                    <p>Groups will appear here once their proposals are approved.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        assignedGroups.map(p => {
                            const groupLogbooks = logbooks.filter(l => l.projectTitle === p.title);
                            const approved = groupLogbooks.filter(l => l.status === 'approved').length;
                            const progress = Math.round((groupLogbooks.length / 16) * 100);
                            return (
                                <div key={p.id} className="card">
                                    <div className="card-header">
                                        <h2 className="card-title">{p.title}</h2>
                                        <span className={`badge badge-${p.status}`}>{p.status}</span>
                                    </div>
                                    <div className="card-content">
                                        <table style={{ width: '100%' }}>
                                            <tbody>
                                                <tr><td style={{ padding: '0.4rem 0', fontWeight: 600, width: '180px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>MEMBERS</td><td>{p.groupMembers || 'Not specified'}</td></tr>
                                                <tr><td style={{ padding: '0.4rem 0', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>RESEARCH AREA</td><td>{p.researchArea}</td></tr>
                                                <tr><td style={{ padding: '0.4rem 0', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>LOGBOOKS</td><td>{groupLogbooks.length} submitted · {approved} approved</td></tr>
                                                <tr>
                                                    <td style={{ padding: '0.4rem 0', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>PROGRESS</td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <div className="progress-bar">
                                                                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                                                </div>
                                                            </div>
                                                            <span style={{ fontWeight: 700 }}>{progress}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ══════════════════ HISTORY ══════════════════ */}
                <div className={`page-content ${activePage === 'history' ? 'active' : ''}`}>
                    <div className="content-header">
                        <h1>Review History</h1>
                        <p>All your review decisions and actions.</p>
                    </div>
                    <div className="card">
                        <div className="card-header"><h2 className="card-title">All Reviews</h2></div>
                        {reviewHistory.length === 0 ? (
                            <div className="card-content">
                                <div className="empty-state">
                                    <span className="empty-icon">📜</span>
                                    <h3>No reviews yet</h3>
                                    <p>Your review history will appear here.</p>
                                </div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto', padding: '1.5rem' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', fontSize: '0.875rem' }}>DATE</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', fontSize: '0.875rem' }}>TYPE</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', fontSize: '0.875rem' }}>ITEM</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', fontSize: '0.875rem' }}>STUDENT</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', fontSize: '0.875rem' }}>DECISION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logbooks.filter(l => l.status !== 'pending').map(lb => (
                                            <tr key={`lb-${lb.id}`} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '1rem' }}>{lb.digitalApproval?.timestamp || lb.rejectedAt || lb.submittedAt}</td>
                                                <td style={{ padding: '1rem' }}>Logbook Wk {lb.weekNo}</td>
                                                <td style={{ padding: '1rem' }}>{lb.workDone?.[0]?.slice(0, 40) || '—'}</td>
                                                <td style={{ padding: '1rem' }}>{lb.studentName}</td>
                                                <td style={{ padding: '1rem' }}><span className={`badge badge-${lb.status}`}>{lb.status}</span></td>
                                            </tr>
                                        ))}
                                        {proposals.filter(p => p.status !== 'pending').map(p => (
                                            <tr key={`p-${p.id}`} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '1rem' }}>{p.supervisorApproval?.timestamp || p.rejectedAt || p.submittedAt}</td>
                                                <td style={{ padding: '1rem' }}>Proposal</td>
                                                <td style={{ padding: '1rem' }}>{p.title?.slice(0, 40)}</td>
                                                <td style={{ padding: '1rem' }}>{p.groupMembers || '—'}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span className={`badge badge-${p.status}`}>
                                                        {p.status === 'approved' ? 'Approved & Forwarded' : p.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* ══════════════════ PERFORMANCE ══════════════════ */}
                <div className={`page-content ${activePage === 'performance' ? 'active' : ''}`}>
                    <div className="content-header">
                        <h1>Performance Metrics</h1>
                        <p>Track your supervision stats.</p>
                    </div>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">{logbooks.length + proposals.length}</div>
                                    <div className="stat-label">Total Reviewed</div>
                                    <div className="stat-trend">Logbooks &amp; proposals</div>
                                </div>
                                <div className="stat-icon">📊</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">
                                        {logbooks.length > 0 ? `${Math.round((approvedLogbooks.length / logbooks.length) * 100)}%` : '—'}
                                    </div>
                                    <div className="stat-label">Approval Rate</div>
                                    <div className="stat-trend">Logbooks</div>
                                </div>
                                <div className="stat-icon">✅</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">{assignedGroups.length}</div>
                                    <div className="stat-label">Active Groups</div>
                                    <div className="stat-trend">This semester</div>
                                </div>
                                <div className="stat-icon">🎯</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">{4 - assignedGroups.length}</div>
                                    <div className="stat-label">Available Slots</div>
                                    <div className="stat-trend">Out of 4 maximum</div>
                                </div>
                                <div className="stat-icon">📈</div>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default SupervisorDashboard;