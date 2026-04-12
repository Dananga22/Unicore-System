import React, { useEffect, useState, useMemo } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  MapPin, 
  ChevronDown, 
  AlertCircle,
  X,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminBookingApprovals() {
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING'); // Default to pending
  const [resourceFilter, setResourceFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsData, resourcesData] = await Promise.all([
        api.getAllBookings(),
        api.getResources()
      ]);
      setBookings(bookingsData.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setResources(resourcesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset reject reason when switching bookings
  useEffect(() => {
    if (selectedBooking) {
      setRejectReason('');
      setSuccess('');
    }
  }, [selectedBooking]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = b.userName.toLowerCase().includes(search.toLowerCase()) || 
                            b.resourceName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchesResource = resourceFilter === 'all' || b.resourceId.toString() === resourceFilter;
      return matchesSearch && matchesStatus && matchesResource;
    });
  }, [bookings, search, statusFilter, resourceFilter]);

  const handleApprove = async (id) => {
    try {
      setSubmitting(true);
      setError('');
      await api.approveBooking(id);
      setSuccess('Booking approved successfully!');
      setTimeout(() => {
        setSuccess('');
        setSelectedBooking(null);
        fetchData();
      }, 1500);
    } catch (err) {
      setError(`Approval failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) return;
    
    try {
      setSubmitting(true);
      setError('');
      await api.rejectBooking(id, rejectReason);
      setSuccess('Booking rejected successfully');
      setRejectReason('');
      setTimeout(() => {
        setSuccess('');
        setSelectedBooking(null);
        fetchData();
      }, 1500);
    } catch (err) {
      setError(`Rejection failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-state">Loading approval queue...</div>;

  return (
    <div className="animate-fade">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Booking Approvals</h2>
          <p>Review and manage facility reservation requests across campus.</p>
        </div>
        <div className="flex gap-4">
          <div className="badge badge-pending">
            {bookings.filter(b => b.status === 'PENDING').length} Pending
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Filters Header */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="search-box" style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input 
                type="text" 
                placeholder="Search by user or resource..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '3rem', width: '100%' }}
              />
            </div>
            
            <div className="flex gap-2 items-center">
              <Filter size={16} color="var(--muted)" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '0.6rem 2rem 0.6rem 1rem' }}>
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select value={resourceFilter} onChange={(e) => setResourceFilter(e.target.value)} style={{ padding: '0.6rem 2rem 0.6rem 1rem' }}>
                <option value="all">All Resources</option>
                {resources.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Approvals Table */}
        <div className="card">
          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            {filteredBookings.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted)' }}>
                <Info size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                <p>No booking requests match your filters.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Requester</th>
                    <th>Resource</th>
                    <th>Schedule</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className={selectedBooking?.id === booking.id ? 'active-row' : ''}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="sidebar-avatar" style={{ background: 'var(--surface-alt)', color: 'var(--primary)', width: '2.5rem', height: '2.5rem' }}>
                            {booking.userName?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold">{booking.userName}</div>
                            <div className="text-muted text-xs">ID #{booking.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold">{booking.resourceName}</div>
                        <div className="text-muted text-xs">Capacity: {resources.find(r => r.id === booking.resourceId)?.capacity}</div>
                      </td>
                      <td>
                        <div className="font-medium text-sm">{new Date(booking.date).toLocaleDateString()}</div>
                        <div className="text-primary font-bold text-xs">{booking.startTime} - {booking.endTime}</div>
                      </td>
                      <td>
                        <span className={`badge badge-${booking.status.toLowerCase()}`}>{booking.status}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {booking.status === 'PENDING' ? (
                          <div className="flex gap-2 justify-end">
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                              onClick={() => handleApprove(booking.id)}
                            >
                              Approve
                            </button>
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                              onClick={() => {
                                setSelectedBooking(booking);
                                // A small delay to ensure modal is open before scrolling
                                setTimeout(() => {
                                  const reasonEl = document.getElementById('rejection-reason-input');
                                  if (reasonEl) {
                                    reasonEl.focus();
                                    reasonEl.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }, 100);
                              }}
                            >
                              Reject
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                              onClick={() => setSelectedBooking(booking)}
                            >
                              Review
                            </button>

                          </div>
                        ) : (
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Details / Review Modal */}
      {selectedBooking && (
        <div className="modal-backdrop" onClick={() => setSelectedBooking(null)}>
          <div className="modal-card animate-slide-up" onClick={e => e.stopPropagation()} style={{ width: 'min(100%, 650px)' }}>
            <div className="card-header pb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3>Request Details</h3>
                <p>Booking ID: #{selectedBooking.id}</p>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }} onClick={() => setSelectedBooking(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8 my-6">
              <div className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="label">User</label>
                  <div className="flex items-center gap-2 font-bold"><User size={16} /> {selectedBooking.userName}</div>
                </div>
                <div className="form-group">
                  <label className="label">Resource</label>
                  <div className="flex items-center gap-2 font-bold"><MapPin size={16} /> {selectedBooking.resourceName}</div>
                </div>
                <div className="form-group">
                  <label className="label">Date & Time</label>
                  <div className="flex items-center gap-2 font-bold"><Calendar size={16} /> {selectedBooking.date}</div>
                  <div className="text-primary font-bold">{selectedBooking.startTime} - {selectedBooking.endTime}</div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="label">Purpose</label>
                  <div className="font-bold" style={{ whiteSpace: 'pre-wrap' }}>{selectedBooking.purpose}</div>
                </div>
                <div className="form-group">
                  <label className="label">Attendees</label>
                  <div className="font-bold">{selectedBooking.expectedAttendees} Persons</div>
                </div>
                <div className="form-group">
                  <label className="label">Status</label>
                  <div><span className={`badge badge-${selectedBooking.status.toLowerCase()}`}>{selectedBooking.status}</span></div>
                </div>
              </div>
            </div>

            {success && (
              <div className="card" style={{ background: 'var(--success-surface)', color: 'var(--success)', border: '1px solid var(--success-border)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2' }}>
                <CheckCircle size={18} /> {success}
              </div>
            )}

            {error && (
              <div className="card" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2' }}>
                <AlertCircle size={18} /> {error}
              </div>
            )}

            {selectedBooking.status === 'PENDING' ? (
              <div className="form-group" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <label className="label">Rejection Reason <span className="text-muted">(Required for rejection)</span></label>
                <textarea 
                  id="rejection-reason-input"
                  rows="3" 
                  placeholder="Explain why this request is being rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  disabled={submitting}

                  style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border)',
                    opacity: submitting ? 0.7 : 1
                  }}
                />
                <div className="flex gap-4 mt-6">
                  <button 
                    className="btn btn-primary flex-1" 
                    onClick={() => handleApprove(selectedBooking.id)}
                    disabled={submitting}
                  >
                    {submitting ? 'Processing...' : <><CheckCircle size={18} /> Approve Request</>}
                  </button>
                  <button 
                    className="btn btn-danger flex-1" 
                    onClick={() => handleReject(selectedBooking.id)}
                    disabled={submitting || !rejectReason.trim()}
                    style={{ opacity: (submitting || !rejectReason.trim()) ? 0.6 : 1 }}
                  >
                    {submitting ? 'Processing...' : <><XCircle size={18} /> Reject Request</>}
                  </button>
                </div>
              </div>
            ) : selectedBooking.reviewReason && (
              <div className="form-group" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                 <label className="label">Rejection Reason</label>
                 <div className="card" style={{ background: '#fff1f2', border: '1px solid #fda4af', color: '#9f1239' }}>
                    {selectedBooking.reviewReason}
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
