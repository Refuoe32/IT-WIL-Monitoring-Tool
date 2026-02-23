import React from 'react';

const Sidebar = ({ activePage, setActivePage, onLogout, userData }) => {
    return (
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
                    <div className="user-avatar">{userData.initials}</div>
                    <div className="user-info">
                        <h4>{userData.name}</h4>
                        <p>ID: {userData.id}</p>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <div className="nav-section-title">Main Menu</div>
                    <div 
                        className={`nav-item ${activePage === 'overview' ? 'active' : ''}`} 
                        onClick={() => setActivePage('overview')}
                    >
                        <span className="icon">📊</span>
                        <span>Overview</span>
                    </div>
                    <div 
                        className={`nav-item ${activePage === 'proposal' ? 'active' : ''}`} 
                        onClick={() => setActivePage('proposal')}
                    >
                        <span className="icon">📋</span>
                        <span>Submit Proposal</span>
                    </div>
                    <div 
                        className={`nav-item ${activePage === 'my-proposal' ? 'active' : ''}`} 
                        onClick={() => setActivePage('my-proposal')}
                    >
                        <span className="icon">📄</span>
                        <span>My Proposal</span>
                    </div>
                    <div 
                        className={`nav-item ${activePage === 'new-logbook' ? 'active' : ''}`} 
                        onClick={() => setActivePage('new-logbook')}
                    >
                        <span className="icon">➕</span>
                        <span>New Logbook</span>
                    </div>
                    <div 
                        className={`nav-item ${activePage === 'logbooks' ? 'active' : ''}`} 
                        onClick={() => setActivePage('logbooks')}
                    >
                        <span className="icon">📝</span>
                        <span>My Logbooks</span>
                    </div>
                    <div 
                        className={`nav-item ${activePage === 'notifications' ? 'active' : ''}`} 
                        onClick={() => setActivePage('notifications')}
                    >
                        <span className="icon">🔔</span>
                        <span>Notifications</span>
                    </div>
                </div>

                <div className="nav-section">
                    <div className="nav-section-title">Account</div>
                    <div 
                        className={`nav-item ${activePage === 'profile' ? 'active' : ''}`} 
                        onClick={() => setActivePage('profile')}
                    >
                        <span className="icon">👤</span>
                        <span>Profile</span>
                    </div>
                </div>
            </nav>

            <div className="logout-section">
                <button className="btn btn-logout" onClick={onLogout}>
                    <span>🚪</span>
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
