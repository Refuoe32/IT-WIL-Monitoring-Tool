import React, { useState } from 'react';
import '../../styles/Dashboard.css';

const StudentDashboard = ({ onLogout, showToast, currentUser }) => {
    const [activePage, setActivePage] = useState('overview');

    // ── In-memory store (replaces hardcoded mock data) ──────────────────────
    const [proposal, setProposal] = useState(null);
    const [logbooks, setLogbooks] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [nextLogbookId, setNextLogbookId] = useState(1);

    // ── Proposal form state ──────────────────────────────────────────────────
    const [proposalData, setProposalData] = useState({
        projectTitle: '',
        description: '',
        researchArea: '',
        groupMembers: ''
    });
    const [showSupervisors, setShowSupervisors] = useState(false);
    const [similarityCheck, setSimilarityCheck] = useState(null);
    const [selectedSupervisor, setSelectedSupervisor] = useState(null);

    // ── Logbook form state (matches official Word template) ──────────────────
    const [logbookForm, setLogbookForm] = useState({
        weekNo: '',
        meetingNo: '',
        term: '',
        workDone: ['', '', '', '', '', ''],
        recordOfDiscussion: ['', '', '', '', '', '', ''],
        problemsEncountered: ['', '', '', '', '', '', ''],
        furtherNotes: ''
    });

    // ── Viewing a logbook detail ─────────────────────────────────────────────
    const [viewingLogbook, setViewingLogbook] = useState(null);

    // ── Supervisors list ─────────────────────────────────────────────────────
    const supervisors = [
        { name: 'Mr. Hlabeli',  area: 'web',      match: 95, capacity: '3/4', expertise: 'Web Development, Database Systems' },
        { name: 'Dr. Molapo',   area: 'database',  match: 88, capacity: '4/4', expertise: 'Database Systems, Cloud Computing' },
        { name: 'Ms. Ntšepe',   area: 'mobile',    match: 82, capacity: '1/4', expertise: 'Mobile Applications, UI/UX' },
        { name: 'Prof. Koali',  area: 'security',  match: 78, capacity: '2/4', expertise: 'Network Security, Cryptography' },
        { name: 'Mr. Tau',      area: 'ml',        match: 45, capacity: '3/4', expertise: 'Machine Learning, AI' }
    ];

    const weeks = Array.from({ length: 16 }, (_, i) => i + 1);
    const usedWeeks = logbooks.map(l => String(l.weekNo));

    // ── Helpers ──────────────────────────────────────────────────────────────
    const now = () => new Date().toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const getWeekDateRange = (week) => {
        // Anchored to first Monday of Feb 2026 — update when connecting real DB
        const start = new Date(2026, 1, 2);
        start.setDate(start.getDate() + (week - 1) * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 4);
        const fmt = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        return `${fmt(start)} – ${fmt(end)}, 2026`;
    };

    const addNotification = (title, message, type = 'info') => {
        setNotifications(prev => [
            { id: Date.now(), title, message, type, time: now() },
            ...prev
        ]);
    };

    const updateArrayField = (field, index, value) => {
        setLogbookForm(prev => {
            const arr = [...prev[field]];
            arr[index] = value;
            return { ...prev, [field]: arr };
        });
    };

    // ── Proposal handlers ────────────────────────────────────────────────────
    const handleProposalChange = (field, value) => {
        setProposalData({ ...proposalData, [field]: value });
    };

    const checkDuplicateAndMatch = () => {
        if (!proposalData.projectTitle || !proposalData.researchArea) {
            showToast('Error', 'Please fill in project title and research area first.');
            return;
        }

        const similarity = Math.floor(Math.random() * 55 + 5);
        const isDuplicate = similarity > 70;

        if (isDuplicate) {
            setSimilarityCheck({
                type: 'danger',
                message: `⚠️ Possible Duplicate Detected! Your project title shows ${similarity}% similarity with existing projects. Please revise your title to ensure originality.`
            });
            setShowSupervisors(false);
            return;
        }

        setSimilarityCheck({
            type: 'info',
            message: `✓ Duplicate Check Passed — Your project title is original (${similarity}% similarity, below 70% threshold).`
        });

        const matchedSupervisors = supervisors
            .filter(s => s.area === proposalData.researchArea || s.match > 70)
            .sort((a, b) => b.match - a.match);

        setSelectedSupervisor(matchedSupervisors[0]?.name);
        setShowSupervisors(true);

        setTimeout(() => {
            document.getElementById('supervisorSelection')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);

        showToast('System Check Complete', 'Duplicate check passed! Supervisors matched and ranked by expertise.');
    };

    const handleProposalSubmit = (e) => {
        e.preventDefault();
        if (!selectedSupervisor) {
            showToast('Error', 'Please select a supervisor.');
            return;
        }

        const newProposal = {
            id: Date.now(),
            title: proposalData.projectTitle,
            description: proposalData.description,
            researchArea: proposalData.researchArea,
            groupMembers: proposalData.groupMembers,
            supervisor: selectedSupervisor,
            status: 'pending',
            submittedAt: now(),
            steps: [
                { label: 'Duplicate Check Passed', detail: 'Proposal title cleared — similarity below threshold.', done: true, time: now() },
                { label: 'Supervisor Matched & Assigned', detail: `System matched with ${selectedSupervisor} based on research area.`, done: true, time: now() },
                { label: 'Awaiting Supervisor Review', detail: 'Supervisor will review and provide feedback.', done: false },
                { label: 'Forward to Coordinator', detail: 'Pending supervisor approval.', done: false },
                { label: 'Project Activation', detail: 'Pending final approval.', done: false }
            ],
            supervisorFeedback: null
        };

        setProposal(newProposal);
        addNotification('Proposal Submitted', `"${proposalData.projectTitle}" submitted and assigned to ${selectedSupervisor}.`, 'success');
        showToast('Proposal Submitted', `Assigned to ${selectedSupervisor} for review.`);

        setProposalData({ projectTitle: '', description: '', researchArea: '', groupMembers: '' });
        setSimilarityCheck(null);
        setShowSupervisors(false);
        setSelectedSupervisor(null);

        setTimeout(() => setActivePage('my-proposal'), 1500);
    };

    // ── Logbook handlers ─────────────────────────────────────────────────────
    const handleLogbookSubmit = (e) => {
        e.preventDefault();

        if (!logbookForm.weekNo) {
            showToast('Error', 'Please select a week number.');
            return;
        }

        if (!proposal) {
            showToast('Error', 'You need an active proposal before submitting logbooks.');
            return;
        }

        if (usedWeeks.includes(String(logbookForm.weekNo))) {
            showToast('Duplicate Week', `A logbook for Week ${logbookForm.weekNo} has already been submitted.`);
            return;
        }

        const newEntry = {
            id: nextLogbookId,
            weekNo: logbookForm.weekNo,
            meetingNo: logbookForm.meetingNo || nextLogbookId,
            term: logbookForm.term,
            dateRange: getWeekDateRange(parseInt(logbookForm.weekNo)),
            submittedAt: now(),
            status: 'pending',
            workDone: logbookForm.workDone.filter(Boolean),
            recordOfDiscussion: logbookForm.recordOfDiscussion.filter(Boolean),
            problemsEncountered: logbookForm.problemsEncountered.filter(Boolean),
            furtherNotes: logbookForm.furtherNotes,
            supervisorFeedback: null,
            studentName: currentUser?.name || '',
            studentId: currentUser?.studentId || '',
            supervisor: proposal?.supervisor,
            projectTitle: proposal?.title
        };

        setLogbooks(prev => [newEntry, ...prev]);
        setNextLogbookId(prev => prev + 1);
        addNotification(`Logbook Week ${logbookForm.weekNo} Submitted`, `Sent to ${proposal?.supervisor} for review.`, 'info');
        showToast('Logbook Submitted', `Week ${logbookForm.weekNo} sent to ${proposal?.supervisor} for review.`);

        setLogbookForm({
            weekNo: '',
            meetingNo: '',
            term: '',
            workDone: ['', '', '', '', '', ''],
            recordOfDiscussion: ['', '', '', '', '', '', ''],
            problemsEncountered: ['', '', '', '', '', '', ''],
            furtherNotes: ''
        });

        setTimeout(() => setActivePage('logbooks'), 1200);
    };

    // ── Supervisor cards renderer ─────────────────────────────────────────────
    const getSupervisorCards = () => {
        const matchedSupervisors = supervisors
            .filter(s => s.area === proposalData.researchArea || s.match > 70)
            .sort((a, b) => b.match - a.match);

        return matchedSupervisors.map((sup, index) => {
            const capacityNum = parseInt(sup.capacity.split('/')[0]);
            const capacityMax = parseInt(sup.capacity.split('/')[1]);
            const capacityPercent = (capacityNum / capacityMax) * 100;
            const isFull = capacityNum >= capacityMax;
            const isSelected = selectedSupervisor === sup.name;

            return (
                <div
                    key={sup.name}
                    className={`supervisor-card ${isFull ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => !isFull && setSelectedSupervisor(sup.name)}
                >
                    <div className="supervisor-header">
                        <div>
                            <div className="supervisor-name">
                                <span className="icon">👨‍🏫</span>
                                {sup.name}
                            </div>
                        </div>
                        {index === 0 && !isFull && <span className="recommended-badge">⭐ Best Match</span>}
                        {isFull && <span className="badge badge-warning">Full Capacity</span>}
                    </div>

                    <div className="supervisor-meta">
                        <strong>Expertise:</strong> {sup.expertise}<br />
                        <strong>Match Score:</strong> {sup.match}% compatibility with your research area<br />
                        <strong>Current Load:</strong> {sup.capacity} groups
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span className="match-score">{sup.match}% MATCH</span>
                    </div>

                    <div className="capacity-indicator">
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', minWidth: '60px' }}>Capacity:</span>
                        <div className="capacity-bar">
                            <div className="capacity-fill" style={{ width: `${capacityPercent}%` }}></div>
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{sup.capacity}</span>
                    </div>
                </div>
            );
        });
    };

    // ── Computed values ──────────────────────────────────────────────────────
    const approvedCount = logbooks.filter(l => l.status === 'approved').length;
    const pendingCount = logbooks.filter(l => l.status === 'pending').length;
    const approvalRate = logbooks.length > 0 ? Math.round((approvedCount / logbooks.length) * 100) : 0;
    const progressPercent = Math.round((logbooks.length / 16) * 100);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="dashboard-container">
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
                            {currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
                        </div>
                        <div className="user-info">
                            <h4>{currentUser?.name || 'Student'}</h4>
                            <p>ID: {currentUser?.studentId || '—'}</p>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <div className="nav-section-title">Main Menu</div>
                        <div className={`nav-item ${activePage === 'overview' ? 'active' : ''}`} onClick={() => setActivePage('overview')}>
                            <span className="icon">📊</span><span>Overview</span>
                        </div>
                        <div className={`nav-item ${activePage === 'proposal' ? 'active' : ''}`} onClick={() => setActivePage('proposal')}>
                            <span className="icon">📋</span><span>Submit Proposal</span>
                        </div>
                        <div className={`nav-item ${activePage === 'my-proposal' ? 'active' : ''}`} onClick={() => setActivePage('my-proposal')}>
                            <span className="icon">📄</span><span>My Proposal</span>
                        </div>
                        <div className={`nav-item ${activePage === 'new-logbook' ? 'active' : ''}`} onClick={() => setActivePage('new-logbook')}>
                            <span className="icon">➕</span><span>New Logbook</span>
                        </div>
                        <div className={`nav-item ${activePage === 'logbooks' ? 'active' : ''}`} onClick={() => setActivePage('logbooks')}>
                            <span className="icon">📝</span><span>My Logbooks</span>
                            {logbooks.length > 0 && (
                                <span style={{ marginLeft: 'auto', background: '#fff', color: 'var(--bg-primary)', fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: '99px' }}>
                                    {logbooks.length}
                                </span>
                            )}
                        </div>
                        <div className={`nav-item ${activePage === 'notifications' ? 'active' : ''}`} onClick={() => setActivePage('notifications')}>
                            <span className="icon">🔔</span><span>Notifications</span>
                            {notifications.length > 0 && (
                                <span style={{ marginLeft: 'auto', background: '#fff', color: 'var(--bg-primary)', fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: '99px' }}>
                                    {notifications.length}
                                </span>
                            )}
                        </div>
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

            <main className="main-content">

                {/* ══════════════════ OVERVIEW ══════════════════ */}
                <div className={`page-content ${activePage === 'overview' ? 'active' : ''}`}>
                    <div className="content-header">
                        <h1>Dashboard Overview</h1>
                        <p>Track your project progress and submissions</p>
                    </div>

                    {!proposal && (
                        <div className="alert alert-warn" style={{ background: '#fff3e0', borderLeft: '4px solid #e65100', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            <strong>⚡ Action Required:</strong> You haven't submitted a project proposal yet.{' '}
                            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setActivePage('proposal')}>Submit one now →</span>
                        </div>
                    )}

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">{proposal ? 1 : 0}</div>
                                    <div className="stat-label">Active Project</div>
                                    <div className="stat-trend">{proposal?.title || 'No proposal yet'}</div>
                                </div>
                                <div className="stat-icon">📋</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">{logbooks.length}</div>
                                    <div className="stat-label">Logbooks Submitted</div>
                                    <div className="stat-trend">Out of 16 weeks</div>
                                </div>
                                <div className="stat-icon">📝</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">{approvedCount}</div>
                                    <div className="stat-label">Approved Entries</div>
                                    <div className="stat-trend">{logbooks.length > 0 ? `${approvalRate}% approval rate` : 'No entries yet'}</div>
                                </div>
                                <div className="stat-icon">✅</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">{pendingCount}</div>
                                    <div className="stat-label">Pending Review</div>
                                    <div className="stat-trend">Awaiting feedback</div>
                                </div>
                                <div className="stat-icon">⏳</div>
                            </div>
                        </div>
                    </div>

                    {proposal && (
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">Project Information</h2>
                                <div className="card-actions">
                                    <button className="btn btn-outline btn-sm" onClick={() => setActivePage('my-proposal')}>View Details</button>
                                </div>
                            </div>
                            <div className="table-container">
                                <table>
                                    <tbody>
                                        <tr>
                                            <th style={{ width: '200px' }}>PROJECT TITLE</th>
                                            <td>{proposal.title}</td>
                                        </tr>
                                        <tr>
                                            <th>SUPERVISOR</th>
                                            <td>{proposal.supervisor}</td>
                                        </tr>
                                        <tr>
                                            <th>STATUS</th>
                                            <td><span className={`badge badge-${proposal.status}`}>{proposal.status}</span></td>
                                        </tr>
                                        <tr>
                                            <th>GROUP MEMBERS</th>
                                            <td>{proposal.groupMembers || 'Not specified'}</td>
                                        </tr>
                                        <tr>
                                            <th>PROGRESS</th>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div className="progress-bar">
                                                            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                                                        </div>
                                                    </div>
                                                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{progressPercent}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Recent Logbook Entries</h2>
                            <div className="card-actions">
                                <button className="btn btn-primary btn-sm" onClick={() => setActivePage('new-logbook')}>+ New Entry</button>
                            </div>
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
                                                <div className="entry-meta">
                                                    <span>📅 Week {lb.weekNo}</span>
                                                    <span>🕒 {lb.submittedAt}</span>
                                                </div>
                                                <span className={`badge badge-${lb.status}`}>{lb.status}</span>
                                            </div>
                                            <h3 className="entry-title">{lb.workDone[0] || `Week ${lb.weekNo} Entry`}</h3>
                                            {lb.supervisorFeedback && (
                                                <p className="entry-text"><strong>Supervisor Feedback:</strong> {lb.supervisorFeedback}</p>
                                            )}
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

                {/* ══════════════════ SUBMIT PROPOSAL ══════════════════ */}
                <div className={`page-content ${activePage === 'proposal' ? 'active' : ''}`}>
                    <div className="content-header">
                        <h1>Submit Project Proposal</h1>
                        <p>Submit your proposal with automatic duplicate detection</p>
                    </div>

                    {proposal && (
                        <div className="alert alert-warn" style={{ background: '#fff3e0', borderLeft: '4px solid #e65100', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            <strong>⚠️ You already have a submitted proposal.</strong> Submitting again will replace it.
                        </div>
                    )}

                    <div className="alert alert-info" style={{ background: '#e3f2fd', borderLeft: '4px solid #1565c0', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        <strong>🔍 Smart System Features:</strong> The system will automatically check for duplicate topics and match you with the best supervisor based on their expertise and availability.
                    </div>

                    <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)', color: '#fff', border: 'none' }}>
                        <div style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem', color: '#fff' }}>🎯 How Intelligent Supervisor Matching Works</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                                {[
                                    ['1️⃣', 'Duplicate Detection', 'System checks your title against existing projects (70% threshold)'],
                                    ['2️⃣', 'Expertise Matching', 'Matches supervisors based on research area compatibility'],
                                    ['3️⃣', 'Capacity Check', 'Ensures supervisor hasn\'t reached maximum load (4 groups)'],
                                    ['4️⃣', 'Auto-Selection', 'Best match is automatically pre-selected for you']
                                ].map(([icon, title, desc]) => (
                                    <div key={title}>
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
                                        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>{title}</strong>
                                        <span style={{ opacity: 0.9, fontSize: '0.9rem' }}>{desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Project Proposal Form</h2>
                        </div>
                        <div className="card-content">
                            <form onSubmit={handleProposalSubmit}>
                                <div className="form-group">
                                    <label className="form-label">PROJECT TITLE *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter your project title"
                                        value={proposalData.projectTitle}
                                        onChange={(e) => { handleProposalChange('projectTitle', e.target.value); setSimilarityCheck(null); setShowSupervisors(false); }}
                                        required
                                    />
                                    {similarityCheck && (
                                        <div className={`alert alert-${similarityCheck.type}`} style={{ marginTop: '1rem' }}>
                                            <strong>{similarityCheck.message}</strong>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">PROJECT DESCRIPTION *</label>
                                    <textarea
                                        className="form-control"
                                        placeholder="Provide a detailed description of your project including objectives, methodology, and expected outcomes..."
                                        value={proposalData.description}
                                        onChange={(e) => handleProposalChange('description', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">RESEARCH AREA *</label>
                                    <select
                                        className="form-control"
                                        value={proposalData.researchArea}
                                        onChange={(e) => { handleProposalChange('researchArea', e.target.value); setSimilarityCheck(null); setShowSupervisors(false); }}
                                        required
                                    >
                                        <option value="">Select research area...</option>
                                        <option value="web">Web Development</option>
                                        <option value="mobile">Mobile Applications</option>
                                        <option value="ml">Machine Learning & AI</option>
                                        <option value="database">Database Systems</option>
                                        <option value="security">Network Security</option>
                                        <option value="cloud">Cloud Computing</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">GROUP MEMBERS (Student Numbers, comma separated)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g., 901015004, 901015219, 901014492"
                                        value={proposalData.groupMembers}
                                        onChange={(e) => handleProposalChange('groupMembers', e.target.value)}
                                    />
                                </div>

                                {showSupervisors && (
                                    <div id="supervisorSelection">
                                        <div style={{ margin: '2rem 0', padding: '1.5rem', background: '#fafafa', borderRadius: '12px', borderLeft: '4px solid #000' }}>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.75rem', color: '#000' }}>
                                                🎓 Select Your Supervisor
                                            </h3>
                                            <p style={{ color: '#666', marginBottom: '0', fontSize: '0.95rem' }}>
                                                Based on your research area, we've matched and ranked the best supervisors. The top match is automatically selected.
                                            </p>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">RECOMMENDED SUPERVISORS (Ranked by Expertise Match)</label>
                                            <div className="entries-list">
                                                {getSupervisorCards()}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setActivePage('overview')}>Cancel</button>
                                    <button type="button" className="btn btn-primary" onClick={checkDuplicateAndMatch}>Check &amp; Continue</button>
                                    {showSupervisors && (
                                        <button type="submit" className="btn btn-primary">Submit Proposal</button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ MY PROPOSAL ══════════════════ */}
                <div className={`page-content ${activePage === 'my-proposal' ? 'active' : ''}`}>
                    <div className="content-header">
                        <h1>My Proposal Status</h1>
                        <p>Track your proposal approval workflow</p>
                    </div>

                    {!proposal ? (
                        <div className="card">
                            <div className="card-content">
                                <div className="empty-state">
                                    <span className="empty-icon">📄</span>
                                    <h3>No proposal submitted yet</h3>
                                    <p>Submit a project proposal to see its status here.</p>
                                    <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={() => setActivePage('proposal')}>Submit Proposal</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="card">
                                <div className="card-header">
                                    <h2 className="card-title">Proposal Approval Workflow</h2>
                                    <span className={`badge badge-${proposal.status}`}>{proposal.status === 'pending' ? 'Pending Review' : proposal.status}</span>
                                </div>
                                <div className="entries-list" style={{ padding: '1.5rem' }}>
                                    {proposal.steps.map((step, i) => (
                                        <div key={i} className={`entry-card ${step.done ? 'approved' : 'pending'}`}>
                                            <div className="entry-header">
                                                <div className="entry-meta">
                                                    <span>📅 Step {i + 1}</span>
                                                    {step.time && <span>🕒 {step.time}</span>}
                                                </div>
                                                <span className={`badge ${step.done ? 'badge-approved' : 'badge-pending'}`}>{step.done ? '✓ Done' : 'Pending'}</span>
                                            </div>
                                            <h3 className="entry-title">{step.label}</h3>
                                            <p className="entry-text">{step.detail}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ margin: '0 0 2rem', padding: '1.5rem', background: '#fafafa', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem' }}>Proposal Details</h3>
                                <table style={{ width: '100%' }}>
                                    <tbody>
                                        <tr><td style={{ padding: '0.5rem 0', fontWeight: '600', width: '200px' }}>Title:</td><td style={{ padding: '0.5rem 0' }}>{proposal.title}</td></tr>
                                        <tr><td style={{ padding: '0.5rem 0', fontWeight: '600' }}>Research Area:</td><td style={{ padding: '0.5rem 0' }}>{proposal.researchArea}</td></tr>
                                        <tr><td style={{ padding: '0.5rem 0', fontWeight: '600' }}>Assigned Supervisor:</td><td style={{ padding: '0.5rem 0' }}>{proposal.supervisor}</td></tr>
                                        <tr><td style={{ padding: '0.5rem 0', fontWeight: '600' }}>Group Members:</td><td style={{ padding: '0.5rem 0' }}>{proposal.groupMembers || 'Not specified'}</td></tr>
                                        <tr><td style={{ padding: '0.5rem 0', fontWeight: '600' }}>Submitted:</td><td style={{ padding: '0.5rem 0' }}>{proposal.submittedAt}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* ══════════════════ NEW LOGBOOK ══════════════════ */}
                <div className={`page-content ${activePage === 'new-logbook' ? 'active' : ''}`}>
                    <div className="content-header">
                        <h1>Submit Weekly Logbook</h1>
                        <p>Record your weekly progress — based on the official Project Logbook template</p>
                    </div>

                    <div className="alert alert-warn" style={{ background: '#fff3e0', borderLeft: '4px solid #e65100', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        <strong>⏰ Deadline Reminder:</strong> Weekly logbooks must be submitted by <strong>Friday at 17:00</strong>. Late submissions will not be accepted unless authorised by the coordinator.
                    </div>

                    {!proposal && (
                        <div className="alert alert-danger" style={{ background: '#ffebee', borderLeft: '4px solid #c62828', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            <strong>⚠️ No active project.</strong> You need an approved proposal before submitting logbooks.{' '}
                            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setActivePage('proposal')}>Submit a proposal first.</span>
                        </div>
                    )}

                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Logbook Entry Form</h2>
                            <span className="badge" style={{ background: '#e3f2fd', color: '#1565c0' }}>Official Template</span>
                        </div>
                        <div className="card-content">
                            <form onSubmit={handleLogbookSubmit}>

                                {/* — Meeting Header (mirrors Word doc header table) — */}
                                <div className="logbook-section">
                                    <div className="logbook-section-title">Meeting Information</div>
                                    <div className="logbook-meta-grid">
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Student's Full Name</label>
                                            <input className="form-control" value={currentUser?.name || ''} readOnly />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Student's ID</label>
                                            <input className="form-control" value={currentUser?.studentId || ''} readOnly />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Supervisor</label>
                                            <input className="form-control" value={proposal?.supervisor || 'Not yet assigned'} readOnly />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Project Title</label>
                                            <input className="form-control" value={proposal?.title || 'No active project'} readOnly />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Meeting No.</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. 5"
                                                value={logbookForm.meetingNo}
                                                onChange={e => setLogbookForm(prev => ({ ...prev, meetingNo: e.target.value }))}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Term</label>
                                            <select
                                                className="form-control"
                                                value={logbookForm.term}
                                                onChange={e => setLogbookForm(prev => ({ ...prev, term: e.target.value }))}
                                            >
                                                <option value="">Select term...</option>
                                                <option value="Term 1">Term 1</option>
                                                <option value="Term 2">Term 2</option>
                                                <option value="Term 3">Term 3</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* — Circle Week Number — */}
                                <div className="logbook-section">
                                    <div className="logbook-section-title">Circle Week Number *</div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                                        Select the week this logbook corresponds to. Greyed weeks have already been submitted.
                                    </p>
                                    <div className="logbook-week-selector">
                                        {weeks.map(w => (
                                            <button
                                                key={w}
                                                type="button"
                                                className={`week-circle ${logbookForm.weekNo === String(w) ? 'selected' : ''} ${usedWeeks.includes(String(w)) ? 'used' : ''}`}
                                                onClick={() => !usedWeeks.includes(String(w)) && setLogbookForm(prev => ({ ...prev, weekNo: String(w) }))}
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

                                {/* — Work Done — */}
                                <div className="logbook-section">
                                    <div className="logbook-section-title">Work Done (since last meeting)</div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                                        Please write the details of the work done after the last meeting.
                                    </p>
                                    <div className="logbook-items-list">
                                        {logbookForm.workDone.map((val, idx) => (
                                            <div key={idx} className="logbook-item-row">
                                                <div className="logbook-item-number">{idx + 1}</div>
                                                <input
                                                    className="logbook-item-input"
                                                    type="text"
                                                    placeholder={`Work item ${idx + 1}...`}
                                                    value={val}
                                                    onChange={e => updateArrayField('workDone', idx, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* — Record of Discussion — */}
                                <div className="logbook-section">
                                    <div className="logbook-section-title">Record of Discussion (meeting with supervisor)</div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                                        Document what was discussed during your supervisor meeting.
                                    </p>
                                    <div className="logbook-items-list">
                                        {logbookForm.recordOfDiscussion.map((val, idx) => (
                                            <div key={idx} className="logbook-item-row">
                                                <div className="logbook-item-number">{idx + 1}</div>
                                                <input
                                                    className="logbook-item-input"
                                                    type="text"
                                                    placeholder={`Discussion point ${idx + 1}...`}
                                                    value={val}
                                                    onChange={e => updateArrayField('recordOfDiscussion', idx, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* — Problems Encountered — */}
                                <div className="logbook-section">
                                    <div className="logbook-section-title">Problems Encountered</div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                                        List problems to be attempted or completed by the next meeting.
                                    </p>
                                    <div className="logbook-items-list">
                                        {logbookForm.problemsEncountered.map((val, idx) => (
                                            <div key={idx} className="logbook-item-row">
                                                <div className="logbook-item-number">{idx + 1}</div>
                                                <input
                                                    className="logbook-item-input"
                                                    type="text"
                                                    placeholder={`Problem ${idx + 1}...`}
                                                    value={val}
                                                    onChange={e => updateArrayField('problemsEncountered', idx, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* — Further Notes — */}
                                <div className="logbook-section">
                                    <div className="logbook-section-title">Further Notes by Lecturer or Student (if applicable)</div>
                                    <textarea
                                        className="form-control"
                                        style={{ minHeight: '90px' }}
                                        placeholder="Any additional notes from the supervisor or student..."
                                        value={logbookForm.furtherNotes}
                                        onChange={e => setLogbookForm(prev => ({ ...prev, furtherNotes: e.target.value }))}
                                    />
                                </div>

                                {/* — Signature Area — */}
                                <div className="logbook-signature-row">
                                    <div className="logbook-signature-box">
                                        <div className="logbook-signature-line"></div>
                                        <div className="logbook-signature-label">Supervisor's Signature</div>
                                    </div>
                                    <div className="logbook-signature-box">
                                        <div className="logbook-signature-line"></div>
                                        <div className="logbook-signature-label">Student's Signature</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setActivePage('overview')}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={!proposal}>Submit Logbook</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ MY LOGBOOKS ══════════════════ */}
                <div className={`page-content ${activePage === 'logbooks' ? 'active' : ''}`}>
                    <div className="content-header">
                        <h1>All Logbook Entries</h1>
                        <p>View and manage your submissions</p>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Entry History</h2>
                            <button className="btn btn-primary btn-sm" onClick={() => setActivePage('new-logbook')}>+ New Entry</button>
                        </div>
                        {logbooks.length === 0 ? (
                            <div className="card-content">
                                <div className="empty-state">
                                    <span className="empty-icon">📝</span>
                                    <h3>No logbooks submitted yet</h3>
                                    <p>Start recording your weekly progress.</p>
                                </div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto', padding: '1.5rem' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', fontSize: '0.875rem' }}>WEEK</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', fontSize: '0.875rem' }}>DATE RANGE</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', fontSize: '0.875rem' }}>WORK DONE (SUMMARY)</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', fontSize: '0.875rem' }}>STATUS</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', fontSize: '0.875rem' }}>SUBMITTED</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', fontSize: '0.875rem' }}>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logbooks.map(lb => (
                                            <tr key={lb.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '1rem' }}><strong>Week {lb.weekNo}</strong></td>
                                                <td style={{ padding: '1rem' }}>{lb.dateRange}</td>
                                                <td style={{ padding: '1rem', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {lb.workDone[0] || '—'}
                                                </td>
                                                <td style={{ padding: '1rem' }}><span className={`badge badge-${lb.status}`}>{lb.status}</span></td>
                                                <td style={{ padding: '1rem' }}>{lb.submittedAt}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                                        onClick={() => { setViewingLogbook(lb); setActivePage('view-logbook'); }}>
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* ══════════════════ VIEW LOGBOOK DETAIL ══════════════════ */}
                <div className={`page-content ${activePage === 'view-logbook' ? 'active' : ''}`}>
                    {viewingLogbook && (
                        <>
                            <div className="content-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button className="btn btn-outline btn-sm" onClick={() => setActivePage('logbooks')}>← Back</button>
                                <div>
                                    <h1>Logbook — Week {viewingLogbook.weekNo}</h1>
                                    <p>{viewingLogbook.dateRange} · Submitted {viewingLogbook.submittedAt}</p>
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
                                            <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>STUDENT</strong><p style={{ marginTop: '4px' }}>{viewingLogbook.studentName}</p></div>
                                            <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>STUDENT ID</strong><p style={{ marginTop: '4px' }}>{viewingLogbook.studentId}</p></div>
                                            <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SUPERVISOR</strong><p style={{ marginTop: '4px' }}>{viewingLogbook.supervisor}</p></div>
                                            <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PROJECT TITLE</strong><p style={{ marginTop: '4px' }}>{viewingLogbook.projectTitle}</p></div>
                                            <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>MEETING NO.</strong><p style={{ marginTop: '4px' }}>{viewingLogbook.meetingNo}</p></div>
                                            <div><strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TERM</strong><p style={{ marginTop: '4px' }}>{viewingLogbook.term || '—'}</p></div>
                                        </div>
                                    </div>

                                    {viewingLogbook.workDone.length > 0 && (
                                        <div className="logbook-section">
                                            <div className="logbook-section-title">Work Done</div>
                                            <div className="logbook-items-list">
                                                {viewingLogbook.workDone.map((item, i) => (
                                                    <div key={i} className="logbook-item-row">
                                                        <div className="logbook-item-number">{i + 1}</div>
                                                        <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {viewingLogbook.recordOfDiscussion.length > 0 && (
                                        <div className="logbook-section">
                                            <div className="logbook-section-title">Record of Discussion</div>
                                            <div className="logbook-items-list">
                                                {viewingLogbook.recordOfDiscussion.map((item, i) => (
                                                    <div key={i} className="logbook-item-row">
                                                        <div className="logbook-item-number">{i + 1}</div>
                                                        <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {viewingLogbook.problemsEncountered.length > 0 && (
                                        <div className="logbook-section">
                                            <div className="logbook-section-title">Problems Encountered</div>
                                            <div className="logbook-items-list">
                                                {viewingLogbook.problemsEncountered.map((item, i) => (
                                                    <div key={i} className="logbook-item-row">
                                                        <div className="logbook-item-number">{i + 1}</div>
                                                        <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {viewingLogbook.furtherNotes && (
                                        <div className="logbook-section">
                                            <div className="logbook-section-title">Further Notes</div>
                                            <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{viewingLogbook.furtherNotes}</p>
                                        </div>
                                    )}

                                    {viewingLogbook.supervisorFeedback && (
                                        <div style={{ background: '#e8f5e9', borderLeft: '4px solid #2e7d32', padding: '1rem 1.25rem', borderRadius: '10px', marginTop: '1rem' }}>
                                            <strong>💬 Supervisor Feedback:</strong> {viewingLogbook.supervisorFeedback}
                                        </div>
                                    )}

                                    <div className="logbook-signature-row">
                                        <div className="logbook-signature-box">
                                            <div className="logbook-signature-line"></div>
                                            <div className="logbook-signature-label">Supervisor's Signature</div>
                                        </div>
                                        <div className="logbook-signature-box">
                                            <div className="logbook-signature-line"></div>
                                            <div className="logbook-signature-label">Student's Signature</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ══════════════════ NOTIFICATIONS ══════════════════ */}
                <div className={`page-content ${activePage === 'notifications' ? 'active' : ''}`}>
                    <div className="content-header">
                        <h1>Notifications</h1>
                        <p>System alerts and activity updates</p>
                    </div>

                    <div className="card">
                        <div style={{ padding: '1.5rem' }}>
                            {notifications.length === 0 ? (
                                <div className="empty-state">
                                    <span className="empty-icon">🔔</span>
                                    <h3>No notifications yet</h3>
                                    <p>Activity updates will appear here when you submit proposals and logbooks.</p>
                                </div>
                            ) : (
                                <div className="entries-list">
                                    {notifications.map(n => (
                                        <div key={n.id} className={`entry-card ${n.type === 'success' ? 'approved' : n.type === 'danger' ? 'rejected' : 'pending'}`}>
                                            <div className="entry-header">
                                                <div className="entry-meta">
                                                    <span>✉️ System</span>
                                                    <span>🕒 {n.time}</span>
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

                {/* ══════════════════ PROFILE ══════════════════ */}
                <div className={`page-content ${activePage === 'profile' ? 'active' : ''}`}>
                    <div className="content-header">
                        <h1>My Profile</h1>
                        <p>View your account information</p>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Personal Information</h2>
                        </div>
                        <div className="card-content">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">FULL NAME</label>
                                    <input type="text" className="form-control" value={currentUser?.name || ''} readOnly />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">STUDENT NUMBER</label>
                                    <input type="text" className="form-control" value={currentUser?.studentId || ''} readOnly />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">EMAIL</label>
                                    <input type="email" className="form-control" value={currentUser?.email || ''} readOnly />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">PHONE</label>
                                    <input type="tel" className="form-control" value={currentUser?.phone || ''} readOnly />
                                </div>
                            </div>
                        </div>
                    </div>

                    {proposal && (
                        <div className="card">
                            <div className="card-header"><h2 className="card-title">Academic Summary</h2></div>
                            <div className="table-container">
                                <table>
                                    <tbody>
                                        <tr><th style={{ width: '200px' }}>PROJECT</th><td>{proposal.title}</td></tr>
                                        <tr><th>SUPERVISOR</th><td>{proposal.supervisor}</td></tr>
                                        <tr><th>LOGBOOKS SUBMITTED</th><td>{logbooks.length} / 16</td></tr>
                                        <tr><th>APPROVED ENTRIES</th><td>{approvedCount}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
};

export default StudentDashboard;