import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarClock, MapPin, ShieldAlert, Wrench, Search, Filter, Edit2, XCircle } from 'lucide-react';
import { api } from '../services/api';
import TicketAnalytics from './TicketAnalytics';

const TicketList = ({ userData }) => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // ID of ticket being processed
    const [error, setError] = useState('');
    
    // Cancel Confirmation State
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [ticketToCancel, setTicketToCancel] = useState(null);
    
    
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

    const getStatusClass = (status) => {
        switch (status) {
            case 'OPEN': return 'status-open';
            case 'IN_PROGRESS': return 'status-progress';
            case 'REJECTED': return 'status-rejected';
            case 'RESOLVED': case 'CLOSED': return 'status-resolved';
            case 'CANCELLED': return 'status-cancelled';
            default: return 'status-open';
        }
    };

    const handleCancel = (e, id) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setTicketToCancel(id);
        setShowCancelModal(true);
    };

    const confirmCancel = async () => {
        if (!ticketToCancel) return;
        
        try {
            setActionLoading(ticketToCancel);
            setError('');
            await api.cancelTicket(ticketToCancel);
            setShowCancelModal(false);
            setTicketToCancel(null);
            await loadTickets();
        } catch (err) {
            alert('Cancel failed: ' + err.message);
            setError(err.message);
        } finally {
            setActionLoading(null);
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

                                <div className="ticket-footer" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="ticket-owner">
                                        <ShieldAlert size={14} />
                                        <span style={{ fontSize: '0.8rem' }}>{isPrivileged ? `By: ${ticket.reportedByName}` : `Assigned: ${ticket.assignedToName || 'Unassigned'}`}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {ticket.status === 'OPEN' && Number(ticket.reportedById) === Number(userData?.id) && (
                                            <>
                                                <button 
                                                    onClick={() => navigate(`/tickets/${ticket.id}/edit`)}
                                                    className="btn btn-secondary flex items-center gap-1" 
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--primary)' }}
                                                >
                                                    <Edit2 size={12} /> Edit
                                                </button>
                                                <button 
                                                    onClick={(e) => handleCancel(e, ticket.id)}
                                                    className="btn btn-secondary flex items-center gap-1" 
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: '#fee2e2', color: '#dc2626' }}
                                                    disabled={actionLoading === ticket.id}
                                                >
                                                    <XCircle size={12} /> {actionLoading === ticket.id ? '...' : 'Cancel'}
                                                </button>
                                            </>
                                        )}
                                        <Link to={`/tickets/${ticket.id}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>View Details</Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {/* Custom Cancellation Confirmation Modal */}
            {showCancelModal && (
                <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
                    <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <XCircle size={24} /> Confirm Cancellation
                            </h2>
                            <button className="close-btn" onClick={() => setShowCancelModal(false)}><XCircle size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: '1.1rem', color: 'var(--text)', marginBottom: '1rem' }}>
                                Are you sure you want to cancel <strong>Ticket #{ticketToCancel}</strong>?
                            </p>
                            <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', color: '#991b1b', fontSize: '0.9rem' }}>
                                <strong>Warning:</strong> This action cannot be undone. Any work started may be interrupted.
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>Keep Ticket</button>
                            <button 
                                className="btn btn-primary" 
                                style={{ background: 'var(--danger)' }} 
                                onClick={confirmCancel}
                                disabled={!!actionLoading}
                            >
                                {actionLoading ? 'Processing...' : 'Yes, Cancel Ticket'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketList;
