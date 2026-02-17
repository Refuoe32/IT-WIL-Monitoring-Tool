import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
    const [formData, setFormData] = useState({
        role: 'student',
        idNumber: '',
        password: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(formData.role);
    };

    const handleRoleChange = (role) => {
        setFormData({ ...formData, role });
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <div className="login-logo">📚</div>
                    <h1>IT WIL Monitoring Tool</h1>
                    <p>Work-Integrated Learning Management System</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">SELECT YOUR ROLE</label>
                        <div className="role-selector">
                            <div className="role-option">
                                <input 
                                    type="radio" 
                                    name="role" 
                                    id="studentRole" 
                                    value="student" 
                                    checked={formData.role === 'student'}
                                    onChange={() => handleRoleChange('student')}
                                />
                                <label htmlFor="studentRole" className="role-label">
                                    <span className="icon">🎓</span>
                                    <span>Student</span>
                                </label>
                            </div>
                            <div className="role-option">
                                <input 
                                    type="radio" 
                                    name="role" 
                                    id="supervisorRole" 
                                    value="supervisor"
                                    checked={formData.role === 'supervisor'}
                                    onChange={() => handleRoleChange('supervisor')}
                                />
                                <label htmlFor="supervisorRole" className="role-label">
                                    <span className="icon">👨‍🏫</span>
                                    <span>Supervisor</span>
                                </label>
                            </div>
                            <div className="role-option">
                                <input 
                                    type="radio" 
                                    name="role" 
                                    id="coordinatorRole" 
                                    value="coordinator"
                                    checked={formData.role === 'coordinator'}
                                    onChange={() => handleRoleChange('coordinator')}
                                />
                                <label htmlFor="coordinatorRole" className="role-label">
                                    <span className="icon">👔</span>
                                    <span>Coordinator</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">STUDENT/STAFF NUMBER</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Enter your ID number" 
                            value={formData.idNumber}
                            onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">PASSWORD</label>
                        <input 
                            type="password" 
                            className="form-control" 
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required 
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>SIGN IN</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
