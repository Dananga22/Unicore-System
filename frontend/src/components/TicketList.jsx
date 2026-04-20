import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, MapPin, ShieldAlert, Wrench, Search, Filter, X, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import TicketAnalytics from './TicketAnalytics';

const TicketList = ({ userData }) => {
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Reject Action State
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Cancel Action State
    const [cancelTarget, setCancelTarget] = useState(null);

    // Action Errors
    const [modalError, setModalError] = useState(null);

    const [submitting, setSubmitting] = useState(false);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const isPrivileged = ['ADMIN', 'TECHNICIAN'].includes(userData?.role);

    useEffect(() => {
        loadTickets();
    }, [userData?.role]);

    useEffect(() => {
        let result = tickets;
        
        if (searchTerm) {
            const lowerQuery = searchTerm.toLowerCase();
            result = result.filter(t => 
                t.description?.toLowerCase().includes(lowerQuery) || 
                t.id.toString().includes(lowerQuery) ||
                t.location?.toLowerCase().includes(lowerQuery)
            );
        }
        
        if (statusFilter) {
            result = result.filter(t => t.status === statusFilter);
        }
        
        if (categoryFilter) {
            result = result.filter(t => t.category === categoryFilter);
        }
        
        setFilteredTickets(result);
    }, [searchTerm, statusFilter, categoryFilter, tickets]);

    const loadTickets = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await api.getTickets(isPrivileged);
            const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setTickets(sorted);
            setFilteredTickets(sorted);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmReject = async () => {
        if (!rejectionReason.trim() || !rejectTarget) return;

        try {
            setSubmitting(true);
            setModalError(null);
            await api.updateTicketStatus(rejectTarget.id, {
                status: 'REJECTED',
                rejectionReason: rejectionReason.trim()
            });
            setRejectTarget(null);
            setRejectionReason('');
            await loadTickets();
        } catch (err) {
            setModalError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmCancel = async () => {
        if (!cancelTarget) return;

        try {
            setSubmitting(true);
            setModalError(null);
            await api.cancelTicket(cancelTarget.id);
            setCancelTarget(null);
            await loadTickets();
        } catch (err) {
            setModalError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'OPEN': return 'status-open';
            case 'IN_PROGRESS': return 'status-progress';
            case 'CANCELLED': return 'status-rejected';
            case 'REJECTED': return 'status-rejected';
            case 'RESOLVED': case 'CLOSED': return 'status-resolved';
            default: return 'status-open';
        }
    };

    // Extract unique categories for filter
    const uniqueCategories = [...new Set(tickets.map(t => t.category))].filter(Boolean);

    return (
        <div className="grid gap-6 animate-fade">
            {isPrivileged && <TicketAnalytics />}

            <div className="card">
                <div className="card-header flex-wrap">
                    <div>
                        <h2>Ticket Operations</h2>
                        <p>{isPrivileged ? 'Manage and track maintenance requests.' : 'Create and follow your maintenance requests.'}</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="btn btn-secondary" onClick={loadTickets}>Refresh</button>
                        {userData?.role === 'USER' && (
                            <Link to="/tickets/new" className="btn btn-primary">Create Ticket</Link>
                        )}
                    </div>
                </div>

                {error && <div className="badge badge-rejected" style={{ justifySelf: 'start', marginBottom: '1rem' }}>{error}</div>}

                <div className="flex gap-4 mb-6 flex-wrap">
                    <div className="search-input" style={{ flex: '1 1 250px' }}>
                        <Search size={16} color="#6b7280" />
                        <input 
                            type="text" 
                            placeholder="Search description, ID, location..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="bg-white" style={{ flex: '0 1 180px', borderRadius: '16px', border: '1px solid var(--border)', padding: '0.82rem' }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                    <select 
                        className="bg-white" style={{ flex: '0 1 180px', borderRadius: '16px', border: '1px solid var(--border)', padding: '0.82rem' }}
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {uniqueCategories.map(cat => (
                            <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className="text-center p-6 text-muted">Loading tickets...</div>
                ) : filteredTickets.length === 0 ? (
                    <div className="text-center p-6 text-muted">No tickets found matching your criteria.</div>
                ) : (
                    <div className="ticket-grid">
                        {filteredTickets.map((ticket) => (
                            <article key={ticket.id} className="ticket-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div className="ticket-card-head">
                                    <div>
                                        <span className={`ticket-status ${getStatusClass(ticket.status)}`}>{ticket.status.replaceAll('_', ' ')}</span>
                                        <h3>Ticket #{ticket.id}</h3>
                                    </div>
                                    <span className="ticket-priority">{ticket.priority}</span>
                                </div>

                                <div className="ticket-meta">
                                    <span><Wrench size={14} /> {ticket.category.replaceAll('_', ' ')}</span>
                                    <span><MapPin size={14} /> {ticket.location}</span>
                                    <span><CalendarClock size={14} /> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                </div>

                                <p className="ticket-description" style={{ flexGrow: 1 }}>{ticket.description.substring(0, 100)}{ticket.description.length > 100 ? '...' : ''}</p>

                                <div className="ticket-footer" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                    <div className="ticket-owner">
                                        <ShieldAlert size={14} />
                                        <span style={{ fontSize: '0.8rem' }}>{isPrivileged ? `By: ${ticket.reportedByName}` : `Assigned: ${ticket.assignedToName || 'Unassigned'}`}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {userData?.role === 'ADMIN' && ticket.status === 'OPEN' && (
                                            <button 
                                                className="btn btn-danger-outline" 
                                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                                                onClick={() => setRejectTarget(ticket)}
                                            >
                                                Reject
                                            </button>
                                        )}
                                        {userData?.id === ticket.reportedById && ticket.status === 'OPEN' && (
                                            <>
                                                <Link 
                                                    to={`/tickets/new?edit=${ticket.id}`} 
                                                    className="btn btn-secondary" 
                                                    style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                                                >
                                                    Edit
                                                </Link>
                                                <button 
                                                    className="btn btn-danger-outline" 
                                                    style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                                                    onClick={() => setCancelTarget(ticket)}
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        )}
                                        <Link to={`/tickets/${ticket.id}`} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>View Details</Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            {rejectTarget && (
                <div className="modal-overlay" onClick={() => setRejectTarget(null)}>
                    <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.25rem' }}>Reject Maintenance Ticket</h2>
                            <button className="close-btn" onClick={() => setRejectTarget(null)}><X size={20} /></button>
                        </div>
                        
                        <div className="modal-body">
                            {modalError && (
                                <div className="badge badge-rejected mb-4" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', display: 'flex', alignItems: 'center' }}>
                                    <ShieldAlert size={16} style={{ marginRight: '0.5rem' }} />
                                    {modalError}
                                </div>
                            )}
                            <div className="status-transition-preview" style={{ padding: '1rem' }}>
                                <span className="status-tag open">OPEN</span>
                                <ArrowRight size={18} />
                                <span className="status-tag rejected">REJECTED</span>
                            </div>

                            <div className="summary-block mb-4" style={{ background: 'var(--background)', padding: '1rem', borderRadius: '12px' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Ticket Reference</span>
                                <strong>#{rejectTarget.id} - {rejectTarget.category.replace('_', ' ')}</strong>
                            </div>

                            <div className="form-group">
                                <label className="required-label">Rejection Reason</label>
                                <textarea 
                                    rows="4" 
                                    value={rejectionReason} 
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Explain to the student why this ticket is being rejected..."
                                    className={!rejectionReason.trim() ? 'invalid' : ''}
                                />
                                {!rejectionReason.trim() && (
                                    <span className="validation-msg">A reason is required to reject a ticket.</span>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setRejectTarget(null)}>Cancel</button>
                            <button 
                                className="btn btn-primary" 
                                style={{ background: 'var(--danger)' }}
                                onClick={handleConfirmReject}
                                disabled={submitting || !rejectionReason.trim()}
                            >
                                {submitting ? 'Processing...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancellation Modal */}
            {cancelTarget && (
                <div className="modal-overlay" onClick={() => setCancelTarget(null)}>
                    <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.25rem' }}>Cancel Maintenance Ticket</h2>
                            <button className="close-btn" onClick={() => setCancelTarget(null)}><X size={20} /></button>
                        </div>
                        
                        <div className="modal-body">
                            {modalError && (
                                <div className="badge badge-rejected mb-4" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', display: 'flex', alignItems: 'center' }}>
                                    <ShieldAlert size={16} style={{ marginRight: '0.5rem' }} />
                                    {modalError}
                                </div>
                            )}
                            <div className="status-transition-preview" style={{ padding: '1rem' }}>
                                <span className="status-tag open">OPEN</span>
                                <ArrowRight size={18} />
                                <span className="status-tag cancelled" style={{ background: 'var(--border)', color: 'var(--text)' }}>CANCELLED</span>
                            </div>

                            <div className="mb-4">
                                <p>Are you sure you want to cancel this maintenance request? This action cannot be undone once confirmed.</p>
                            </div>

                            <div className="summary-block mb-4" style={{ background: 'var(--background)', padding: '1rem', borderRadius: '12px' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Ticket Reference</span>
                                <strong>#{cancelTarget.id} - {cancelTarget.category.replace('_', ' ')}</strong>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setCancelTarget(null)}>Stay Open</button>
                            <button 
                                className="btn btn-primary" 
                                style={{ background: 'var(--danger)' }}
                                onClick={handleConfirmCancel}
                                disabled={submitting}
                            >
                                {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketList;
