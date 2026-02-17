import React, { useState, useEffect } from 'react';

const Notifications = () => {
    // Notifications data state
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            icon: '✉️',
            type: 'Email Sent',
            category: 'logbook',
            time: '4 days ago',
            timeStamp: new Date('2026-02-09'),
            badge: 'Approved',
            badgeClass: 'badge-approved',
            title: 'Logbook Entry Approved - Week 12',
            message: 'Your logbook entry "Database Design and Implementation" has been approved by Mr. Hlabeli. Excellent work on the schema design!',
            read: true
        },
        {
            id: 2,
            icon: '✉️',
            type: 'Email Sent',
            category: 'proposal',
            time: '2 weeks ago',
            timeStamp: new Date('2026-01-29'),
            badge: 'Approved',
            badgeClass: 'badge-approved',
            title: 'Proposal Approved',
            message: 'Your project proposal has been approved by Mr. Hlabeli and forwarded to the coordinator. Your project is now active.',
            read: true
        },
        {
            id: 3,
            icon: '✉️',
            type: 'Email Sent',
            category: 'assignment',
            time: '3 weeks ago',
            timeStamp: new Date('2026-01-22'),
            badge: 'Matched',
            badgeClass: 'badge-approved',
            title: 'Supervisor Assigned',
            message: 'Based on your research area, you have been matched with Mr. Hlabeli (95% expertise match in Web Development).',
            read: true
        },
        {
            id: 4,
            icon: '🔔',
            type: 'System Alert',
            category: 'deadline',
            time: '1 day ago',
            timeStamp: new Date('2026-02-12'),
            badge: 'Reminder',
            badgeClass: 'badge-pending',
            title: 'Logbook Deadline Approaching',
            message: 'Reminder: Your Week 13 logbook is due on Friday, February 14, 2026 at 17:00 PM. Don\'t forget to submit!',
            read: false
        },
        {
            id: 5,
            icon: '💬',
            type: 'Feedback',
            category: 'logbook',
            time: '1 week ago',
            timeStamp: new Date('2026-02-06'),
            badge: 'Feedback',
            badgeClass: 'badge-approved',
            title: 'Supervisor Feedback Received',
            message: 'Mr. Hlabeli has provided feedback on your Week 11 logbook. Check your logbook page to view the details.',
            read: true
        }
    ]);

    // Filter state
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterRead, setFilterRead] = useState('all');
    
    // Stats
    const [stats, setStats] = useState({
        total: 0,
        unread: 0
    });

    // Calculate stats
    useEffect(() => {
        setStats({
            total: notifications.length,
            unread: notifications.filter(n => !n.read).length
        });
    }, [notifications]);

    // Handle mark as read
    const handleMarkAsRead = (notificationId) => {
        setNotifications(notifications.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
        ));
    };

    // Handle mark all as read
    const handleMarkAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    // Handle delete notification
    const handleDeleteNotification = (notificationId) => {
        if (window.confirm('Are you sure you want to delete this notification?')) {
            setNotifications(notifications.filter(n => n.id !== notificationId));
        }
    };

    // Handle clear all notifications
    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to delete all notifications?')) {
            setNotifications([]);
        }
    };

    // Get filtered notifications
    const getFilteredNotifications = () => {
        let filtered = [...notifications];

        // Filter by category
        if (filterCategory !== 'all') {
            filtered = filtered.filter(n => n.category === filterCategory);
        }

        // Filter by read status
        if (filterRead === 'unread') {
            filtered = filtered.filter(n => !n.read);
        } else if (filterRead === 'read') {
            filtered = filtered.filter(n => n.read);
        }

        // Sort by timestamp (newest first)
        filtered.sort((a, b) => b.timeStamp - a.timeStamp);

        return filtered;
    };

    const filteredNotifications = getFilteredNotifications();

    return (
        <div className="page-content active">
            <div className="content-header">
                <h1>Notifications</h1>
                <p>System alerts and email notifications</p>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="stat-card">
                    <div className="stat-header">
                        <div>
                            <div className="stat-value">{stats.total}</div>
                            <div className="stat-label">Total Notifications</div>
                        </div>
                        <div className="stat-icon">🔔</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div>
                            <div className="stat-value">{stats.unread}</div>
                            <div className="stat-label">Unread</div>
                        </div>
                        <div className="stat-icon">✉️</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">All Notifications</h2>
                    <div className="card-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                        {stats.unread > 0 && (
                            <button 
                                className="btn btn-outline btn-sm"
                                onClick={handleMarkAllAsRead}
                            >
                                ✓ Mark All as Read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button 
                                className="btn btn-outline btn-sm"
                                onClick={handleClearAll}
                                style={{ color: '#f44336', borderColor: '#f44336' }}
                            >
                                🗑️ Clear All
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {/* Category Filter */}
                        <select
                            className="form-control"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            style={{ maxWidth: '200px' }}
                        >
                            <option value="all">All Categories</option>
                            <option value="logbook">Logbook</option>
                            <option value="proposal">Proposal</option>
                            <option value="assignment">Assignment</option>
                            <option value="deadline">Deadline</option>
                        </select>

                        {/* Read Status Filter */}
                        <select
                            className="form-control"
                            value={filterRead}
                            onChange={(e) => setFilterRead(e.target.value)}
                            style={{ maxWidth: '150px' }}
                        >
                            <option value="all">All Messages</option>
                            <option value="unread">Unread Only</option>
                            <option value="read">Read Only</option>
                        </select>

                        <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.875rem', alignSelf: 'center' }}>
                            Showing {filteredNotifications.length} of {notifications.length} notifications
                        </span>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="entries-list" style={{ padding: '1.5rem' }}>
                    {filteredNotifications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No notifications found</p>
                            <p style={{ fontSize: '0.875rem' }}>
                                {filterCategory !== 'all' || filterRead !== 'all'
                                    ? 'Try adjusting your filters'
                                    : 'You\'re all caught up!'}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <div 
                                key={notification.id} 
                                className="entry-card approved"
                                style={{ 
                                    opacity: notification.read ? 0.7 : 1,
                                    borderLeft: notification.read ? '4px solid transparent' : '4px solid #2196F3'
                                }}
                            >
                                <div className="entry-header">
                                    <div className="entry-meta">
                                        <span>{notification.icon} {notification.type}</span>
                                        <span>🕒 {notification.time}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        {!notification.read && (
                                            <span style={{ 
                                                padding: '0.25rem 0.5rem', 
                                                background: '#2196F3', 
                                                color: 'white', 
                                                borderRadius: '4px', 
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}>
                                                NEW
                                            </span>
                                        )}
                                        <span className={`badge ${notification.badgeClass}`}>
                                            {notification.badge}
                                        </span>
                                    </div>
                                </div>
                                <h3 className="entry-title">{notification.title}</h3>
                                <p className="entry-text">{notification.message}</p>
                                
                                <div className="entry-actions" style={{ marginTop: '1rem' }}>
                                    {!notification.read && (
                                        <button 
                                            className="btn btn-outline btn-sm"
                                            onClick={() => handleMarkAsRead(notification.id)}
                                        >
                                            ✓ Mark as Read
                                        </button>
                                    )}
                                    <button 
                                        className="btn btn-outline btn-sm"
                                        onClick={() => handleDeleteNotification(notification.id)}
                                        style={{ color: '#f44336', borderColor: '#f44336' }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
