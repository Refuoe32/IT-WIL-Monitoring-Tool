import React, { useState, useEffect } from 'react';

const MyProposal = () => {
    // Proposal data state
    const [proposalData] = useState({
        title: 'IT WIL Monitoring Tool',
        researchArea: 'Web Development',
        supervisor: 'Mr. Hlabeli',
        members: 'Refuoe Letsela, Mosololi Khatleli, Sello Lebeko, Rants\'itile Ramone',
        status: 'Approved'
    });

    // Workflow steps state
    const [workflowSteps] = useState([
        {
            step: 1,
            title: 'Duplicate Check Passed',
            status: 'completed',
            badge: '✓ Done',
            description: 'Your proposal title has been checked and no duplicates were found. Similarity score: 23% (Below 70% threshold)',
            date: 'Jan 15, 2026 10:30 AM',
            icon: '📅'
        },
        {
            step: 2,
            title: 'Supervisor Matched & Assigned',
            status: 'completed',
            badge: '✓ Done',
            description: 'System matched you with <strong>Mr. Hlabeli</strong> based on research area (Web Development) with 95% expertise match.',
            additionalInfo: 'Supervisor Capacity: 3/4 groups',
            date: 'Jan 15, 2026 10:31 AM',
            icon: '📅'
        },
        {
            step: 3,
            title: 'Supervisor Review & Approval',
            status: 'completed',
            badge: '✓ Done',
            description: '<strong>Supervisor Feedback:</strong> Excellent project idea! The scope is realistic and aligns well with current industry needs. Approved to proceed to coordinator.',
            reviewedBy: 'Mr. Hlabeli',
            date: 'Jan 16, 2026 2:15 PM',
            icon: '📅'
        },
        {
            step: 4,
            title: 'Forwarded to Coordinator',
            status: 'completed',
            badge: '✓ Done',
            description: 'Your approved proposal has been automatically forwarded to the coordinator for final record-keeping and monitoring.',
            date: 'Jan 16, 2026 2:16 PM',
            icon: '📅'
        },
        {
            step: 5,
            title: 'Project Activated',
            status: 'completed',
            badge: '✓ Final',
            description: 'Your project is now active! You can begin submitting weekly logbooks for supervisor review.',
            date: 'Jan 16, 2026 2:16 PM',
            icon: '📅'
        }
    ]);

    // You can add useEffect to fetch real data from API
    useEffect(() => {
        // fetchProposalWorkflow();
    }, []);

    const handleDownloadProposal = () => {
        console.log('Downloading proposal...');
        // Add download logic here
    };

    return (
        <div className="page-content active">
            <div className="content-header">
                <h1>My Proposal Status</h1>
                <p>Track your proposal approval workflow</p>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Proposal Approval Workflow</h2>
                    <span className="badge badge-approved">Approved by Supervisor</span>
                </div>
                
                <div className="entries-list" style={{ padding: '1.5rem' }}>
                    {workflowSteps.map((step) => (
                        <div key={step.step} className="entry-card approved">
                            <div className="entry-header">
                                <div className="entry-meta">
                                    <span>{step.icon} Step {step.step}</span>
                                    <span>✅ Completed</span>
                                </div>
                                <span className="badge badge-approved">{step.badge}</span>
                            </div>
                            <h3 className="entry-title">{step.title}</h3>
                            <p 
                                className="entry-text" 
                                dangerouslySetInnerHTML={{ __html: step.description }}
                            />
                            {step.additionalInfo && (
                                <p className="entry-text">
                                    <strong>{step.additionalInfo}</strong> | <strong>Date:</strong> {step.date}
                                </p>
                            )}
                            {step.reviewedBy && (
                                <p className="entry-text">
                                    <strong>Reviewed by:</strong> {step.reviewedBy} | <strong>Date:</strong> {step.date}
                                </p>
                            )}
                            {!step.additionalInfo && !step.reviewedBy && (
                                <p className="entry-text"><strong>Date:</strong> {step.date}</p>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ 
                    margin: '1.5rem', 
                    padding: '1.5rem', 
                    background: '#fafafa', 
                    borderRadius: '12px' 
                }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem' }}>
                        Proposal Details
                    </h3>
                    <table style={{ width: '100%' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '0.5rem 0', fontWeight: '600', width: '200px' }}>
                                    Title:
                                </td>
                                <td style={{ padding: '0.5rem 0' }}>{proposalData.title}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '0.5rem 0', fontWeight: '600' }}>
                                    Research Area:
                                </td>
                                <td style={{ padding: '0.5rem 0' }}>{proposalData.researchArea}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '0.5rem 0', fontWeight: '600' }}>
                                    Assigned Supervisor:
                                </td>
                                <td style={{ padding: '0.5rem 0' }}>{proposalData.supervisor}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '0.5rem 0', fontWeight: '600' }}>
                                    Group Members:
                                </td>
                                <td style={{ padding: '0.5rem 0' }}>{proposalData.members}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '0.5rem 0', fontWeight: '600' }}>
                                    Status:
                                </td>
                                <td style={{ padding: '0.5rem 0' }}>
                                    <span className="badge badge-approved">{proposalData.status}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                        <button 
                            className="btn btn-outline btn-sm"
                            onClick={handleDownloadProposal}
                        >
                            📥 Download Proposal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyProposal;
