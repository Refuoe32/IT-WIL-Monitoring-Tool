import React, { useState } from 'react';

const Profile = ({ userData }) => {
    // Form state
    const [formData, setFormData] = useState({
        fullName: userData.name,
        studentNumber: userData.id,
        email: userData.email,
        phone: userData.phone,
        address: '',
        emergencyContact: '',
        emergencyPhone: ''
    });

    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    
    // Password change state
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Validation errors
    const [errors, setErrors] = useState({});
    
    // Submission state
    const [isSaving, setIsSaving] = useState(false);

    // Handle input change
    const handleInputChange = (field, value) => {
        setFormData({
            ...formData,
            [field]: value
        });
        
        // Clear error for this field
        if (errors[field]) {
            setErrors({
                ...errors,
                [field]: null
            });
        }
    };

    // Handle password input change
    const handlePasswordChange = (field, value) => {
        setPasswordData({
            ...passwordData,
            [field]: value
        });
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.phone || formData.phone.trim() === '') {
            newErrors.phone = 'Phone number is required';
        } else if (!/^[\d\s\+\-()]+$/.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Validate password change
    const validatePasswordChange = () => {
        const newErrors = {};

        if (!passwordData.currentPassword) {
            newErrors.currentPassword = 'Current password is required';
        }

        if (!passwordData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (passwordData.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle save profile
    const handleSaveProfile = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSaving(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('Saving profile:', formData);
            
            // In real app, make API call here
            alert('Profile updated successfully!');
            setIsEditing(false);
        } catch (error) {
            alert('Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle password change submit
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (!validatePasswordChange()) {
            return;
        }

        setIsSaving(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('Changing password...');
            
            // In real app, make API call here
            alert('Password changed successfully!');
            
            // Reset password form
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setShowPasswordChange(false);
        } catch (error) {
            alert('Failed to change password. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setFormData({
            fullName: userData.name,
            studentNumber: userData.id,
            email: userData.email,
            phone: userData.phone,
            address: '',
            emergencyContact: '',
            emergencyPhone: ''
        });
        setErrors({});
        setIsEditing(false);
    };

    return (
        <div className="page-content active">
            <div className="content-header">
                <h1>My Profile</h1>
                <p>Manage your account information</p>
            </div>

            {/* Personal Information Card */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Personal Information</h2>
                    <div className="card-actions">
                        {!isEditing ? (
                            <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => setIsEditing(true)}
                            >
                                ✏️ Edit Profile
                            </button>
                        ) : (
                            <button 
                                className="btn btn-outline btn-sm"
                                onClick={handleCancelEdit}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
                <div className="card-content">
                    <form onSubmit={handleSaveProfile}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">FULL NAME</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">STUDENT NUMBER</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={formData.studentNumber}
                                    disabled
                                />
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">EMAIL</label>
                                <input 
                                    type="email" 
                                    className={`form-control ${errors.email ? 'error' : ''}`}
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    disabled
                                />
                                {errors.email && (
                                    <span className="error-message">{errors.email}</span>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">PHONE *</label>
                                <input 
                                    type="tel" 
                                    className={`form-control ${errors.phone ? 'error' : ''}`}
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    disabled={!isEditing}
                                />
                                {errors.phone && (
                                    <span className="error-message">{errors.phone}</span>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">ADDRESS</label>
                            <input 
                                type="text" 
                                className="form-control"
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                disabled={!isEditing}
                                placeholder="Enter your address"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">EMERGENCY CONTACT NAME</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    value={formData.emergencyContact}
                                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="Enter emergency contact name"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">EMERGENCY CONTACT PHONE</label>
                                <input 
                                    type="tel" 
                                    className="form-control"
                                    value={formData.emergencyPhone}
                                    onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="Enter emergency contact phone"
                                />
                            </div>
                        </div>

                        {isEditing && (
                            <div style={{ 
                                display: 'flex', 
                                gap: '1rem', 
                                justifyContent: 'flex-end', 
                                marginTop: '2rem' 
                            }}>
                                <button 
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={handleCancelEdit}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Security Settings Card */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <div className="card-header">
                    <h2 className="card-title">Security Settings</h2>
                </div>
                <div className="card-content">
                    {!showPasswordChange ? (
                        <div>
                            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                Keep your account secure by regularly updating your password
                            </p>
                            <button 
                                className="btn btn-outline"
                                onClick={() => setShowPasswordChange(true)}
                            >
                                🔒 Change Password
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handlePasswordSubmit}>
                            <div className="form-group">
                                <label className="form-label">CURRENT PASSWORD *</label>
                                <input 
                                    type="password" 
                                    className={`form-control ${errors.currentPassword ? 'error' : ''}`}
                                    value={passwordData.currentPassword}
                                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                    placeholder="Enter your current password"
                                />
                                {errors.currentPassword && (
                                    <span className="error-message">{errors.currentPassword}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">NEW PASSWORD *</label>
                                <input 
                                    type="password" 
                                    className={`form-control ${errors.newPassword ? 'error' : ''}`}
                                    value={passwordData.newPassword}
                                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                    placeholder="Enter your new password (min 8 characters)"
                                />
                                {errors.newPassword && (
                                    <span className="error-message">{errors.newPassword}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">CONFIRM NEW PASSWORD *</label>
                                <input 
                                    type="password" 
                                    className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                    placeholder="Confirm your new password"
                                />
                                {errors.confirmPassword && (
                                    <span className="error-message">{errors.confirmPassword}</span>
                                )}
                            </div>

                            <div style={{ 
                                display: 'flex', 
                                gap: '1rem', 
                                justifyContent: 'flex-end', 
                                marginTop: '2rem' 
                            }}>
                                <button 
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => {
                                        setShowPasswordChange(false);
                                        setPasswordData({
                                            currentPassword: '',
                                            newPassword: '',
                                            confirmPassword: ''
                                        });
                                        setErrors({});
                                    }}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Changing...' : 'Change Password'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Account Statistics */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <div className="card-header">
                    <h2 className="card-title">Account Statistics</h2>
                </div>
                <div className="card-content">
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">42</div>
                                    <div className="stat-label">Days Active</div>
                                </div>
                                <div className="stat-icon">📅</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">12</div>
                                    <div className="stat-label">Submissions</div>
                                </div>
                                <div className="stat-icon">📝</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">92%</div>
                                    <div className="stat-label">Approval Rate</div>
                                </div>
                                <div className="stat-icon">✅</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
