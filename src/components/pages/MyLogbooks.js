import React, { useState, useEffect } from 'react';

const MyLogbooks = () => {
    // Logbooks data state
    const [logbooks, setLogbooks] = useState([
        {
            id: 1,
            week: 'Week 13',
            weekNumber: 13,
            date: 'Feb 13, 2026',
            title: 'User Authentication System',
            status: 'pending',
            submitted: '2 hours ago',
            submittedDate: new Date('2026-02-13'),
            activities: 'Developed user authentication system and role-based access control.',
            hoursSpent: 15
        },
        {
            id: 2,
            week: 'Week 12',
            weekNumber: 12,
            date: 'Feb 9, 2026',
            title: 'Database Design and Implementation',
            status: 'approved',
            submitted: '4 days ago',
            submittedDate: new Date('2026-02-09'),
            activities: 'Completed database design and implementation.',
            feedback: 'Excellent work on the schema design!',
            hoursSpent: 18
        },
        {
            id: 3,
            week: 'Week 11',
            weekNumber: 11,
            date: 'Feb 2, 2026',
            title: 'System Requirements Documentation',
            status: 'approved',
            submitted: '1 week ago',
            submittedDate: new Date('2026-02-02'),
            activities: 'Documented system requirements and use cases.',
            feedback: 'Good documentation. Well structured.',
            hoursSpent: 12
        },
        {
            id: 4,
            week: 'Week 10',
            weekNumber: 10,
            date: 'Jan 26, 2026',
            title: 'Project Planning and Research',
            status: 'approved',
            submitted: '2 weeks ago',
            submittedDate: new Date('2026-01-26'),
            activities: 'Conducted research and created project timeline.',
            hoursSpent: 10
        }
    ]);

    // Filter and sort state
    const [filterStatus, setFilterStatus] = useState('all'); // all, approved, pending
    const [sortBy, setSortBy] = useState('recent'); // recent, oldest, week
    const [searchQuery, setSearchQuery] = useState('');

    // Stats state
    const [stats, setStats] = useState({
        total: 0,
        approved: 0,
        pending: 0,
        totalHours: 0
    });

    // Calculate stats when logbooks change
    useEffect(() => {
        const approved = logbooks.filter(l => l.status === 'approved').length;
        const pending = logbooks.filter(l => l.status === 'pending').length;
        const totalHours = logbooks.reduce((sum, l) => sum + (l.hoursSpent || 0), 0);

        setStats({
            total: logbooks.length,
            approved,
            pending,
            totalHours
        });
    }, [logbooks]);

    // Filter and sort logbooks
    const getFilteredLogbooks = () => {
        let filtered = [...logbooks];

        // Apply status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(l => l.status === filterStatus);
        }

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(l => 
                l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.activities.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.week.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply sorting
        switch (sortBy) {
            case 'recent':
                filtered.sort((a, b) => b.submittedDate - a.submittedDate);
                break;
            case 'oldest':
                filtered.sort((a, b) => a.submittedDate - b.submittedDate);
                break;
            case 'week':
                filtered.sort((a, b) => b.weekNumber - a.weekNumber);
                break;
            default:
                break;
        }

        return filtered;
    };

    // Handle view logbook details
    const handleViewLogbook = (logbookId) => {
        console.log('Viewing logbook:', logbookId);
        // In real app, navigate to detail page or open modal
    };

    // Handle edit logbook
    const handleEditLogbook = (logbookId) => {
        console.log('Editing logbook:', logbookId);
        // In real app, navigate to edit page
    };

    // Handle delete logbook
    const handleDeleteLogbook = (logbookId) => {
        if (window.confirm('Are you sure you want to delete this logbook entry?')) {
            setLogbooks(logbooks.filter(l => l.id !== logbookId));
            console.log('Deleted logbook:', logbookId);
        }
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        return status === 'approved' ? 'badge-approved' : 'badge-pending';
    };

    // Get status text
    const getStatusText = (status) => {
        return status === 'approved' ? 'Approved' : 'Pending';
    };

    const filteredLogbooks = getFilteredLogbooks();

    return (
        <div className="page-content active">
            <div className="content-header">
                <h1>All Logbook Entries</h1>
                <p>View and manage your submissions</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-header">
                        <div>
                            <div className="stat-value">{stats.total}</div>
                            <div className="stat-label">Total Entries</div>
                        </div>
                        <div className="stat-icon">📝</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div>
                            <div className="stat-value">{stats.approved}</div>
                            <div className="stat-label">Approved</div>
                        </div>
                        <div className="stat-icon">✅</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div>
                            <div className="stat-value">{stats.pending}</div>
                            <div className="stat-label">Pending Review</div>
                        </div>
                        <div className="stat-icon">⏳</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div>
                            <div className="stat-value">{stats.totalHours}h</div>
                            <div className="stat-label">Total Hours</div>
                        </div>
                        <div className="stat-icon">⏱️</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Entry History</h2>
                </div>

                {/* Filters and Search */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Search */}
                        <input
                            type="text"
                            className="form-control"
                            placeholder="🔍 Search logbooks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ maxWidth: '300px' }}
                        />

                        {/* Status Filter */}
                        <select
                            className="form-control"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{ maxWidth: '150px' }}
                        >
                            <option value="all">All Status</option>
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                        </select>

                        {/* Sort By */}
                        <select
                            className="form-control"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{ maxWidth: '150px' }}
                        >
                            <option value="recent">Most Recent</option>
                            <option value="oldest">Oldest First</option>
                            <option value="week">By Week Number</option>
                        </select>

                        {/* Results count */}
                        <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Showing {filteredLogbooks.length} of {logbooks.length} entries
                        </span>
                    </div>
                </div>

                {/* Logbooks Table */}
                <div style={{ overflowX: 'auto', padding: '1.5rem' }}>
                    {filteredLogbooks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No logbooks found</p>
                            <p style={{ fontSize: '0.875rem' }}>
                                {searchQuery || filterStatus !== 'all' 
                                    ? 'Try adjusting your filters or search query' 
                                    : 'You haven\'t submitted any logbooks yet'
                                }
                            </p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ 
                                        padding: '1rem', 
                                        textAlign: 'left', 
                                        fontWeight: '700', 
                                        fontSize: '0.875rem' 
                                    }}>
                                        WEEK
                                    </th>
                                    <th style={{ 
                                        padding: '1rem', 
                                        textAlign: 'left', 
                                        fontWeight: '700', 
                                        fontSize: '0.875rem' 
                                    }}>
                                        DATE
                                    </th>
                                    <th style={{ 
                                        padding: '1rem', 
                                        textAlign: 'left', 
                                        fontWeight: '700', 
                                        fontSize: '0.875rem' 
                                    }}>
                                        TITLE
                                    </th>
                                    <th style={{ 
                                        padding: '1rem', 
                                        textAlign: 'left', 
                                        fontWeight: '700', 
                                        fontSize: '0.875rem' 
                                    }}>
                                        STATUS
                                    </th>
                                    <th style={{ 
                                        padding: '1rem', 
                                        textAlign: 'left', 
                                        fontWeight: '700', 
                                        fontSize: '0.875rem' 
                                    }}>
                                        SUBMITTED
                                    </th>
                                    <th style={{ 
                                        padding: '1rem', 
                                        textAlign: 'left', 
                                        fontWeight: '700', 
                                        fontSize: '0.875rem' 
                                    }}>
                                        ACTIONS
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogbooks.map((logbook) => (
                                    <tr key={logbook.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <strong>{logbook.week}</strong>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{logbook.date}</td>
                                        <td style={{ padding: '1rem' }}>{logbook.title}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span className={`badge ${getStatusBadgeClass(logbook.status)}`}>
                                                {getStatusText(logbook.status)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{logbook.submitted}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button 
                                                    className="btn btn-outline" 
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                                    onClick={() => handleViewLogbook(logbook.id)}
                                                >
                                                    View
                                                </button>
                                                {logbook.status === 'pending' && (
                                                    <>
                                                        <button 
                                                            className="btn btn-outline" 
                                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                                            onClick={() => handleEditLogbook(logbook.id)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            className="btn btn-outline" 
                                                            style={{ 
                                                                padding: '0.5rem 1rem', 
                                                                fontSize: '0.875rem',
                                                                color: '#f44336',
                                                                borderColor: '#f44336'
                                                            }}
                                                            onClick={() => handleDeleteLogbook(logbook.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyLogbooks;
