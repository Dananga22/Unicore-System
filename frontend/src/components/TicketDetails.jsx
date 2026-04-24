import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    MessageSquareText, 
    Paperclip, 
    X, 
    Check, 
    Clock, 
    User, 
    AlertCircle, 
    ChevronRight,
    ArrowRight,
    Shield,
    History as HistoryIcon,
    Pencil,
    Trash2,
    Save
} from 'lucide-react';
import { api, API_ORIGIN } from '../services/api';

const TicketStepper = ({ currentStatus }) => {
    const steps = [
        { key: 'OPEN', label: 'Open', color: '#3b82f6' },
        currentStatus === 'REJECTED' ? { key: 'REJECTED', label: 'Rejected', color: '#ef4444' } : null,
        { key: 'IN_PROGRESS', label: 'In Progress', color: '#f59e0b' },
        { key: 'RESOLVED', label: 'Resolved', color: '#10b981' },
        { key: 'CLOSED', label: 'Closed', color: '#6b7280' }
    ].filter(Boolean);
    
    const currentIndex = steps.findIndex(s => s.key === currentStatus);
    
    return (
        <div className="ticket-stepper-container">
            {steps.map((step, index) => {
                const isCompleted = index < currentIndex;
                const isActive = index === currentIndex;
                const isUpcoming = index > currentIndex;
                
                return (
                    <React.Fragment key={step.key}>
                        <div className={`stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                            <div className="stepper-circle">
                                {isCompleted ? <Check size={16} strokeWidth={3} /> : index + 1}
                            </div>
                            <span className="stepper-label">{step.label}</span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`stepper-line ${isCompleted ? 'completed' : ''}`}></div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const TicketTimeline = ({ history }) => {
    if (!history || history.length === 0) return null;

    return (
        <div className="ticket-timeline">
            {history.map((event, index) => (
                <div key={event.id || index} className="timeline-event">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                        <div className="timeline-header">
                            <span className="timeline-action">{event.action}</span>
                            <span className="timeline-date">{new Date(event.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="timeline-details">
                            <User size={12} />
                            <span>{event.performedByName}</span>
                            {event.statusFrom && event.statusTo && (
                                <div className="status-change">
                                    <span className="status-pill from">{event.statusFrom.replace('_', ' ')}</span>
                                    <ArrowRight size={12} />
                                    <span className={`status-pill to ${event.statusTo.toLowerCase()}`}>{event.statusTo.replace('_', ' ')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const TicketDetails = ({ userData }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editedComment, setEditedComment] = useState('');
    const [statusUpdate, setStatusUpdate] = useState('');
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const isPrivileged = ['ADMIN', 'TECHNICIAN'].includes(userData?.role);

    useEffect(() => {
        loadTicketDetails();
    }, [id]);

    const loadTicketDetails = async () => {
        try {
            setLoading(true);
            const ticketData = await api.getTicketById(id);
            setTicket(ticketData);
            setComments(await api.getTicketComments(id));
            setResolutionNotes(ticketData.resolutionNotes || '');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getAvailableTransitions = (status) => {
        switch (status) {
            case 'OPEN': return ['IN_PROGRESS', 'REJECTED'];
            case 'IN_PROGRESS': return ['RESOLVED', 'REJECTED'];
            case 'RESOLVED': return ['CLOSED'];
            default: return [];
        }
    };

    const handleAddComment = async (event) => {
        event.preventDefault();
        if (!newComment.trim()) return;
        try {
            await api.addTicketComment(id, { content: newComment });
            setNewComment('');
            setComments(await api.getTicketComments(id));
        } catch (err) {
            setError(err.message);
        }
    };

    const beginEditComment = (comment) => {
        setEditingCommentId(comment.id);
        setEditedComment(comment.content);
    };

    const cancelEditComment = () => {
        setEditingCommentId(null);
        setEditedComment('');
    };

    const handleUpdateComment = async (commentId) => {
        if (!editedComment.trim()) return;
        try {
            await api.updateComment(commentId, { content: editedComment });
            setComments(await api.getTicketComments(id));
            cancelEditComment();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteComment = async (commentId) => {
        const confirmed = window.confirm('Delete this comment permanently?');
        if (!confirmed) return;

        try {
            await api.deleteComment(commentId);
            setComments(await api.getTicketComments(id));
            if (editingCommentId === commentId) {
                cancelEditComment();
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleStatusUpdate = async () => {
        if ((statusUpdate === 'RESOLVED' || statusUpdate === 'CLOSED') && !resolutionNotes.trim()) {
            return;
        }
        
        try {
            setUpdating(true);
            await api.updateTicketStatus(id, {
                status: statusUpdate,
                resolutionNotes: (statusUpdate === 'RESOLVED' || statusUpdate === 'CLOSED') ? resolutionNotes.trim() : null,
                rejectionReason: statusUpdate === 'REJECTED' ? resolutionNotes.trim() : null,
            });
            setShowStatusModal(false);
            await loadTicketDetails();
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleAssignToMe = async () => {
        try {
            setUpdating(true);
            await api.assignTicket(id, userData.id);
            await loadTicketDetails();
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="page-loading">Loading ticket workspace...</div>;
    if (!ticket) return <div className="card error-card">Ticket not found or inaccessible.</div>;

    const nextStatuses = getAvailableTransitions(ticket.status);
    const isAssignedToMe = ticket.assignedToId === userData?.id;
    const isOwner = ticket.reportedById === userData?.id;

    const handleCancelTicket = async () => {
        const confirmed = window.confirm('Are you sure you want to cancel this ticket?');
        if (!confirmed) return;
        
        try {
            setUpdating(true);
            await api.cancelTicket(id);
            await loadTicketDetails();
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="ticket-workspace animate-fade">
            {error && (
                <div className="alert alert-error mb-4">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                    <button onClick={() => setError('')}><X size={16} /></button>
                </div>
            )}

            <div className="ticket-main-grid">
                <div className="ticket-content-area">
                    {/* Primary Info Card */}
                    <div className="card ticket-details-card">
                        <div className="ticket-header-strip">
                            <div className="ticket-id-badge">TICKET-#{ticket.id}</div>
                            <div className={`status-pill-large ${ticket.status.toLowerCase()}`}>
                                {ticket.status.replaceAll('_', ' ')}
                            </div>
                        </div>

                        <div className="ticket-title-section">
                            <h1>{ticket.category.replaceAll('_', ' ')}</h1>
                            <div className="ticket-meta-row">
                                <div className="meta-item">
                                    <Clock size={14} />
                                    <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="meta-item">
                                    <Shield size={14} />
                                    <span>Priority: <strong>{ticket.priority}</strong></span>
                                </div>
                            </div>
                        </div>

                        <TicketStepper currentStatus={ticket.status} />

                        <div className="ticket-description-box">
                            <h3>Description</h3>
                            <p>{ticket.description}</p>
                            {ticket.location && (
                                <div className="location-tag">
                                    <strong>Location:</strong> {ticket.location}
                                </div>
                            )}
                        </div>

                        {ticket.resolutionNotes && (
                            <div className="resolution-notes-box">
                                <h3>Resolution Notes</h3>
                                <p>{ticket.resolutionNotes}</p>
                            </div>
                        )}

                        {ticket.rejectionReason && (
                            <div className="resolution-notes-box" style={{ borderColor: 'var(--danger)', background: '#fef2f2' }}>
                                <h3 style={{ color: 'var(--danger)' }}>Rejection Reason</h3>
                                <p>{ticket.rejectionReason}</p>
                            </div>
                        )}

                        {ticket.imageUrls?.length > 0 && (
                            <div className="attachments-section">
                                <h3>Attachments</h3>
                                <div className="attachments-grid">
                                    {ticket.imageUrls.map((url, i) => (
                                        <a key={i} href={`${API_ORIGIN}${url}`} target="_blank" rel="noreferrer" className="attachment-card">
                                            <img src={`${API_ORIGIN}${url}`} alt="Ticket" />
                                            <div className="attachment-overlay">
                                                <Paperclip size={16} />
                                                <span>View Original</span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Collaborative Section (Comments) */}
                    <div className="card comments-card mt-6">
                        <div className="chat-header">
                            <MessageSquareText size={18} />
                            <h3>Collaborative Updates</h3>
                        </div>
                        
                        <div className="comments-stream">
                            {comments.map((comment) => (
                                <div key={comment.id} className={`comment-bubble ${comment.userId === userData?.id ? 'authored' : ''}`}>
                                    <div className="comment-meta" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                            <strong>{comment.userName}</strong>
                                            <span>
                                                {new Date(comment.createdAt).toLocaleTimeString()}
                                                {comment.updatedAt && comment.updatedAt !== comment.createdAt ? ' • edited' : ''}
                                            </span>
                                        </div>
                                        {(comment.userId === userData?.id || userData?.role === 'ADMIN') && (
                                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.4rem 0.55rem' }}
                                                    onClick={() => beginEditComment(comment)}
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger-outline"
                                                    style={{ padding: '0.4rem 0.55rem' }}
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {editingCommentId === comment.id ? (
                                        <div style={{ display: 'grid', gap: '0.65rem' }}>
                                            <textarea
                                                rows="3"
                                                value={editedComment}
                                                onChange={(e) => setEditedComment(e.target.value)}
                                            />
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button type="button" className="btn btn-secondary" onClick={cancelEditComment}>
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    disabled={!editedComment.trim()}
                                                    onClick={() => handleUpdateComment(comment.id)}
                                                >
                                                    <Save size={14} /> Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p>{comment.content}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleAddComment} className="comment-composer">
                            <textarea 
                                value={newComment} 
                                onChange={(e) => setNewComment(e.target.value)} 
                                placeholder="Type an update or comment..."
                                rows="3"
                            />
                            <button type="submit" className="btn btn-primary" disabled={!newComment.trim()}>
                                Send Update
                            </button>
                        </form>
                    </div>
                </div>

                {/* Sidebar Info & Actions */}
                <div className="ticket-sidebar">
                    <div className="card sticky-sidebar">
                        <div className="sidebar-section">
                            <h3>Workflow Actions</h3>
                            <div className="action-buttons-group">
                                {isOwner && ticket.status === 'OPEN' && (
                                    <div className="flex flex-col gap-2 w-full mb-3">
                                        <button 
                                            className="btn btn-primary btn-full-width"
                                            onClick={() => navigate(`/tickets/new?edit=${id}`)}
                                        >
                                            <Pencil size={16} />
                                            Edit Ticket
                                        </button>
                                        <button 
                                            className="btn btn-danger-outline btn-full-width"
                                            onClick={handleCancelTicket}
                                            disabled={updating}
                                        >
                                            <X size={16} />
                                            Cancel Ticket
                                        </button>
                                        <div className="divider" style={{ margin: '0.5rem 0' }}></div>
                                    </div>
                                )}

                                {isPrivileged && nextStatuses.length > 0 && (
                                    <div className="flex flex-col gap-2 w-full">
                                        {nextStatuses.filter(s => s !== 'REJECTED').map(status => (
                                            <button 
                                                key={status}
                                                className="btn btn-primary btn-full-width" 
                                                onClick={() => {
                                                    setStatusUpdate(status);
                                                    setShowStatusModal(true);
                                                }}
                                            >
                                                Update to {status.replace('_', ' ')}
                                                <ChevronRight size={16} />
                                            </button>
                                        ))}
                                        {nextStatuses.includes('REJECTED') && (
                                            <button 
                                                className="btn btn-danger-outline btn-full-width" 
                                                onClick={() => {
                                                    setStatusUpdate('REJECTED');
                                                    setShowStatusModal(true);
                                                }}
                                            >
                                                Reject Ticket
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                )}
                                
                                {isPrivileged && !isAssignedToMe && (
                                    <button className="btn btn-secondary btn-full-width mt-2" onClick={handleAssignToMe} disabled={updating}>
                                        Assign to Me
                                    </button>
                                )}
                                
                                {!isPrivileged && nextStatuses.length === 0 && (
                                    <div className="empty-state-hint">
                                        This ticket is now {ticket.status.toLowerCase()}. No further actions required.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="divider"></div>

                        <div className="sidebar-section">
                            <h3>Ownership</h3>
                            <div className="user-info-card">
                                <div className="user-avatar">{ticket.reportedByName[0]}</div>
                                <div className="user-details">
                                    <span className="label">Reported By</span>
                                    <strong>{ticket.reportedByName}</strong>
                                </div>
                            </div>
                            <div className="user-info-card mt-4">
                                <div className="user-avatar admin">{ticket.assignedToName?.[0] || '?'}</div>
                                <div className="user-details">
                                    <span className="label">Assigned To</span>
                                    <strong>{ticket.assignedToName || 'Unassigned'}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="divider"></div>

                        <div className="sidebar-section">
                            <div className="section-header-inline">
                                <HistoryIcon size={16} />
                                <h3>Activity History</h3>
                            </div>
                            <TicketTimeline history={ticket.history} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Status Update Modal */}
            {showStatusModal && (
                <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
                    <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Advance Ticket Lifecycle</h2>
                            <button className="close-btn" onClick={() => setShowStatusModal(false)}><X size={20} /></button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="status-transition-preview">
                                <span className={`status-tag ${ticket.status.toLowerCase()}`}>{ticket.status.replace('_', ' ')}</span>
                                <ArrowRight size={18} />
                                <span className={`status-tag ${statusUpdate.toLowerCase()}`}>{statusUpdate.replace('_', ' ')}</span>
                            </div>

                            <p className="modal-instruction">
                                Moving this ticket to <strong>{statusUpdate.replace('_', ' ')}</strong>. 
                                {statusUpdate === 'RESOLVED' && " Please explain how the issue was addressed."}
                                {statusUpdate === 'CLOSED' && " Final confirmation of completion."}
                            </p>

                            {(statusUpdate === 'RESOLVED' || statusUpdate === 'CLOSED' || statusUpdate === 'REJECTED') && (
                                <div className="form-group mt-4">
                                    <label className="required-label">
                                        {statusUpdate === 'REJECTED' ? 'Rejection Reason' : 'Resolution Notes'}
                                    </label>
                                    <textarea 
                                        rows="5" 
                                        value={resolutionNotes} 
                                        onChange={(e) => setResolutionNotes(e.target.value)}
                                        placeholder={statusUpdate === 'REJECTED' ? "Explain why this ticket is being rejected..." : "Describe the solution in detail..."}
                                        className={!resolutionNotes.trim() ? 'invalid' : ''}
                                    />
                                    {!resolutionNotes.trim() && (
                                        <span className="validation-msg">This field is required for this transition.</span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>Cancel</button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleStatusUpdate}
                                disabled={updating || ((statusUpdate === 'RESOLVED' || statusUpdate === 'CLOSED') && !resolutionNotes.trim())}
                            >
                                {updating ? 'Updating...' : 'Confirm Transition'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketDetails;
