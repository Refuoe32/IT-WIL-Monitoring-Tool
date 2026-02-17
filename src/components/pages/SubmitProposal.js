import React, { useState } from 'react';

const SubmitProposal = ({ setActivePage, showToast }) => {
    // Form state
    const [proposalData, setProposalData] = useState({
        projectTitle: '',
        description: '',
        researchArea: '',
        groupMembers: ''
    });

    // UI state
    const [showSupervisors, setShowSupervisors] = useState(false);
    const [similarityCheck, setSimilarityCheck] = useState(null);
    const [selectedSupervisor, setSelectedSupervisor] = useState(null);
    const [loading, setLoading] = useState(false);

    // Supervisors data - in real app, this would come from API
    const [supervisors] = useState([
        { 
            id: 1,
            name: 'Mr. Hlabeli', 
            area: 'web', 
            match: 95, 
            capacity: '3/4', 
            expertise: 'Web Development, Database Systems' 
        },
        { 
            id: 2,
            name: 'Dr. Molapo', 
            area: 'database', 
            match: 88, 
            capacity: '4/4', 
            expertise: 'Database Systems, Cloud Computing' 
        },
        { 
            id: 3,
            name: 'Ms. Ntšepe', 
            area: 'mobile', 
            match: 82, 
            capacity: '1/4', 
            expertise: 'Mobile Applications, UI/UX' 
        },
        { 
            id: 4,
            name: 'Prof. Koali', 
            area: 'security', 
            match: 78, 
            capacity: '2/4', 
            expertise: 'Network Security, Cryptography' 
        },
        { 
            id: 5,
            name: 'Mr. Tau', 
            area: 'ml', 
            match: 45, 
            capacity: '3/4', 
            expertise: 'Machine Learning, AI' 
        }
    ]);

    // Handlers
    const handleProposalChange = (field, value) => {
        setProposalData({ ...proposalData, [field]: value });
    };

    const checkDuplicateAndMatch = async () => {
        if (!proposalData.projectTitle || !proposalData.researchArea) {
            showToast('Error', 'Please fill in project title and research area first.');
            return;
        }

        setLoading(true);

        // Simulate API call for duplicate check
        setTimeout(() => {
            // Simulate duplicate check (in real app, call API)
            const similarity = Math.floor(Math.random() * 100);
            const isDuplicate = similarity > 70;

            if (isDuplicate) {
                setSimilarityCheck({
                    type: 'danger',
                    message: `⚠️ Possible Duplicate Detected! Your project title shows ${similarity}% similarity with existing projects. Please revise your title to ensure originality.`
                });
                setShowSupervisors(false);
                setLoading(false);
                return;
            }

            setSimilarityCheck({
                type: 'info',
                message: `✓ Duplicate Check Passed - Your project title is original (${similarity}% similarity - below 70% threshold).`
            });

            // Match supervisors based on research area
            const matchedSupervisors = supervisors
                .filter(s => s.area === proposalData.researchArea || s.match > 70)
                .sort((a, b) => b.match - a.match);

            // Auto-select best match
            if (matchedSupervisors.length > 0) {
                setSelectedSupervisor(matchedSupervisors[0].id);
            }
            
            setShowSupervisors(true);
            setLoading(false);
            
            // Scroll to supervisor section
            setTimeout(() => {
                document.getElementById('supervisorSelection')?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest' 
                });
            }, 100);

            showToast('System Check Complete', 'Duplicate check passed! Supervisors matched and ranked based on expertise.');
        }, 1500); // Simulate API delay
    };

    const handleProposalSubmit = (e) => {
        e.preventDefault();

        if (!selectedSupervisor) {
            showToast('Error', 'Please select a supervisor.');
            return;
        }

        // In real app, submit to API
        console.log('Submitting proposal:', {
            ...proposalData,
            supervisorId: selectedSupervisor
        });

        showToast('Proposal Submitted', 'Your proposal has been submitted and assigned to the selected supervisor for review.');
        
        // Navigate to my-proposal page
        setTimeout(() => setActivePage('my-proposal'), 2000);
    };

    const getMatchedSupervisors = () => {
        return supervisors
            .filter(s => s.area === proposalData.researchArea || s.match > 70)
            .sort((a, b) => b.match - a.match);
    };

    const renderSupervisorCard = (supervisor, index) => {
        const capacityNum = parseInt(supervisor.capacity.split('/')[0]);
        const capacityMax = parseInt(supervisor.capacity.split('/')[1]);
        const capacityPercent = (capacityNum / capacityMax) * 100;
        const isFull = capacityNum >= capacityMax;
        const isSelected = selectedSupervisor === supervisor.id;
        const isTopMatch = index === 0;

        return (
            <div
                key={supervisor.id}
                className={`supervisor-card ${isFull ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => !isFull && setSelectedSupervisor(supervisor.id)}
                style={{ cursor: isFull ? 'not-allowed' : 'pointer' }}
            >
                <div className="supervisor-header">
                    <div>
                        <div className="supervisor-name">
                            <span className="icon">👨‍🏫</span>
                            {supervisor.name}
                        </div>
                    </div>
                    {isTopMatch && !isFull && <span className="recommended-badge">⭐ Best Match</span>}
                    {isFull && <span className="badge badge-warning">Full Capacity</span>}
                </div>

                <div className="supervisor-meta">
                    <strong>Expertise:</strong> {supervisor.expertise}<br />
                    <strong>Match Score:</strong> {supervisor.match}% compatibility with your research area<br />
                    <strong>Current Load:</strong> {supervisor.capacity} groups
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span className="match-score">{supervisor.match}% MATCH</span>
                </div>

                <div className="capacity-indicator">
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', minWidth: '60px' }}>Capacity:</span>
                    <div className="capacity-bar">
                        <div className="capacity-fill" style={{ width: `${capacityPercent}%` }}></div>
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{supervisor.capacity}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="page-content active">
            <div className="content-header">
                <h1>Submit Project Proposal</h1>
                <p>Submit your proposal with automatic duplicate detection</p>
            </div>

            <div className="alert alert-info">
                <strong>🔍 Smart System Features:</strong> The system will automatically check for duplicate topics 
                and match you with the best supervisor based on their expertise and availability.
            </div>

            <div className="card" style={{ 
                marginBottom: '2rem', 
                background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)', 
                color: '#fff', 
                border: 'none' 
            }}>
                <div style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem', color: '#fff' }}>
                        🎯 How Intelligent Supervisor Matching Works
                    </h3>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '1.5rem', 
                        marginTop: '1.5rem' 
                    }}>
                        <div>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>1️⃣</div>
                            <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Duplicate Detection</strong>
                            <span style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                                System checks your title against existing projects (70% threshold)
                            </span>
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>2️⃣</div>
                            <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Expertise Matching</strong>
                            <span style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                                Matches supervisors based on research area compatibility
                            </span>
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>3️⃣</div>
                            <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Capacity Check</strong>
                            <span style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                                Ensures supervisor hasn't reached maximum load (4 groups)
                            </span>
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>4️⃣</div>
                            <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Auto-Selection</strong>
                            <span style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                                Best match is automatically pre-selected for you
                            </span>
                        </div>
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
                                id="projectTitle"
                                placeholder="Enter your project title"
                                value={proposalData.projectTitle}
                                onChange={(e) => handleProposalChange('projectTitle', e.target.value)}
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
                                onChange={(e) => handleProposalChange('researchArea', e.target.value)}
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
                                placeholder="e.g., 901015004, 901015219, 901014492, 901014491"
                                value={proposalData.groupMembers}
                                onChange={(e) => handleProposalChange('groupMembers', e.target.value)}
                            />
                        </div>

                        {showSupervisors && (
                            <div id="supervisorSelection">
                                <div style={{ 
                                    margin: '2rem 0', 
                                    padding: '1.5rem', 
                                    background: '#fafafa', 
                                    borderRadius: '12px', 
                                    borderLeft: '4px solid #000' 
                                }}>
                                    <h3 style={{ 
                                        fontSize: '1.25rem', 
                                        fontWeight: '800', 
                                        marginBottom: '0.75rem', 
                                        color: '#000' 
                                    }}>
                                        🎓 Select Your Supervisor
                                    </h3>
                                    <p style={{ color: '#666', marginBottom: '0', fontSize: '0.95rem' }}>
                                        Based on your research area, we've matched and ranked the best supervisors for your project.
                                        The top match is automatically selected. You can choose a different supervisor if preferred.
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">RECOMMENDED SUPERVISORS (Ranked by Expertise Match)</label>
                                    <div className="entries-list">
                                        {getMatchedSupervisors().map((supervisor, index) => 
                                            renderSupervisorCard(supervisor, index)
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

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
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-primary" 
                                onClick={checkDuplicateAndMatch}
                                disabled={loading}
                            >
                                {loading ? 'Checking...' : 'Check & Continue'}
                            </button>
                            {showSupervisors && (
                                <button type="submit" className="btn btn-primary">
                                    Submit Proposal
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SubmitProposal;
