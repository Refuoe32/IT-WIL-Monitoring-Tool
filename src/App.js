import React, { useState } from 'react';
import Login from './components/Login/Login';
import StudentDashboard from './components/Student/StudentDashboard';
import SupervisorDashboard from './components/Supervisor/SupervisorDashboard';
import CoordinatorDashboard from './components/Coordinator/CoordinatorDashboard';
import Toast from './components/Toast';
import './styles/global.css';

function App() {
    const [currentView, setCurrentView] = useState('login');
    const [toasts, setToasts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    // ── Shared state — proposals, logbooks and notifications flow between
    //    Student, Supervisor and Coordinator dashboards through here.
    //    Replace with API calls once the database is connected.
    const [sharedState, setSharedState] = useState({
        proposals:     [],
        logbooks:      [],
        notifications: []
    });

    // ── Login receives the user object from your auth system.
    //    Expected shape: { name, studentId, email, phone, role }
    const handleLogin = (role, user) => {
        setCurrentUser(user || { role });
        if (role === 'student')      setCurrentView('student');
        else if (role === 'supervisor') setCurrentView('supervisor');
        else if (role === 'coordinator') setCurrentView('coordinator');
    };

    const handleLogout = () => {
        setCurrentView('login');
        setCurrentUser(null);
        showToast('Logged Out', 'You have been successfully logged out.');
    };

    const showToast = (title, message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, title, message }]);
        // Auto-remove after 4 s
        setTimeout(() => removeToast(id), 4000);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <div className="App">
            {currentView === 'login' && (
                <Login onLogin={handleLogin} />
            )}

            {currentView === 'student' && (
                <StudentDashboard
                    onLogout={handleLogout}
                    showToast={showToast}
                    currentUser={currentUser}
                    sharedState={sharedState}
                    setSharedState={setSharedState}
                />
            )}

            {currentView === 'supervisor' && (
                <SupervisorDashboard
                    onLogout={handleLogout}
                    showToast={showToast}
                    currentUser={currentUser}
                    sharedState={sharedState}
                    setSharedState={setSharedState}
                />
            )}

            {currentView === 'coordinator' && (
                <CoordinatorDashboard
                    onLogout={handleLogout}
                    showToast={showToast}
                    currentUser={currentUser}
                    sharedState={sharedState}
                    setSharedState={setSharedState}
                />
            )}

            <div className="toast-container">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        title={toast.title}
                        message={toast.message}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </div>
    );
}

export default App;