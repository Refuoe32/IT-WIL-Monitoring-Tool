import React, { useState } from 'react';

const NewLogbook = ({ setActivePage, showToast }) => {
    // Form data state
    const [formData, setFormData] = useState({
        weekNumber: 14,
        dateRange: 'Feb 10 - Feb 14, 2026',
        activities: '',
        hoursSpent: '',
        nextWeekPlan: '',
        challenges: ''
    });

    // Validation errors
    const [errors, setErrors] = useState({});
    
    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get current date for deadline reminder
    const getCurrentDay = () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = new Date();
        return days[today.getDay()];
    };

    // Handle input changes
    const handleInputChange = (field, value) => {
        setFormData({
            ...formData,
            [field]: value
        });
        
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors({
                ...errors,
                [field]: null
            });
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.activities.trim()) {
            newErrors.activities = 'Activities completed is required';
        } else if (formData.activities.trim().length < 50) {
            newErrors.activities = 'Please provide more detail (minimum 50 characters)';
        }

        if (!formData.nextWeekPlan.trim()) {
            newErrors.nextWeekPlan = 'Next week\'s plan is required';
        } else if (formData.nextWeekPlan.trim().length < 30) {
            newErrors.nextWeekPlan = 'Please provide more detail (minimum 30 characters)';
        }

        if (formData.hoursSpent && (isNaN(formData.hoursSpent) || formData.hoursSpent < 0)) {
            newErrors.hoursSpent = 'Please enter a valid number of hours';
        }

        if (!formData.weekNumber || formData.weekNumber < 1) {
            newErrors.weekNumber = 'Please enter a valid week number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Validation Error', 'Please fix the errors in the form before submitting.');
            return;
        }

        setIsSubmitting(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // In real app, make API call here
            console.log('Submitting logbook:', formData);

            showToast(
                'Logbook Submitted', 
                'Your weekly logbook has been submitted successfully and sent to your supervisor for review.'
            );

            // Reset form
            setFormData({
                weekNumber: formData.weekNumber + 1,
                dateRange: '',
                activities: '',
                hoursSpent: '',
                nextWeekPlan: '',
                challenges: ''
            });

            // Navigate to overview
            setTimeout(() => setActivePage('overview'), 1500);
        } catch (error) {
            showToast('Error', 'Failed to submit logbook. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle save as draft
    const handleSaveAsDraft = () => {
        console.log('Saving as draft:', formData);
        showToast('Draft Saved', 'Your logbook has been saved as draft. You can continue editing it later.');
    };

    return (
        <div className="page-content active">
            <div className="content-header">
                <h1>Submit Weekly Logbook</h1>
                <p>Record your weekly progress and activities</p>
            </div>

            <div className="alert" style={{ background: '#fff3e0', borderLeft: '4px solid #e65100' }}>
                <strong>⏰ Deadline Reminder:</strong> Weekly logbooks must be submitted by Friday at 17:00 PM. 
                Late submissions will not be accepted unless authorized by the coordinator.
                {getCurrentDay() === 'Friday' && (
                    <span style={{ display: 'block', marginTop: '0.5rem', fontWeight: '700', color: '#e65100' }}>
                        ⚠️ Today is Friday! Please submit before 17:00 PM.
                    </span>
                )}
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Logbook Entry Form</h2>
                </div>
                <div className="card-content">
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">WEEK NUMBER *</label>
                                <input 
                                    type="number" 
                                    className={`form-control ${errors.weekNumber ? 'error' : ''}`}
                                    value={formData.weekNumber}
                                    onChange={(e) => handleInputChange('weekNumber', e.target.value)}
                                    required 
                                    min="1"
                                />
                                {errors.weekNumber && (
                                    <span className="error-message">{errors.weekNumber}</span>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">DATE RANGE</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={formData.dateRange}
                                    onChange={(e) => handleInputChange('dateRange', e.target.value)}
                                    placeholder="e.g., Feb 10 - Feb 14, 2026"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">ACTIVITIES COMPLETED *</label>
                            <textarea 
                                className={`form-control ${errors.activities ? 'error' : ''}`}
                                placeholder="Describe the work completed this week, including specific tasks, challenges faced, and solutions implemented..." 
                                value={formData.activities}
                                onChange={(e) => handleInputChange('activities', e.target.value)}
                                required
                                rows="5"
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                                {errors.activities && (
                                    <span className="error-message">{errors.activities}</span>
                                )}
                                <span style={{ 
                                    fontSize: '0.875rem', 
                                    color: formData.activities.length < 50 ? '#e65100' : '#4caf50',
                                    marginLeft: 'auto'
                                }}>
                                    {formData.activities.length} characters (minimum 50)
                                </span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">HOURS SPENT</label>
                            <input 
                                type="number" 
                                className={`form-control ${errors.hoursSpent ? 'error' : ''}`}
                                placeholder="Total hours worked this week"
                                value={formData.hoursSpent}
                                onChange={(e) => handleInputChange('hoursSpent', e.target.value)}
                                min="0"
                                step="0.5"
                            />
                            {errors.hoursSpent && (
                                <span className="error-message">{errors.hoursSpent}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">NEXT WEEK'S PLAN *</label>
                            <textarea 
                                className={`form-control ${errors.nextWeekPlan ? 'error' : ''}`}
                                placeholder="Outline your planned activities for next week..." 
                                value={formData.nextWeekPlan}
                                onChange={(e) => handleInputChange('nextWeekPlan', e.target.value)}
                                required
                                rows="4"
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                                {errors.nextWeekPlan && (
                                    <span className="error-message">{errors.nextWeekPlan}</span>
                                )}
                                <span style={{ 
                                    fontSize: '0.875rem', 
                                    color: formData.nextWeekPlan.length < 30 ? '#e65100' : '#4caf50',
                                    marginLeft: 'auto'
                                }}>
                                    {formData.nextWeekPlan.length} characters (minimum 30)
                                </span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">CHALLENGES / ISSUES</label>
                            <textarea 
                                className="form-control"
                                placeholder="Describe any challenges or blockers you encountered..."
                                value={formData.challenges}
                                onChange={(e) => handleInputChange('challenges', e.target.value)}
                                rows="3"
                            />
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
                                onClick={() => setActivePage('overview')}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-outline" 
                                onClick={handleSaveAsDraft}
                                disabled={isSubmitting}
                            >
                                💾 Save as Draft
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Logbook'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NewLogbook;
