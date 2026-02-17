import React, { useState, useEffect } from 'react';

const Overview = ({ setActivePage }) => {
    // You can add state here for fetching real data from API
    const [projectData] = useState({
        title: 'IT WIL Monitoring Tool',
        supervisor: 'Mr. Hlabeli',
        status: 'Approved',
        members: 'Refuoe Letsela, Mosololi Khatleli, Sello Lebeko, Rants\'itile Ramone',
        progress: 65
    });

    const [stats] = useState({
        activeProjects: 1,
        logbooksSubmitted: 12,
        approvedEntries: 11,
        pendingReview: 1
    });

    const [recentEntries] = useState([
        {
            id: 1,
            week: 12,
            date: 'Feb 9, 2026',
            title: 'Database Design and Implementation',
            status: 'approved',
            activities: 'Completed database design and implementation. Started working on the supervisor allocation algorithm.',
            feedback: 'Excellent progress! Database schema is well-structured. Continue with the implementation phase.'
        },
        {
            id: 2,
            week: 13,
            date: 'Feb 13, 2026',
            title: 'User Authentication System',
            status: 'pending',
            activities: 'Developed user authentication system and role-based access control. Tested login functionality across different user roles.'
        }
    ]);

    // Example: Fetch data on component mount
    useEffect(() => {
        // You can add API calls here
        // fetchProjectData();
        // fetchStats();
        // fetchRecentEntries();
    }, []);

    const handleViewDetails = (entryId) => {
        console.log('View details for entry:', entryId);
        // Add your logic here to view entry details
    };

    return (
        <div className="page-content active">
            <div className="content-header">
                <h1>Dashboard Overview</h1>
                <p>Track your project progress and submissions</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <div>
                            <div className="stat-value">{stats.activeProjects}</div>
                            <div className="stat-label">Active Project</div>
                            <div className="stat-trend">{projectData.title}</div>
                        </div>
                        <div className="stat-icon">📋</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div>
                            <div className="stat-value">{stats.logbooksSubmitted}</div>
                            <div className="stat-label">Logbooks Submitted</div>
                            <div className="stat-trend">↑ 2 this month</div>
                        </div>
                        <div className="stat-icon">📝</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div>
                            <div className="stat-value">{stats.approvedEntries}</div>
                            <div className="stat-label">Approved Entries</div>
                            <div className="stat-trend">92% approval rate</div>
                        </div>
                        <div className="stat-icon">✅</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div>
                            <div className="stat-value">{stats.pendingReview}</div>
                            <div className="stat-label">Pending Review</div>
                            <div className="stat-trend">Awaiting feedback</div>
                        </div>
                        <div className="stat-icon">⏳</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Project Information</h2>
                    <div className="card-actions">
                        <button className="btn btn-outline btn-sm">View Details</button>
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <tbody>
                            <tr>
                                <th style={{ width: '200px' }}>PROJECT TITLE</th>
                                <td>{projectData.title}</td>
                            </tr>
                            <tr>
                                <th>SUPERVISOR</th>
                                <td>{projectData.supervisor}</td>
                            </tr>
                            <tr>
                                <th>STATUS</th>
                                <td><span className="badge badge-approved">{projectData.status}</span></td>
                            </tr>
                            <tr>
                                <th>GROUP MEMBERS</th>
                                <td>{projectData.members}</td>
                            </tr>
                            <tr>
                                <th>PROGRESS</th>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${projectData.progress}%` }}></div>
                                            </div>
                                        </div>
                                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{projectData.progress}%</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Recent Logbook Entries</h2>
                    <div className="card-actions">
                        <button 
                            className="btn btn-primary btn-sm" 
                            onClick={() => setActivePage('new-logbook')}
                        >
                            + New Entry
                        </button>
                    </div>
                </div>

                <div className="entries-list">
                    {recentEntries.map((entry) => (
                        <div key={entry.id} className={`entry-card ${entry.status}`}>
                            <div className="entry-header">
                                <div className="entry-meta">
                                    <span>📅 Week {entry.week}</span>
                                    <span>🕒 {entry.date}</span>
                                </div>
                                <span className={`badge badge-${entry.status}`}>
                                    {entry.status === 'approved' ? 'Approved' : 'Pending Review'}
                                </span>
                            </div>
                            <h3 className="entry-title">{entry.title}</h3>
                            <p className="entry-text">
                                <strong>Activities:</strong> {entry.activities}
                            </p>
                            {entry.feedback && (
                                <p className="entry-text">
                                    <strong>Supervisor Feedback:</strong> {entry.feedback}
                                </p>
                            )}
                            <div className="entry-actions">
                                <button 
                                    className="btn btn-outline btn-sm"
                                    onClick={() => handleViewDetails(entry.id)}
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Overview;
