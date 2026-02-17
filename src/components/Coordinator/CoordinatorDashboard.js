import React, { useState } from 'react';
import '../../styles/CoordinatorDashboard.css';

// ─── In-Memory Data Store ────────────────────────────────────────────────────
const initialData = {
    supervisors: [
        {
            id: 1,
            name: 'Mr. Hlabeli',
            email: 'hlabeli@wil.ac.ls',
            specialization: 'Web Development, E-Commerce',
            capacity: 4,
            groups: 3,
            totalSupervised: 28,
            activeProjects: 3,
            completedProjects: 22,
            rejectedProposals: 3,
            totalReviews: 24,
            avgResponseTime: 0.8,
            reviewHistory: [
                { date: '2025-01-10', action: 'Approved', project: 'IT WIL Monitoring Tool' },
                { date: '2025-01-12', action: 'Approved', project: 'E-Commerce Platform' },
                { date: '2025-01-15', action: 'Rejected', project: 'Duplicate Proposal X' },
            ],
        },
        {
            id: 2,
            name: 'Dr. Molapo',
            email: 'molapo@wil.ac.ls',
            specialization: 'AI, Machine Learning',
            capacity: 4,
            groups: 4,
            totalSupervised: 22,
            activeProjects: 4,
            completedProjects: 16,
            rejectedProposals: 2,
            totalReviews: 18,
            avgResponseTime: 0.8,
            reviewHistory: [
                { date: '2025-01-11', action: 'Approved', project: 'AI Chatbot System' },
                { date: '2025-01-14', action: 'Approved', project: 'ML Data Pipeline' },
            ],
        },
        {
            id: 3,
            name: 'Ms. Nkosi',
            email: 'nkosi@wil.ac.ls',
            specialization: 'Cybersecurity, Networking',
            capacity: 4,
            groups: 2,
            totalSupervised: 15,
            activeProjects: 2,
            completedProjects: 11,
            rejectedProposals: 2,
            totalReviews: 14,
            avgResponseTime: 1.2,
            reviewHistory: [
                { date: '2025-01-09', action: 'Approved', project: 'Network Monitor Pro' },
            ],
        },
    ],

    proposals: [
        { id: 1, title: 'IT WIL Monitoring Tool', students: 4, supervisorId: 1, status: 'approved', similarity: 12, submitted: '2025-01-05' },
        { id: 2, title: 'E-Commerce Platform with AI', students: 2, supervisorId: 1, status: 'with_supervisor', similarity: 34, submitted: '2025-01-14' },
        { id: 3, title: 'AI Chatbot System', students: 3, supervisorId: 2, status: 'approved', similarity: 18, submitted: '2025-01-08' },
        { id: 4, title: 'ML Data Pipeline', students: 2, supervisorId: 2, status: 'pending', similarity: 22, submitted: '2025-01-16' },
        { id: 5, title: 'Network Monitor Pro', students: 2, supervisorId: 3, status: 'approved', similarity: 9, submitted: '2025-01-06' },
        { id: 6, title: 'Blockchain Voting System', students: 3, supervisorId: null, status: 'pending', similarity: 45, submitted: '2025-01-17' },
        { id: 7, title: 'Smart Campus App', students: 4, supervisorId: null, status: 'pending', similarity: 28, submitted: '2025-01-18' },
        { id: 8, title: 'Duplicate ECommerce Clone', students: 2, supervisorId: null, status: 'flagged', similarity: 82, submitted: '2025-01-18' },
    ],

    projects: [
        { id: 1, title: 'IT WIL Monitoring Tool', students: 4, supervisorId: 1, progress: 65, status: 'active', startDate: '2025-01-10' },
        { id: 2, title: 'AI Chatbot System', students: 3, supervisorId: 2, progress: 80, status: 'active', startDate: '2025-01-12' },
        { id: 3, title: 'Network Monitor Pro', students: 2, supervisorId: 3, progress: 45, status: 'active', startDate: '2025-01-15' },
        { id: 4, title: 'Legacy CRM Upgrade', students: 3, supervisorId: 1, progress: 100, status: 'completed', startDate: '2024-08-01' },
        { id: 5, title: 'Student Portal v2', students: 4, supervisorId: 2, progress: 100, status: 'completed', startDate: '2024-08-05' },
    ],

    settings: {
        maxSupervisionLimit: 4,
        similarityThreshold: 70,
        logbookDeadline: 'Friday 17:00',
        autoAssignment: true,
        emailNotifications: true,
    },

    activityLog: [
        { id: 1, icon: '📤', time: '2 hours ago', badge: 'Forwarded', badgeType: 'approved', title: 'Proposal Approved & Forwarded', desc: 'E-Commerce Platform with AI — Approved by Mr. Hlabeli' },
        { id: 2, icon: '🔍', time: '3 hours ago', badge: 'Passed', badgeType: 'approved', title: 'Similarity Check Passed', desc: '34% similarity (below 70% threshold)' },
        { id: 3, icon: '🎯', time: '3 hours ago', badge: 'Matched', badgeType: 'approved', title: 'Supervisor Auto-Assignment', desc: 'Matched to Dr. Molapo (94% match score)' },
        { id: 4, icon: '🚩', time: '5 hours ago', badge: 'Flagged', badgeType: 'rejected', title: 'Duplicate Proposal Detected', desc: '"Duplicate ECommerce Clone" — 82% similarity' },
        { id: 5, icon: '✅', time: '1 day ago', badge: 'Completed', badgeType: 'approved', title: 'Project Completed', desc: 'Legacy CRM Upgrade — Supervised by Mr. Hlabeli' },
    ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const calcSuccessRate = (s) =>
    s.totalSupervised > 0 ? Math.round((s.completedProjects / s.totalSupervised) * 100) : 0;

const getStatusBadge = (status) => {
    const map = {
        approved: { label: 'Approved', cls: 'badge-approved' },
        with_supervisor: { label: 'With Supervisor', cls: 'badge-pending' },
        pending: { label: 'Pending', cls: 'badge-pending' },
        flagged: { label: 'Flagged', cls: 'badge-rejected' },
        active: { label: 'Active', cls: 'badge-approved' },
        completed: { label: 'Completed', cls: 'badge-completed' },
    };
    return map[status] || { label: status, cls: 'badge-pending' };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ProgressBar = ({ value, color = 'var(--accent)' }) => (
    <div className="cd-progress-track">
        <div className="cd-progress-fill" style={{ width: `${value}%`, background: color }} />
        <span className="cd-progress-label">{value}%</span>
    </div>
);

const SupervisorCard = ({ sup, onSelect }) => {
    const rate = calcSuccessRate(sup);
    const load = Math.round((sup.groups / sup.capacity) * 100);
    return (
        <div className="cd-sup-card" onClick={() => onSelect(sup)}>
            <div className="cd-sup-card-top">
                <div className="cd-sup-avatar">{sup.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
                <div>
                    <div className="cd-sup-name">{sup.name}</div>
                    <div className="cd-sup-spec">{sup.specialization}</div>
                </div>
                <span className={`badge ${load >= 100 ? 'badge-rejected' : 'badge-approved'} cd-sup-badge`}>
                    {load >= 100 ? 'Full' : 'Available'}
                </span>
            </div>

            <div className="cd-sup-metrics">
                <div className="cd-metric">
                    <span className="cd-metric-val">{sup.totalSupervised}</span>
                    <span className="cd-metric-lbl">Total</span>
                </div>
                <div className="cd-metric">
                    <span className="cd-metric-val">{sup.activeProjects}</span>
                    <span className="cd-metric-lbl">Active</span>
                </div>
                <div className="cd-metric">
                    <span className="cd-metric-val">{sup.completedProjects}</span>
                    <span className="cd-metric-lbl">Done</span>
                </div>
                <div className="cd-metric">
                    <span className="cd-metric-val">{sup.rejectedProposals}</span>
                    <span className="cd-metric-lbl">Rejected</span>
                </div>
            </div>

            <div className="cd-sup-bottom">
                <div className="cd-sup-rate-row">
                    <span>Success Rate</span>
                    <strong>{rate}%</strong>
                </div>
                <ProgressBar value={rate} color={rate >= 80 ? 'var(--success)' : rate >= 60 ? 'var(--warning)' : 'var(--danger)'} />
                <div className="cd-sup-rate-row" style={{ marginTop: '0.6rem' }}>
                    <span>Capacity Load</span>
                    <strong>{sup.groups}/{sup.capacity}</strong>
                </div>
                <ProgressBar value={load} color={load >= 100 ? 'var(--danger)' : 'var(--accent)'} />
                <div className="cd-sup-footer">
                    <span>⏱ Avg Response: <strong>{sup.avgResponseTime} days</strong></span>
                    <span>📝 Reviews: <strong>{sup.totalReviews}</strong></span>
                </div>
            </div>
        </div>
    );
};

const SupervisorModal = ({ sup, onClose }) => {
    if (!sup) return null;
    const rate = calcSuccessRate(sup);
    return (
        <div className="cd-modal-overlay" onClick={onClose}>
            <div className="cd-modal" onClick={e => e.stopPropagation()}>
                <div className="cd-modal-header">
                    <div className="cd-modal-avatar">{sup.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
                    <div>
                        <h2>{sup.name}</h2>
                        <p>{sup.email}</p>
                        <p className="cd-modal-spec">{sup.specialization}</p>
                    </div>
                    <button className="cd-modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="cd-modal-stats">
                    {[
                        { label: 'Total Supervised', value: sup.totalSupervised },
                        { label: 'Active Projects', value: sup.activeProjects },
                        { label: 'Completed', value: sup.completedProjects },
                        { label: 'Rejected Proposals', value: sup.rejectedProposals },
                        { label: 'Avg Response Time', value: `${sup.avgResponseTime}d` },
                        { label: 'Success Rate', value: `${rate}%` },
                    ].map((m, i) => (
                        <div key={i} className="cd-modal-stat">
                            <div className="cd-modal-stat-val">{m.value}</div>
                            <div className="cd-modal-stat-lbl">{m.label}</div>
                        </div>
                    ))}
                </div>

                <div className="cd-modal-section">
                    <h3>Performance Overview</h3>
                    <div className="cd-modal-perf-row">
                        <span>Success Rate</span>
                        <div style={{ flex: 1, margin: '0 1rem' }}>
                            <ProgressBar value={rate} color={rate >= 80 ? 'var(--success)' : 'var(--warning)'} />
                        </div>
                        <strong>{rate}%</strong>
                    </div>
                    <div className="cd-modal-perf-row">
                        <span>Capacity</span>
                        <div style={{ flex: 1, margin: '0 1rem' }}>
                            <ProgressBar value={Math.round((sup.groups / sup.capacity) * 100)} />
                        </div>
                        <strong>{sup.groups}/{sup.capacity}</strong>
                    </div>
                </div>

                <div className="cd-modal-section">
                    <h3>Recent Review Activity</h3>
                    {sup.reviewHistory.map((r, i) => (
                        <div key={i} className="cd-modal-review">
                            <span className={`badge ${r.action === 'Approved' ? 'badge-approved' : 'badge-rejected'}`}>{r.action}</span>
                            <span className="cd-modal-review-title">{r.project}</span>
                            <span className="cd-modal-review-date">{r.date}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CoordinatorDashboard = ({ onLogout, showToast }) => {
    const [activePage, setActivePage] = useState('overview');
    const [data, setData] = useState(initialData);
    const [selectedSup, setSelectedSup] = useState(null);
    const [settingsForm, setSettingsForm] = useState(initialData.settings);
    const [proposalFilter, setProposalFilter] = useState('all');

    const supervisorName = (id) => {
        const s = data.supervisors.find(s => s.id === id);
        return s ? s.name : '—';
    };

    const totalStudents = data.projects.reduce((a, p) => a + p.students, 0);
    const pendingCount = data.proposals.filter(p => p.status === 'pending').length;
    const avgSuccessRate = Math.round(
        data.supervisors.reduce((a, s) => a + calcSuccessRate(s), 0) / data.supervisors.length
    );

    const filteredProposals = proposalFilter === 'all'
        ? data.proposals
        : data.proposals.filter(p => p.status === proposalFilter);

    const saveSettings = (e) => {
        e.preventDefault();
        setData(prev => ({ ...prev, settings: settingsForm }));
        showToast && showToast('Settings Saved', 'System settings updated successfully.');
    };

    const navItems = [
        { id: 'overview', icon: '📊', label: 'System Overview' },
        { id: 'proposals', icon: '📋', label: 'All Proposals' },
        { id: 'supervisors', icon: '👨‍🏫', label: 'Supervisors' },
        { id: 'projects', icon: '📁', label: 'All Projects' },
        { id: 'analytics', icon: '📈', label: 'Analytics' },
        { id: 'settings', icon: '⚙️', label: 'Settings' },
    ];

    return (
        <div className="cd-layout">
            {/* Sidebar */}
            <aside className="cd-sidebar">
                <div className="cd-sidebar-logo">
                    <div className="cd-logo-icon">📚</div>
                    <div>
                        <h2>WIL Monitor</h2>
                        <p>Coordinator Portal</p>
                    </div>
                </div>

                <div className="cd-user-block">
                    <div className="cd-user-avatar">DR</div>
                    <div>
                        <h4>Dr. Ramone</h4>
                        <p>Administrator</p>
                    </div>
                </div>

                <nav className="cd-nav">
                    <div className="cd-nav-label">Main Menu</div>
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`cd-nav-item ${activePage === item.id ? 'cd-nav-active' : ''}`}
                            onClick={() => setActivePage(item.id)}
                        >
                            <span className="cd-nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="cd-sidebar-footer">
                    <button className="cd-logout-btn" onClick={onLogout}>🚪 Logout</button>
                </div>
            </aside>

            {/* Main */}
            <main className="cd-main">

                {/* ── Overview ─────────────────────────────── */}
                {activePage === 'overview' && (
                    <div className="cd-page">
                        <div className="cd-page-header">
                            <div>
                                <h1>System Overview</h1>
                                <p>Monitor overall system performance</p>
                            </div>
                        </div>

                        <div className="cd-stats-grid">
                            {[
                                { icon: '📋', label: 'Total Projects', value: data.projects.length, sub: `${data.projects.filter(p => p.status === 'active').length} active` },
                                { icon: '👨‍🏫', label: 'Active Supervisors', value: data.supervisors.length, sub: 'All assigned' },
                                { icon: '🎓', label: 'Total Students', value: totalStudents, sub: 'Across all projects' },
                                { icon: '⏳', label: 'Pending Proposals', value: pendingCount, sub: 'Awaiting assignment' },
                                { icon: '📈', label: 'Avg Success Rate', value: `${avgSuccessRate}%`, sub: 'Supervisor average' },
                                { icon: '🔍', label: 'Flagged Proposals', value: data.proposals.filter(p => p.status === 'flagged').length, sub: 'High similarity' },
                            ].map((s, i) => (
                                <div key={i} className="cd-stat-card">
                                    <div className="cd-stat-icon">{s.icon}</div>
                                    <div className="cd-stat-val">{s.value}</div>
                                    <div className="cd-stat-lbl">{s.label}</div>
                                    <div className="cd-stat-sub">{s.sub}</div>
                                </div>
                            ))}
                        </div>

                        <div className="cd-card">
                            <div className="cd-card-header"><h2>Recent System Activity</h2></div>
                            <div className="cd-activity-list">
                                {data.activityLog.map(a => (
                                    <div key={a.id} className="cd-activity-item">
                                        <div className="cd-activity-icon">{a.icon}</div>
                                        <div className="cd-activity-body">
                                            <div className="cd-activity-top">
                                                <strong>{a.title}</strong>
                                                <span className="cd-activity-time">🕒 {a.time}</span>
                                            </div>
                                            <p>{a.desc}</p>
                                        </div>
                                        <span className={`badge badge-${a.badgeType}`}>{a.badge}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Proposals ────────────────────────────── */}
                {activePage === 'proposals' && (
                    <div className="cd-page">
                        <div className="cd-page-header">
                            <div>
                                <h1>All Proposals</h1>
                                <p>Monitor proposal workflow across the system</p>
                            </div>
                        </div>

                        <div className="cd-filter-bar">
                            {['all', 'pending', 'approved', 'with_supervisor', 'flagged'].map(f => (
                                <button
                                    key={f}
                                    className={`cd-filter-btn ${proposalFilter === f ? 'cd-filter-active' : ''}`}
                                    onClick={() => setProposalFilter(f)}
                                >
                                    {f === 'all' ? 'All' : f === 'with_supervisor' ? 'With Supervisor' : f.charAt(0).toUpperCase() + f.slice(1)}
                                    <span className="cd-filter-count">
                                        {f === 'all' ? data.proposals.length : data.proposals.filter(p => p.status === f).length}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="cd-card">
                            <div className="cd-card-header"><h2>Proposal Status Tracking</h2></div>
                            <div className="cd-table-wrap">
                                <table className="cd-table">
                                    <thead>
                                        <tr>
                                            <th>TITLE</th>
                                            <th>STUDENTS</th>
                                            <th>SUPERVISOR</th>
                                            <th>SIMILARITY</th>
                                            <th>SUBMITTED</th>
                                            <th>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProposals.map(p => {
                                            const s = getStatusBadge(p.status);
                                            const simColor = p.similarity >= 70 ? 'var(--danger)' : p.similarity >= 50 ? 'var(--warning)' : 'var(--success)';
                                            return (
                                                <tr key={p.id}>
                                                    <td><strong>{p.title}</strong></td>
                                                    <td>{p.students}</td>
                                                    <td>{supervisorName(p.supervisorId)}</td>
                                                    <td>
                                                        <span style={{ color: simColor, fontWeight: 600 }}>{p.similarity}%</span>
                                                    </td>
                                                    <td>{p.submitted}</td>
                                                    <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Supervisors ──────────────────────────── */}
                {activePage === 'supervisors' && (
                    <div className="cd-page">
                        <div className="cd-page-header">
                            <div>
                                <h1>Supervisor Performance</h1>
                                <p>Detailed supervision monitoring and accountability tracking</p>
                            </div>
                        </div>

                        {/* Summary performance table */}
                        <div className="cd-card" style={{ marginBottom: '2rem' }}>
                            <div className="cd-card-header"><h2>Performance Summary</h2></div>
                            <div className="cd-table-wrap">
                                <table className="cd-table">
                                    <thead>
                                        <tr>
                                            <th>SUPERVISOR</th>
                                            <th>TOTAL SUPERVISED</th>
                                            <th>ACTIVE</th>
                                            <th>COMPLETED</th>
                                            <th>REJECTED PROPOSALS</th>
                                            <th>SUCCESS RATE</th>
                                            <th>AVG RESPONSE</th>
                                            <th>CAPACITY</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.supervisors.map(s => {
                                            const rate = calcSuccessRate(s);
                                            return (
                                                <tr key={s.id} className="cd-table-row-clickable" onClick={() => setSelectedSup(s)}>
                                                    <td>
                                                        <div className="cd-table-sup">
                                                            <div className="cd-table-avatar">{s.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
                                                            <div>
                                                                <strong>{s.name}</strong>
                                                                <div className="cd-table-spec">{s.specialization.split(',')[0]}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{s.totalSupervised}</td>
                                                    <td>{s.activeProjects}</td>
                                                    <td>{s.completedProjects}</td>
                                                    <td>{s.rejectedProposals}</td>
                                                    <td>
                                                        <div className="cd-inline-rate">
                                                            <span style={{ color: rate >= 80 ? 'var(--success)' : rate >= 60 ? 'var(--warning)' : 'var(--danger)', fontWeight: 700 }}>{rate}%</span>
                                                            <div className="cd-inline-bar">
                                                                <div style={{ width: `${rate}%`, background: rate >= 80 ? 'var(--success)' : rate >= 60 ? 'var(--warning)' : 'var(--danger)', height: '100%', borderRadius: '4px' }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{s.avgResponseTime} days</td>
                                                    <td>
                                                        <span className={`badge ${s.groups >= s.capacity ? 'badge-rejected' : 'badge-approved'}`}>
                                                            {s.groups}/{s.capacity}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <p className="cd-table-hint">Click a row to view full supervisor profile</p>
                        </div>

                        {/* Supervisor cards grid */}
                        <div className="cd-sup-grid">
                            {data.supervisors.map(s => (
                                <SupervisorCard key={s.id} sup={s} onSelect={setSelectedSup} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Projects ─────────────────────────────── */}
                {activePage === 'projects' && (
                    <div className="cd-page">
                        <div className="cd-page-header">
                            <div>
                                <h1>All Projects</h1>
                                <p>Project monitoring and progress tracking</p>
                            </div>
                        </div>
                        <div className="cd-card">
                            <div className="cd-card-header"><h2>Project Tracking</h2></div>
                            <div className="cd-table-wrap">
                                <table className="cd-table">
                                    <thead>
                                        <tr>
                                            <th>TITLE</th>
                                            <th>STUDENTS</th>
                                            <th>SUPERVISOR</th>
                                            <th>START DATE</th>
                                            <th>PROGRESS</th>
                                            <th>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.projects.map(p => {
                                            const s = getStatusBadge(p.status);
                                            return (
                                                <tr key={p.id}>
                                                    <td><strong>{p.title}</strong></td>
                                                    <td>{p.students}</td>
                                                    <td>{supervisorName(p.supervisorId)}</td>
                                                    <td>{p.startDate}</td>
                                                    <td style={{ minWidth: 160 }}>
                                                        <ProgressBar
                                                            value={p.progress}
                                                            color={p.progress === 100 ? 'var(--success)' : 'var(--accent)'}
                                                        />
                                                    </td>
                                                    <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Analytics ────────────────────────────── */}
                {activePage === 'analytics' && (
                    <div className="cd-page">
                        <div className="cd-page-header">
                            <div>
                                <h1>System Analytics</h1>
                                <p>Performance metrics and system insights</p>
                            </div>
                        </div>

                        <div className="cd-stats-grid">
                            {[
                                { icon: '📝', label: 'Total Submissions', value: data.proposals.length + data.projects.length, sub: 'Proposals + Projects' },
                                { icon: '✅', label: 'Approval Rate', value: `${Math.round((data.proposals.filter(p => p.status === 'approved').length / data.proposals.length) * 100)}%`, sub: 'System-wide' },
                                { icon: '⏱️', label: 'Avg Response Time', value: `${(data.supervisors.reduce((a, s) => a + s.avgResponseTime, 0) / data.supervisors.length).toFixed(1)}d`, sub: 'Across supervisors' },
                                { icon: '🔍', label: 'Duplicates Flagged', value: data.proposals.filter(p => p.status === 'flagged').length, sub: 'This semester' },
                                { icon: '🎓', label: 'Completed Projects', value: data.projects.filter(p => p.status === 'completed').length, sub: 'All time' },
                                { icon: '📈', label: 'Avg Supervisor Rate', value: `${avgSuccessRate}%`, sub: 'Success rate' },
                            ].map((s, i) => (
                                <div key={i} className="cd-stat-card">
                                    <div className="cd-stat-icon">{s.icon}</div>
                                    <div className="cd-stat-val">{s.value}</div>
                                    <div className="cd-stat-lbl">{s.label}</div>
                                    <div className="cd-stat-sub">{s.sub}</div>
                                </div>
                            ))}
                        </div>

                        <div className="cd-analytics-grid">
                            <div className="cd-card">
                                <div className="cd-card-header"><h2>Supervisor Success Rates</h2></div>
                                <div className="cd-analytics-body">
                                    {data.supervisors.map(s => {
                                        const rate = calcSuccessRate(s);
                                        return (
                                            <div key={s.id} className="cd-analytics-row">
                                                <div className="cd-analytics-name">
                                                    <div className="cd-table-avatar" style={{ width: 32, height: 32, fontSize: '0.7rem' }}>
                                                        {s.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                                                    </div>
                                                    <span>{s.name}</span>
                                                </div>
                                                <div className="cd-analytics-bar-wrap">
                                                    <ProgressBar value={rate} color={rate >= 80 ? 'var(--success)' : 'var(--warning)'} />
                                                </div>
                                                <span className="cd-analytics-pct" style={{ color: rate >= 80 ? 'var(--success)' : 'var(--warning)' }}>{rate}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="cd-card">
                                <div className="cd-card-header"><h2>Proposal Status Breakdown</h2></div>
                                <div className="cd-analytics-body">
                                    {['approved', 'pending', 'with_supervisor', 'flagged'].map(status => {
                                        const count = data.proposals.filter(p => p.status === status).length;
                                        const pct = Math.round((count / data.proposals.length) * 100);
                                        const badge = getStatusBadge(status);
                                        return (
                                            <div key={status} className="cd-analytics-row">
                                                <span style={{ minWidth: 130 }}>
                                                    <span className={`badge ${badge.cls}`}>{badge.label}</span>
                                                </span>
                                                <div className="cd-analytics-bar-wrap">
                                                    <ProgressBar value={pct} />
                                                </div>
                                                <span className="cd-analytics-pct">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="cd-card">
                                <div className="cd-card-header"><h2>Avg Response Time by Supervisor</h2></div>
                                <div className="cd-analytics-body">
                                    {data.supervisors.map(s => {
                                        const maxTime = Math.max(...data.supervisors.map(x => x.avgResponseTime));
                                        const pct = Math.round((s.avgResponseTime / maxTime) * 100);
                                        return (
                                            <div key={s.id} className="cd-analytics-row">
                                                <span style={{ minWidth: 100, fontSize: '0.875rem' }}>{s.name.split(' ')[1]}</span>
                                                <div className="cd-analytics-bar-wrap">
                                                    <ProgressBar value={pct} color="var(--accent)" />
                                                </div>
                                                <span className="cd-analytics-pct">{s.avgResponseTime}d</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="cd-card">
                                <div className="cd-card-header"><h2>Project Completion Status</h2></div>
                                <div className="cd-analytics-body">
                                    {data.projects.map(p => (
                                        <div key={p.id} className="cd-analytics-row">
                                            <span style={{ minWidth: 160, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                                            <div className="cd-analytics-bar-wrap">
                                                <ProgressBar value={p.progress} color={p.progress === 100 ? 'var(--success)' : 'var(--accent)'} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Settings ─────────────────────────────── */}
                {activePage === 'settings' && (
                    <div className="cd-page">
                        <div className="cd-page-header">
                            <div>
                                <h1>System Settings</h1>
                                <p>Configure system-wide parameters</p>
                            </div>
                        </div>
                        <div className="cd-card">
                            <div className="cd-card-header"><h2>Supervisor Allocation Settings</h2></div>
                            <div className="cd-card-body">
                                <form onSubmit={saveSettings}>
                                    <div className="cd-form-group">
                                        <label className="cd-form-label">MAXIMUM SUPERVISION LIMIT</label>
                                        <input
                                            type="number"
                                            className="cd-form-control"
                                            value={settingsForm.maxSupervisionLimit}
                                            onChange={e => setSettingsForm(p => ({ ...p, maxSupervisionLimit: parseInt(e.target.value) }))}
                                        />
                                    </div>
                                    <div className="cd-form-group">
                                        <label className="cd-form-label">SIMILARITY THRESHOLD (%)</label>
                                        <input
                                            type="number"
                                            className="cd-form-control"
                                            value={settingsForm.similarityThreshold}
                                            onChange={e => setSettingsForm(p => ({ ...p, similarityThreshold: parseInt(e.target.value) }))}
                                        />
                                        <p className="cd-form-hint">Proposals above this threshold are flagged as potential duplicates</p>
                                    </div>
                                    <div className="cd-form-group">
                                        <label className="cd-form-label">LOGBOOK DEADLINE</label>
                                        <select
                                            className="cd-form-control"
                                            value={settingsForm.logbookDeadline}
                                            onChange={e => setSettingsForm(p => ({ ...p, logbookDeadline: e.target.value }))}
                                        >
                                            <option>Friday 17:00</option>
                                            <option>Thursday 17:00</option>
                                            <option>Friday 23:59</option>
                                        </select>
                                    </div>
                                    <div className="cd-form-group">
                                        <label className="cd-form-label">AUTO ASSIGNMENT</label>
                                        <div className="cd-toggle-row">
                                            <button
                                                type="button"
                                                className={`cd-toggle ${settingsForm.autoAssignment ? 'cd-toggle-on' : ''}`}
                                                onClick={() => setSettingsForm(p => ({ ...p, autoAssignment: !p.autoAssignment }))}
                                            >
                                                <div className="cd-toggle-knob" />
                                            </button>
                                            <span>{settingsForm.autoAssignment ? 'Enabled' : 'Disabled'}</span>
                                        </div>
                                    </div>
                                    <div className="cd-form-group">
                                        <label className="cd-form-label">EMAIL NOTIFICATIONS</label>
                                        <div className="cd-toggle-row">
                                            <button
                                                type="button"
                                                className={`cd-toggle ${settingsForm.emailNotifications ? 'cd-toggle-on' : ''}`}
                                                onClick={() => setSettingsForm(p => ({ ...p, emailNotifications: !p.emailNotifications }))}
                                            >
                                                <div className="cd-toggle-knob" />
                                            </button>
                                            <span>{settingsForm.emailNotifications ? 'Enabled' : 'Disabled'}</span>
                                        </div>
                                    </div>
                                    <div className="cd-form-actions">
                                        <button type="submit" className="cd-btn-primary">Save Settings</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

            </main>

            {/* Supervisor Detail Modal */}
            <SupervisorModal sup={selectedSup} onClose={() => setSelectedSup(null)} />
        </div>
    );
};

export default CoordinatorDashboard;